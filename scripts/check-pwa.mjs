/**
 * Kiểm tra bản dựng PWA: bé cài app ra màn hình chính và **chơi được khi mất mạng**.
 *
 * Chạy: node scripts/check-pwa.mjs   (sau `npm run build`)
 *
 * Vì sao cần: engine Stockfish là file rời trong `public/stockfish/`. Nếu Workbox
 * không precache các file đó (hoặc ai đó hạ `maximumFileSizeToCacheInBytes`), app
 * vẫn build xanh, vẫn mở online bình thường - chỉ khi mất mạng mới lộ ra là tab
 * Đấu Máy / Tàn cuộc chết lặng. Bài kiểm này bắt đúng lúc build.
 */
import { readFileSync, existsSync } from 'node:fs'

let failures = 0
const check = (condition, label) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

const root = process.cwd()
const read = (path) => (existsSync(`${root}/${path}`) ? readFileSync(`${root}/${path}`, 'utf8') : '')

console.log('\n▶ PWA: cài được ra màn hình chính + chơi offline')

check(existsSync(`${root}/dist/index.html`), 'đã có dist/index.html (chạy npm run build trước)')

const html = read('dist/index.html')
check(html.includes('registerSW'), 'index.html có đăng ký service worker')
check(
  html.includes('manifest.webmanifest'),
  'index.html trỏ tới manifest.webmanifest',
)

const manifestRaw = read('dist/manifest.webmanifest')
let manifest = null
try {
  manifest = JSON.parse(manifestRaw)
} catch {
  /* để check bên dưới báo lỗi */
}
check(Boolean(manifest), 'manifest.webmanifest đọc được')
if (manifest) {
  check(manifest.display === 'standalone', `chạy toàn màn hình khi cài (${manifest.display})`)
  check(Boolean(manifest.name && manifest.short_name), 'có tên đầy đủ và tên ngắn')
  check(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'có icon để cài ra màn hình chính')
  check(manifest.theme_color === '#1b2639', 'theme_color đúng màu navy của app')
}

const sw = read('dist/sw.js')
check(sw.length > 0, 'có service worker (dist/sw.js)')
check(sw.includes('stockfish'), 'service worker precache engine Stockfish')
check(
  sw.includes('wasm') || sw.includes('.wasm'),
  'service worker precache file WASM của engine',
)
check(sw.includes('index.html'), 'service worker cache trang chủ để mở offline')

for (const file of [
  'dist/stockfish/stockfish-19-lite-single.js',
  'dist/stockfish/stockfish-19-lite-single.wasm',
]) {
  check(existsSync(`${root}/${file}`), `có ${file.replace('dist/', '')} trong bản dựng`)
}

if (failures > 0) {
  console.log(`\n❌ PWA CÓ ${failures} LỖI\n`)
  process.exit(1)
}

console.log('\n✅ PWA PASS!\n')
