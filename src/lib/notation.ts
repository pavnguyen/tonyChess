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
