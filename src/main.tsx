import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router'
import { KidProgressProvider } from './store/progress'
import { RatingProvider } from './store/rating'
import { ReviewProvider } from './store/review'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <KidProgressProvider>
        <RatingProvider>
          <ReviewProvider>
            <RouterProvider router={router} />
          </ReviewProvider>
        </RatingProvider>
      </KidProgressProvider>
    </QueryClientProvider>
  </StrictMode>,
)
