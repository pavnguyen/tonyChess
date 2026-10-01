import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { HeaderOptions } from '../components/HeaderOptions'
import { useKidProgress } from '../store/progress'

const TABS = [
  { to: '/', label: 'Khai Cuộc', full: 'Khai cuộc Đại Kiện Tướng', icon: '🛡️' },
  { to: '/tactics', label: 'Trung Cuộc', full: 'Trung cuộc - Mẹo săn quân', icon: '⚔️' },
  { to: '/endgames', label: 'Tàn Cuộc', full: 'Tàn cuộc - Trạm năng lượng Hậu', icon: '👑' },
  { to: '/free-play', label: 'Đấu với Máy', full: 'Đấu tập tự do với chú Máy', icon: '🎮' },
] as const

export function RootLayout() {
  const matchRoute = useMatchRoute()
  const { stars, rank, nextRank } = useKidProgress()

  return (
    // Trên máy tính/tablet: khung app cao đúng bằng màn hình, nội dung cuộn trong
    // từng cột. Trên điện thoại: để trang cuộn dọc như bình thường cho dễ đọc.
    <div className="flex min-h-dvh flex-col stage:h-dvh stage:overflow-hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-brand-900/40 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 shadow-[0_6px_18px_-12px_rgba(13,32,24,0.8)] stage:static">
        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 px-2 py-1.5 sm:px-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5" title="Học Viện Cờ Vua Nhí">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-lg shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              ♟️
            </span>
            <span className="hidden text-sm font-extrabold leading-tight text-white sm:block">
              Học Viện Cờ Vua Nhí
            </span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const active = Boolean(matchRoute({ to: tab.to }))
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  title={tab.full}
                  className={`flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-extrabold transition-all active:translate-y-[1px] ${
                    active
                      ? 'bg-white text-brand-800 shadow-[0_2px_6px_rgba(0,0,0,0.25)]'
                      : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-sm" aria-hidden>
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="hidden items-center gap-1 rounded-xl bg-gold-400/20 px-2 py-1 ring-1 ring-gold-300/40 md:flex"
              title={
                nextRank
                  ? `${rank.title} - còn ${nextRank.minStars - stars} ⭐ để lên ${nextRank.title}`
                  : `${rank.title} - danh hiệu cao nhất`
              }
            >
              <span aria-hidden>{rank.emoji}</span>
              <span className="text-xs font-extrabold text-gold-200">⭐ {stars}</span>
            </span>
            <HeaderOptions />
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-2 py-2 sm:px-3">
        <Outlet />
      </main>
    </div>
  )
}
