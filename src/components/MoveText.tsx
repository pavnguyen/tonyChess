import { splitMoveMentions } from '../lib/moveText'
import { PIECE_GLYPH, PIECE_NAME_VI } from '../lib/notation'

interface Props {
  /** Câu cần hiện (giữ nguyên nội dung gốc). */
  text: string
}

/**
 * Hiện câu văn mà **tên quân + vị trí** được tô sáng: `♟ Tốt e5`, `♞ Mã c6`.
 *
 * Nhờ vậy bé quét mắt là thấy ngay "quân gì, đứng ở đâu" trong một đoạn chữ dài,
 * và hình quân cờ giúp nhớ mặt quân. Phần chữ còn lại giữ nguyên từng ký tự -
 * component này không rút gọn hay thay đổi nội dung.
 */
export function MoveText({ text }: Props) {
  const parts = splitMoveMentions(text)
  if (parts.length === 1 && parts[0].kind === 'text') return <>{text}</>

  return (
    <>
      {parts.map((part, index) =>
        part.kind === 'text' ? (
          <span key={index}>{part.text}</span>
        ) : (
          <span
            key={index}
            className="mx-0.5 inline-flex items-baseline gap-0.5 rounded-md bg-gold-100 px-1 py-px font-extrabold text-brand-900 ring-1 ring-gold-300"
          >
            <span aria-hidden>{PIECE_GLYPH[part.piece]}</span>
            {PIECE_NAME_VI[part.piece]} {part.square}
          </span>
        ),
      )}
    </>
  )
}
