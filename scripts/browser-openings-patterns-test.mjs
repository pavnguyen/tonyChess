/**
 * Kiểm tra modal **“Ôn mẫu hình cuối khai cuộc”** ở tab Khai cuộc:
 *   1. Bấm nút 🧩 → mở modal, hiện sẵn thế cờ CUỐI của khai cuộc đang học.
 *   2. Danh sách khai cuộc đúng theo cột Trắng/Đen; bấm một khai cuộc khác thì
 *      bàn cờ trong modal đổi sang thế cờ cuối của khai cuộc đó (không phải đi lại).
 *   3. Bàn cờ trong modal dùng id riêng (`kid-board-pattern-*`) nên KHÔNG trùng id
 *      với bàn cờ chính (`kid-board-*`).
 *   4. Đóng được bằng nút ✕ (và phím Esc).
 *
 * Chạy: npm run check:patterns
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, close } = await openPage(APP_URL, {
  port: 9382,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra modal mẫu hình.')
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

const text = (selector) =>
  evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? ''`)

const clickId = (id) =>
  evaluate(`
    (() => {
      const el = document.getElementById(${JSON.stringify(id)})
      if (!el) return false
      el.click()
      return true
    })()
  `)

const clickInModal = (needle) =>
  evaluate(`
    (() => {
      const modal = document.getElementById('kid-patterns-modal')
      if (!modal) return false
      const el = [...modal.querySelectorAll('button')].find((b) =>
        b.innerText.includes(${JSON.stringify(needle)}),
      )
      if (!el) return false
      el.click()
      return true
    })()
  `)

const clickPattern = (id) =>
  evaluate(`
    (() => {
      const el = document.querySelector('[data-pattern-id="' + ${JSON.stringify(id)} + '"]')
      if (!el) return false
      el.click()
      return true
    })()
  `)

const present = (selector) =>
  evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)

await sleep(2500)

console.log('\n▶ Bấm nút 🧩 nhỏ → hiện mẫu hình cuối khai cuộc')

// Không còn nút to “🧩 Ôn mẫu hình cuối khai cuộc”, và bàn cờ KHÔNG tự bung khung
// khi rê chuột nữa (dễ bật nhầm, che mất thế cờ đang học).
check(
  !(await evaluate(`Boolean(document.getElementById('kid-openings-patterns'))`)),
  'không còn nút to “🧩 Ôn mẫu hình cuối khai cuộc”',
)
check(
  !(await present('#kid-opening-board-hover')),
  'bàn cờ không còn tự bung khung khi rê chuột',
)
const autoOpened = await evaluate(`
  (() => {
    const el = document.getElementById('kid-board-board')
    if (!el) return 'no-board'
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    return Boolean(document.getElementById('kid-patterns-modal'))
  })()
`)
check(autoOpened === false, 'rê chuột ngang bàn cờ KHÔNG mở khung mẫu hình')
check(await waitFor('#kid-final-pattern'), 'có nút 🧩 nhỏ cạnh tên khai cuộc để chủ động mở')
check(await clickId('kid-final-pattern'), 'bấm nút 🧩')
check(await waitFor('#kid-patterns-modal'), 'khung mẫu hình hiện ra sau khi bấm nút 🧩')

console.log('\n▶ Bàn cờ trong modal có id riêng, không trùng bàn cờ chính')

check(await present('#kid-board-board'), 'bàn cờ CHÍNH vẫn còn (id kid-board-board)')
check(await present('#kid-board-pattern-board'), 'modal có bàn cờ riêng (id kid-board-pattern-board)')
check(
  await present('#kid-board-coords'),
  'khung toạ độ bàn cờ chính vẫn nguyên (kid-board-coords)',
)
check(
  await present('#kid-board-pattern-coords'),
  'khung toạ độ bàn cờ modal dùng id riêng (kid-board-pattern-coords)',
)
const dupBoardIds = await evaluate(
  `document.querySelectorAll('#kid-board-board').length`,
)
check(dupBoardIds === 1, `chỉ có ĐÚNG 1 bàn cờ chính (nhận ${dupBoardIds})`)

console.log('\n▶ Mặc định mở đúng khai cuộc đang học')

// Bài mặc định nay là bài đứng đầu danh sách ưu tiên - Ván cờ Ý.
check(
  (await present('[data-pattern-id="italian"]')) &&
    String(await evaluate(`document.querySelector('[data-pattern-id="italian"]').getAttribute('aria-pressed')`)) ===
      'true',
  'thẻ khai cuộc đang học (Ván cờ Ý) được chọn sẵn',
)
const defaultLine = String(await text('#kid-pattern-line'))
check(
  defaultLine.includes('e4'),
  `hiện dòng chính của bài mặc định - Ván cờ Ý (${defaultLine.slice(0, 40)}…)`,
)

const whiteChips = await evaluate(
  `document.querySelectorAll('#kid-patterns-list [data-pattern-id]').length`,
)
check(whiteChips === 5, `cột Trắng có đủ 5 khai cuộc (${whiteChips})`)

console.log('\n▶ Bấm khai cuộc khác → bàn cờ trong modal đổi thế cờ cuối')

check(await clickPattern('london'), 'bấm thẻ “Hệ thống London”')
await sleep(400)
const londonLine = String(await text('#kid-pattern-line'))
check(londonLine !== defaultLine, 'dòng chính đổi sang khai cuộc mới')
check(londonLine.includes('d4'), `đúng dòng của London (${londonLine.slice(0, 40)}…)`)
check(
  String(await evaluate(`document.querySelector('[data-pattern-id="london"]').getAttribute('aria-pressed')`)) ===
    'true',
  'thẻ London được đánh dấu đang chọn',
)

console.log('\n▶ Chuyển sang cột quân Đen')

check(await clickInModal('Bé cầm Đen'), 'bấm “Bé cầm Đen” trong modal')
await sleep(400)
const blackChips = await evaluate(
  `document.querySelectorAll('#kid-patterns-list [data-pattern-id]').length`,
)
check(blackChips === 5, `cột Đen có đủ 5 khai cuộc (${blackChips})`)
const blackLine = String(await text('#kid-pattern-line'))
check(
  blackLine.includes('g6') || blackLine.includes('e6') || blackLine.includes('c6'),
  `hiện dòng chính của khai cuộc Đen đầu tiên (${blackLine.slice(0, 40)}…)`,
)

console.log('\n▶ Đóng modal')

check(await clickId('kid-patterns-close'), 'bấm “✕ Đóng”')
await sleep(400)
check(!(await present('#kid-patterns-modal')), 'modal đã đóng')
check(await present('#kid-board-board'), 'bàn cờ chính vẫn hoạt động bình thường')

console.log('\n▶ Bấm một khai cuộc → bàn cờ hiện thế cờ mẫu hình')

// Mở tab bằng đường dẫn thường thì bàn cờ đã hiện SẴN mẫu hình của bài mặc định
// (Italian Game) - bé không phải bấm lại đúng thẻ đang được chọn sẵn.
check(
  await present('#kid-opening-preview'),
  'mở tab là đã có bàn xem trước của bài mặc định',
)
check(
  await present('#kid-board-piece-wB-c4'),
  'bàn xem trước đúng thế cờ cuối Ván cờ Ý (Tượng Trắng ở c4)',
)

const clickedLevel = await evaluate(`
  (() => {
    const el = document.querySelector('[data-level-id="italian"]')
    if (!el) return 'not-found'
    if (el.disabled) return 'disabled'
    el.click()
    return 'clicked'
  })()
`)
check(clickedLevel === 'clicked', `bấm được khai cuộc “Ván cờ Ý” trên bản đồ (${clickedLevel})`)
await sleep(500)

check(await present('#kid-opening-preview'), 'hiện bàn xem trước thế cờ mẫu hình')
check(
  await present('#kid-board-piece-wB-c4'),
  'bàn cờ hiện đúng thế cờ cuối Ván cờ Ý (Tượng Trắng ở c4)',
)
check(await present('#kid-board-piece-wK-g1'), 'Vua Trắng đã nhập thành (đứng ở g1)')
check(!(await present('#kid-board-piece-wP-e2')), 'Tốt e2 đã tiến - không còn ở ô xuất phát')

check(await clickId('kid-opening-preview-start'), 'bấm “▶ Bắt đầu học từ đầu”')
await sleep(400)
check(!(await present('#kid-opening-preview')), 'thoát bàn xem trước')
check(
  (await present('#kid-board-piece-wP-e2')) && (await present('#kid-board-piece-wB-c1')),
  'bàn cờ trở về đúng thế cờ gốc (Tốt e2 + Tượng c1)',
)

console.log('\n▶ Bộ lọc khai cuộc theo nước mở đầu của bé')

const nodeCount = () => evaluate(`document.querySelectorAll('[data-level-id]').length`)
// Bản đồ chỉ bày 3 kiểu thông dụng nhất; các kiểu khác nằm trong khung “Tham khảo
// thêm” (mặc định đóng). Đếm riêng để chắc phần chính vẫn đúng 3 thẻ.
const mainCount = () =>
  evaluate(`document.querySelectorAll('[data-level-id]:not([data-opening-extra])').length`)
const clickOpenFilter = (move) =>
  evaluate(`
    (() => {
      const el = document.querySelector('[data-opening-move-filter="' + ${JSON.stringify(move)} + '"]')
      if (!el) return false
      el.click()
      return true
    })()
  `)

check(await present('#kid-opening-move-filter'), 'có hàng bộ lọc theo nước mở đầu')
check(await present('[data-opening-move-filter="all"]'), 'có chip “Tất cả”')
check(
  (await mainCount()) === 3,
  `bé cầm Trắng: bản đồ chỉ bày 3 kiểu thông dụng nhất (${await mainCount()})`,
)
check((await nodeCount()) === 5, `vẫn đủ 5 khai cuộc trong trang (${await nodeCount()})`)
check(
  await evaluate(
    `document.querySelector('[data-level-id="italian"]')?.getAttribute('aria-current') === 'true'`,
  ),
  'bài đang chọn mặc định đúng là bài số 1 (Ván cờ Ý)',
)
check(await present('#kid-opening-extras'), 'có nút “📚 Tham khảo thêm” cho các kiểu ít gặp')
check(
  await evaluate(`
    (() => {
      const extras = [...document.querySelectorAll('[data-opening-extra]')]
      return extras.length === 2 && extras.every((el) => !el.offsetParent)
    })()
  `),
  'phần tham khảo mặc định ĐÓNG (2 kiểu còn lại bị ẩn)',
)
check(
  await evaluate(`
    (() => {
      document.getElementById('kid-opening-extras')?.click()
      return true
    })()
  `),
  'bấm mở được khung tham khảo',
)
await sleep(350)
check(
  await evaluate(`
    (() => {
      const extras = [...document.querySelectorAll('[data-opening-extra]')]
      return extras.length === 2 && extras.every((el) => Boolean(el.offsetParent))
    })()
  `),
  'mở khung thì thấy 2 kiểu tham khảo',
)
await evaluate(`document.getElementById('kid-opening-extras')?.click()`)
await sleep(250)

check(await clickOpenFilter('e4'), 'bấm chip 1.e4')
await sleep(400)
const e4Count = await nodeCount()
check(e4Count === 2, `lọc 1.e4 gom đúng 2 bài (Ý + Tây Ban Nha) (${e4Count})`)

check(await clickOpenFilter('all'), 'bấm “Tất cả”')
await sleep(400)
const allCount = await nodeCount()
check(allCount === 5, `bỏ lọc hiện lại đủ 5 khai cuộc (${allCount})`)
check(
  (await mainCount()) === 3,
  `bỏ lọc thì bản đồ chính vẫn gọn 3 thẻ (${await mainCount()})`,
)

close()
finish('BROWSER OPENINGS-PATTERNS')
