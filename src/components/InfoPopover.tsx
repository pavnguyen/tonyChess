import { useState, type ReactNode } from 'react'
import { infoById } from '../lib/info'

/**
 * Nút **ⓘ** (giải thích tại chỗ) + bảng nội dung mở ra.
 *
 * Vì sao làm dạng "hộp thoại giữa màn hình" chứ không phải bảng xổ xuống như ⚙️:
 * nút ⓘ xuất hiện ở RẤT nhiều khung - có khung nằm trong cột phải vốn đã tự cuộn,
 * có khung nằm sát mép. Bảng xổ xuống (`absolute`) sẽ bị cắt hoặc tràn ra ngoài.
 * Dùng lớp phủ `fixed` + hộp canh giữa thì chạy giống nhau ở mọi chỗ, và trên
 * điện thoại bé vẫn đọc được trọn nội dung.
 *
 * Nếu khoá `topic` chưa có nội dung thì nút **không hiện** - nhờ vậy thêm một
 * khai cuộc mới mà chưa kịp viết giải thích thì giao diện không hiện nút rỗng.
 */

/** In đậm `**chữ**` và mã `` `chữ` `` trong nội dung - đủ để đọc rõ, không cần markdown. */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <b key={index} className="font-extrabold text-brand-900">
          {part.slice(2, -2)}
        </b>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-brand-50 px-1 py-0.5 font-mono text-[0.72rem] font-bold text-brand-700"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

// Hai tông màu: `default` cho nền sáng (mọi khung nội dung), `onDark` cho thanh
// tiêu đề xanh đậm. Dùng prop chứ không nối class để tránh việc hai lớp Tailwind
// cùng thuộc tính (`text-white` vs `text-info-600`) tranh nhau thắng-thua.
const TONES = {
  default:
    'border-info-200 bg-info-50 text-info-600 hover:border-info-400 hover:bg-info-100',
  onDark: 'border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/25',
} as const

export function InfoButton({
  topic,
  tone = 'default',
}: {
  topic?: string
  tone?: keyof typeof TONES
}) {
  const [open, setOpen] = useState(false)
  const entry = topic ? infoById(topic) : undefined
  if (!entry) return null

  return (
    <>
      <button
        type="button"
        id={`kid-info-${topic}`}
        data-info-topic={topic}
        aria-label={`Giải thích: ${entry.title}`}
        title="Bấm để đọc giải thích"
        onClick={() => setOpen(true)}
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 text-[0.7rem] font-extrabold transition-all active:translate-y-[1px] ${TONES[tone]}`}
      >
        ⓘ
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-ink-900/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={entry.title}
            id={`kid-info-panel-${topic}`}
            className="animate-pop-in fixed left-1/2 top-1/2 z-50 max-h-[80dvh] w-[min(22rem,90vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-[3px] border-white bg-white p-3 text-left shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-info-50 px-2 py-0.5 text-[0.65rem] font-extrabold text-info-700">
                {entry.tag}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng giải thích"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-600 transition-all hover:bg-brand-100 active:translate-y-[1px]"
              >
                ✕
              </button>
            </div>
            <h3 className="mt-1.5 text-base font-extrabold text-brand-900">{entry.title}</h3>
            <div className="mt-1.5 grid gap-1.5">
              {entry.body.map((paragraph, index) => (
                <p key={index} className="text-[0.78rem] font-bold leading-snug text-ink-600">
                  {inline(paragraph)}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
