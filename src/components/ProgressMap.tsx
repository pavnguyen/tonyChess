export interface ProgressNode {
  id: string
  level: number
  title: string
  emoji: string
  subtitle: string
  completed: boolean
  unlocked: boolean
}

interface Props {
  nodes: ProgressNode[]
  activeId?: string
  onSelect: (id: string) => void
  title: string
  unitLabel: string
  allDoneMessage: string
  /** Nhãn hiện dưới ô đang chọn, ví dụ "Cấp 3 · Phòng thủ King's Indian". */
  levelLabel?: string
}

/**
 * Bản đồ leo cấp dạng ô vuông gọn gàng: trạm sau chỉ mở khi trạm trước đã xong.
 * Thiết kế để cả bản đồ nằm gọn trong ~2 hàng ô, bé nhìn thấy hết mà không phải cuộn.
 */
export function ProgressMap({
  nodes,
  activeId,
  onSelect,
  title,
  unitLabel,
  allDoneMessage,
  levelLabel = 'Cấp',
}: Props) {
  const done = nodes.filter((node) => node.completed).length
  const unlocked = nodes.filter((node) => node.unlocked).length
  const allDone = nodes.length > 0 && done === nodes.length
  const active = nodes.find((node) => node.id === activeId)

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="shrink-0 text-[0.7rem] font-extrabold uppercase tracking-wide text-brand-500">
            🗺️ {title}
          </p>
          <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-leaf-400 transition-all duration-500"
              style={{
                width: `${nodes.length ? Math.round((done / nodes.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-[0.7rem] font-extrabold text-brand-700 ring-1 ring-brand-100">
          Xong {done}/{nodes.length} {unitLabel} · mở {unlocked}
        </span>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(2.7rem, 1fr))' }}
      >
        {nodes.map((node) => {
          const isActive = node.id === activeId
          const skin = node.completed
            ? 'border-leaf-300 bg-leaf-50'
            : node.unlocked
              ? isActive
                ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                : 'border-sand-200 bg-white hover:border-brand-400'
              : 'border-ink-200 bg-ink-50'
          const badge = node.completed
            ? 'bg-leaf-500 text-white'
            : node.unlocked
              ? 'bg-gradient-to-br from-brand-700 to-brand-500 text-white'
              : 'bg-ink-300 text-ink-600'

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => node.unlocked && onSelect(node.id)}
              disabled={!node.unlocked}
              aria-current={isActive}
              title={
                node.unlocked
                  ? `${levelLabel} ${node.level} · ${node.title} - ${node.subtitle}`
                  : `${levelLabel} ${node.level} · ${node.title} (chưa mở khoá)`
              }
              className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all active:translate-y-[1px] disabled:cursor-not-allowed disabled:active:translate-y-0 ${skin}`}
            >
              <span
                className={`grid size-5 place-items-center rounded-full text-[0.6rem] font-extrabold ${badge} ${
                  isActive && !node.completed ? 'animate-pulse-ring' : ''
                }`}
              >
                {node.completed ? '✓' : node.unlocked ? node.level : '🔒'}
              </span>
              <span className="text-sm leading-none" aria-hidden>
                {node.emoji}
              </span>
            </button>
          )
        })}

        <div
          title={allDone ? allDoneMessage : 'Chạm đích: hoàn thành hết các trạm phía trên!'}
          className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed ${
            allDone ? 'border-gold-400 bg-gold-50' : 'border-ink-200 bg-ink-50'
          }`}
        >
          <span className="text-[0.6rem] font-extrabold text-brand-400">🏁</span>
          <span className="text-sm leading-none">🏆</span>
        </div>
      </div>

      <p className="text-[0.7rem] font-bold text-brand-500">
        {active
          ? `${levelLabel} ${active.level} · ${active.emoji} ${active.title} - ${active.subtitle}`
          : 'Bé bấm vào một ô đã mở khoá để bắt đầu nhé!'}
      </p>
    </div>
  )
}
