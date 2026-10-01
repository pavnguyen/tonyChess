/**
 * **Kế hoạch theo thế cờ hiện tại** (mức 3 của §4.4) - sinh tự động bằng engine.
 *
 * Khác với `Opening.plan` (kế hoạch viết tay, cố định cho cả khai cuộc), module này
 * **đọc chính thế cờ bé đang có trên bàn** rồi nói ra việc cần làm ngay:
 *
 *  1. 🚨 quân CỦA BÉ đang bị treo → cứu hoặc đổi;
 *  2. 🎯 quân ĐỐI THỦ đang bị treo → ăn được;
 *  3. 🎯 mục tiêu theo thế cờ: Vua chưa nhập thành, cột mở cho Xe, Tốt sắp phong cấp;
 *  4. 🤖 engine (minimax thuần JS) đề xuất nước đi + đánh giá ai đang hơn.
 *
 * Nhờ vậy "Kế hoạch tiếp theo" đổi theo TỪNG nhánh bé chọn và từng nước bé đi - đúng
 * nghĩa "tuỳ tình huống", chứ không phải 3 câu giống nhau cho mọi ván.
 *
 * Module thuần dữ liệu + hàm (không React/DOM) nên test được bằng `node
 * scripts/smoke-plan.ts`. Engine dùng mức `hard` vì đây là **lời khuyên**, không phải
 * đối thủ: `hard` có `blunderChance = 0` nên **không bao giờ cố tình đi bừa** (mức
 * `easy`/`medium` đi bừa để ván đấu vui hơn nên không dùng để khuyên được).
 *
 * Lưu ý: `hard` vẫn chạy theo **ngân sách thời gian**, nên hai lần gọi liên tiếp có
 * thể ra hai nước hơi khác nhau; vì vậy bài test chỉ khẳng định nước đề xuất **đi
 * được thật**, còn phần đọc thế cờ (quân treo, cột mở, Tốt sắp phong cấp) là thuần
 * dữ liệu nên luôn ổn định.
 */
import { Chess } from 'chess.js'
// Đuôi `.ts` là bắt buộc: file này còn được `node scripts/smoke-plan.ts` nạp thẳng
// (Node tự bỏ kiểu), mà Node không tự thêm đuôi cho import lúc chạy.
import { evaluateWhite, pickMove } from '../engine/minimax.ts'
import type { Difficulty } from '../engine/minimax.ts'
import { findHangingPieces } from './threats.ts'
import type { Side } from '../types'

export interface LivePlanItem {
  icon: string
  kind: 'danger' | 'chance' | 'goal' | 'engine' | 'note'
  text: string
}

export interface LivePlan {
  items: LivePlanItem[]
  /** Nước engine đề xuất (SAN) - `null` khi thế cờ đã hết nước. */
  engineSan: string | null
  /** Câu đánh giá thế cờ nhìn từ phía bé, ví dụ "bé hơn 1.2". */
  evalText: string
  mood: 'better' | 'even' | 'worse'
}

/** Tối đa 4 việc - nhiều hơn thì bé 7 tuổi không nhớ nổi. */
export const MAX_LIVE_PLAN_ITEMS = 4

const NAME_VI: Record<string, string> = {
  p: 'Tốt',
  n: 'Mã',
  b: 'Tượng',
  r: 'Xe',
  q: 'Hậu',
  k: 'Vua',
}

/**
 * Quân của bên `side` đang ở hàng thứ mấy (1..8) - dùng để biết Tốt còn mấy bước
 * nữa thành Hậu.
 */
function rankOf(square: string): number {
  return Number(square[1])
}

/** Cột nào không còn Tốt nào (cột mở) mà bên mình lại có Xe. */
function openFileForRook(game: Chess, side: Side): string | null {
  const pawnFiles = new Set(
    game
      .board()
      .flat()
      .filter((cell) => cell && cell.type === 'p')
      .map((cell) => cell!.square[0]),
  )
  const hasRook = game
    .board()
    .flat()
    .some((cell) => cell && cell.color === (side === 'white' ? 'w' : 'b') && cell.type === 'r')
  if (!hasRook) return null
  const centerFirst = ['d', 'e', 'c', 'f', 'b', 'g', 'a', 'h']
  return centerFirst.find((file) => !pawnFiles.has(file)) ?? null
}

/** Tốt của bên mình đã qua hàng 4 (sắp phong cấp). */
function rookieRunner(game: Chess, side: Side): { square: string; steps: number } | null {
  const own = side === 'white' ? 'w' : 'b'
  let best: { square: string; steps: number } | null = null
  for (const cell of game.board().flat()) {
    if (!cell || cell.color !== own || cell.type !== 'p') continue
    const rank = rankOf(cell.square)
    const steps = side === 'white' ? 8 - rank : rank - 1
    if (steps > 3) continue
    if (!best || steps < best.steps) best = { square: cell.square, steps }
  }
  return best
}

/**
 * Sinh kế hoạch cho thế cờ `fen` nhìn từ phía bé (`side`).
 * Trả `null` nếu FEN không hợp lệ.
 */
export function buildLivePlan(
  fen: string,
  side: Side,
  difficulty: Difficulty = 'hard',
): LivePlan | null {
  const game = new Chess()
  try {
    game.load(fen)
  } catch {
    return null
  }

  const foe: Side = side === 'white' ? 'black' : 'white'
  const items: LivePlanItem[] = []

  // 1. Quân của bé đang treo - việc gấp nhất, luôn đứng đầu.
  const mine = findHangingPieces(game, side).sort((a, b) => a.attackers - b.attackers)
  if (mine[0]) {
    items.push({
      icon: '🚨',
      kind: 'danger',
      text: `Đang treo ${NAME_VI[mine[0].piece]} ở ${mine[0].square} - cứu hoặc đổi ngay.`,
    })
  }

  // 2. Quân đối thủ bị treo - cơ hội ăn quân.
  const theirs = findHangingPieces(game, foe)
  if (theirs[0]) {
    items.push({
      icon: '🎯',
      kind: 'chance',
      text: `Đối thủ treo ${NAME_VI[theirs[0].piece]} ở ${theirs[0].square} - ăn được ngay.`,
    })
  }

  // 3. Mục tiêu theo thế cờ.
  const castling = fen.split(' ')[2] ?? '-'
  const castleRights = side === 'white' ? /[KQ]/ : /[kq]/
  if (castleRights.test(castling)) {
    items.push({
      icon: '🏰',
      kind: 'goal',
      text: 'Vua còn ở giữa - nhập thành cho Vua vào lều an toàn.',
    })
  }
  const runner = rookieRunner(game, side)
  if (runner) {
    items.push({
      icon: '👑',
      kind: 'goal',
      text: `Tốt ${runner.square} chỉ còn ${runner.steps} bước là thành Hậu - đẩy tiếp!`,
    })
  }
  const openFile = openFileForRook(game, side)
  if (openFile) {
    items.push({
      icon: '🛣️',
      kind: 'goal',
      text: `Cột ${openFile} đã mở - đưa Xe chiếm cột đó.`,
    })
  }

  // 4. Engine: nước máy muốn đi + ai đang hơn.
  const best = pickMove(fen, difficulty)
  if (best) {
    items.push({ icon: '🤖', kind: 'engine', text: `Máy muốn đi ${best.san}.` })
  }

  if (items.length < 2) {
    items.push({
      icon: '🧭',
      kind: 'note',
      text: 'Thế cờ đang cân bằng - cải thiện quân yếu nhất rồi tiến lên.',
    })
  }

  const raw = evaluateWhite(game)
  const cp = side === 'white' ? raw : -raw
  const evalText =
    Math.abs(cp) < 50
      ? 'hai bên cân bằng'
      : cp > 0
        ? `bé hơn ${(cp / 100).toFixed(1)}`
        : `đối thủ hơn ${(-cp / 100).toFixed(1)}`

  return {
    items: items.slice(0, MAX_LIVE_PLAN_ITEMS),
    engineSan: best?.san ?? null,
    evalText,
    mood: Math.abs(cp) < 50 ? 'even' : cp > 0 ? 'better' : 'worse',
  }
}