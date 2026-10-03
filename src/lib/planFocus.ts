/**
 * **Soi ô cờ theo câu kế hoạch** (§4.4 - phần "Kế hoạch trung cuộc").
 *
 * Khác với `livePlan.ts` (máy đọc thế cờ rồi tự sinh việc), module này chỉ làm
 * **một việc rất nhỏ**: đọc một câu kế hoạch viết tay rồi rút ra
 *
 *  1. **những ô cờ** câu đó nhắc tới (để giao diện tô sáng), và
 *  2. **mũi tên "từ ô này sang ô kia"** nếu câu nói rõ quân đang đứng ở đâu và đi tới đâu.
 *
 * Nhờ vậy phần kế hoạch trở nên **trực quan** mà KHÔNG phải thêm dữ liệu mới: mỗi
 * câu kế hoạch vốn đã có sẵn số ô ("Đưa Mã b1 lên d2", "ô f7", "Xe vào cột e"),
 * ta chỉ đọc lại chính câu đó.
 *
 * Ba dạng được nhận ra:
 *  - **ô cờ** - chữ cột + số hàng, ví dụ `d2`, `f7`; chấp nhận cả khi dính ký hiệu
 *    quân (`Nc6`, `Bg3`) để câu nào viết theo ký hiệu SAN vẫn hiểu được;
 *  - **cả một cột** - cụm "cột e" nghĩa là cột e, tô sáng đủ 8 ô của cột đó;
 *  - **mũi tên** - câu dạng `Đưa <quân> <ô nguồn> … <ô đích>`, ví dụ
 *    "Đưa Xe f8 lên e8" → mũi tên f8 → e8. Chỉ lấy **ô đích là ô cụ thể**; câu nói
 *    "sang cột c" thì không vẽ mũi tên (vẽ vào đâu cũng là đoán bừa).
 *
 * Chủ ý KHÔNG nhận "cột Hậu" / "cánh Vua": chỉ chữ cột viết thường `a..h` mới được
 * tính, nên "cột Hậu" không bị hiểu nhầm thành cột h.
 *
 * Module thuần dữ liệu + hàm (không React/DOM) nên kiểm chứng được bằng
 * `node scripts/smoke-plan.ts`.
 */
import { Chess } from 'chess.js'
import type { Side } from '../types'

/** Một ô cờ, ví dụ `d2`. Ký hiệu quân đứng trước (nếu có) chỉ để nhận diện, bỏ đi. */
const SQUARE_TOKEN = /\b[KQRBN]?([a-h][1-8])\b/g

/** Cụm "cột e" - nhóm 1 là chữ cột viết thường. */
const FILE_TOKEN = /\bcột\s+([a-h])\b/g

/** Câu nói rõ QUÂN ĐANG Ở đâu: "Đưa Xe f8 …". Nhóm 1 là ô xuất phát. */
const MOVE_SOURCE = /(?:Đưa|đưa)\s+(?:Mã|Tượng|Xe|Hậu|Vua|Tốt)\s+([a-h][1-8])/g

/**
 * Nước **dọn đường** nhắc trước mũi tên, ví dụ "Đẩy Tốt b6 rồi đưa Tượng c8 ra b7"
 * hoặc "Đánh sang cánh Hậu bằng ...b5 rồi đưa Tượng c8 lên b7". Nhóm 1 là ô đích
 * của nước dọn đường; quân đi là Tốt nên chỉ cần biết nó tới đâu.
 */
const PREP_PUSH = /(?:Đẩy|đẩy|bằng)\s*(?:Tốt\s*)?\.{0,3}\s*([a-h][1-8])/g

const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const BOARD_RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

const fileIndex = (file: string) => BOARD_FILES.indexOf(file as (typeof BOARD_FILES)[number])

/** Một chỗ nhắc tới ô cờ trong câu, kèm vị trí để biết ô nào đứng trước ô nào. */
interface FocusToken {
  square: string
  start: number
  /** Ô sinh ra từ cụm "cột x" (cả cột) - không dùng làm đích mũi tên. */
  fromFile: boolean
}

export interface PlanArrow {
  from: string
  to: string
}

export interface PlanFocus {
  /** Mọi ô cần tô sáng, đã bỏ trùng và sắp theo thứ tự bàn cờ (a1 → h8). */
  squares: string[]
  /** Cặp ô "nguồn → đích" nếu câu nói rõ; không rõ thì `null`. */
  arrow: PlanArrow | null
  /** Các ô mà Tốt phải tiến tới TRƯỚC mũi tên (kế hoạch 2 bước), theo thứ tự câu. */
  prep: string[]
}

function scanTokens(text: string): FocusToken[] {
  const list: FocusToken[] = []
  for (const match of text.matchAll(SQUARE_TOKEN)) {
    list.push({ square: match[1], start: match.index ?? 0, fromFile: false })
  }
  for (const match of text.matchAll(FILE_TOKEN)) {
    const file = match[1]
    for (const rank of BOARD_RANKS) {
      list.push({ square: file + rank, start: match.index ?? 0, fromFile: true })
    }
  }
  return list.sort((a, b) => a.start - b.start)
}

interface FoundArrow {
  arrow: PlanArrow
  /** Vị trí phần "Đưa <quân> <ô nguồn>" trong câu. */
  index: number
}

function findArrow(text: string, tokens: FocusToken[]): FoundArrow | null {
  const [match] = [...text.matchAll(MOVE_SOURCE)]
  if (!match) return null
  const from = match[1]
  const index = match.index ?? 0
  const after = index + match[0].length
  // Ô đích = ô ĐẦU TIÊN nhắc tới sau phần "Đưa <quân> <ô nguồn>".
  const next = tokens.find((token) => token.start >= after)
  if (!next || next.fromFile || next.square === from) return null
  return { arrow: { from, to: next.square }, index }
}

/** Các nước dọn đường (Tốt) nhắc TRƯỚC mũi tên, theo thứ tự trong câu. */
function prepsBefore(text: string, before: number): string[] {
  const list: string[] = []
  for (const match of text.matchAll(PREP_PUSH)) {
    if ((match.index ?? 0) < before) list.push(match[1])
  }
  return list
}

/**
 * Rút ô cờ + mũi tên từ một câu kế hoạch. Câu không nhắc ô nào thì `squares` rỗng.
 */
export function parsePlanFocus(text: string): PlanFocus {
  const tokens = scanTokens(text)
  const squares = [...new Set(tokens.map((token) => token.square))].sort((a, b) => {
    const byFile = fileIndex(a[0]) - fileIndex(b[0])
    return byFile !== 0 ? byFile : Number(a[1]) - Number(b[1])
  })
  const found = findArrow(text, tokens)
  return {
    squares,
    arrow: found?.arrow ?? null,
    prep: found ? prepsBefore(text, found.index) : [],
  }
}

/** Dựng ván cờ từ `fen` nhưng cho bên `side` đi trước (kế hoạch là việc CỦA BÉ). */
function withSideToMove(fen: string, side: Side): Chess | null {
  const parts = fen.split(' ')
  if (parts.length < 6) return null
  try {
    const game = new Chess()
    parts[1] = side === 'white' ? 'w' : 'b'
    // Bắt Tốt qua đường và số nước không quan trọng khi kiểm một nước đơn lẻ.
    parts[3] = '-'
    parts[4] = '0'
    game.load(parts.join(' '))
    return game
  } catch {
    return null
  }
}

/**
 * Nước `from → to` có **đi được thật** không, nhìn từ phía bé (`side`)?
 *
 * Vì sao phải tự đổi lượt đi: dòng chính có thể kết thúc ở nước của đối thủ, nên
 * tới lượt bên kia - mà kế hoạch lại là việc CỦA BÉ. Ta dựng lại đúng thế cờ đó
 * nhưng cho bé đi trước, rồi hỏi `chess.js` xem nước ấy có hợp lệ.
 */
export function isSideMoveLegal(fen: string, side: Side, from: string, to: string): boolean {
  const game = withSideToMove(fen, side)
  if (!game) return false
  try {
    return Boolean(game.move({ from, to }))
  } catch {
    return false
  }
}

/** Nước đi hợp lệ của Tốt `side` tới đúng ô `square` (để kiểm nước dọn đường). */
function pawnMoveTo(game: Chess, square: string) {
  return game
    .moves({ verbose: true })
    .find((move) => move.piece === 'p' && move.to === square)
}

/**
 * Cả câu kế hoạch có **làm được thật** không: đi lần lượt các nước Tốt dọn đường
 * nhắc trước, rồi tới nước chính của mũi tên.
 *
 * Nhờ vậy câu kiểu "Đẩy Tốt b6 rồi đưa Tượng c8 ra b7" vẫn được coi là ĐÚNG (một
 * kế hoạch hai bước), trong khi câu nói điều bất khả thi vẫn bị bắt.
 */
export function isPlanFocusPlayable(fen: string, side: Side, text: string): boolean {
  const focus = parsePlanFocus(text)
  const { arrow } = focus
  if (!arrow) return false
  const game = withSideToMove(fen, side)
  if (!game) return false
  for (const target of focus.prep) {
    const prep = pawnMoveTo(game, target)
    if (!prep) return false
    try {
      game.move({ from: prep.from, to: prep.to, promotion: prep.promotion })
    } catch {
      return false
    }
  }
  // Đi xong nước dọn đường thì lượt đi đã thuộc về đối thủ - phải trả lượt lại
  // cho bé rồi mới kiểm nước chính (cả hai nước đều là việc CỦA BÉ).
  const after = withSideToMove(game.fen(), side)
  if (!after) return false
  try {
    return Boolean(after.move({ from: arrow.from, to: arrow.to }))
  } catch {
    return false
  }
}
