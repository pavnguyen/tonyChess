/**
 * Kiểm tra tab Chiến lược sau khi gộp về một module “10 nguyên tắc vàng”:
 *   1. Hiện đủ 10 thẻ nguyên tắc, mở/đóng được.
 *   2. Mỗi nguyên tắc có HAI thế cờ minh hoạ; bấm thẻ là soi lên bàn cờ lớn.
 *   3. Công tắc “Nên / Không nên” đổi thế cờ trên bàn (xanh NÊN, đỏ KHÔNG NÊN).
 *   4. Không còn dấu vết bài giảng GM cũ.
 *
 * Chạy: node scripts/browser-strategy-drag-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}/strategy`, {
  port: 9353,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra tab Chiến lược.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const bodyText = () => evaluate(`document.body.innerText`)

/** Chờ một đoạn chữ xuất hiện (trang tải lười). */
const waitForText = async (needle, timeoutMs = 8000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const text = String(await bodyText())
    if (text.includes(needle)) return true
    await sleep(120)
  }
  return false
}

const hasPiece = (piece, square) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${piece}-${square}'))`)

const clickByText = (needle) =>
  evaluate(`
    (() => {
      const el = [...document.querySelectorAll('button')].find((b) =>
        b.innerText.includes(${JSON.stringify(needle)}),
      )
      if (!el) return false
      el.click()
      return true
    })()
  `)

await sleep(2500)

console.log('\n▶ Chiến lược: một module “10 nguyên tắc vàng” có thế cờ minh hoạ')

check(await waitForText('10 nguyên tắc vàng'), 'khung “10 nguyên tắc vàng” đã hiện')

// Mỗi thẻ là một nút bấm mở ra nội dung - đếm theo thuộc tính aria-expanded.
const cardCount = await evaluate(`
  [...document.querySelectorAll('button[aria-expanded]')].filter((b) =>
    /^\\s*\\d+\\s*$/.test(b.querySelector('span')?.textContent ?? ''),
  ).length
`)
check(cardCount === 10, `có đủ 10 thẻ nguyên tắc (đếm được ${cardCount})`)

// Mặc định bàn cờ soi thế “NÊN” của nguyên tắc đầu tiên (Tốt d4/e4 giữ trung tâm).
check(
  (await hasPiece('wP', 'd4')) && (await hasPiece('wP', 'e4')),
  'bàn cờ mặc định soi thế minh hoạ của nguyên tắc đầu tiên',
)

// Bấm thẻ đầu tiên → phải lộ câu hỏi tự vấn + cả hai thế + khẩu quyết.
const opened = await evaluate(`
  (() => {
    const button = document.querySelector('[data-principle-id="center"]')
    if (!button) return false
    button.click()
    return true
  })()
`)
check(opened, 'bấm được thẻ “Làm chủ trung tâm”')
await sleep(300)
const afterOpen = String(await bodyText())
check(afterOpen.includes('trung tâm'), 'thẻ mở ra có nội dung về trung tâm')
check(
  afterOpen.includes('Nên:') && afterOpen.includes('Không nên:'),
  'thẻ mở ra có cả hai thế cờ “Nên” và “Không nên”',
)
check(afterOpen.includes('Khẩu quyết'), 'thẻ mở ra có khẩu quyết vè')

// Gạt công tắc sang “Không nên” → bàn cờ đổi sang thế cờ đỏ.
check(await clickByText('Không nên'), 'bấm công tắc “Không nên”')
await sleep(400)
check(await hasPiece('wP', 'a3'), 'bàn cờ đổi sang thế “không nên” (Tốt đi hoang ra a3)')
check(!(await hasPiece('wP', 'd4')), 'thế “nên” cũ đã được thay bằng thế “không nên”')

// Không còn dấu vết bài giảng GM.
const stale = ['Bài giảng GM', 'Grand Master', 'minority', 'Phòng thủ dự phòng', 'Đòn bẩy']
const finalText = String(await bodyText())
const leftovers = stale.filter((needle) => finalText.includes(needle))
check(
  leftovers.length === 0,
  `không còn nội dung bài giảng GM${leftovers.length ? ` (còn: ${leftovers.join(', ')})` : ''}`,
)

// Bàn cờ có quân.
const pieceCount = await evaluate(`
  document.querySelectorAll('[id^="kid-board-piece-"]').length
`)
check(Number(pieceCount) > 0, `bàn cờ có quân (${pieceCount} quân)`)

close()
finish('BROWSER STRATEGY')
