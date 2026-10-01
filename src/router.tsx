import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { RootLayout } from './layout/RootLayout'
import { EndgamesPage } from './pages/EndgamesPage'
import { FreePlayPage } from './pages/FreePlayPage'
import { OpeningsPage } from './pages/OpeningsPage'
import { TacticsPage } from './pages/TacticsPage'

const rootRoute = createRootRoute({ component: RootLayout })

const openingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OpeningsPage,
})

const tacticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tactics',
  component: TacticsPage,
})

const endgamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/endgames',
  component: EndgamesPage,
})

const freePlayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/free-play',
  component: FreePlayPage,
})

const routeTree = rootRoute.addChildren([
  openingsRoute,
  tacticsRoute,
  endgamesRoute,
  freePlayRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
