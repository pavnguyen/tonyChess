import { useLocation } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { tipsFor } from '../lib/parentTips'
import { STAGES } from '../lib/stages'
import { useActiveLesson } from '../store/lesson'
import { useKidProgress } from '../store/progress'

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
 *  2. Khối 🔒 riêng cho ba mẹ: số Elo mini, điểm từng dạng đòn, và nút chọn giai
 *     đoạn tuổi của bé.
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

  const { stage, setStageId, birthYear, setBirthYear } = useKidProgress()

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
            {tip.questions.map((question) => (
              <li
                key={question}
                className="flex gap-1.5 rounded-xl bg-brand-50 px-2 py-1.5 text-[0.7rem] font-bold text-brand-700"
              >
                <span aria-hidden className="text-gold-500">
                  ❓
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ul>

          {/*
            Khối riêng cho ba mẹ. KHÔNG có điểm số/so hơn thua: app này để HỌC CỜ, nên chỗ
            này chỉ còn đúng việc ba mẹ cần - chỉnh lứa tuổi cho khớp với bé.
          */}
          <div className="mt-2 grid gap-1.5 rounded-xl border-2 border-dashed border-gold-300 bg-gold-50/70 p-2">
            <p className="text-[0.6rem] font-extrabold uppercase tracking-wide text-gold-800">
              🔒 Phần của ba mẹ
            </p>
            <p className="text-[0.6rem] font-extrabold uppercase tracking-wide text-gold-800">
              🎚️ Giai đoạn của bé
            </p>
            <div className="grid grid-cols-2 gap-1">
              {STAGES.map((item) => {
                const active = item.id === stage.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStageId(item.id)}
                    className={`flex items-center gap-1 rounded-lg border-2 px-1.5 py-1 text-[0.65rem] font-extrabold transition-all active:translate-y-[1px] ${
                      active
                        ? 'border-brand-400 bg-white text-brand-800'
                        : 'border-brand-100 bg-white/70 text-brand-500 hover:border-brand-300'
                    }`}
                  >
                    <span aria-hidden>{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <label
              htmlFor="kid-parent-birth-year"
              className="flex items-center gap-1.5 text-[0.65rem] font-extrabold text-brand-600"
            >
              🎂 Năm sinh
              <input
                id="kid-parent-birth-year"
                type="number"
                inputMode="numeric"
                min={1990}
                max={2100}
                placeholder="VD 2019"
                value={birthYear ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setBirthYear(value ? Number(value) : null)
                }}
                className="w-20 rounded-lg border-2 border-brand-100 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-brand-800"
              />
            </label>
          </div>
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
