import { InfoButton } from './InfoPopover'

/**
 * Bong bóng chú thích tự vẽ cho từng trạm trên bản đồ.
 *
 * Vì sao KHÔNG dùng tooltip mặc định của trình duyệt (`title`): ô trạm chỉ cao 48px,
 * nhỏ hơn cả cái khung tooltip gốc, nên nó đè lên cả hàng ô và cắt chữ. Bong bóng này
 * nằm `absolute` NGAY TRÊN ô, chỉ hiện khi rê chuột HOẶC khi ô được chọn bằng bàn phím
 * (`group-focus-visible`), và `pointer-events-none` nên không cản bé bấm ô.
 */
function Tooltip({ text }: { text: string }) {
  return (
    <span
      aria-hidden
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-brand-900 px-2 py-1 text-center text-[0.62rem] font-bold leading-tight text-white shadow-[0_6px_14px_rgba(13,32,24,0.45)] group-hover:block group-focus-visible:block"
    >
      {text}
    </span>
  )
}

export interface ProgressNode {
  id: string
  level: number
  title: string
  emoji: string
  subtitle: string
}

interface Props {
  nodes: ProgressNode[]
  activeId?: string
  onSelect: (id: string) => void
  title: string
  /** Nhãn hiện dưới ô đang chọn, ví dụ "Cấp 3 · Phòng thủ King's Indian". */
  levelLabel?: string
  /** Khoá nội dung cho nút ⓘ cạnh tiêu đề bản đồ (xem `src/lib/info.ts`). */
  info?: string
}

/**
 * Bản đồ chọn bài dạng ô vuông gọn gàng: mọi trạm đều bấm được ngay, bé muốn học bài
 * nào lúc nào cũng được - app không khoá theo thứ tự và không theo dõi đã học tới đâu.
 */
export function ProgressMap({ nodes, activeId, onSelect, title, levelLabel = 'Cấp', info }: Props) {
  const active = nodes.find((node) => node.id === activeId)

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <p className="shrink-0 text-[0.7rem] font-extrabold uppercase tracking-wide text-brand-500">
          🗺️ {title}
        </p>
        <InfoButton topic={info} />
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(2.7rem, 1fr))' }}
      >
        {nodes.map((node) => {
          const isActive = node.id === activeId
          const tooltip = `${levelLabel} ${node.level} · ${node.title} - ${node.subtitle}`

          return (
            // `relative` + `group` để bong bóng chú thích tự canh vào đúng ô, thay cho
            // tooltip mặc định của trình duyệt - vốn đè lên cả hàng ô khi ô quá nhỏ.
            <button
              key={node.id}
              type="button"
              data-level-id={node.id}
              onClick={() => onSelect(node.id)}
              aria-current={isActive}
              aria-label={tooltip}
              className={`group relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all active:translate-y-[1px] ${
                isActive
                  ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                  : 'border-sand-200 bg-white hover:border-brand-400'
              }`}
            >
              <Tooltip text={tooltip} />
              <span
                className={`grid size-5 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-[0.6rem] font-extrabold text-white ${
                  isActive ? 'animate-pulse-ring' : ''
                }`}
              >
                {node.level}
              </span>
              <span className="text-sm leading-none" aria-hidden>
                {node.emoji}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[0.7rem] font-bold text-brand-500">
        {active
          ? `${levelLabel} ${active.level} · ${active.emoji} ${active.title} - ${active.subtitle}`
          : 'Bé bấm vào một ô để bắt đầu nhé!'}
      </p>
    </div>
  )
}
