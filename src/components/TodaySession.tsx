import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { buildSession, loadSessionState, markDone, resetSession } from '../lib/session'

/**
 * Dải **“Buổi luyện hôm nay”** ở tab Học: thấp đúng một hai dòng nên không làm bàn
 * cờ nhỏ lại, nhưng đủ để bé bấm **▶ Bắt đầu** là đi liền mạch 5 bài.
 *
 * Bỏ dở giữa chừng không sao: tiến độ của ngày được lưu, mở lại vẫn đứng đúng bài
 * đang dở. Cùng một ngày → cùng buổi luyện (sinh theo ngày, xem `src/lib/session.ts`).
 */
export function TodaySession() {
  const navigate = useNavigate()
  const items = useMemo(() => buildSession(), [])
  // Đọc tiến độ ngay trong bước khởi tạo: mở lại trang vẫn đứng đúng bài đang dở
  // mà không phải render thừa một vòng (và không cần effect).
  const [done, setDone] = useState(() => loadSessionState().done)

  const finished = done >= items.length
  const nextIndex = Math.min(done, items.length - 1)
  const nextItem = items[nextIndex]

  const start = () => {
    if (!nextItem) return
    markDone(nextIndex)
    setDone(nextIndex)
    navigate({ to: nextItem.to })
  }

  return (
    <div
      id="kid-today-session"
      className="mb-1 flex shrink-0 flex-wrap items-center gap-1.5 rounded-xl border border-sand-200 bg-white/80 px-2 py-1"
    >
      <span className="shrink-0 text-xs font-extrabold text-brand-700">
        📅 Hôm nay · {done}/{items.length}
      </span>
      <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
        {items.map((item, index) => (
          <span
            key={item.id}
            className={`size-1.5 rounded-full ${
              index < done ? 'bg-leaf-500' : index === nextIndex ? 'bg-gold-400' : 'bg-sand-200'
            }`}
          />
        ))}
      </div>
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-brand-500">
        {finished ? 'Xong buổi hôm nay 🎉' : `Tiếp: ${nextItem?.label ?? ''}`}
      </span>
      <button
        id="kid-session-start"
        type="button"
        onClick={finished ? () => { resetSession(); setDone(0) } : start}
        className="min-h-7 shrink-0 rounded-lg bg-brand-700 px-2 text-xs font-extrabold text-white active:translate-y-[1px]"
      >
        {finished ? '↺ Luyện lại' : done === 0 ? '▶ Bắt đầu' : '▶ Làm tiếp'}
      </button>
    </div>
  )
}
