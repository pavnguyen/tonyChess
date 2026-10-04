/**
 * Kiểm tra tab **Đối phó khai cuộc** (`/counters`):
 *   1. Danh sách có đủ bài đối phó cho cả hai màu đối thủ (5 Trắng / 5 Đen).
 *   2. Bấm một bài → hiện tên cách đối phó + ý tưởng + các việc cần làm.
 *   3. Phím tắt ◀ ▶ ▲ ▼ tiến/lùi từng nước trên bàn cờ (như tab Khai cuộc).
 *   4. Đổi màu đối thủ → danh sách đổi sang đúng bộ bài của màu đó.
 *   5. Nút ⓘ “Đối phó khai cuộc” có nội dung.
 *
 * Chạy: npm run check:counters
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}/counters`,
  { port: 9385, windowSize: '1440,900' },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra tab Đối phó.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const waitFor = async (selector, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(150)
  }
  return false
}

const present = (selector) =>
  evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)

const text = (selector) =>
  evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? ''`)

const clickInBody = (needle) =>
  evaluate(`
    (() => {
      const el = [...document.querySelectorAll('button, [role="tab"]')].find((b) =>
        (b.innerText || '').includes(${JSON.stringify(needle)}),
      )
      if (!el) return false
      el.click()
      return true
    })()
  `)

const pressKey = async (key, code, vk) => {
  const base = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
}

await sleep(2500)

console.log('\n▶ Tab Đối phó tải và liệt kê bài của “đối thủ cầm Trắng”')

check(await waitFor('#kid-counter-list'), 'hiện danh sách bài đối phó')
check(await present('#kid-board-board'), 'có bàn cờ chính (kid-board-board)')
const whiteCount = await evaluate(
  `document.querySelectorAll('#kid-counter-list [data-counter-id]').length`,
)
check(whiteCount === 8, `mặc định có 8 bài đối phó cho đối thủ cầm Trắng (${whiteCount})`)
check(
  String(await text('#kid-counter-idea')).trim().length >= 30,
  'hiện ý tưởng đối phó của bài đang chọn',
)
check(
  (await present('#kid-counter-points')) &&
    (await evaluate(`document.querySelectorAll('#kid-counter-points li').length`)) >= 3,
  'hiện ≥ 3 việc bé cần làm',
)
check(
  String(await text('#kid-counter-opponent-plan')).replace(/\s+/g, ' ').trim().length >= 40,
  'hiện câu “đối thủ đang định làm gì?” của bài đang chọn',
)

console.log('\n▶ Phím tắt tiến/lùi từng nước')

check(
  (await present('#kid-board-piece-wP-d2')) && !(await present('#kid-board-piece-wP-d4')),
  'thế cờ ban đầu: Tốt Trắng còn ở d2',
)
await pressKey('ArrowRight', 'ArrowRight', 39)
await sleep(450)
check(
  (await present('#kid-board-piece-wP-d4')) && !(await present('#kid-board-piece-wP-d2')),
  'phím ▶ tiến một nước: đối thủ đi d4',
)
await pressKey('ArrowRight', 'ArrowRight', 39)
await sleep(450)
check(await present('#kid-board-piece-bP-d5'), 'phím ▶ tiến tiếp: bé cầm Đen đáp d5')
await pressKey('ArrowLeft', 'ArrowLeft', 37)
await sleep(450)
check(
  !(await present('#kid-board-piece-bP-d5')) && (await present('#kid-board-piece-wP-d4')),
  'phím ◀ lùi lại: nước d5 được gỡ, d4 vẫn còn',
)

console.log('\n▶ Bộ lọc “gom theo nước mở đầu”')

const countList = () =>
  evaluate(`document.querySelectorAll('#kid-counter-list [data-counter-id]').length`)
const clickFilter = (move) =>
  evaluate(`
    (() => {
      const el = document.querySelector('[data-move-filter="' + ${JSON.stringify(move)} + '"]')
      if (!el) return false
      el.click()
      return true
    })()
  `)

check(await present('#kid-counter-move-filter'), 'có hàng bộ lọc theo nước mở đầu')
check(await present('[data-move-filter="d4"]'), 'có chip lọc cho 1.d4')
check(await present('[data-move-filter="all"]'), 'có chip “Tất cả”')
const allWhite = await countList()
check(allWhite === 8, `mặc định hiện đủ 8 bài (${allWhite})`)

check(await clickFilter('d4'), 'bấm chip 1.d4')
await sleep(400)
const d4Count = await countList()
check(d4Count === 3, `lọc 1.d4 gom đúng 3 bài (${d4Count})`)
const d4Selected = await evaluate(
  `document.querySelector('#kid-counter-list [data-counter-id][aria-pressed="true"]')?.getAttribute('data-counter-id')`,
)
check(d4Selected === 'vs-london', `bài đang chọn là bài 1.d4 đầu tiên (${d4Selected})`)

check(await clickFilter('all'), 'bấm “Tất cả”')
await sleep(400)
const allAgain = await countList()
check(allAgain === 8, `bỏ lọc hiện lại đủ 8 bài (${allAgain})`)

console.log('\n▶ Đổi sang “đối thủ cầm Đen”')

check(await clickInBody('Đối thủ cầm Đen'), 'bấm “Đối thủ cầm Đen”')
await sleep(500)
const blackCount = await evaluate(
  `document.querySelectorAll('#kid-counter-list [data-counter-id]').length`,
)
check(blackCount === 8, `danh sách đổi sang 8 bài cho đối thủ cầm Đen (${blackCount})`)
const firstBlack = await evaluate(
  `document.querySelector('#kid-counter-list [data-counter-id]')?.getAttribute('data-counter-id')`,
)
check(firstBlack !== 'vs-london', `bài đầu tiên là của Đen, không phải London (${firstBlack})`)

console.log('\n▶ Bấm một bài khác → bàn cờ đổi dòng nước')

const before = String(await text('#kid-counter-name'))
check(await clickInBody('Phòng thủ Pháp'), 'bấm bài “Phòng thủ Pháp”')
await sleep(500)
const after = String(await text('#kid-counter-name'))
check(after !== before, `tên cách đối phó đổi theo bài mới (${after.slice(0, 50)}…)`)

console.log('\n▶ Nút ⓘ có nội dung')

check(await present('#kid-info-counter'), 'có nút ⓘ “Đối phó khai cuộc”')

console.log('\n▶ Khung “Ôn tập hôm nay” có mặt ở tab Đối phó')

check(await present('#kid-review-strip'), 'có khung 🔁 Ôn tập hôm nay (dùng chung cơ chế ôn tập ngắt quãng)')

console.log('\n▶ Mở sẵn đúng bài qua đường dẫn /counters?vs=…')

// Bài chỉ bàn về một nước mở đầu (không gắn khai cuộc riêng) vẫn xem được, nhưng
// KHÔNG có nút "mở bài khai cuộc gốc".
await evaluate(`location.href = ${JSON.stringify(`${APP_URL}/counters?vs=vs-1e4-open`)}`)
await sleep(1800)
check(await waitFor('#kid-counter-list'), 'trang Đối phó tải lại với tham số ?vs=')
check(
  await present('#kid-counter-opponent-plan'),
  'bài nước mở đầu có câu “đối thủ đang định làm gì”',
)
check(
  !(await present('#kid-counter-opening')),
  'bài nước mở đầu KHÔNG có nút mở khai cuộc gốc (không gắn khai cuộc riêng)',
)

await evaluate(`location.href = ${JSON.stringify(`${APP_URL}/counters?vs=vs-sicilian`)}`)
await sleep(1800)
await waitFor('#kid-counter-list')
const selected = await evaluate(
  `document.querySelector('#kid-counter-list [data-counter-id][aria-pressed="true"]')?.getAttribute('data-counter-id')`,
)
check(selected === 'vs-sicilian', `mở sẵn đúng bài Sicilian (${selected})`)

console.log('\n▶ Từ Đối phó mở bài khai cuộc gốc')

check(await clickInBody('Mở bài khai cuộc gốc'), 'bấm “📖 Mở bài khai cuộc gốc”')
await sleep(1800)
const urlBack = String(await evaluate(`location.pathname + location.search`))
check(
  urlBack.includes('opening=sicilian'),
  `sang tab Khai cuộc kèm ?opening=sicilian (${urlBack})`,
)
check(await waitFor('#kid-opening-vs'), 'tab Khai cuộc có nút “🧭 Bạn chơi khai cuộc này thì sao?”')
check(
  String(await evaluate(`document.body.innerText`)).includes('Phòng thủ Sicilian'),
  'mở sẵn đúng bài khai cuộc Sicilian',
)

console.log('\n▶ Từ Khai cuộc nhảy ngược lại Đối phó')

check(await clickInBody('Bạn chơi khai cuộc này thì sao'), 'bấm nút nhảy sang Đối phó')
await sleep(1800)
const urlVs = String(await evaluate(`location.pathname + location.search`))
check(
  urlVs.includes('/counters') && urlVs.includes('vs=vs-sicilian'),
  `sang tab Đối phó kèm ?vs=vs-sicilian (${urlVs})`,
)
check(await waitFor('#kid-counter-list'), 'tab Đối phó mở lại đúng bài')

console.log('\n▶ Luyện đáp trả bằng thao tác trên bàn cờ')
await evaluate(`location.href = ${JSON.stringify(`${APP_URL}/counters?vs=vs-london`)}`)
await sleep(1800)
await clickInBody('Luyện tự đáp trả')
await sleep(1100)
check(await present('#kid-board-piece-wP-d4'), 'chế độ luyện tự đi nước mở đầu của đối thủ')
const move = async (from, to) => {
  await evaluate(`document.getElementById('kid-board-square-${from}').click()`)
  await sleep(100)
  await evaluate(`document.getElementById('kid-board-square-${to}').click()`)
  await sleep(350)
}
await move('d7', 'd6')
check(await present('#kid-board-piece-bP-d7'), 'nước đáp chưa đúng bị từ chối, quân vẫn ở d7')
check(String(await evaluate(`document.body.innerText`)).includes('Nước này chưa đúng'), 'nước sai có lời nhắc dễ hiểu')
await move('d7', 'd5')
check(await present('#kid-board-piece-bP-d5'), 'đáp đúng d5 được chấp nhận')
await sleep(800)
check(await present('#kid-board-piece-wB-f4'), 'đối thủ tự đi tiếp Bf4')
await clickInBody('Ẩn gợi ý')
await sleep(100)
check(!String(await text('#kid-counter-turn')).includes('→'), 'ẩn gợi ý không lộ ô đáp trả trong dải lượt')
await clickInBody('Chơi lại')
await sleep(1100)
check(await present('#kid-board-piece-bP-d7') && !await present('#kid-board-piece-bP-d5'), 'Chơi lại trả về nước đáp đầu tiên')

close()
finish('BROWSER COUNTERS')
