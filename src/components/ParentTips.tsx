import { useLocation } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { tipsFor } from '../lib/parentTips'
import { useActiveLesson } from '../store/lesson'

/** Trạng thái thu/mở được nhớ giữa các lần mở app (§10). */
const STORAGE_KEY = 'hoc-vien-co-vua-nhi.parent-tips.v1'

function loadOpen(): boolean {
  if (typeof localStorage === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'closed'
  } catch {
    return true
  }
}

/**
 * Khung **“Gợi ý cho ba mẹ”** (§10) - góc dưới bên phải, hiện ở MỌI tab.
 *
 * Hai phần:
 *  1. Câu hỏi “đố con” đúng với bài bé đang học (ba mẹ ngồi cạnh không phải nghĩ
 *     xem hỏi gì);
 *  2. Khối 🔒 riêng cho ba mẹ (hiện chỉ còn phần hướng dẫn, không có cài đặt riêng).
 *
 * Vì là khối `position: fixed` nên nó KHÔNG tham gia vào luồng bố cục - đây là
 * điều kiện bắt buộc để không phá vỡ bố cục “không cuộn”. Bề rộng/chiều cao đều
 * bị chặn theo màn hình (`max-w-[calc(100vw-1rem)]`, `max-h-[68dvh]`) để không
 * bao giờ đẩy ra ngoài khung nhìn.
 */
export function ParentTips() {
  const { pathname } = useLocation()
  const lessonId = useActiveLesson()
  const tip = tipsFor(pathname, lessonId)

  const [open, setOpen] = useState(loadOpen)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed')
    } catch {
      /* trình duyệt chặn lưu trữ thì thôi, khung vẫn chạy */
    }
  }, [open])

  const toggle = useCallback(() => setOpen((value) => !value), [])

  return (
    <aside
      id="kid-parent-tips"
      className="fixed bottom-2 right-2 z-40 flex max-w-[calc(100vw-1rem)] flex-col items-end gap-1.5 print:hidden"
    >
      {open && (
        <div
          id="kid-parent-tips-body"
          className="animate-pop-in max-h-[68dvh] w-[17.5rem] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border-[3px] border-white bg-white p-2.5 text-left shadow-2xl"
        >
          <p className="text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
            💬 Gợi ý cho ba mẹ
          </p>
          <p className="mt-0.5 text-xs font-extrabold text-brand-900">{tip.title}</p>

          <ul className="mt-1 grid gap-1">
            {tip.questions.map((item) => (
              <li
                key={item.q}
                className="rounded-xl bg-brand-50 px-2 py-1.5 text-[0.7rem] font-bold text-brand-700"
              >
                <div className="flex gap-1.5">
                  <span aria-hidden className="text-gold-500">
                    ❓
                  </span>
                  <span>{item.q}</span>
                </div>
                <div className="mt-1 flex gap-1.5 pl-4 text-[0.65rem] font-bold text-brand-500">
                  <span aria-hidden className="text-leaf-500">
                    ✔️
                  </span>
                  <span>{item.a}</span>
                </div>
              </li>
            ))}
          </ul>

        </div>
      )}

      <button
        id="kid-parent-tips-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="kid-parent-tips-body"
        onClick={toggle}
        title={open ? 'Thu gọn khung gợi ý cho ba mẹ' : 'Mở khung gợi ý cho ba mẹ'}
        className={`flex items-center gap-1 rounded-2xl border-2 px-2.5 py-1.5 text-[0.7rem] font-extrabold shadow-lg transition-all active:translate-y-[2px] ${
          open
            ? 'border-white/70 bg-brand-700 text-white hover:bg-brand-600'
            : 'border-white/70 bg-brand-800 text-white hover:bg-brand-700'
        }`}
      >
        <span aria-hidden>{open ? '▾' : '▸'}</span>
        <span aria-hidden>🔒</span>
        Gợi ý cho ba mẹ
      </button>
    </aside>
  )
}
