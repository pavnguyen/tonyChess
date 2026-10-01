/**
 * Cấu hình PM2 cho bản production của Học Viện Cờ Vua Nhí.
 *
 * App này là SPA tĩnh: `npm run build` tạo ra `dist/` (HTML + JS + CSS + worker),
 * nên không cần web server riêng - PM2 có sẵn chế độ `serve` để phục vụ thư mục
 * đó, kèm luôn phần SPA fallback cho các đường dẫn con.
 *
 * Vì sao tên file là `.cjs`? `package.json` đặt `"type": "module"`, nên nếu đổi tên
 * thành `ecosystem.config.js` thì Node sẽ nạp file đó dạng ES module: dòng
 * `module.exports` *không* xuất ra gì cả - đã thử trên Node 23 cho ra object rỗng
 * `{}` (trên Node cũ hơn thì báo lỗi `module is not defined`), và PM2 sẽ không
 * thấy mảng `apps` nào để chạy. Đuôi `.cjs` giữ file này ở dạng CommonJS.
 *
 * Dùng:
 *   npm ci && npm run build
 *   pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'hoc-vien-co-vua-nhi',
      // `serve` là tên dành riêng của PM2 (không phải file trong repo).
      script: 'serve',
      // Cố định thư mục gốc để `./dist` đúng dù bạn đứng ở đâu khi gọi pm2.
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      kill_timeout: 3000,
      time: true,
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 4173,
        // 0.0.0.0 = nghe mọi card mạng (mặc định của PM2). Nếu đặt Nginx phía
        // trước, đổi thành '127.0.0.1' để chỉ Nginx gọi được vào app.
        PM2_SERVE_HOST: '0.0.0.0',
        // Bật SPA: mọi đường dẫn không phải file thật (vd /tactics khi bé F5)
        // đều trả về index.html để TanStack Router tự mở đúng tab.
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: './index.html',
      },
    },
  ],
}
