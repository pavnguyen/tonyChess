/**
 * **HLV thông minh** - chấm nước đi của bé bằng Stockfish.
 *
 * Quy ước điểm: mọi con số trong file này đều là **centipawn nhìn từ phía Trắng**
 * (dương = Trắng hơn). Muốn biết bé được/lỗ bao nhiêu thì đổi dấu theo màu bé.
 *
 * Vì sao cần module riêng: `stockfishThink` chỉ trả về *nước đi* (dùng cho máy đánh
 * với bé). HLV cần thêm *điểm* của thế cờ trước và sau nước bé đi, cộng bộ nhớ đệm
 * theo FEN để nước đi lại không phải chờ 1.5 giây nữa.
 *
 * Luôn có đường lui: không nạp được Stockfish (máy yếu, trình duyệt chặn Worker) thì
 * tự chấm bằng engine JS `rankMoves` và ghi `from: 'js'` để giao diện nói rõ.
 */
import { Chess } from 'chess.js'
import { rankMoves } from './minimax'
import { stockfishAnalyze } from './stockfishLoader'
import { uciToEngineMove } from './uci'

/** Ngân sách mặc định cho một lần chấm (đúng như spec: tối đa ~1.5s). */
export const ANALYSIS_BUDGET_MS = 1500

/** Điểm quy đổi cho thế chiếu bí - lớn hơn mọi ưu thế quân bình thường. */
const MATE_SCORE = 10000

export interface PositionEval {
  /** Centipawn nhìn từ phía TRẮNG. */
  cp: number
  /** Còn `null` khi không phải thế chiếu bí cận kề. */
  mate: number | null
  depth: number
  from: 'stockfish' | 'js'
}

export interface MoveGrade {
  /** Mất bao nhiêu centipawn so với nước mạnh nhất (≥ 0). */
  lossCp: number
  bestSan: string
  bestFrom: string
  bestTo: string
  /** Thế cờ TRƯỚC nước bé đi. */
  fenBefore: string
  /** Thế cờ SAU nước bé đi. */
  fenAfter: string
  from: 'stockfish' | 'js'
}

/** Bộ nhớ đệm theo FEN: đi lại nước cũ trả lời tức thì. */
const cache = new Map<string, PositionEval>()
const CACHE_LIMIT = 400

/** `score mate N` → centipawn (N dương: bên đi chiếu bí). */
function mateToCp(mate: number): number {
  return mate > 0 ? MATE_SCORE - mate * 100 : -MATE_SCORE - mate * 100
}

function remember(fen: string, value: PositionEval) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(fen, value)
}

function turnOf(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w'
}

/**
 * Điểm của một thế cờ, nhìn từ phía TRẮNG.
 * Trả `null` khi FEN hỏng (không thể xảy ra với dữ liệu app sinh ra).
 */
export async function evaluatePosition(
  fen: string,
  budgetMs: number = ANALYSIS_BUDGET_MS,
): Promise<PositionEval | null> {
  const cached = cache.get(fen)
  if (cached) return cached

  let probe: Chess
  try {
    probe = new Chess(fen)
  } catch {
    return null
  }
  if (probe.isGameOver() && probe.isCheckmate()) {
    // Đã chiếu bí: bên ĐANG ĐI là bên thua.
    const value: PositionEval = {
      cp: probe.turn() === 'w' ? -MATE_SCORE : MATE_SCORE,
      mate: 0,
      depth: 0,
      from: 'stockfish',
    }
    remember(fen, value)
    return value
  }

  const turn = turnOf(fen)
  const sign = turn === 'w' ? 1 : -1

  const analysis = await stockfishAnalyze(fen, { movetime: budgetMs }).catch(() => null)
  if (analysis && (analysis.cp !== null || analysis.mate !== null)) {
    const sideToMoveCp =
      analysis.mate !== null ? mateToCp(analysis.mate) : (analysis.cp as number)
    const value: PositionEval = {
      cp: sign * sideToMoveCp,
      mate: analysis.mate,
      depth: analysis.depth ?? 0,
      from: 'stockfish',
    }
    remember(fen, value)
    return value
  }

  // Đường lui: engine JS (dùng đánh giá tĩnh + tìm kiếm nông).
  const ranked = rankMoves(fen, 'hard', Math.max(400, budgetMs))
  if (ranked.length === 0) return null
  const value: PositionEval = {
    cp: sign * ranked[0].score,
    mate: null,
    depth: 0,
    from: 'js',
  }
  remember(fen, value)
  return value
}

/**
 * Chấm nước `san` của bé đi từ thế `fenBefore`.
 *
 * `lossCp = (điểm tốt nhất cho bé) - (điểm thực tế sau nước bé đi)`; luôn ≥ 0 vì
 * nước tốt nhất là mức trần. Ngưỡng HLV dùng để báo lỗi là **100 centipawn = 1 điểm**.
 */
export async function gradeMove(
  fenBefore: string,
  san: string,
  budgetMs: number = ANALYSIS_BUDGET_MS,
): Promise<MoveGrade | null> {
  let probe: Chess
  try {
    probe = new Chess(fenBefore)
  } catch {
    return null
  }
  const kidColor = probe.turn()
  const kidSign = kidColor === 'w' ? 1 : -1

  try {
    probe.move(san)
  } catch {
    return null
  }
  const fenAfter = probe.fen()

  const before = await evaluatePosition(fenBefore, budgetMs)
  if (!before) return null
  const after = await evaluatePosition(fenAfter, budgetMs)

  // Nước mạnh nhất: lấy từ Stockfish (UCI → SAN); nếu không có thì từ rankMoves.
  let bestSan = ''
  let bestFrom = ''
  let bestTo = ''
  let bestFrom0 = before.cp

  const analysis = await stockfishAnalyze(fenBefore, { movetime: budgetMs }).catch(() => null)
  if (analysis) {
    const best = uciToEngineMove(fenBefore, analysis.bestUci)
    if (best) {
      bestSan = best.san
      bestFrom = best.from
      bestTo = best.to
    }
  }
  if (!bestSan) {
    const ranked = rankMoves(fenBefore, 'hard', Math.max(400, budgetMs))
    if (ranked.length > 0) {
      bestSan = ranked[0].san
      bestFrom = ranked[0].from
      bestTo = ranked[0].to
      bestFrom0 = kidSign * ranked[0].score
    }
  }

  const afterCp = after ? after.cp : before.cp
  const lossCp = Math.max(0, Math.round(kidSign * (bestFrom0 - afterCp)))

  return {
    lossCp,
    bestSan,
    bestFrom,
    bestTo,
    fenBefore,
    fenAfter,
    from: before.from,
  }
}

/** Chỉ dùng trong bài kiểm: xoá bộ nhớ đệm. */
export function clearAnalysisCache() {
  cache.clear()
}
