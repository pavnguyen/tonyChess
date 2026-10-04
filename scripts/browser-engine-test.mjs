/**
 * Kiểm tra thật trong trình duyệt: Web Worker của bộ máy cờ vua có trả nước đi không.
 *
 * Chạy: node scripts/browser-engine-test.mjs  (cần `npx vite preview --port 5198`)
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = new URL('/free-play', process.env.APP_URL ?? 'http://localhost:5198').href

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}#engine`, {
  port: 9333,
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra trình duyệt.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

console.log('\n▶ Kiểm tra trình duyệt: Web Worker của bộ máy cờ vua')

// Cho trang thời gian tải (chờ React render và Worker khởi động).
await sleep(2500)

const text = await evaluate('document.body.innerText')

check(await evaluate('typeof Worker === "function"'), 'trình duyệt hỗ trợ Web Worker')
check(
  typeof text === 'string' && text.includes('Đấu tập tự do'),
  'trang Đấu tập đã render',
)

// Chuyển sang cho bé cầm quân Đen → máy (Trắng) phải tự đi nước đầu tiên.
const clicked = await evaluate(`
  (() => {
    const buttons = [...document.querySelectorAll('button')]
    const black = buttons.find(
      (b) => b.closest('[role="tablist"]') && b.textContent.includes('Đen'),
    )
    if (!black) return 'not-found'
    black.click()
    return black.textContent.trim()
  })()
`)
check(
  typeof clicked === 'string' && clicked.includes('Đen'),
  `đã bấm chọn “Bé cầm quân Đen” (nút: ${clicked})`,
)

await sleep(400)
const afterSwitch = await evaluate(`
  (() => {
    const badge = [...document.querySelectorAll('span')].find((s) =>
      /Lượt của bé|Chờ máy đi|đang suy nghĩ/.test(s.textContent),
    )
    return badge ? badge.textContent.trim() : 'no-status'
  })()
`)
check(
  String(afterSwitch).includes('Chờ máy') || String(afterSwitch).includes('suy nghĩ'),
  `sau khi đổi quân, trạng thái là “${afterSwitch}”`,
)

// Chờ tối đa 15 giây cho worker trả về nước đi (đây là round-trip thật).
let delivered = null
for (let attempt = 0; attempt < 30 && !delivered; attempt += 1) {
  await sleep(500)
  const snapshot = await evaluate(`
    (() => {
      const body = document.body.innerText
      const table = document.querySelector('table')
      const rows = table ? [...table.querySelectorAll('tr')] : []
      const first = rows[0]
      const cells = first ? [...first.querySelectorAll('td')].map((c) => c.textContent.trim()) : []
      return { cells, waiting: body.includes('đang suy nghĩ') }
    })()
  `)
  if (snapshot && snapshot.cells && snapshot.cells[1]) delivered = snapshot
}

if (delivered) {
  check(true, `Web Worker đã trả nước đi: “${delivered.cells.join(' ')}”`)

  // Nước đi được hiển thị theo tuýp ký hiệu bé đang chọn (hình con cờ ♘c3 /
  // quốc tế Nc3 / Việt Mf3), nên chỉ kiểm tra phần chung của mọi tuýp:
  // một token duy nhất và có ô đích (hoặc là nước nhập thành).
  const moveText = String(delivered.cells[1]).trim()
  check(
    (/[a-h][1-8]/.test(moveText) || /^O-O/.test(moveText)) && !/\s/.test(moveText),
    `nước đi ghi đúng ký hiệu cờ: “${moveText}”`,
  )
} else {
  check(false, 'Web Worker KHÔNG trả về nước đi trong 15 giây')
}

const finalText = await evaluate('document.body.innerText')
check(
  typeof finalText === 'string' && !finalText.includes('đang suy nghĩ'),
  'máy không còn kẹt ở trạng thái “đang suy nghĩ”',
)

close()
finish('BROWSER ENGINE')
