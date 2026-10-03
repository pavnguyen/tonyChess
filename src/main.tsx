import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { primeSpeech } from './lib/speech'
import { router } from './router'
import { LessonProvider } from './store/lesson'
import { KidProgressProvider } from './store/progress'

// Nạp sẵn giọng đọc Mỹ cho “bàn cờ biết nói” (một số trình duyệt chỉ có giọng sau
// sự kiện `voiceschanged`) - gọi sớm để lần chạm quân đầu tiên đã đọc được.
primeSpeech()

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
          {/* Khung “Gợi ý cho ba mẹ” nằm ngoài mọi trang nên cần một chỗ để
              trang bài học “báo lên” bài đang mở (§10). */}
          <LessonProvider>
            <RouterProvider router={router} />
          </LessonProvider>
      </KidProgressProvider>
    </QueryClientProvider>
  </StrictMode>,
)
