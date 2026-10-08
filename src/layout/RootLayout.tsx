import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { HeaderOptions } from '../components/HeaderOptions'
import { InfoButton } from '../components/InfoPopover'
import { ParentTips } from '../components/ParentTips'

const TABS = [
  { to: '/', label: 'Khai Cuộc', full: 'Khai cuộc Grand Master', icon: '🛡️' },
  { to: '/counters', label: 'Đối Phó', full: 'Đối phó khai cuộc - phá thế đối phương', icon: '🧭' },
  { to: '/tactics', label: 'Trung Cuộc', full: 'Trung cuộc - Tìm nước hay nhất', icon: '⚔️' },
  { to: '/endgames', label: 'Tàn Cuộc', full: 'Tàn cuộc cơ bản', icon: '👑' },
  { to: '/strategy', label: 'Chiến Lược', full: 'Chiến lược - 10 nguyên tắc vàng', icon: '🏅' },
  { to: '/free-play', label: 'Đấu với Robot', full: 'Đấu tập tự do với chú Máy', icon: '🎮' },
] as const

export function RootLayout() {
  const matchRoute = useMatchRoute()

  return (
    // Trên máy tính/tablet: khung app cao đúng bằng màn hình, nội dung cuộn trong
    // từng cột. Trên điện thoại: để trang cuộn dọc như bình thường cho dễ đọc.
    <div className="flex min-h-dvh flex-col stage:h-dvh stage:overflow-hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-brand-900/40 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 shadow-[0_6px_18px_-12px_rgba(13,32,24,0.8)] stage:static">
        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 px-2 py-1.5 sm:px-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5" title="Nam An - Cờ Vua">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-lg shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              ♟️
            </span>
            <span className="hidden text-sm font-extrabold leading-tight text-white sm:block">
              Nam An - Cờ Vua
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
                  className={`relative flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-extrabold transition-all active:translate-y-[1px] ${
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
            <InfoButton topic="app" tone="onDark" />
            <HeaderOptions />
          </div>
        </div>
      </header>

      {/* Trên điện thoại chỉ chừa lề 6px để bàn cờ rộng gần hết màn hình. */}
      <main className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-1.5 py-1.5 sm:px-3 sm:py-2">
        <Outlet />
      </main>

      {/*
        Khung “Gợi ý cho ba mẹ” (§10) - nằm NGOÀI luồng bố cục (`position: fixed`)
        nên hiện ở mọi tab mà không làm trang phải cuộn thêm.
      */}
      <ParentTips />
    </div>
  )
}
