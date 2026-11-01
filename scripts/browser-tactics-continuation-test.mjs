/**
 * Kiểm tra chế độ “đánh tiếp” của tab Trung cuộc: sau nước hay nhất, máy tự đáp
 * trả rồi bé đi nốt để kết liễu.
 *
 * Chạy: node scripts/browser-tactics-continuation-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, close } = await openPage(APP_URL, {
  port: 9373,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra đánh tiếp.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()
const bodyText = () => evaluate(`document.body.innerText`)

const waitFor = async (selector, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(150)
  }
  return false
}

const waitForText = async (needle, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (String(await bodyText()).includes(needle)) return true
    await sleep(150)
  }
  return false
}

const clickSquare = async (square) => {
  await evaluate(`
    (() => {
      const el = document.getElementById('kid-board-square-' + ${JSON.stringify(square)})
      if (el) el.click()
      return Boolean(el)
    })()
  `)
}

await sleep(2500)

console.log('\n▶ Chế độ “đánh tiếp” (3 nước của bé, máy đáp ở giữa)')

// Th�� cờ `material-1` (chủ đề Trừng phạt quân treo) là thế có chuỗi đánh tiếp:
// Nd6 → máy Kf8 → Nxc8 → máy f6 → Nxa7.
await evaluate(`window.location.href = ${JSON.stringify(APP_URL + '/tactics?theme=win-material')}`)
await sleep(2000)
check(await waitForText('Mã bắt đôi hai Xe rồi ăn tiếp'), 'mở đúng thế có chuỗi đánh tiếp đầu tiên')
check(await waitFor('#kid-tactic-step'), 'hiện bộ đếm nước trong chuỗi đánh tiếp')

// Nước 1: Mã c4 → d6 (đòn đôi), rồi máy tự đáp Kf8.
await clickSquare('c4')
await sleep(220)
await clickSquare('d6')
await sleep(1400)
check(
  await evaluate(`Boolean(document.getElementById('kid-board-piece-bK-f8'))`),
  'máy tự đáp trả: Vua Đen lùi về f8',
)
check(
  !String(await bodyText()).includes('Đánh tiếp tuyệt vời!'),
  'chưa đi nốt thì chưa báo hoàn thành',
)

// Nước 2: Mã ăn Xe c8, máy đáp f6.
await clickSquare('d6')
await sleep(220)
await clickSquare('c8')
await sleep(1400)

// Nước 3: Mã ăn nốt Tốt a7 → hết chuỗi.
await clickSquare('c8')
await sleep(220)
await clickSquare('a7')
check(await waitForText('Đánh tiếp tuyệt vời!'), 'đi nốt chuỗi → báo “Đánh tiếp tuyệt vời!”')

close()
finish('BROWSER TACTICS CONTINUATION')
