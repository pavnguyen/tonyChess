/**
 * Kiểm tra tính năng MỚI của tab Trung cuộc:
 *   1. Chế độ “đánh tiếp”: sau nước hay nhất, máy tự đáp trả rồi bé đi nốt để kết liễu.
 *   2. Huy hiệu trình độ ước lượng (Elo) trên thanh tiêu đề.
 *   3. Khung “🔁 Ôn tập hôm nay” hiện đúng bài đã tới hạn.
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

// ── Nạp sẵn tiến độ: một bài Trung cuộc đã làm từ 5 ngày trước (tới hạn ôn lại).
await evaluate(`
  (() => {
    const old = Date.now() - 5 * 24 * 60 * 60 * 1000
    localStorage.setItem('hoc-vien-co-vua-nhi.v1', JSON.stringify({
      stars: 12,
      completed: ['tactics:pawn-1'],
      notation: 'figurine',
      soundOn: false,
      unlockAll: true,
      reviews: { 'tactics:pawn-1': { last: old, box: 0 } },
    }))
    return true
  })()
`)

console.log('\n▶ Huy hiệu Elo + khung ôn tập')

await evaluate(`window.location.href = ${JSON.stringify(APP_URL + '/tactics')}`)
await sleep(2000)
check(await waitFor('#kid-elo-badge'), 'thanh tiêu đề có huy hiệu trình độ ước lượng (Elo)')
const eloText = await evaluate(`document.getElementById('kid-elo-badge')?.innerText ?? ''`)
check(/≈\s*\d+/.test(String(eloText)), `Elo hiện số ước lượng dễ đọc (${String(eloText).trim()})`)

check(await waitFor('#kid-review-strip'), 'tab Trung cuộc có khung “🔁 Ôn tập hôm nay”')
const reviewCount = await evaluate(
  `document.getElementById('kid-review-count')?.innerText ?? ''`,
)
check(
  /1\s*đến hạn/.test(String(reviewCount)),
  `đếm đúng 1 bài tới hạn ôn lại (${String(reviewCount).trim()})`,
)
check(
  await evaluate(
    `Boolean(document.querySelector('[data-review-id="tactics:pawn-1"]'))`,
  ),
  'hiện chip ôn tập đúng bài đã làm từ 5 ngày trước',
)

console.log('\n▶ Chế độ “đánh tiếp” (chiếu bí 2 nước)')

await evaluate(`window.location.href = ${JSON.stringify(APP_URL + '/tactics?theme=mate-two')}`)
await sleep(2000)
check(await waitForText('Thang Xe đuổi Vua'), 'mở đúng thế “Chiếu bí 2 nước” đầu tiên')
check(await waitFor('#kid-tactic-step'), 'hiện bộ đếm nước trong chuỗi đánh tiếp')

// Nước 1: Xe a1 → a8 (chiếu), rồi máy tự đáp Kh7.
await clickSquare('a1')
await sleep(220)
await clickSquare('a8')
await sleep(1400)
check(
  await evaluate(`Boolean(document.getElementById('kid-board-piece-bK-h7'))`),
  'máy tự đáp trả: Vua Đen chạy lên h7',
)
check(
  !String(await bodyText()).includes('Đánh tiếp tuyệt vời!'),
  'chưa đi nốt thì chưa báo hoàn thành',
)

// Nước 2: Xe b2 → h2 (chiếu bí).
await clickSquare('b2')
await sleep(220)
await clickSquare('h2')
check(await waitForText('Đánh tiếp tuyệt vời!'), 'đi nốt nước chiếu bí → báo “Đánh tiếp tuyệt vời!”')

close()
finish('BROWSER TACTICS CONTINUATION')
