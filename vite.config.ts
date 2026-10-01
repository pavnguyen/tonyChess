import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
