/**
 * Kiểm tra "cửa toán" trước mỗi nước cờ ở tab Học/Luyện:
 *   1. Bé kéo một nước → nước cờ CHƯA được đi, cửa toán mở với ô nhập tự lấy nét.
 *   2. Ô nhập dùng bàn phím số trên điện thoại (`inputMode="numeric"`).
 *   3. Trả lời sai → báo đỏ, cửa vẫn mở, bé thử lại; bấm ra ngoài không đóng được.
 *   4. Trả lời đúng → cửa đóng và nước cờ vừa kéo được đi tiếp.
 *   5. Trên khung 390×844 thẻ toán nằm gọn trong màn hình, không tràn ngang.
 *
 * Chạy: node scripts/browser-math-test.mjs (cần dev/preview server)
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'
import { solveEquation, solveMathGate } from './lib/mathGate.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}/?opening=london#math-gate`,
  { port: 9397, windowSize: '1440,900' },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra cửa toán.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const waitFor = async (selector, timeoutMs = 6000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(120)
  }
  return false
}

const hasPiece = (piece, square) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${piece}-${square}'))`)

const bodyText = () => evaluate(`document.body.innerText`)

const rectOf = (square) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-board-square-${square}')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }
    })()
  `)

const mouse = (type, x, y, extra = {}) =>
  send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, ...extra })

const dragPiece = async (from, to) => {
  const a = await rectOf(from)
  const b = await rectOf(to)
  if (!a || !b) return false
  await mouse('mousePressed', a.x, a.y, { buttons: 1 })
  await sleep(80)
  for (let step = 1; step <= 6; step += 1) {
    await mouse('mouseMoved', a.x + ((b.x - a.x) * step) / 6, a.y + ((b.y - a.y) * step) / 6, {
      buttons: 1,
    })
    await sleep(60)
  }
  await mouse('mouseReleased', b.x, b.y, { buttons: 0 })
  return true
}

const setInput = (value) =>
  evaluate(`(() => {
    const input = document.getElementById('kid-math-input')
    if (!input) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, ${JSON.stringify(String(value))})
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)

const clickSubmit = () =>
  evaluate(`(() => {
    const button = document.getElementById('kid-math-submit')
    if (!button || button.disabled) return false
    button.click()
    return true
  })()`)

await sleep(2500)

console.log('\n▶ Kéo một nước → cửa toán mở, nước cờ chưa được đi')

check(await dragPiece('d2', 'd4'), 'đã kéo quân Tốt d2 → d4')
check(await waitFor('#kid-math-gate'), 'cửa toán mở ra')
check(await hasPiece('wP', 'd2'), 'quân Tốt vẫn ở d2 - nước cờ CHƯA được đi')
check(!(await hasPiece('wP', 'd4')), 'ô d4 còn trống khi chưa giải toán')

const equation = String(
  await evaluate(`document.getElementById('kid-math-gate')?.dataset.equation ?? ''`),
).trim()
check(equation.includes('x'), `cửa toán hiện phép tính có ô trống (${equation})`)

await sleep(200)
const focus = await evaluate(`document.activeElement?.id ?? ''`)
check(focus === 'kid-math-input', 'ô đáp án tự lấy nét, bé gõ được ngay')

const attrs = await evaluate(`(() => {
  const input = document.getElementById('kid-math-input')
  return input ? { mode: input.inputMode, pattern: input.getAttribute('pattern') } : null
})()`)
check(
  attrs?.mode === 'numeric' && attrs?.pattern === '[0-9]*',
  `ô nhập mở bàn phím số trên điện thoại (inputMode=${attrs?.mode}, pattern=${attrs?.pattern})`,
)

console.log('\n▶ Sai thì cửa vẫn đóng chặt, bé thử lại')

await evaluate(`document.getElementById('kid-math-gate').click()`)
await sleep(200)
check(
  await evaluate(`Boolean(document.getElementById('kid-math-gate'))`),
  'bấm ra ngoài thẻ không đóng được cửa toán',
)

const answer = solveEquation(equation)
check(answer !== null, `giải được phép tính (${equation} → ${answer})`)
const wrong = answer === 99 ? 98 : 99
check(await setInput(wrong), `gõ đáp án sai (${wrong})`)
await sleep(100)
check(await clickSubmit(), 'bấm Đồng ý với đáp án sai')
await sleep(350)
check(
  String(await bodyText()).includes('Chưa đúng'),
  'hiện lời nhắc “Chưa đúng rồi, bé thử lại nhé!”',
)
check(
  await evaluate(`Boolean(document.getElementById('kid-math-gate'))`),
  'cửa toán vẫn mở sau câu trả lời sai',
)
check(
  (await evaluate(`document.getElementById('kid-math-input')?.value ?? ''`)) === '',
  'ô đáp án được xoá để bé gõ lại',
)

console.log('\n▶ Trên điện thoại 390×844 thẻ toán nằm gọn màn hình')

// Đổi khung ngay khi cửa toán còn mở: đo đúng thẻ đang dùng, không phải mở lại trang.
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: false,
})
await sleep(300)
check(
  await evaluate(`Boolean(document.getElementById('kid-math-gate'))`),
  'cửa toán vẫn mở sau khi đổi sang khung điện thoại',
)

const layout = await evaluate(`(() => {
  const gate = document.getElementById('kid-math-gate')
  const card = gate?.firstElementChild
  const input = document.getElementById('kid-math-input')
  if (!card || !input) return null
  const rect = card.getBoundingClientRect()
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    innerW: innerWidth,
    innerH: innerHeight,
    scrollW: document.documentElement.scrollWidth,
    focused: document.activeElement === input,
  }
})()`)
check(Boolean(layout), 'đọc được vị trí thẻ toán')
check(
  Boolean(layout) && layout.left >= 0 && layout.right <= layout.innerW,
  `thẻ toán nằm trong bề ngang màn hình (${layout?.left?.toFixed?.(0)}…${layout?.right?.toFixed?.(0)} ≤ ${layout?.innerW})`,
)
check(
  Boolean(layout) && layout.bottom <= layout.innerH,
  `thẻ toán không bị tràn xuống dưới (${layout?.bottom?.toFixed?.(0)} ≤ ${layout?.innerH})`,
)
check(
  Boolean(layout) && layout.scrollW <= layout.innerW + 1,
  `trang không tràn ngang (${layout?.scrollW} ≤ ${layout?.innerW}px)`,
)
check(Boolean(layout?.focused), 'ô đáp án vẫn tự lấy nét trên điện thoại')

console.log('\n▶ Giải đúng → nước cờ vừa kéo được đi')

check(await solveMathGate(evaluate), 'gõ đáp án đúng thì cửa toán đóng ngay')
await sleep(1300)
check(await hasPiece('wP', 'd4'), 'quân Tốt đã đi tới d4 sau khi giải đúng')

console.log('\n▶ Vào Chơi (Đấu Máy / Soi quân) cũng mở cửa toán ngay')

for (const [path, label] of [['/free-play', 'Đấu Máy'], ['/hazards', 'Soi quân']]) {
  await evaluate(`location.href = ${JSON.stringify(`${APP_URL}${path}#math-gate-entry`)}`)
  await sleep(2500)
  check(await waitFor('#kid-math-gate'), `vào ${label} là cửa toán mở ngay`)
  check(await solveMathGate(evaluate), `giải xong cửa toán ở ${label}`)
  check(
    !(await evaluate(`Boolean(document.getElementById('kid-math-gate'))`)),
    `cửa toán đóng sau khi giải ở ${label}`,
  )
}

close()
finish('BROWSER MATH')
