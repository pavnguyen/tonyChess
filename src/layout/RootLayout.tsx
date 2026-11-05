import { Link, Outlet, useMatchRoute, useRouterState } from '@tanstack/react-router'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { HeaderOptions } from '../components/HeaderOptions'
import { InfoButton } from '../components/InfoPopover'
import { GroupNav } from '../components/GroupNav'
import { TodaySession } from '../components/TodaySession'

/**
 * Ba nhóm chính. `short` là nhãn dùng trên thanh tab ĐIỆN THOẠI (thanh dưới đáy
 * màn hình, chia đều): chỉ 2 chữ mỗi ô nên bé/ba mẹ bấm trúng ngay, không phải
 * vuốt ngang tìm tab như trước.
 *
 * Nhóm **Tiến bộ** đã bỏ: sổ lỗi và điểm ước lượng chỉ làm bé bận tâm con số,
 * trong khi HLV ngay ở tab Đấu Máy đã nói đúng lỗi vừa đi.
 */
const TABS = [
  {
    to: '/',
    match: ['/', '/counters', '/strategy'],
    label: 'Học',
    short: 'Học',
    full: 'Học: khai cuộc, đối phó, nguyên tắc vàng',
    icon: '📚',
  },
  {
    to: '/tactics',
    match: ['/tactics', '/endgames'],
    label: 'Luyện',
    short: 'Luyện',
    full: 'Luyện: trung cuộc và tàn cuộc',
    icon: '🎯',
  },
  {
    to: '/free-play',
    match: ['/free-play', '/hazards'],
    label: 'Chơi',
    short: 'Chơi',
    full: 'Chơi: đấu với máy và soi quân treo',
    icon: '🎮',
  },
] as const

export function RootLayout() {
  const matchRoute = useMatchRoute()
  /** Trang Học là "nhà": chỉ ở đó mới bày buổi luyện hôm nay cho khỏi chật. */
  const onLearnHome = Boolean(matchRoute({ to: '/' }))
  /** Đổi trang là đặt lại ErrorBoundary: lỗi ở một bài không khoá cả app. */
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    // Trên máy tính/tablet: khung app cao đúng bằng màn hình, nội dung cuộn trong
    // từng cột. Trên điện thoại: để trang cuộn dọc như bình thường cho dễ đọc.
    <div className="flex min-h-dvh flex-col stage:h-dvh stage:overflow-hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-brand-950/50 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-600 shadow-[0_6px_18px_-12px_rgba(27,38,57,0.75)] stage:static">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-2 px-2 py-1.5 sm:px-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5" title="Nam An - Cờ Vua">
            <span className="grid size-8 place-items-center rounded-xl bg-white text-lg shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              ♟️
            </span>
            <span className="text-xs font-extrabold leading-tight text-white sm:text-sm">
              Nam An - Cờ Vua
            </span>
          </Link>

          {/*
            MỘT thẻ `<nav>` cho cả hai kiểu:
            - Điện thoại (mặc định): thanh tab CỐ ĐỊNH Ở ĐÁY màn hình, chia đều
              mỗi ô icon + hai chữ - vừa tầm ngón tay cái, không phải vuốt ngang
              để tìm tab như thanh cuộn trên đỉnh trước đây.
            - Máy tính / cửa sổ rộng (`stage`): về lại hàng tab nằm ngang trong
              thanh tiêu đề như cũ.
          */}
          <nav
            id="kid-tab-nav"
            aria-label="Ba nhóm chính"
            className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t border-white/10 bg-brand-900/95 px-1 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_20px_-16px_rgba(13,32,24,0.9)] backdrop-blur stage:static stage:min-w-0 stage:flex-1 stage:items-center stage:gap-1 stage:overflow-x-auto stage:border-0 stage:bg-transparent stage:p-0 stage:shadow-none stage:backdrop-blur-none">
            {TABS.map((tab) => {
              // Nhóm "Học" gồm 3 trang nên phải sáng ở cả Khai cuộc lẫn Đối phó,
              // Chiến lược - nếu chỉ so `to` thì bé đứng ở Đối phó sẽ thấy không tab nào
              // được chọn.
              const active = tab.match.some((path) => Boolean(matchRoute({ to: path })))
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  title={tab.full}
                  className={`relative flex min-h-[3.4rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 text-xs font-extrabold leading-none transition-all active:translate-y-[1px] stage:min-h-0 stage:flex-none stage:flex-row stage:gap-1 stage:px-2 stage:py-1.5 ${
                    active
                      ? 'bg-white text-brand-800 shadow-[0_2px_6px_rgba(0,0,0,0.25)]'
                      : 'text-white/85 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <span className="text-[1.15rem] leading-none stage:text-sm" aria-hidden>
                    {tab.icon}
                  </span>
          {/*
            Điện thoại: nhãn hai chữ được phép XUỐNG DÒNG thay vì cắt
            (`truncate`) - ở máy 320px mỗi ô chỉ rộng ~42px nên "Chiến
            Lược" phải nằm trên hai dòng mới đọc được đủ, không bị "Chiến…".
          */}
                  <span className="max-w-full text-center text-xs leading-[1.1] break-words stage:hidden">
                    {tab.short}
                  </span>
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
      <main className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-1.5 pt-1.5 pb-[5.4rem] sm:px-3 sm:pt-2 stage:py-1">
        {/*
          Dải chuyển bài và buổi luyện hôm nay là hai dòng “phụ”. Khi màn hình thấp
          (điện thoại nằm ngang 430px) chúng tự ẩn để khối bàn cờ vẫn nằm trọn một
          màn hình - bé muốn sang bài khác thì dùng thanh tab dưới đáy.
        */}
        {/*
          Điện thoại nằm ngang: chỉ ẩn dải "Hôm nay" (cao 2 dòng), GIỮ dải chuyển
          bài trong nhóm - trước đây ẩn cả hai nên bé mất lối sang bài kế bên.
        */}
        <div className="shrink-0">
          <GroupNav />
          {onLearnHome && (
            <div className="[@media(max-height:560px)]:hidden">
              <TodaySession />
            </div>
          )}
        </div>
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

    </div>
  )
}
