/**
 * Kiểm tra khung toạ độ bàn cờ “biết nói”:
 *   1. Nhãn cột (a-h) ở CẢ mép trên và mép dưới, nhãn hàng (1-8) ở CẢ mép trái và mép
 *      phải - đúng 8 nhãn mỗi mép và đúng thứ tự (bé dò ngang hay dọc đều có mốc).
 *   2. Bàn cờ xoay cho quân Đen thì nhãn cũng đảo theo (h…a, 1…8) - không để bé đọc nhầm.
 *   3. Chạm vào quân nào thì bàn cờ **làm sáng đúng cột + hàng** của ô đó ở CẢ BỐN mép
 *      và hiện tên ô (ví dụ `e2`) - đây là phần giúp bé quen ký hiệu nhanh hơn.
 *   4. Phát âm bằng Web Speech API: chạm ô đọc “E 2”, nước mới hiện đọc tên nước (giọng Mỹ).
 *   5. Khung toạ độ không cản thao tác (nằm trong bàn cờ, không làm trang tràn ngang).
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

/** Đọc thứ tự nhãn theo từng mép bàn cờ: { top, bottom, left, right }. */
const labels = () =>
  evaluate(`
    (() => {
      const out = {}
      for (const node of document.querySelectorAll('#kid-board-coords [data-coord]')) {
        const side = node.dataset.coordSide
        if (!side) continue
        ;(out[side] = out[side] || []).push(node.dataset.coord)
      }
      return out
    })()
  `)

/** Các nhãn đang được làm sáng (có nền vàng), gộp theo mép. */
const activeLabels = () =>
  evaluate(`
    (() => {
      const out = {}
      for (const node of document.querySelectorAll('#kid-board-coords [data-coord]')) {
        if (!node.className.includes('gold')) continue
        const side = node.dataset.coordSide
        ;(out[side] = out[side] || []).push(node.dataset.coord)
      }
      return out
    })()
  `)

const join = (list) => (Array.isArray(list) ? list.join('') : '')

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

/** Tên ô ở góc trên-phải từng ô (a8, e4…), theo đúng thứ tự từ trên-trái xuống. */
const squareLabels = () =>
  evaluate(`
    [...document.querySelectorAll('#kid-board-square-coords [data-square-coord]')].map(
      (el) => el.dataset.squareCoord,
    )
  `)

console.log('\n▶ Toạ độ bàn cờ (cột a-h, hàng 1-8)')

// --- 1. Bàn Trắng: đủ nhãn, đúng thứ tự.
await navigate('/')
check(await waitFor('#kid-board-coords'), 'có khung toạ độ trên bàn cờ')
const white = await labels()
check(
  join(white.top) === 'abcdefgh' && join(white.bottom) === 'abcdefgh',
  `cột hiện ở CẢ mép trên và mép dưới, đúng thứ tự a…h (trên “${join(white.top)}”, dưới “${join(white.bottom)}”)`,
)
check(
  join(white.left) === '87654321' && join(white.right) === '87654321',
  `hàng hiện ở CẢ mép trái và mép phải, đúng thứ tự 8…1 (trái “${join(white.left)}”, phải “${join(white.right)}”)`,
)

// --- 1b. Mỗi ô có tên toạ độ ở góc trên-phải (a1, e4…) để bé liếc là biết.
const whiteSquares = await squareLabels()
check(whiteSquares.length === 64, `mỗi ô đều có tên toạ độ ở góc (${whiteSquares.length}/64)`)
check(
  whiteSquares[0] === 'a8' && whiteSquares[7] === 'h8' && whiteSquares[63] === 'h1',
  `tên ô đúng thứ tự bàn Trắng (đầu “${whiteSquares[0]}”, cuối “${whiteSquares[63]}”)`,
)
check(whiteSquares.includes('e4') && whiteSquares.includes('a1'), 'có đủ tên ô như e4 và a1')

// --- 2. Chạm quân e2 → sáng đúng cột e + hàng 2 ở CẢ HAI phía, hiện tên ô.
await clickSquare('e2')
await sleep(250)
check((await readout()) === 'e2', `chọn quân → hiện tên ô “e2” (nhận được “${await readout()}”)`)

// Ô đọc tên phải nằm DƯỚI dải toạ độ - không được che nhãn cột a-h (lỗi cũ: nổi
// phía trên khung nên đè lên dải nhãn, và có thể bị thanh tiêu đề che mất).
const readoutGeom = await evaluate(`(() => {
  const ro = document.getElementById('kid-board-coord-readout')?.getBoundingClientRect()
  const strip = document.querySelector('[data-coord-edge="top"]')?.getBoundingClientRect()
  if (!ro || !strip) return null
  return { top: Math.round(ro.top), stripBottom: Math.round(strip.bottom), covers: ro.top < strip.bottom }
})()`)
check(
  readoutGeom && readoutGeom.covers === false,
  `ô đọc tên nằm DƯỚI dải toạ độ, không che nhãn (${JSON.stringify(readoutGeom)})`,
)

const activeE2 = await activeLabels()
check(
  activeE2.top?.includes('e') &&
    activeE2.bottom?.includes('e') &&
    activeE2.left?.includes('2') &&
    activeE2.right?.includes('2'),
  `chọn e2 → cột e và hàng 2 sáng ở CẢ BỐN mép (${JSON.stringify(activeE2)})`,
)
check(
  !activeE2.top?.includes('a') && !activeE2.left?.includes('5'),
  'không làm sáng nhầm cột/hàng khác',
)

// --- 3. Đổi sang quân khác thì nhãn sáng đổi theo ngay.
await clickSquare('d2')
await sleep(250)
check((await readout()) === 'd2', `chọn quân khác → đọc đúng ô mới “d2” (nhận được “${await readout()}”)`)
const activeD2 = await activeLabels()
check(
  activeD2.bottom?.includes('d') &&
    activeD2.right?.includes('2') &&
    !activeD2.bottom?.includes('e'),
  `ô sáng đổi theo quân mới (${JSON.stringify(activeD2)})`,
)

// --- 3b. Phát âm: chạm ô đọc tên ô, nước đi mới hiện đọc tên nước (giọng Mỹ).
const speechReady = await evaluate(
  `(() => {
    if (!window.speechSynthesis) return false
    window.__spoken = []
    window.speechSynthesis.speak = (utterance) => { window.__spoken.push(utterance.text) }
    window.speechSynthesis.cancel = () => {}
    return true
  })()`,
)
if (!speechReady) {
  console.log('  ℹ Trình duyệt không có speechSynthesis - bỏ qua bài kiểm phát âm')
} else {
  await clickSquare('e2')
  await sleep(200)
  const spokenAfterTouch = await evaluate(`window.__spoken.slice()`)
  check(
    spokenAfterTouch.some((text) => text.includes('E 2')),
    `chạm ô e2 → bàn cờ đọc kèm tên ô “E 2” (đã đọc: ${JSON.stringify(spokenAfterTouch)})`,
  )
  check(
    spokenAfterTouch.some((text) => /^Pawn\b/.test(text)),
    `chọn quân e2 → đọc TÊN QUÂN tiếng Anh “Pawn” (đã đọc: ${JSON.stringify(spokenAfterTouch)})`,
  )

  // Chọn Mã → phải đọc "Knight" kèm ô, cho bé quen tên quân tiếng Anh.
  await evaluate(`window.__spoken = []`)
  await clickSquare('g1')
  await sleep(200)
  const spokenKnight = await evaluate(`window.__spoken.slice()`)
  check(
    spokenKnight.some((text) => /^Knight\b/.test(text)),
    `chọn quân g1 → đọc “Knight G 1” (đã đọc: ${JSON.stringify(spokenKnight)})`,
  )

  // Bấm “Tiến” để nước mới hiện ra → phải đọc tên nước theo giọng Mỹ.
  await evaluate(`
    (() => {
      window.__spoken = []
      const button = [...document.querySelectorAll('button')].find((b) =>
        b.textContent.includes('Tiến'),
      )
      if (button) button.click()
      return Boolean(button)
    })()
  `)
  await sleep(600)
  const spokenMove = await evaluate(`window.__spoken.slice()`)
  check(
    spokenMove.some((text) => /^(Pawn|Knight|Bishop|Rook|Queen|King)\b/.test(text)),
    `nước mới hiện ra → đọc tên nước theo giọng Mỹ (đã đọc: ${JSON.stringify(spokenMove)})`,
  )

  // Ngoài lượt bé (đang xem đối thủ đi) thì bàn cờ VẪN đọc khi bé chạm quân - đây
  // chính là lúc bé hay ngồi xem nên trước đây không nghe được gì.
  await evaluate(`window.__spoken = []`)
  await clickSquare('d7')
  await sleep(200)
  const spokenWatching = await evaluate(`window.__spoken.slice()`)
  check(
    spokenWatching.some((text) => /^Pawn\b/.test(text) && text.includes('D 7')),
    `ngoài lượt bé vẫn đọc tên quân địch khi chạm ô d7 (đã đọc: ${JSON.stringify(spokenWatching)})`,
  )
}

// --- 4. Bàn Đen: nhãn phải xoay 180° theo.
await navigate('/free-play')
check(await waitFor('#kid-board-coords'), 'trang Đấu tập tự do cũng có khung toạ độ')
const beforeFlip = await activeLabels()
check(Object.keys(beforeFlip).length === 0, 'chưa chọn quân thì chưa nhãn nào sáng (bàn cờ để bé yên)')

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
  join(black.top) === 'hgfedcba' && join(black.bottom) === 'hgfedcba',
  `bàn xoay cho Đen → cột đảo thành h…a ở cả hai mép ngang (“${join(black.top)}” / “${join(black.bottom)}”)`,
)
check(
  join(black.left) === '12345678' && join(black.right) === '12345678',
  `bàn xoay cho Đen → hàng đảo thành 1…8 ở cả hai mép dọc (“${join(black.left)}” / “${join(black.right)}”)`,
)
const blackSquares = await squareLabels()
check(
  blackSquares[0] === 'h1' && blackSquares[63] === 'a8',
  `bàn xoay cho Đen → tên ô cũng đảo theo (đầu “${blackSquares[0]}”, cuối “${blackSquares[63]}”)`,
)

// --- 5b. Bốn mép đều có nhãn đủ 8 ô (không mép nào bị thiếu).
const edgeCounts = await evaluate(`
  (() => {
    const out = {}
    for (const node of document.querySelectorAll('#kid-board-coords [data-coord]')) {
      const side = node.dataset.coordSide
      if (side) out[side] = (out[side] || 0) + 1
    }
    return out
  })()
`)
check(
  edgeCounts.top === 8 && edgeCounts.bottom === 8 && edgeCounts.left === 8 && edgeCounts.right === 8,
  `mỗi mép đúng 8 nhãn (${JSON.stringify(edgeCounts)})`,
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
