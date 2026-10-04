import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router'
import { PageFallback } from './components/PageFallback'
import { RootLayout } from './layout/RootLayout'

const rootRoute = createRootRoute({ component: RootLayout })

// Mỗi tab là một file JS riêng: bé chỉ tải đúng tab đang mở, không phải cả 4.
const openingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Mở sẵn đúng khai cuộc qua đường dẫn `/?opening=sicilian` - dùng cho nút nhảy
  // từ tab Đối phó về bài khai cuộc gốc. Tab Khai cuộc tự kiểm lại giá trị này.
  validateSearch: (search: Record<string, unknown>): { opening?: string } => ({
    opening: typeof search.opening === 'string' ? search.opening : undefined,
  }),
  component: lazyRouteComponent(() => import('./pages/OpeningsPage'), 'OpeningsPage'),
})

const tacticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tactics',
  // Mở sẵn đúng chủ đề qua đường dẫn `/tactics?theme=win-material`.
  // Tab Trung cuộc tự kiểm lại giá trị này trước khi dùng.
  validateSearch: (search: Record<string, unknown>): { theme?: string } => ({
    theme: typeof search.theme === 'string' ? search.theme : undefined,
  }),
  component: lazyRouteComponent(() => import('./pages/TacticsPage'), 'TacticsPage'),
})

const countersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/counters',
  // Mở sẵn đúng bài đối phó qua đường dẫn `/counters?vs=vs-sicilian` - dùng cho nút
  // nhảy từ bài khai cuộc sang bài đối phó tương ứng.
  validateSearch: (search: Record<string, unknown>): { vs?: string } => ({
    vs: typeof search.vs === 'string' ? search.vs : undefined,
  }),
  component: lazyRouteComponent(() => import('./pages/CountersPage'), 'CountersPage'),
})

const endgamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/endgames',
  component: lazyRouteComponent(() => import('./pages/EndgamesPage'), 'EndgamesPage'),
})

const strategyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/strategy',
  component: lazyRouteComponent(() => import('./pages/StrategyPage'), 'StrategyPage'),
})

const freePlayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/free-play',
  component: lazyRouteComponent(() => import('./pages/FreePlayPage'), 'FreePlayPage'),
})

const routeTree = rootRoute.addChildren([
  openingsRoute,
  countersRoute,
  tacticsRoute,
  endgamesRoute,
  strategyRoute,
  freePlayRoute,
])

export const router = createRouter({
  routeTree,
  // Rê chuột / chạm vào tab nào thì tải trước tab đó → bấm vào là mở ngay.
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: PageFallback,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
