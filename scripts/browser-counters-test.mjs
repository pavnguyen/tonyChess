/**
 * Kiểm tra tab **Đối phó khai cuộc** (`/counters`):
 *   1. Combo chọn bài có đủ bài đối phó cho cả hai màu đối thủ (5 Trắng / 5 Đen).
 *   2. Đổi bài trong combo → hiện tên cách đối phó + ý tưởng + các việc cần làm.
 *   3. Phím tắt ◀ ▶ ▲ ▼ tiến/lùi từng nước trên bàn cờ (như tab Khai cuộc).
 *   4. Đổi màu đối thủ → combo đổi sang đúng bộ bài của màu đó.
 *   5. Nút ⓘ “Đối phó khai cuộc” có nội dung.
 *
 * Chạy: npm run check:counters
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

// Ghim London cho phần kiểm phím ◀ ▶ (bài dễ soát nhất: 1.d4 d5 2.Bf4); bài mặc
// định của app nay là bài đứng đầu danh sách ưu tiên - Ván cờ Ý (1.e4 e5).
const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}/counters?vs=vs-london`,
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

check(await waitFor('#kid-counter-select'), 'hiện combo chọn bài đối phó')
check(await present('#kid-board-board'), 'có bàn cờ chính (kid-board-board)')
const whiteOptions = await evaluate(
  `document.querySelectorAll('#kid-counter-select option').length`,
)
check(whiteOptions === 5, `đối thủ cầm Trắng có đủ 5 bài trong combo (${whiteOptions})`)
const whiteSelected = await evaluate(`document.getElementById('kid-counter-select').value`)
check(whiteSelected === 'vs-london', `combo đang mở đúng bài từ ?vs= (${whiteSelected})`)
await sleep(250)
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

// Tab Đối phó giờ mặc định mở ở chế độ LUYỆN (bé tự đi ngay). Phím ◀ ▶ chỉ dành cho
// chế độ Xem nên phải chuyển sang chế độ đó trước khi kiểm phím tắt.
await clickInBody('Xem từng bước')
await sleep(600)
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

console.log('\n▶ Đổi bài bằng combo')

const selectLesson = (id) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-counter-select')
      if (!el) return false
      el.value = ${JSON.stringify(id)}
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    })()
  `)

const before = String(await text('#kid-counter-name'))
check(await selectLesson('vs-ruy-lopez'), 'chọn bài khác trong combo')
await sleep(500)
const after = String(await text('#kid-counter-name'))
check(after !== before, `cách đối phó đổi theo bài mới (${after.slice(0, 50)}…)`)

console.log('\n▶ Đổi sang “đối thủ cầm Đen”')

check(await clickInBody('Đối thủ cầm Đen'), 'bấm “Đối thủ cầm Đen”')
await sleep(500)
const blackOptions = await evaluate(
  `document.querySelectorAll('#kid-counter-select option').length`,
)
check(blackOptions === 5, `combo đổi sang 5 bài của Đen (${blackOptions})`)
const firstBlack = await evaluate(`document.getElementById('kid-counter-select').value`)
check(firstBlack !== 'vs-london', `bài đang chọn là của Đen, không phải London (${firstBlack})`)

console.log('\n▶ Nút ⓘ có nội dung')

check(await present('#kid-info-counter'), 'có nút ⓘ “Đối phó khai cuộc”')

console.log('\n▶ Mở sẵn đúng bài qua đường dẫn /counters?vs=…')

// Mọi bài Đối phó nay đều gắn đúng một khai cuộc trong tab Khai cuộc, nên luôn có
// nút “mở bài khai cuộc gốc” - không còn bài “nước mở đầu rời” để kiểm riêng.
await evaluate(`location.href = ${JSON.stringify(`${APP_URL}/counters?vs=vs-sicilian`)}`)
await sleep(1800)
await waitFor('#kid-counter-select')
const selected = await evaluate(`document.getElementById('kid-counter-select').value`)
check(selected === 'vs-sicilian', `mở sẵn đúng bài Sicilian (${selected})`)

console.log('\n▶ Từ Đối phó mở bài khai cuộc gốc')

check(await clickInBody('Mở bài khai cuộc gốc'), 'bấm “📖 Mở bài khai cuộc gốc”')
await sleep(1800)
const urlBack = String(await evaluate(`location.pathname + location.search`))
check(
  urlBack.includes('opening=sicilian'),
  `sang tab Khai cuộc kèm ?opening=sicilian (${urlBack})`,
)
check(await waitFor('#kid-opening-vs'), 'tab Khai cuộc có nút “🧭 Đối thủ chơi khai cuộc này thì sao?”')
check(
  String(await evaluate(`document.body.innerText`)).includes('Phòng thủ Sicilian'),
  'mở sẵn đúng bài khai cuộc Sicilian',
)

console.log('\n▶ Từ Khai cuộc nhảy ngược lại Đối phó')

check(
  await evaluate(`
    (() => {
      const el = document.getElementById('kid-opening-vs')
      if (!el) return false
      el.click()
      return true
    })()
  `),
  'bấm nút nhảy sang Đối phó',
)
await sleep(1800)
const urlVs = String(await evaluate(`location.pathname + location.search`))
check(
  urlVs.includes('/counters') && urlVs.includes('vs=vs-sicilian'),
  `sang tab Đối phó kèm ?vs=vs-sicilian (${urlVs})`,
)
check(await waitFor('#kid-counter-select'), 'tab Đối phó mở lại đúng bài')

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
// Chế độ luyện vẫn có Lùi/Tiến để xem lại nước vừa đi (không phải đổi sang chế độ Xem).
check(await present('#kid-counter-back'), 'chế độ luyện có nút ◀ Lùi')
await clickInBody('◀ Lùi')
await sleep(600)
check(!(await present('#kid-board-piece-wB-f4')), '◀ Lùi gỡ nước vừa đi (Bf4), và đối thủ KHÔNG tự đi lại')
check(await present('#kid-board-piece-bP-d5'), 'lùi xong vẫn giữ nước bé vừa đáp (Tốt Đen ở d5)')
await clickInBody('Tiến ▶')
await sleep(700)
check(await present('#kid-board-piece-wB-f4'), 'Tiến ▶ đi tiếp lại được (Bf4 trở lại)')
await clickInBody('Ẩn gợi ý')
await sleep(100)
check(!String(await text('#kid-counter-turn')).includes('→'), 'ẩn gợi ý không lộ ô đáp trả trong dải lượt')
await clickInBody('Chơi lại')
await sleep(1100)
check(await present('#kid-board-piece-bP-d7') && !await present('#kid-board-piece-bP-d5'), 'Chơi lại trả về nước đáp đầu tiên')

close()
finish('BROWSER COUNTERS')
