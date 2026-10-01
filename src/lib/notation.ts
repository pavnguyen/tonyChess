import type { CSSProperties } from 'react'
import type { MoveAnnotation, NotationStyle, PieceCode } from '../types'

/** Tên quân cờ tiếng Việt đầy đủ. */
export const PIECE_NAME_VI: Record<PieceCode, string> = {
  k: 'Vua',
  q: 'Hậu',
  r: 'Xe',
  b: 'Tượng',
  n: 'Mã',
  p: 'Tốt',
}

/** Ký hiệu hình con cờ (dễ nhất cho bé 7 tuổi). */
const FIGURINE: Record<PieceCode, string> = {
  k: '♔',
  q: '♕',
  r: '♖',
  b: '♗',
  n: '♘',
  p: '♙',
}

/**
 * Hình quân cờ "đặc" (♚♛♜♝♞♟) - nhìn là nhận ra ngay quân gì, dùng cho những
 * chỗ cần icon to như banner giải thích. Khác với `FIGURINE` (hình rỗng
 * ♔♕♖♗♘♙) vốn dùng trong ký hiệu nước đi.
 */
export const PIECE_GLYPH: Record<PieceCode, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
}

/** Ký hiệu chuẩn thi đấu quốc tế FIDE. */
const ENGLISH: Record<PieceCode, string> = {
  k: 'K',
  q: 'Q',
  r: 'R',
  b: 'B',
  n: 'N',
  p: '',
}

/** Ký hiệu chuẩn sách cờ Việt Nam cũ (M, T, X, H, V). */
const VIETNAMESE: Record<PieceCode, string> = {
  k: 'V',
  q: 'H',
  r: 'X',
  b: 'T',
  n: 'M',
  p: '',
}

/** Màu vàng đồng của mũi tên chỉ nước đi kế tiếp. */
export const ARROW_COLOR = '#d9a93f'

/**
 * Các vệt tô trên bàn cờ - khai báo một chỗ để gam màu luôn khớp nhau.
 *
 * Quy ước màu cho bé:
 * - **Nước vừa đi**: viền xám nhạt (thông tin, không tranh sự chú ý).
 * - **Quân bé cần đi**: viền VÀNG ĐỒNG đậm + nền vàng nhạt.
 * - **Ô đích**: viền XANH THÉP + nền xanh nhạt (khác hẳn màu quân cần đi).
 *
 * Vàng đồng và xanh thép đều nổi rõ trên cả ô trắng lẫn ô xanh lá đậm của bàn cờ.
 */
export const BOARD_MARKS = {
  lastMoveFrom: 'inset 0 0 0 3px rgba(110, 120, 114, 0.5)',
  lastMoveTo: 'inset 0 0 0 4px rgba(110, 120, 114, 0.62)',
  hintFromFill: 'rgba(217, 169, 63, 0.4)',
  hintFromRing: 'inset 0 0 0 5px #c08e22',
  hintToFill: 'rgba(147, 192, 205, 0.42)',
  hintToRing: 'inset 0 0 0 4px #5f9faf',
} as const

/**
 * Style hoàn chỉnh cho hai ô gợi ý - dùng chung cho cả ba tab có bàn cờ, nên
 * muốn đổi cách nháy chỉ cần sửa ở đây.
 *
 * Nhịp “thở” khai báo ở `src/index.css`: viền dày lên rồi trả về, chu kỳ 1.5s.
 * Nền + viền tĩnh vẫn được đặt song song để bé nào bật chế độ “giảm chuyển
 * động” thì ô gợi ý vẫn hiện ra bình thường.
 */
export const HINT_FROM_STYLE: CSSProperties = {
  backgroundColor: BOARD_MARKS.hintFromFill,
  boxShadow: BOARD_MARKS.hintFromRing,
  // Ô của QUÂN BÉ CẦN ĐI: nhịp mạnh hơn một chút cho bé bắt được ngay.
  animation: 'hint-breathe-gold 1.5s ease-in-out infinite',
}

export const HINT_TO_STYLE: CSSProperties = {
  backgroundColor: BOARD_MARKS.hintToFill,
  boxShadow: BOARD_MARKS.hintToRing,
  // Ô ĐÍCH: nhịp dịu hơn, để mắt bé tập trung vào quân cần đi.
  animation: 'hint-breathe-steel 1.5s ease-in-out infinite',
}

export const NOTATION_OPTIONS: {
  value: NotationStyle
  label: string
  sample: string
}[] = [
  { value: 'figurine', label: 'Hình con cờ', sample: '♘f3' },
  { value: 'english', label: 'Chuẩn quốc tế', sample: 'Nf3' },
  { value: 'vietnamese', label: 'Tiếng Việt', sample: 'Mf3' },
]

/** Đoán loại quân cờ từ một nước đi SAN. */
export function pieceFromSan(san: string): PieceCode {
  if (san.startsWith('O-O')) return 'k'
  const head = san[0]
  switch (head) {
    case 'K':
      return 'k'
    case 'Q':
      return 'q'
    case 'R':
      return 'r'
    case 'B':
      return 'b'
    case 'N':
      return 'n'
    default:
      return 'p'
  }
}

function letterFor(piece: PieceCode, style: NotationStyle): string {
  if (style === 'figurine') return FIGURINE[piece]
  if (style === 'english') return ENGLISH[piece]
  return VIETNAMESE[piece]
}

/**
 * Đổi một nước SAN sang ký hiệu theo tuýp chọn của bé.
 * Ví dụ "Nf3" → "♘f3" (hình) | "Nf3" (quốc tế) | "Mf3" (Việt).
 */
export function formatSan(san: string, style: NotationStyle): string {
  if (san.startsWith('O-O')) return san
  const piece = pieceFromSan(san)
  if (piece === 'p') return san
  return letterFor(piece, style) + san.slice(1)
}

/** Mô tả 1 câu cho bé: "Quân Mã nhảy tới f3". */
export function describeMove(san: string, style: NotationStyle) {
  const piece = pieceFromSan(san)
  const notation = formatSan(san, style)
  const pieceName = PIECE_NAME_VI[piece]
  const isCastle = san.startsWith('O-O')
  const target = isCastle ? '' : san.replace(/^[KQRBN]/, '').replace(/[+#]$/, '')
  const action = isCastle
    ? 'Nhập thành an toàn'
    : piece === 'p'
      ? `Tốt tiến tới ${target}`
      : `${pieceName} nhảy tới ${target}`
  return { notation, pieceName, target, isCastle, action, piece }
}

/** Lời giải thích thay thế cho nước đi của đối thủ. */
export function opponentAnnotation(san: string, notation: NotationStyle): MoveAnnotation {
  return {
    san,
    piece: pieceFromSan(san),
    reason: `Đối thủ đi ${formatSan(san, notation)} để chống lại kế hoạch của bé.`,
    rhyme: 'Nhìn kỹ đối thủ',
  }
}

/** "1. d4" / "3... Nf6" theo số ply (0-based). */
export function moveLabel(plyIndex: number, san: string, style: NotationStyle): string {
  const moveNumber = Math.floor(plyIndex / 2) + 1
  const dots = plyIndex % 2 === 0 ? '.' : '...'
  return `${moveNumber}${dots} ${formatSan(san, style)}`
}
