import { splitMoveMentions } from '../lib/moveText'
import { FIGURINE, PIECE_NAME_VI } from '../lib/notation'

interface Props {
  /** Câu cần hiện (giữ nguyên nội dung gốc). */
  text: string
  /**
   * Bấm vào cụm **quân + ô** (ví dụ `♗ Tượng c5`) → tô sáng ô đó trên bàn cờ.
   *
   * Chỉ truyền khi cụm chữ KHÔNG nằm trong một nút khác: một nút lồng trong nút là
   * HTML không hợp lệ và bàn phím sẽ nhảy loạn. Chỗ nào cả dòng vốn đã là nút (ví dụ
   * “Mục tiêu”/“Ba việc” ở tab Khai cuộc - bấm cả dòng đã tô ô rồi) thì để trống.
   */
  onPickSquare?: (square: string) => void
  /** Ô đang được tô sáng, để cụm chữ đang bấm nổi bật hơn các cụm khác. */
  pickedSquare?: string | null
}

/**
 * Hiện câu văn mà **tên quân + vị trí** được tô sáng: `♙ Tốt e5`, `♘ Mã c6`.
 *
 * Nhờ vậy bé quét mắt là thấy ngay "quân gì, đứng ở đâu" trong một đoạn chữ dài,
 * và hình quân cờ giúp nhớ mặt quân. Phần chữ còn lại giữ nguyên từng ký tự -
 * component này không rút gọn hay thay đổi nội dung.
 *
 * Khi có `onPickSquare`, mỗi cụm trở thành một chỗ bấm được: bấm `♗ Tượng c5` là ô
 * c5 trên bàn cờ sáng lên - bé đối chiếu chữ với bàn cờ ngay tại chỗ, không phải tự
 * dò toạ độ.
 *
 * Dùng hình quân RỖNG (♙♘♗) như ký hiệu nước đi ở banner, không dùng hình đặc:
 * hình đặc (♟♞♝) ở cỡ chữ nhỏ trông nặng và dễ bị cắt viền trên/dưới.
 */
export function MoveText({ text, onPickSquare, pickedSquare }: Props) {
  const parts = splitMoveMentions(text)
  if (parts.length === 1 && parts[0].kind === 'text') return <>{text}</>

  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === 'text') return <span key={index}>{part.text}</span>

        const active = Boolean(pickedSquare && pickedSquare === part.square)
        const label = `${PIECE_NAME_VI[part.piece]} ${part.square}`

        /*
         * `inline` (không phải inline-flex) để chip chảy theo dòng chữ như một từ:
         * không bị tách thành hộp riêng làm vỡ bố cục flex xung quanh. `role="button"`
         * thay cho <button> vì cụm chữ nằm trong <p>/<span> và không được là phần tử
         * khối.
         */
        const shared =
          'mx-0.5 inline whitespace-nowrap rounded-md px-1 font-extrabold ring-1'
        const tone = active
          ? 'bg-gold-300 text-brand-950 ring-gold-500'
          : 'bg-gold-100 text-brand-900 ring-gold-300'

        if (!onPickSquare) {
          return (
            <span key={index} className={`${shared} ${tone}`}>
              <span aria-hidden className="mr-1">
                {FIGURINE[part.piece]}
              </span>
              {label}
            </span>
          )
        }

        return (
          <span
            key={index}
            role="button"
            tabIndex={0}
            data-move-square={part.square}
            aria-pressed={active}
            title={`Bấm để tô sáng ô ${part.square} trên bàn cờ`}
            onClick={() => onPickSquare(part.square)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onPickSquare(part.square)
            }}
            className={`${shared} ${tone} cursor-pointer transition-colors hover:bg-gold-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700`}
          >
            <span aria-hidden className="mr-1">
              {FIGURINE[part.piece]}
            </span>
            {label}
          </span>
        )
      })}
    </>
  )
}
