import { Link, useMatchRoute } from '@tanstack/react-router'

/**
 * Thanh chuyển bài **trong cùng một nhóm**.
 *
 * Vì sao cần: thanh tab dưới đáy màn hình đã rút từ 7 xuống **3 nhóm** (Học · Luyện ·
 * Chơi) cho bé bấm trúng, nên các bài trong nhóm được chuyển bằng dải
 * pill này - vẫn tới được mọi trang cũ mà không nhồi lại 7 ô nhỏ.
 */
const GROUPS: { id: string; items: { to: string; label: string; icon: string }[] }[] = [
  {
    id: 'learn',
    items: [
      { to: '/', label: 'Khai cuộc', icon: '🛡️' },
      { to: '/counters', label: 'Đối phó', icon: '🧭' },
      { to: '/strategy', label: 'Nguyên tắc', icon: '🏅' },
    ],
  },
  {
    id: 'train',
    items: [
      { to: '/tactics', label: 'Trung cuộc', icon: '⚔️' },
      { to: '/endgames', label: 'Tàn cuộc', icon: '👑' },
    ],
  },
  {
    id: 'play',
    items: [
      { to: '/free-play', label: 'Đấu ván', icon: '🎮' },
      { to: '/hazards', label: 'Soi quân', icon: '🔍' },
    ],
  },
]

export function GroupNav() {
  const matchRoute = useMatchRoute()
  const group = GROUPS.find((item) => item.items.some((link) => matchRoute({ to: link.to })))
  // Trang nằm ngoài danh sách nhóm (không có) thì không vẽ dải - đỡ một dòng thừa.
  if (!group || group.items.length < 2) return null

  return (
    <nav
      id="kid-group-nav"
      aria-label="Bài trong nhóm"
      className="mb-1 flex shrink-0 gap-1 overflow-x-auto"
    >
      {group.items.map((item) => {
        const active = Boolean(matchRoute({ to: item.to }))
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active}
            className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-xs font-extrabold transition-all active:translate-y-[1px] ${
              active
                ? 'border-brand-600 bg-brand-700 text-white'
                : 'border-sand-300 bg-white text-brand-700 hover:border-brand-300'
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
