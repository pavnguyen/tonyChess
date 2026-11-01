import type { PieceCode } from '../types'

/**
 * Nhận diện **cụm quân + vị trí** trong câu tiếng Việt để giao diện tô sáng:
 *
 *  - cụm đã có tên quân: `Tượng c4`, `Mã f6`, `Tốt e5`, `Hậu d8`… → giữ nguyên tên;
 *  - nước Tốt viết trơn sau động từ đi Tốt: `Đáp e5`, `Đẩy c5`, `Dâng d4`, `...b5`
 *    → hiểu là Tốt (trong dữ liệu, các động từ này luôn nói về Tốt).
 *
 * Vì sao cần: bé 7 tuổi đọc "Đáp e5" không biết quân nào đi; hiện thành
 * **♟ Tốt e5** vừa rõ quân, vừa có hình để nhớ. Hàm này chỉ TÁCH câu, không sửa
 * nội dung - phần chữ còn lại giữ nguyên từng ký tự.
 */

const PIECE_BY_WORD: Record<string, PieceCode> = {
  Tốt: 'p',
  Mã: 'n',
  Tượng: 'b',
  Xe: 'r',
  Hậu: 'q',
  Vua: 'k',
}

/**
 * Động từ mà chủ ngữ trong dữ liệu luôn là Tốt ("Đáp e5", "Đẩy c5"…), cộng dấu
 * ba chấm của nước Đen ("...b5"). Phải escape dấu chấm, nếu để `...` thì nó thành
 * ký tự đại diện và nuốt luôn những ô đứng sau từ bất kỳ.
 */
const PAWN_VERBS = ['Đáp', 'Đẩy', 'Dâng', 'Chèn', 'Tiến', 'Kéo', 'Chiếm', '\\.\\.\\.', '…']

const MENTION = new RegExp(
  [
    '(?<![\\p{L}])',
    '(?:',
    // 1+2: tên quân + ô, ví dụ "Tượng c4"
    '(Tốt|Mã|Tượng|Xe|Hậu|Vua)\\s?([a-h][1-8])',
    '|',
    // 3: ô đứng ngay sau một động từ đi Tốt (động từ nằm NGOÀI match nên vẫn còn trong câu)
    `(?<=(?:${PAWN_VERBS.join('|')})\\s)([a-h][1-8])`,
    ')',
    // Không ăn vào đuôi từ ("Tượng c4a") hay chuỗi ô ("b4-b5").
    '(?![\\p{L}0-9-])',
  ].join(''),
  'gu',
)

export type MoveMention =
  | { kind: 'text'; text: string }
  | { kind: 'piece'; piece: PieceCode; square: string }

/**
 * Tách câu thành các mảnh chữ thường và các mảnh "quân + ô".
 * Câu không có cụm nào thì trả về đúng MỘT mảnh chữ (component sẽ render thẳng).
 */
export function splitMoveMentions(source: string): MoveMention[] {
  const parts: MoveMention[] = []
  let cursor = 0
  for (const match of source.matchAll(MENTION)) {
    const index = match.index ?? 0
    const which = match[1]
    const square = match[2] ?? match[3]
    if (!square) continue
    if (index > cursor) parts.push({ kind: 'text', text: source.slice(cursor, index) })
    parts.push({ kind: 'piece', piece: which ? PIECE_BY_WORD[which] : 'p', square })
    cursor = index + match[0].length
  }
  if (cursor < source.length) parts.push({ kind: 'text', text: source.slice(cursor) })
  return parts
}
