import { useState } from 'react'
import { HEATMAP_COLORS } from '../lib/threats'
import { InfoButton } from './InfoPopover'

interface Props {
  on: boolean
  onToggle: () => void
  className?: string
}

/** Nút "Mắt Thần Cờ Vua" + bảng chú giải màu ô cờ. */
export function EyeToggle({ on, onToggle, className = '' }: Props) {
  const [showLegend, setShowLegend] = useState(false)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        id="kid-eye-toggle"
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        title="Mắt Thần Cờ Vua: nhìn toàn cảnh nguy hiểm"
        className={`flex items-center gap-2 rounded-full border-[3px] border-white px-3 py-2 text-xs font-extrabold shadow-lg transition-all active:translate-y-[2px] sm:text-sm ${
          on
            ? 'bg-gradient-to-br from-brand-700 to-leaf-500 text-white animate-pulse-ring'
            : 'bg-white text-brand-600'
        }`}
      >
        <span className={`text-xl ${on ? '' : 'grayscale'}`} aria-hidden>
          👁️
        </span>
        <span className="whitespace-nowrap">Mắt Thần Cờ Vua</span>
        <span
          className={`grid size-5 place-items-center rounded-full text-[0.6rem] ${
            on ? 'bg-white text-leaf-600' : 'bg-brand-100 text-brand-500'
          }`}
        >
          {on ? 'BẬT' : 'TẮT'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setShowLegend((value) => !value)}
        aria-expanded={showLegend}
        className="grid size-9 place-items-center rounded-full border-[3px] border-white bg-white text-sm font-extrabold text-brand-600 shadow-lg"
        title="Xem chú giải màu"
      >
        ?
      </button>

      {showLegend && (
        <div className="animate-pop-in absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border-[3px] border-white bg-white p-3 text-left shadow-2xl">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-brand-900">
            👁️ Mắt Thần đọc bàn cờ thế nào?
            <InfoButton topic="eye" />
          </div>
          <ul className="space-y-1.5 text-xs font-bold text-brand-700">
            <li className="flex items-center gap-2">
              <span
                className="grid size-5 shrink-0 place-items-center rounded-md text-[0.6rem] font-extrabold text-white"
                style={{ backgroundColor: HEATMAP_COLORS.hanging }}
              >
                !
              </span>
              Ô đỏ kèm dấu ⚠️ = QUÂN CỦA BÉ ĐANG BỊ TREO, phải cứu ngay!
            </li>
            <li className="flex items-center gap-2">
              <span
                className="size-5 shrink-0 rounded-md border border-coral-300"
                style={{ backgroundColor: HEATMAP_COLORS.danger }}
              />
              Ô ĐỎ = đối thủ đang kiểm soát, đừng đưa quân vào!
            </li>
            <li className="flex items-center gap-2">
              <span
                className="size-5 shrink-0 rounded-md border border-leaf-300"
                style={{ backgroundColor: HEATMAP_COLORS.center }}
              />
              Ô XANH ĐẬM = ô trung tâm quý, nên chiếm.
            </li>
            <li className="flex items-center gap-2">
              <span
                className="size-5 shrink-0 rounded-md border border-leaf-200"
                style={{ backgroundColor: HEATMAP_COLORS.safe }}
              />
              Ô XANH NHẠT = vùng an toàn.
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
