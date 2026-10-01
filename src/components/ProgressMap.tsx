import { Fragment } from 'react'

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
}

/** Bản đồ leo cấp: mỗi bài là một trạm, trạm sau mở khi trạm trước đã xong. */
export function ProgressMap({
  nodes,
  activeId,
  onSelect,
  title,
  unitLabel,
  allDoneMessage,
}: Props) {
  const done = nodes.filter((node) => node.completed).length
  const unlocked = nodes.filter((node) => node.unlocked).length
  const ratio = nodes.length ? done / nodes.length : 0
  const allDone = nodes.length > 0 && done === nodes.length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-violet-500">
          🗺️ {title}
        </p>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold text-violet-700">
          Đã xong {done}/{nodes.length} {unitLabel} · mở {unlocked}
        </span>
      </div>

      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      <ol className="mt-3 grid gap-1">
        {nodes.map((node, index) => {
          const active = node.id === activeId
          const state = node.completed
            ? {
                ring: 'border-emerald-300 bg-emerald-50',
                badge: 'bg-emerald-500 text-white',
                tag: '🏆 Đã xong',
                tagClass: 'bg-emerald-100 text-emerald-700',
              }
            : node.unlocked
              ? {
                  ring: active
                    ? 'border-violet-500 bg-violet-50 shadow-[0_4px_0_#c4b5fd]'
                    : 'border-violet-200 bg-white hover:border-violet-400',
                  badge: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white',
                  tag: active ? '▶️ Đang học' : '🔓 Học ngay',
                  tagClass: 'bg-violet-100 text-violet-700',
                }
              : {
                  ring: 'border-slate-200 bg-slate-50',
                  badge: 'bg-slate-300 text-slate-600',
                  tag: '🔒 Học bài trước',
                  tagClass: 'bg-slate-100 text-slate-500',
                }

          return (
            <Fragment key={node.id}>
              {index > 0 && (
                <li
                  aria-hidden
                  className={`ml-7 h-3 w-1 rounded-full ${
                    node.unlocked ? 'bg-violet-200' : 'bg-slate-200'
                  }`}
                />
              )}
              <li>
                <button
                  type="button"
                  onClick={() => node.unlocked && onSelect(node.id)}
                  disabled={!node.unlocked}
                  aria-current={active}
                  className={`flex w-full items-center gap-3 rounded-2xl border-[3px] p-2.5 text-left transition-all active:translate-y-[2px] disabled:cursor-not-allowed disabled:active:translate-y-0 ${state.ring}`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold shadow-sm ${state.badge}`}
                  >
                    {node.completed ? '🏆' : node.unlocked ? node.level : '🔒'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-violet-900">
                      {node.emoji} {node.title}
                    </span>
                    <span className="block truncate text-[0.7rem] font-bold text-violet-500">
                      {node.unlocked ? node.subtitle : 'Bé học xong bài trước để mở khoá nhé!'}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold ${state.tagClass}`}
                  >
                    {state.tag}
                  </span>
                </button>
              </li>
            </Fragment>
          )
        })}

        <li
          aria-hidden
          className={`ml-7 h-3 w-1 rounded-full ${allDone ? 'bg-amber-300' : 'bg-slate-200'}`}
        />
        <li>
          <div
            className={`flex items-center gap-3 rounded-2xl border-[3px] border-dashed p-2.5 ${
              allDone
                ? 'border-amber-400 bg-amber-50'
                : 'border-slate-200 bg-slate-50 opacity-80'
            }`}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-xl">
              🏁
            </span>
            <span className="text-xs font-extrabold text-violet-700">
              {allDone ? allDoneMessage : 'Chạm đích: hoàn thành hết các trạm phía trên!'}
            </span>
          </div>
        </li>
      </ol>
    </div>
  )
}
