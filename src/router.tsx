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
  component: lazyRouteComponent(() => import('./pages/OpeningsPage'), 'OpeningsPage'),
})

const tacticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tactics',
  component: lazyRouteComponent(() => import('./pages/TacticsPage'), 'TacticsPage'),
})

const endgamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/endgames',
  component: lazyRouteComponent(() => import('./pages/EndgamesPage'), 'EndgamesPage'),
})

const freePlayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/free-play',
  component: lazyRouteComponent(() => import('./pages/FreePlayPage'), 'FreePlayPage'),
})

const routeTree = rootRoute.addChildren([
  openingsRoute,
  tacticsRoute,
  endgamesRoute,
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
