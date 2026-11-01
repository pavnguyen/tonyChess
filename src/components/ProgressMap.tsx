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
  /** Nhãn ngắn dưới tên khi bật `showNames` - vì sao bài này đứng ở thứ tự đó. */
  tag?: string
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
  /**
   * Hiện TÊN khai cuộc ngay trên từng ô (dạng thẻ 2 cột) thay vì chỉ số cấp + emoji.
   *
   * Vì sao cần: điện thoại không có "rê chuột" nên bong bóng chú thích không bao giờ
   * hiện - bé/ba mẹ chỉ thấy một hàng số với emoji, không biết ô nào là khai cuộc nào.
   * Bật cờ này thì tên nằm sẵn trên thẻ, tra cứu nhanh không cần bấm thử từng ô.
   */
  showNames?: boolean
}

/**
 * Bản đồ chọn bài dạng ô vuông gọn gàng: mọi trạm đều bấm được ngay, bé muốn học bài
 * nào lúc nào cũng được - app không khoá theo thứ tự và không theo dõi đã học tới đâu.
 */
export function ProgressMap({
  nodes,
  activeId,
  onSelect,
  title,
  levelLabel = 'Cấp',
  info,
  showNames = false,
}: Props) {
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
        className={showNames ? 'grid grid-cols-2 gap-1.5 sm:grid-cols-3' : 'grid gap-1.5'}
        style={
          showNames ? undefined : { gridTemplateColumns: 'repeat(auto-fit, minmax(2.7rem, 1fr))' }
        }
      >
        {nodes.map((node) => {
          const isActive = node.id === activeId
          const tooltip = `${levelLabel} ${node.level} · ${node.title} - ${node.subtitle}`
          const stateClass = isActive
            ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
            : 'border-sand-200 bg-white hover:border-brand-400'

          // Thẻ CÓ TÊN (điện thoại): emoji + tên khai cuộc + nhãn ngắn, thay cho ô
          // chỉ có số cấp mà bé phải rê chuột mới biết là bài gì.
          if (showNames) {
            return (
              <button
                key={node.id}
                type="button"
                data-level-id={node.id}
                onClick={() => onSelect(node.id)}
                aria-current={isActive}
                aria-label={tooltip}
                className={`flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 text-left transition-all active:translate-y-[1px] ${stateClass}`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-[0.6rem] font-extrabold text-white ${
                    isActive ? 'animate-pulse-ring' : ''
                  }`}
                >
                  {node.level}
                </span>
                <span className="text-base leading-none" aria-hidden>
                  {node.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[0.72rem] font-extrabold leading-tight ${
                      isActive ? 'text-brand-900' : 'text-brand-800'
                    }`}
                  >
                    {node.title}
                  </span>
                  {node.tag && (
                    <span className="mt-0.5 block truncate text-[0.62rem] font-bold text-brand-500">
                      {node.tag}
                    </span>
                  )}
                </span>
              </button>
            )
          }

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
              className={`group relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all active:translate-y-[1px] ${stateClass}`}
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
