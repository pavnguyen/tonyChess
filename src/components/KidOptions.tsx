import { useState } from 'react'
import { NOTATION_OPTIONS } from '../lib/notation'
import { useKidProgress } from '../store/progress'
import { KidButton, Segmented } from './ui'

/** Thanh tùy chọn dành cho bé: đổi ký hiệu nước đi + bật/tắt âm thanh. */
export function KidOptions() {
  const { notation, setNotation, soundOn, toggleSound, stars, resetProgress } = useKidProgress()
  const [open, setOpen] = useState(false)

  return (
    <div className="card-pop p-2.5 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 text-sm font-extrabold text-violet-800"
          aria-expanded={open}
        >
          <span className="text-lg" aria-hidden>
            🎛️
          </span>
          Tùy chọn của bé
          <span className="text-violet-400">{open ? '▲' : '▼'}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-bold text-violet-400 sm:inline">
            Ký hiệu đang dùng: {NOTATION_OPTIONS.find((o) => o.value === notation)?.sample}
          </span>
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className={`grid size-9 place-items-center rounded-full border-[3px] border-white text-lg shadow-md transition-all active:translate-y-[2px] ${
              soundOn ? 'bg-emerald-100' : 'bg-slate-100 grayscale'
            }`}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-slide-up mt-3 grid gap-3">
          <div>
            <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-violet-500">
              ✍️ Cách ghi nước đi
            </p>
            <Segmented
              options={NOTATION_OPTIONS.map((option) => ({
                value: option.value,
                label: `${option.label} (${option.sample})`,
              }))}
              value={notation}
              onChange={setNotation}
              size="sm"
            />
            <p className="mt-1.5 text-[0.7rem] font-bold text-violet-400">
              👦 Bé 7 tuổi nên chọn “Hình con cờ” cho dễ nhớ; lớn hơn chút thì chuyển “Chuẩn
              quốc tế”.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-extrabold text-sky-700">
              🔄 Bàn cờ tự xoay 180° khi bé học bài cờ Đen
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-amber-700">
              ⭐ Bé đang có {stars} sao
            </span>
            <KidButton
              variant="ghost"
              className="ml-auto !px-3 !py-1.5 !text-xs"
              onClick={() => {
                if (window.confirm('Bé muốn xóa hết sao và bắt đầu lại từ đầu chứ?')) {
                  resetProgress()
                }
              }}
            >
              🧹 Chơi lại từ đầu
            </KidButton>
          </div>
        </div>
      )}
    </div>
  )
}
