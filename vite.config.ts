import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    /**
     * PWA: bé cài app ra màn hình chính và **vẫn luyện được khi mất mạng**.
     *
     * Precache cả thư mục `stockfish/` (JS + WASM) vì engine chạy trong trình duyệt:
     * thiếu file đó thì tab Đấu Máy / Tàn cuộc mở ra sẽ im lặng, không báo lỗi.
     * `maximumFileSizeToCacheInBytes` phải nâng lên vì WASM của engine lớn hơn mức
     * 2 MB mặc định của Workbox.
     */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: 'Nam An - Cờ Vua',
        short_name: 'Cờ Vua Nhí',
        description:
          'Bé học khai cuộc, đối phó, trung cuộc, soi quân và tàn cuộc trên bàn cờ tương tác.',
        lang: 'vi',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fbf7ee',
        theme_color: '#1f4132',
        icons: [
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Trang mở offline phải có cả HTML, CSS, JS, font và engine.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,txt,wasm}'],
        maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Thư viện ít khi đổi, tách riêng để trình duyệt giữ trong cache lâu dài:
        // bé cập nhật code mới cũng không phải tải lại React / TanStack / thư viện cờ.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return
          // Thứ tự quan trọng: "react-chessboard" cũng chứa chữ "react".
          if (
            id.includes('/node_modules/react-chessboard/') ||
            id.includes('/node_modules/@dnd-kit/') ||
            id.includes('/node_modules/chess.js/')
          ) {
            return 'vendor-chess'
          }
          if (id.includes('/node_modules/@tanstack/')) return 'vendor-tanstack'
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
