/**
 * Sinh bộ ảnh thương hiệu khi chia sẻ lên mạng xã hội và icon trên điện thoại:
 *   - public/og-image.png         1200×630  (Facebook / Zalo / Twitter…)
 *   - public/apple-touch-icon.png  180×180  (icon khi bé "Thêm vào màn hình chính")
 *
 * Cách làm: thiết kế bằng HTML/CSS (dễ chỉnh, dùng được font hệ thống) rồi nhờ
 * **chính Chrome headless** - thứ các bài kiểm tra khác đang dùng - chụp lại.
 * Không cần thêm thư viện vẽ ảnh nào.
 *
 * Sau khi chụp, script **giải mã lại chính file PNG vừa ghi** để kiểm tra kích
 * thước và màu ở vài điểm chốt (nền ngà, khung bàn cờ xanh, quân Tốt trắng…),
 * nên nếu thiết kế hỏng thì script báo lỗi ngay chứ không im lặng.
 *
 * Chạy: node scripts/generate-assets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openPage, sleep } from './lib/cdp.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Quân Tốt vẽ bằng vector - dùng chung cho mọi ảnh cho khỏi lệch nét. */
const PAWN = (fill = '#fbf9f4') => `
  <g fill="${fill}">
    <circle cx="32" cy="19.5" r="9" />
    <path d="M32 27.5c-5.6 0-8.7 3.5-7.7 7.8l2.4 8.2h10.6l2.4-8.2c1-4.3-2.1-7.8-7.7-7.8z" />
    <rect x="21" y="43" width="22" height="4.5" rx="2.25" />
    <rect x="18" y="48" width="28" height="5" rx="2.5" />
    <rect x="15" y="53.5" width="34" height="6" rx="3" />
  </g>`

/** Icon iOS: nền phủ kín (iOS tự bo góc) + quân Tốt trắng ở giữa. */
const ICON_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; width: 180px; height: 180px; overflow: hidden; }
  body { background: linear-gradient(135deg, #356c4f 0%, #1f4132 55%, #163125 100%);
         display: grid; place-items: center; }
  svg { width: 132px; height: 132px; display: block; }
</style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${PAWN()}</svg>
</body></html>`

/** Thế cờ nhỏ trang trí cho ảnh OG: ô nào có quân thì ghi ký hiệu quân đặc. */
const MINI_BOARD = {
  0: '♜', 1: '♞', 3: '♛', 4: '♚', 6: '♞', 7: '♜',
  8: '♟', 9: '♟', 11: '♟', 12: '♟', 14: '♟', 15: '♟',
  27: '♙', 28: '♙', 34: '♟', 35: '♘',
  40: '♙', 41: '♙', 42: '♙', 45: '♙',
  56: '♖', 57: '♘', 58: '♗', 59: '♕', 60: '♔', 61: '♗', 62: '♘', 63: '♖',
}
const WHITE_PIECES = '♙♘♗♖♕♔'

const boardCells = Array.from({ length: 64 }, (_, index) => {
  const file = index % 8
  const rank = Math.floor(index / 8)
  const isDark = (file + rank) % 2 === 1
  const piece = MINI_BOARD[index] ?? ''
  const light = WHITE_PIECES.includes(piece)
  return `<div class="sq ${isDark ? 'dark' : 'light'}">${
    piece ? `<span class="${light ? 'wp' : 'bp'}">${piece}</span>` : ''
  }</div>`
}).join('')

const OG_HTML = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: 'Baloo 2', -apple-system, 'Segoe UI', system-ui, sans-serif;
    color: #1f2a24;
    background:
      radial-gradient(circle at 10% 4%, rgba(217, 169, 63, 0.18) 0%, transparent 42%),
      radial-gradient(circle at 88% 6%, rgba(63, 130, 97, 0.16) 0%, transparent 40%),
      #fbf9f4;
    display: flex;
    align-items: center;
    gap: 40px;
    padding: 52px 56px;
  }
  .left { flex: 1 1 auto; min-width: 0; }
  .brand { display: flex; align-items: center; gap: 20px; }
  .mark {
    width: 92px; height: 92px; flex: 0 0 92px; border-radius: 24px;
    background: linear-gradient(135deg, #295640 0%, #163125 100%);
    display: grid; place-items: center;
    box-shadow: 0 18px 34px -18px rgba(13, 32, 24, 0.7);
    border: 2px solid rgba(217, 169, 63, 0.4);
  }
  .mark svg { width: 62px; height: 62px; }
  h1 { margin: 0; font-size: 58px; line-height: 1.05; font-weight: 800; color: #163125; letter-spacing: -0.5px; }
  .sub { margin: 6px 0 0; font-size: 24px; font-weight: 700; color: #4a8767; }
  .tagline { margin: 30px 0 0; font-size: 27px; font-weight: 600; line-height: 1.42; color: #404741; max-width: 44ch; }
  .chips { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
  .chip {
    font-size: 22px; font-weight: 700; color: #295640;
    background: #ffffff; border: 1px solid #ebe5d7; border-radius: 16px;
    padding: 10px 16px; box-shadow: 0 4px 12px -8px rgba(31, 42, 36, 0.5);
  }
  .foot { margin-top: 30px; font-size: 21px; font-weight: 700; color: #9c711a; }
  .right { flex: 0 0 400px; }
  .frame {
    width: 400px; padding: 12px; border-radius: 26px;
    background: linear-gradient(135deg, #295640, #163125);
    box-shadow: 0 26px 48px -26px rgba(13, 32, 24, 0.85);
  }
  .board { display: grid; grid-template-columns: repeat(8, 1fr); border-radius: 14px; overflow: hidden; }
  .sq { aspect-ratio: 1 / 1; display: grid; place-items: center; font-size: 34px; line-height: 1; }
  .light { background: #ffffff; }
  .dark { background: #2f6b4f; }
  .wp { color: #fbf9f4; -webkit-text-stroke: 1.4px #163125; }
  .bp { color: #163125; -webkit-text-stroke: 1.4px rgba(251, 249, 244, 0.55); }
</style></head><body>
  <div class="left">
    <div class="brand">
      <div class="mark"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${PAWN()}</svg></div>
      <div>
        <h1>Nam An - Cờ Vua</h1>
        <p class="sub">Cùng bé lên Grand Master</p>
      </div>
    </div>
    <p class="tagline">Học Khai cuộc Grand Master, mẹo săn quân Trung cuộc và Tàn cuộc - mỗi nước đi đều có lời giải thích dễ hiểu cho bé.</p>
    <div class="chips">
      <span class="chip">🛡️ Khai cuộc GM</span>
      <span class="chip">⚔️ Săn quân</span>
      <span class="chip">👑 Tàn cuộc</span>
      <span class="chip">🎮 Đấu tập với chú Máy</span>
    </div>
    <p class="foot">👁️ Mắt Thần Cờ Vua · ⭐ Kỳ thủ Nhí → Grand Master Nhí</p>
  </div>
  <div class="right">
    <div class="frame"><div class="board">${boardCells}</div></div>
  </div>
</body></html>`

const TARGETS = [
  { file: 'public/og-image.png', html: OG_HTML, width: 1200, height: 630 },
  { file: 'public/apple-touch-icon.png', html: ICON_HTML, width: 180, height: 180 },
]

/**
 * Giải mã PNG (8-bit, RGB hoặc RGBA) - chỉ để tự kiểm tra ảnh vừa sinh.
 * Trả về hàm đọc màu từng điểm ảnh.
 */
function decodePng(buffer) {
  let offset = 8
  let width = 0
  let height = 0
  let colorType = 0
  const chunks = []

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (data[8] !== 8) throw new Error(`chỉ hỗ trợ PNG 8-bit (nhận ${data[8]}-bit)`)
      colorType = data[9]
    } else if (type === 'IDAT') {
      chunks.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0
  if (!channels) throw new Error(`chỉ hỗ trợ PNG RGB/RGBA (color type ${colorType})`)

  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)
  let read = 0

  for (let y = 0; y < height; y += 1) {
    const filter = raw[read]
    read += 1
    const line = raw.subarray(read, read + stride)
    read += stride
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y === 0 ? null : out.subarray((y - 1) * stride, y * stride)

    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? cur[x - channels] : 0
      const b = prev ? prev[x] : 0
      const c = prev && x >= channels ? prev[x - channels] : 0
      let value = line[x]
      if (filter === 1) value += a
      else if (filter === 2) value += b
      else if (filter === 3) value += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      } else if (filter !== 0) {
        throw new Error(`bộ lọc PNG lạ: ${filter}`)
      }
      cur[x] = value & 0xff
    }
  }

  return {
    width,
    height,
    pixel: (x, y) => {
      const i = y * stride + x * channels
      return [out[i], out[i + 1], out[i + 2]]
    },
  }
}

const near = (pixel, target, tolerance = 26) =>
  pixel.every((value, index) => Math.abs(value - target[index]) <= tolerance)

const hex = (pixel) => '#' + pixel.map((v) => v.toString(16).padStart(2, '0')).join('')

let failures = 0
const check = (ok, label) => {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    failures += 1
    console.error(`  ✗ ${label}`)
  }
}

const { skipped, failedToConnect, send, evaluate, close } = await openPage(
  'data:text/html,<body style="margin:0"></body>',
  { port: 9346, windowSize: '1300,1700' },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - không sinh được ảnh thương hiệu.')
  console.log('   Đặt biến môi trường CHROME_PATH rồi chạy lại.')
  process.exit(1)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

console.log('\n▶ Sinh ảnh thương hiệu (nền ngà + xanh rừng + vàng đồng)')

mkdirSync(resolve(ROOT, 'public'), { recursive: true })

for (const target of TARGETS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: target.width,
    height: target.height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send('Page.navigate', {
    url: 'data:text/html;charset=utf-8,' + encodeURIComponent(target.html),
  })
  await sleep(1200)
  // Chờ font (Baloo 2 tải từ Google) sẵn sàng để chữ không bị nhảy nét.
  await evaluate('document.fonts.ready.then(() => true)', true)
  await sleep(250)

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: target.width, height: target.height, scale: 1 },
  })
  const buffer = Buffer.from(shot.result.data, 'base64')
  const file = resolve(ROOT, target.file)
  writeFileSync(file, buffer)

  const image = decodePng(buffer)
  check(
    image.width === target.width && image.height === target.height,
    `${target.file}: đúng ${target.width}×${target.height}px (nhận ${image.width}×${image.height}, ${(buffer.length / 1024).toFixed(0)} kB)`,
  )

  if (target.file.includes('og-image')) {
    check(near(image.pixel(8, 8), [251, 249, 244], 30), `nền giấy ngà ở góc trên trái (${hex(image.pixel(8, 8))})`)
    check(near(image.pixel(600, 620), [251, 249, 244], 40), `nền giấy ngà ở đáy ảnh (${hex(image.pixel(600, 620))})`)
    // Khung bàn cờ nhỏ nằm sát mép phải: viền trang 56px, khung dày 12px.
    check(near(image.pixel(1138, 315), [41, 86, 64], 44), `khung bàn cờ xanh rừng (${hex(image.pixel(1138, 315))})`)
    // Đếm xem có đủ ô trắng, ô xanh lá đậm và chi tiết vàng đồng không.
    let white = 0
    let green = 0
    let gold = 0
    for (let y = 0; y < image.height; y += 3) {
      for (let x = 0; x < image.width; x += 3) {
        const [r, g, b] = image.pixel(x, y)
        if (r > 245 && g > 245 && b > 245) white += 1
        else if (Math.abs(r - 47) < 30 && Math.abs(g - 107) < 30 && Math.abs(b - 79) < 30) green += 1
        // Vàng đồng: ngả vàng rõ (kênh xanh dương thấp hơn hẳn đỏ) - bắt được
        // chữ vàng #9c711a ở dòng chân ảnh cùng các emoji ⭐ 👁️.
        if (r - b > 80 && r > 120) gold += 1
      }
    }
    check(white > 400, `có ô cờ trắng trên bàn cờ nhỏ (${white} điểm)`)
    check(green > 900, `có ô cờ xanh lá đậm trên bàn cờ nhỏ (${green} điểm)`)
    check(gold > 150, `có chi tiết vàng đồng (dòng chân ảnh) (${gold} điểm)`)
  } else {
    check(near(image.pixel(4, 4), [53, 108, 79], 34), `nền icon xanh rừng ở góc (${hex(image.pixel(4, 4))})`)
    check(near(image.pixel(90, 55), [251, 249, 244], 30), `quân Tốt trắng ở giữa icon (${hex(image.pixel(90, 55))})`)
  }
}

close()
console.log(
  failures === 0 ? '\n✅ ẢNH THƯƠNG HIỆU PASS!\n' : `\n❌ ẢNH THƯƠNG HIỆU CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
