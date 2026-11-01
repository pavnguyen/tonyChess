import { splitMoveMentions } from '../lib/moveText'
import { FIGURINE, PIECE_NAME_VI } from '../lib/notation'

interface Props {
  /** Câu cần hiện (giữ nguyên nội dung gốc). */
  text: string
}

/**
 * Hiện câu văn mà **tên quân + vị trí** được tô sáng: `♙ Tốt e5`, `♘ Mã c6`.
 *
 * Nhờ vậy bé quét mắt là thấy ngay "quân gì, đứng ở đâu" trong một đoạn chữ dài,
 * và hình quân cờ giúp nhớ mặt quân. Phần chữ còn lại giữ nguyên từng ký tự -
 * component này không rút gọn hay thay đổi nội dung.
 *
 * Dùng hình quân RỖNG (♙♘♗) như ký hiệu nước đi ở banner, không dùng hình đặc:
 * hình đặc (♟♞♝) ở cỡ chữ nhỏ trông nặng và dễ bị cắt viền trên/dưới.
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
            // `inline` (không phải inline-flex) để chip chảy theo dòng chữ như một
            // từ: không bị tách thành hộp riêng làm vỡ bố cục flex xung quanh.
            className="mx-0.5 inline whitespace-nowrap rounded-md bg-gold-100 px-1 font-extrabold text-brand-900 ring-1 ring-gold-300"
          >
            <span aria-hidden className="mr-1">
              {FIGURINE[part.piece]}
            </span>
            {PIECE_NAME_VI[part.piece]} {part.square}
          </span>
        ),
      )}
    </>
  )
}
