import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { KidOptions } from '../components/KidOptions'
import { StarHud } from '../components/StarHud'

const TABS = [
  { to: '/', label: 'Khai cuộc Đại Kiện Tướng', short: 'Khai cuộc', icon: '🛡️' },
  { to: '/tactics', label: 'Trung cuộc — Mẹo săn quân', short: 'Săn quân', icon: '⚔️' },
  { to: '/endgames', label: 'Tàn cuộc — Trạm Hậu', short: 'Tàn cuộc', icon: '👑' },
  { to: '/free-play', label: 'Đấu tập với Máy', short: 'Đấu Máy', icon: '🎮' },
] as const

export function RootLayout() {
  const matchRoute = useMatchRoute()

  return (
    <div className="min-h-dvh pb-8">
      <header className="sticky top-0 z-30 border-b-4 border-white/70 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <span className="animate-float-slow grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-md sm:size-11">
                ♟️
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-extrabold leading-tight text-white sm:text-xl">
                  Học Viện Cờ Vua Nhí
                </span>
                <span className="block truncate text-[0.68rem] font-bold text-white/80 sm:text-xs">
                  Bé 7 tuổi chinh phục Khai cuộc · Trung cuộc · Tàn cuộc
                </span>
              </span>
            </Link>
            <div className="hidden w-72 lg:block">
              <StarHud />
            </div>
          </div>

          <nav className="-mx-1 flex gap-1.5 overflow-x-auto pb-0.5">
            {TABS.map((tab) => {
              const active = Boolean(matchRoute({ to: tab.to }))
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-extrabold transition-all active:translate-y-[2px] sm:text-sm ${
                    active
                      ? 'bg-white text-violet-700 shadow-[0_4px_0_rgba(255,255,255,0.45)]'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span className="text-base" aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto mt-3 grid max-w-6xl gap-3 px-3 sm:px-4">
        <div className="lg:hidden">
          <StarHud />
        </div>
        <KidOptions />
        <Outlet />
      </main>

      <footer className="mx-auto mt-6 max-w-6xl px-3 text-center text-xs font-bold text-violet-400 sm:px-4">
        ♟️ Học Viện Cờ Vua Nhí — dữ liệu khai cuộc tham khảo các ván đấu của Carlsen, Kasparov,
        Nakamura, Wesley So. Chúc bé chơi vui!
      </footer>
    </div>
  )
}
