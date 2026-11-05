import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { primeSpeech } from './lib/speech'
import { router } from './router'
import { KidProgressProvider } from './store/progress'

// Nạp sẵn giọng đọc Mỹ cho “bàn cờ biết nói” (một số trình duyệt chỉ có giọng sau
// sự kiện `voiceschanged`) - gọi sớm để lần chạm quân đầu tiên đã đọc được.
//
// Nhưng để SAU khung hình đầu tiên: `getVoices()` phải chờ danh sách giọng của hệ
// điều hành, gọi ngay trước `createRoot` là chặn đúng lúc bé đang nhìn màn hình
// trắng. Rảnh rỗi mới nạp - lần chạm quân đầu tiên vẫn kịp.
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(() => primeSpeech(), { timeout: 2000 })
} else {
  setTimeout(primeSpeech, 200)
}

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
        <RouterProvider router={router} />
      </KidProgressProvider>
    </QueryClientProvider>
  </StrictMode>,
)
