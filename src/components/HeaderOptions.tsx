import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NOTATION_LEGEND, NOTATION_OPTIONS, NOTATION_SYMBOLS } from '../lib/notation'
import { useKidProgress } from '../store/progress'
import { InfoButton } from './InfoPopover'
import { LessonLabel } from './ui'

/**
 * Bánh răng ⚙️ trên thanh tiêu đề: gom hết tuỳ chọn của bé vào một bảng nhỏ,
 * để phần nội dung chính không bị chiếm mất chiều cao.
 *
 * Vì sao bảng này nằm trong `createPortal` chứ không `absolute` như trước:
 * `<header>` có `sticky` + `z-30` nên tự tạo một **stacking context**. Mọi
 * `z-50` bên trong nó chỉ có giá trị 30 so với trang, trong khi hộp ⓘ của nội
 * dung là `fixed z-50` ở cấp tài liệu - hậu quả là mở ⓘ rồi mở ⚙️ thì hộp ⓘ
 * (kèm lớp phủ tối) vẽ ĐÈ lên bảng tuỳ chọn, bảng bị xám và chữ lẫn vào nhau.
 * Đưa ra `body` thì `z-[61]` mới thật sự nằm trên mọi hộp thoại của trang.
 */
export function HeaderOptions() {
  const [open, setOpen] = useState(false)
  /** Toạ độ bảng, tính từ nút ⚙️ - portal không còn cha `relative` để bám vào. */
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { notation, setNotation, soundOn, toggleSound } = useKidProgress()

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setAnchor({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Tùy chọn của bé"
        title="Tùy chọn của bé"
        className={`relative grid size-9 place-items-center rounded-2xl border-2 border-white/70 text-lg shadow-md transition-all active:translate-y-[2px] ${
          open ? 'bg-white text-brand-700' : 'bg-white/20 text-white hover:bg-white/30'
        }`}
      >
        {open ? '✕' : '⚙️'}
        {!soundOn && (
          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-coral-500 ring-2 ring-white" />
        )}
      </button>

      {open &&
        anchor &&
        createPortal(
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] cursor-default bg-brand-950/25"
            />
            <div
              role="dialog"
              aria-label="Tùy chọn của bé"
              id="kid-options-panel"
              style={{ top: anchor.top, right: anchor.right }}
              className="animate-pop-in fixed z-[61] max-h-[calc(100dvh-4.75rem)] w-[min(20.5rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-2xl border-[3px] border-white bg-white p-3 text-left shadow-2xl"
            >
              <p className="text-sm font-extrabold text-brand-900">🎛️ Tùy chọn của bé</p>

              <div className="mt-2.5 flex items-center gap-1.5">
                <LessonLabel icon="✍️" title="Cách ghi nước đi" size="sm" />
                <InfoButton topic="notation" />
              </div>
              <div className="mt-1 grid gap-1">
                {NOTATION_OPTIONS.map((option) => {
                  const active = option.value === notation
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNotation(option.value)}
                      aria-pressed={active}
                      className={`flex items-center justify-between gap-2 rounded-xl border-2 px-2.5 py-1.5 text-xs font-extrabold transition-all active:translate-y-[1px] ${
                        active
                          ? 'border-brand-400 bg-brand-50 text-brand-800'
                          : 'border-brand-100 bg-white text-brand-500 hover:border-brand-300'
                      }`}
                    >
                      <span className="min-w-0">{option.label}</span>
                      <span className="shrink-0 rounded-lg bg-white px-2 py-0.5 text-sm shadow-sm">
                        {option.sample}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Bảng đối chiếu để bé học ánh xạ: hình cờ = ký hiệu FIDE = tiếng Việt. */}
              <div className="mt-1.5 grid gap-0.5 rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/60 px-2.5 py-1.5">
                <LessonLabel icon="🔤" title="Bảng đối chiếu ký hiệu" size="sm" />
                {NOTATION_LEGEND.map((row) => (
                  <div
                    key={row.piece}
                    className="flex items-center gap-1.5 text-xs font-bold leading-tight text-brand-700"
                  >
                    <span className="w-4 shrink-0 text-center text-base leading-none" aria-hidden>
                      {row.glyph}
                    </span>
                    <span className="shrink-0 text-brand-300">=</span>
                    <span className="w-9 shrink-0 text-center font-extrabold text-brand-900">
                      {row.fide || 'ô cờ'}
                    </span>
                    <span className="shrink-0 text-brand-300">=</span>
                    <span className="min-w-0 truncate" title={row.name}>
                      {row.name}
                      {row.viet ? ` (${row.viet})` : ''}
                    </span>
                  </div>
                ))}
              </div>

              {/*
                Ký hiệu ĐẶC BIỆT (nhập thành, chiếu, chiếu bí, ăn quân, phong cấp,
                bắt Tốt qua đường, nước hay/dở, kết quả ván) - nhờ vậy bé đọc được
                trọn một biên bản cờ chứ không chỉ tên quân. Nghĩa được phép xuống
                2 dòng: bảng rộng 20.5rem, cắt bằng `truncate` thì mất chữ ("bên
                Đen xin th…").
              */}
              <div className="mt-1.5 grid gap-0.5 rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/60 px-2.5 py-1.5">
                <LessonLabel icon="✍️" title="Ký hiệu đặc biệt trên biên bản" size="sm" />
                {NOTATION_SYMBOLS.map((row) => (
                  <div key={row.glyph} className="flex items-start gap-1.5 text-xs font-bold leading-tight text-brand-700">
                    <span className="w-9 shrink-0 pt-px text-center font-extrabold text-brand-900">
                      {row.glyph}
                    </span>
                    <span className="shrink-0 text-brand-300">=</span>
                    <span className="line-clamp-2 min-w-0 flex-1">{row.meaning}</span>
                    <span className="shrink-0 font-bold text-ink-600">{row.sample}</span>
                  </div>
                ))}
              </div>

              {/*
                KHÔNG còn bảng chọn giọng: app luôn tự chọn giọng Mỹ tự nhiên nhất
                máy có (`autoVoice` trong `src/lib/speech.ts` - ưu tiên Google US /
                Aria / Jenny / Samantha, bỏ qua giọng “đồ chơi” như Albert, Bells).
              */}
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-brand-500">
                🔈 Giọng đọc: tự chọn giọng hay nhất máy có (ưu tiên giọng Nam tiếng Việt)
              </p>

              <div className="mt-2.5 grid gap-1.5">
                <button
                  type="button"
                  onClick={toggleSound}
                  className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white px-2.5 py-1.5 text-xs font-extrabold text-brand-600 transition-all active:translate-y-[1px]"
                >
                  <span>🔊 Âm thanh</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      soundOn ? 'bg-leaf-100 text-leaf-700' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {soundOn ? 'BẬT' : 'TẮT'}
                  </span>
                </button>
              </div>

              <p className="mt-2 text-xs font-bold text-ink-600">
                🔄 Bài cờ Đen tự xoay bàn cờ 180°
              </p>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
