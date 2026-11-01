import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { HeaderOptions } from '../components/HeaderOptions'
import { InfoButton } from '../components/InfoPopover'
import { ParentTips } from '../components/ParentTips'

/**
 * Sáu tab chính. `short` là nhãn dùng trên thanh tab ĐIỆN THOẠI (thanh dưới đáy
 * màn hình, 6 ô chia đều): chỉ 2 chữ mỗi ô nên bé/ba mẹ bấm trúng ngay, không
 * phải vuốt ngang tìm tab như trước.
 */
const TABS = [
  { to: '/', label: 'Khai Cuộc', short: 'Khai Cuộc', full: 'Khai cuộc Grand Master', icon: '🛡️' },
  {
    to: '/counters',
    label: 'Đối Phó',
    short: 'Đối Phó',
    full: 'Đối phó khai cuộc - phá thế đối phương',
    icon: '🧭',
  },
  { to: '/tactics', label: 'Trung Cuộc', short: 'Trung Cuộc', full: 'Trung cuộc - Tìm nước hay nhất', icon: '⚔️' },
  { to: '/endgames', label: 'Tàn Cuộc', short: 'Tàn Cuộc', full: 'Tàn cuộc cơ bản', icon: '👑' },
  { to: '/strategy', label: 'Chiến Lược', short: 'Chiến Lược', full: 'Chiến lược - 10 nguyên tắc vàng', icon: '🏅' },
  {
    to: '/free-play',
    label: 'Đấu với Robot',
    short: 'Đấu Máy',
    full: 'Đấu tập tự do với chú Máy',
    icon: '🎮',
  },
] as const

export function RootLayout() {
  const matchRoute = useMatchRoute()

  return (
    // Trên máy tính/tablet: khung app cao đúng bằng màn hình, nội dung cuộn trong
    // từng cột. Trên điện thoại: để trang cuộn dọc như bình thường cho dễ đọc.
    <div className="flex min-h-dvh flex-col stage:h-dvh stage:overflow-hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-brand-900/40 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 shadow-[0_6px_18px_-12px_rgba(13,32,24,0.8)] stage:static">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-2 px-2 py-1.5 sm:px-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5" title="Nam An - Cờ Vua">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-lg shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              ♟️
            </span>
            <span className="hidden text-sm font-extrabold leading-tight text-white sm:block">
              Nam An - Cờ Vua
            </span>
          </Link>

          {/*
            MỘT thẻ `<nav>` cho cả hai kiểu:
            - Điện thoại (mặc định): thanh tab CỐ ĐỊNH Ở ĐÁY màn hình, 6 ô chia
              đều, mỗi ô icon + hai chữ - vừa tầm ngón tay cái, không phải vuốt
              ngang để tìm tab như thanh cuộn trên đỉnh trước đây.
            - Máy tính / cửa sổ rộng (`stage`): về lại hàng tab nằm ngang trong
              thanh tiêu đề như cũ.
          */}
          <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t border-white/10 bg-brand-900/95 px-1 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_20px_-16px_rgba(13,32,24,0.9)] backdrop-blur stage:static stage:min-w-0 stage:flex-1 stage:items-center stage:gap-1 stage:overflow-x-auto stage:border-0 stage:bg-transparent stage:p-0 stage:shadow-none stage:backdrop-blur-none">
            {TABS.map((tab) => {
              const active = Boolean(matchRoute({ to: tab.to }))
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  title={tab.full}
                  className={`relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[0.62rem] font-extrabold leading-none transition-all active:translate-y-[1px] stage:min-h-0 stage:flex-none stage:flex-row stage:gap-1 stage:px-2 stage:py-1.5 stage:text-xs ${
                    active
                      ? 'bg-white text-brand-800 shadow-[0_2px_6px_rgba(0,0,0,0.25)]'
                      : 'text-white/85 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none stage:text-sm" aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="max-w-full truncate stage:hidden">{tab.short}</span>
                  <span className="hidden truncate stage:inline">{tab.label}</span>
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

      {/*
        Trên điện thoại chỉ chừa lề 6px để bàn cờ rộng gần hết màn hình, và chừa
        thêm một khoảng ở đáy để thanh tab cố định không che nội dung cuối trang.
      */}
      <main className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-1.5 pt-1.5 pb-[4.9rem] sm:px-3 sm:pt-2 stage:py-2">
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
