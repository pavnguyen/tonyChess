import { InfoButton } from './InfoPopover'
import { useKidProgress } from '../store/progress'

export interface ReviewItem {
  /** Id hoạt động dùng trong sổ tiến độ (ví dụ `tactics:fork-1`). */
  id: string
  /** Nhãn ngắn hiện trên chip. */
  label: string
}

/**
 * Khung **🔁 Ôn tập hôm nay** - gom những bài đã làm và đã tới hạn nhắc lại theo nhịp
 * ôn tập ngắt quãng (xem `REVIEW_INTERVALS_DAYS` trong store tiến độ). Bé bấm một chip
 * là nhảy thẳng tới bài đó để làm lại.
 *
 * Đặt ở tab nào thì truyền đúng danh sách bài của tab đó (`items`).
 */
export function ReviewStrip({
  items,
  onPick,
  title = '🔁 Ôn tập hôm nay',
}: {
  items: ReviewItem[]
  onPick: (id: string) => void
  title?: string
}) {
  const { isReviewDue } = useKidProgress()
  const due = items.filter((item) => isReviewDue(item.id))

  return (
    <div
      id="kid-review-strip"
      className="rounded-2xl border-2 border-dashed border-info-300 bg-info-50 px-3 py-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-info-700">
          {title}
          <InfoButton topic="review" />
        </span>
        <span
          id="kid-review-count"
          className="rounded-full bg-info-100 px-2 py-0.5 text-[0.7rem] font-extrabold text-info-700 ring-1 ring-info-200"
        >
          {due.length} đến hạn
        </span>
      </div>
      {due.length === 0 ? (
        <p className="mt-1 text-[0.7rem] font-bold text-info-600">
          ✅ Hôm nay chưa có gì tới hạn - bé cứ học bài mới cho vui nhé!
        </p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {due.map((item) => (
            <button
              key={item.id}
              type="button"
              data-review-id={item.id}
              onClick={() => onPick(item.id)}
              className="flex max-w-[11rem] items-center gap-1 rounded-full border-2 border-info-200 bg-white px-2.5 py-1 text-[0.7rem] font-extrabold text-info-700 transition-all hover:border-info-400 active:translate-y-[1px]"
            >
              <span aria-hidden>🔁</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
