/**
 * Kiểm tra khung toạ độ bàn cờ “biết nói”:
 *   1. Nhãn cột (a-h) ở mép dưới, nhãn hàng (1-8) ở mép trái, luôn đủ 8+8 và đúng thứ tự.
 *   2. Bàn cờ xoay cho quân Đen thì nhãn cũng đảo theo (h…a, 1…8) - không để bé đọc nhầm.
 *   3. Chạm vào quân nào thì bàn cờ **làm sáng đúng cột + hàng** của ô đó và hiện tên ô
 *      (ví dụ `e2`) - đây là phần giúp bé quen ký hiệu nhanh hơn.
 *   4. Khung toạ độ không cản thao tác (nằm trong bàn cờ, không làm trang tràn ngang).
 *
 * Chạy: node scripts/browser-coords-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}#coords`, {
  port: 9368,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra toạ độ bàn cờ.')
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

const navigate = async (path) => {
  const base = APP_URL.replace(/\/$/, '')
  await evaluate(`location.href = ${JSON.stringify(`${base}${path}`)}`)
  await waitFor('#kid-board-coords')
  await sleep(300)
}

/** Đọc thứ tự nhãn cột / hàng đang hiển thị. */
const labels = () =>
  evaluate(`
    (() => {
      const nodes = [...document.querySelectorAll('#kid-board-coords [data-coord]')]
      const value = (node) => node.dataset.coord
      // Cột: nhãn chữ; Hàng: nhãn số.
      const files = nodes.filter((n) => /[a-h]/.test(value(n))).map(value)
      const ranks = nodes.filter((n) => /[1-8]/.test(value(n))).map(value)
      return { files, ranks }
    })()
  `)

/** Các nhãn đang được làm sáng (có nền vàng). */
const activeLabels = () =>
  evaluate(`
    [...document.querySelectorAll('#kid-board-coords [data-coord]')]
      .filter((el) => el.className.includes('gold'))
      .map((el) => el.dataset.coord)
  `)

const readout = () =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-board-coord-readout')
      return el ? el.innerText.trim() : ''
    })()
  `)

const clickSquare = (square) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-board-square-' + ${JSON.stringify(square)})
      if (!el) return false
      el.click()
      return true
    })()
  `)

console.log('\n▶ Toạ độ bàn cờ (cột a-h, hàng 1-8)')

// --- 1. Bàn Trắng: đủ nhãn, đúng thứ tự.
await navigate('/')
check(await waitFor('#kid-board-coords'), 'có khung toạ độ trên bàn cờ')
const white = await labels()
check(white.files.join('') === 'abcdefgh', `cột trái→phải đúng thứ tự a…h (“${white.files.join('')}”)`)
check(white.ranks.join('') === '87654321', `hàng trên→dưới đúng thứ tự 8…1 (“${white.ranks.join('')}”)`)

// --- 2. Chạm quân e2 → sáng đúng cột e + hàng 2, hiện tên ô.
await clickSquare('e2')
await sleep(250)
check((await readout()) === 'e2', `chọn quân → hiện tên ô “e2” (nhận được “${await readout()}”)`)
const activeE2 = await activeLabels()
check(
  activeE2.includes('e') && activeE2.includes('2'),
  `chọn e2 → làm sáng cột e và hàng 2 (${JSON.stringify(activeE2)})`,
)
check(
  !activeE2.includes('a') && !activeE2.includes('5'),
  'không làm sáng nhầm cột/hàng khác',
)

// --- 3. Đổi sang quân khác thì nhãn sáng đổi theo ngay.
await clickSquare('d2')
await sleep(250)
check((await readout()) === 'd2', `chọn quân khác → đọc đúng ô mới “d2” (nhận được “${await readout()}”)`)
const activeD2 = await activeLabels()
check(
  activeD2.includes('d') && activeD2.includes('2') && !activeD2.includes('e'),
  `ô sáng đổi theo quân mới (${JSON.stringify(activeD2)})`,
)

// --- 4. Bàn Đen: nhãn phải xoay 180° theo.
await navigate('/free-play')
check(await waitFor('#kid-board-coords'), 'trang Đấu tập tự do cũng có khung toạ độ')
const beforeFlip = await activeLabels()
check(beforeFlip.length === 0, 'chưa chọn quân thì chưa nhãn nào sáng (bàn cờ để bé yên)')

const flipped = await evaluate(`
  (() => {
    const tab = [...document.querySelectorAll('[role="tab"]')].find((el) =>
      el.textContent.includes('Đen'),
    )
    if (!tab) return false
    tab.click()
    return true
  })()
`)
check(flipped, 'chọn được “bé cầm quân Đen” ở trang Đấu tập tự do')
await sleep(400)
const black = await labels()
check(
  black.files.join('') === 'hgfedcba',
  `bàn xoay cho Đen → cột đảo thành h…a (“${black.files.join('')}”)`,
)
check(
  black.ranks.join('') === '12345678',
  `bàn xoay cho Đen → hàng đảo thành 1…8 (“${black.ranks.join('')}”)`,
)

// --- 5. Khung toạ độ nằm gọn trong bàn cờ, không phá bố cục.
const fits = await evaluate(`
  (() => {
    const coords = document.getElementById('kid-board-coords')
    const board = coords ? coords.parentElement : null
    if (!coords || !board) return null
    const c = coords.getBoundingClientRect()
    const b = board.getBoundingClientRect()
    return {
      insideLeft: c.left >= b.left - 2,
      insideRight: c.right <= b.right + 2,
      insideTop: c.top >= b.top - 2,
      insideBottom: c.bottom <= b.bottom + 2,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    }
  })()
`)
if (fits) {
  check(
    fits.insideLeft && fits.insideRight && fits.insideTop && fits.insideBottom,
    'khung toạ độ nằm trọn bên trong bàn cờ',
  )
  check(
    fits.scrollW <= fits.innerW + 2,
    `khung toạ độ không làm trang tràn ngang (${fits.scrollW} ≤ ${fits.innerW}px)`,
  )
} else {
  check(false, 'đọc được vị trí khung toạ độ')
}

close()
finish('TOẠ ĐỘ BÀN CỜ')
