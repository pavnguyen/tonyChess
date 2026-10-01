import { Chess } from 'chess.js'
import type { Move } from 'chess.js'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface EngineMove {
  san: string
  from: string
  to: string
  promotion?: string
}

export interface EngineConfig {
  /** Độ sâu tối đa của cây tìm kiếm. */
  depth: number
  /** Ngân sách thời gian cho mỗi nước (ms) - luôn ưu tiên không làm bé phải chờ. */
  timeBudget: number
  /** Xác suất đi bừa cho tự nhiên (bé dễ thắng hơn). */
  blunderChance: number
  /** Chênh lệch điểm tối đa giữa các nước được coi là "ngang nhau". */
  epsilon: number
}

/** Ba mức độ dành cho bé 7 tuổi. */
export const DIFFICULTY: Record<Difficulty, EngineConfig> = {
  easy: { depth: 1, timeBudget: 200, blunderChance: 0.35, epsilon: 120 },
  medium: { depth: 2, timeBudget: 900, blunderChance: 0.08, epsilon: 35 },
  hard: { depth: 3, timeBudget: 1800, blunderChance: 0, epsilon: 0 },
}

const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

/**
 * Bảng điểm vị trí (Piece-Square Table) viết theo thứ tự "nhìn từ trên bàn cờ":
 * phần tử 0 là ô a8, phần tử 63 là ô h1 - đúng thứ tự `chess.board()` trả về.
 */
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0,
    5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
}

const MATE = 100000
const TIMEOUT = '__engine_timeout__'

/** Điểm thế cờ nhìn từ phía Trắng (dương = Trắng đang hơn). */
export function evaluateWhite(game: Chess): number {
  let score = 0
  const board = game.board()
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const square = board[row][col]
      if (!square) continue
      const table = PST[square.type]
      // row 0 là hàng 8 → khớp đúng thứ tự bảng PST; quân Đen soi gương.
      const index = square.color === 'w' ? row * 8 + col : (7 - row) * 8 + col
      const value = VALUES[square.type] + (table?.[index] ?? 0)
      score += square.color === 'w' ? value : -value
    }
  }
  return score
}

/** Sắp xếp nước đi: ăn quân to trước để alpha-beta cắt tỉa tốt hơn. */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort(
    (a, b) => (b.captured ? VALUES[b.captured] : 0) - (a.captured ? VALUES[a.captured] : 0),
  )
}

function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
  ply: number,
): number {
  if (game.isCheckmate()) return -MATE + ply
  if (game.isDraw() || game.isStalemate() || game.isInsufficientMaterial()) return 0
  if (depth <= 0) {
    return (game.turn() === 'w' ? 1 : -1) * evaluateWhite(game)
  }
  if (Date.now() > deadline) throw new Error(TIMEOUT)

  let best = -Infinity
  let a = alpha
  for (const move of orderMoves(game.moves({ verbose: true }))) {
    game.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' })
    const score = -negamax(game, depth - 1, -beta, -a, deadline, ply + 1)
    game.undo()
    if (score > best) best = score
    if (best > a) a = best
    if (a >= beta) break
  }
  return best
}

/**
 * Chọn nước đi cho máy. Luôn trả về nước hợp lệ, tôn trọng ngân sách thời gian,
 * và ở mức Dễ/Vừa sẽ chọn ngẫu nhiên trong nhóm nước gần bằng điểm cao nhất
 * để bé không gặp một đối thủ "máy móc" nhàm chán.
 */
export function pickMove(fen: string, difficulty: Difficulty = 'medium'): Move | null {
  const game = new Chess()
  try {
    game.load(fen)
  } catch {
    return null
  }

  const legalMoves = game.moves({ verbose: true })
  if (legalMoves.length === 0) return null

  const config = DIFFICULTY[difficulty]

  // Bé mới tập: thỉnh thoảng máy "đi bừa" cho ván cờ vui hơn.
  if (config.blunderChance > 0 && Math.random() < config.blunderChance) {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)]
  }

  const ordered = orderMoves(legalMoves)
  const deadline = Date.now() + config.timeBudget
  let pool: { move: Move; score: number }[] = ordered.map((move) => ({
    move,
    score: 0,
  }))

  try {
    for (let depth = 1; depth <= config.depth; depth += 1) {
      const scored: { move: Move; score: number }[] = []
      for (const move of ordered) {
        if (Date.now() > deadline) throw new Error(TIMEOUT)
        game.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' })
        // Cửa sổ đầy đủ để mọi nước gốc đều có điểm chính xác (phục vụ chọn ngẫu nhiên).
        const score = -negamax(game, depth - 1, -Infinity, Infinity, deadline, 1)
        game.undo()
        scored.push({ move, score })
      }
      scored.sort((a, b) => b.score - a.score)
      pool = scored
    }
  } catch {
    // Hết ngân sách thời gian → dùng kết quả của vòng sâu nhất đã hoàn thành.
  }

  const bestScore = pool[0]?.score ?? 0
  const candidates = pool.filter((item) => item.score >= bestScore - config.epsilon)
  const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0]
  return chosen?.move ?? ordered[0]
}

/** Bọc kết quả thành dữ liệu gọn nhẹ để gửi qua Web Worker. */
export function toEngineMove(move: Move | null): EngineMove | null {
  if (!move) return null
  return {
    san: move.san,
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  }
}
