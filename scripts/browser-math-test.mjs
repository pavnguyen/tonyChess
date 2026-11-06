/**
 * Kiểm tra "cửa toán":
 *   1. Vào Đấu Máy / Soi quân là cửa toán mở sẵn, ô nhập tự lấy nét, bàn phím số.
 *   2. Trả lời sai → báo đỏ, cửa vẫn mở; bấm ra ngoài không đóng được.
 *   3. KHÔNG hỏi mỗi nước: nước đầu tiên đi luôn, cửa chỉ mở lại sau 2–3 nước.
 *   4. Cửa mở thì nước cờ bị giữ lại, giải đúng mới được đi.
 *   5. Trên khung 390×844 thẻ toán nằm gọn trong màn hình, không tràn ngang.
 *
 * Chạy: node scripts/browser-math-test.mjs (cần dev/preview server)
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'
import { solveEquation, solveMathGate } from './lib/mathGate.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}/free-play#math-gate`,
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

const gateOpen = () => evaluate(`Boolean(document.getElementById('kid-math-gate'))`)

const square = (name) =>
  evaluate(`(() => {
    const el = document.getElementById('kid-board-square-${name}')
    if (!el) return false
    el.click()
    return true
  })()`)

const clickButtonText = (pattern) =>
  evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => ${pattern}.test(b.innerText || ''))
    if (!btn) return false
    btn.click()
    return true
  })()`)

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

/** Chờ tới lượt bé (máy đang nghĩ thì đừng cố đi). */
const waitTurn = async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (String(await bodyText()).includes('Lượt của bé')) return true
    await sleep(200)
  }
  return false
}

await sleep(2500)

// Bàn cờ có thể mặc định cho bé cầm Đen; chọn Trắng để chắc chắn tới lượt bé.
// Đổi bên dựng lại bàn cờ nên cửa toán mở lại với phép mới.
await clickButtonText('/Trắng/')
await sleep(1000)

console.log('\n▶ Vào Đấu Máy là cửa toán mở sẵn')

check(await waitFor('#kid-math-gate'), 'cửa toán mở ngay khi vào Đấu Máy')

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
check(await gateOpen(), 'bấm ra ngoài thẻ không đóng được cửa toán')

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
check(await gateOpen(), 'cửa toán vẫn mở sau câu trả lời sai')
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
check(await gateOpen(), 'cửa toán vẫn mở sau khi đổi sang khung điện thoại')

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

console.log('\n▶ Giải đúng → cửa đóng ngay')

check(await solveMathGate(evaluate), 'gõ đáp án đúng thì cửa toán đóng ngay')
check(!(await gateOpen()), 'cửa toán đóng sau khi giải')

console.log('\n▶ Nước đầu tiên đi luôn, không hỏi toán')

await waitTurn()
await square('d2')
await sleep(180)
await square('d4')
await sleep(900)
check(!(await gateOpen()), 'nước đầu tiên KHÔNG mở cửa toán')
check(await hasPiece('wP', 'd4'), 'quân Tốt đã đi tới d4 ngay, không bị giữ lại')

console.log('\n▶ Cứ 2–3 nước bé mới phải giải toán một lần')

// Nước 1 (d4) đã đi. Thử các nước an toàn; nước nào đi được thì tính, tới nước
// thứ 2 hoặc thứ 3 thì cửa toán phải mở và giữ nước đó lại.
let movesDone = 1
let gated = null
for (const [piece, from, to] of [
  ['wP', 'e2', 'e3'],
  ['wN', 'g1', 'f3'],
  ['wP', 'a2', 'a3'],
  ['wN', 'b1', 'c3'],
  ['wP', 'h2', 'h3'],
]) {
  if (gated) break
  await waitTurn()
  await square(from)
  await sleep(180)
  await square(to)
  await sleep(800)
  if (await gateOpen()) {
    gated = { piece, from, to, number: movesDone + 1 }
    break
  }
  if (await hasPiece(piece, to)) movesDone += 1
}

check(Boolean(gated), 'cửa toán mở lại sau vài nước')
check(
  Boolean(gated) && gated.number >= 2 && gated.number <= 3,
  `cửa mở đúng sau 2–3 nước (mở ở nước thứ ${gated?.number})`,
)

if (gated) {
  check(
    await hasPiece(gated.piece, gated.from),
    'cửa mở thì nước cờ bị giữ lại, quân chưa rời ô cũ',
  )
  check(await solveMathGate(evaluate), 'giải đúng cửa toán đang giữ nước cờ')
  // Nước treo quân có thể bị HLV hỏi lại; các nước ở trên đều an toàn nên hiếm khi có.
  await clickButtonText('/Vẫn đi/')
  await sleep(900)
  check(await hasPiece(gated.piece, gated.to), `quân đã đi tới ${gated.to} sau khi giải`)
}

console.log('\n▶ Vào Soi quân cũng mở cửa toán ngay')

await evaluate(`location.href = ${JSON.stringify(`${APP_URL}/hazards#math-gate-entry`)}`)
await sleep(2500)
check(await waitFor('#kid-math-gate'), 'vào Soi quân là cửa toán mở ngay')
check(await solveMathGate(evaluate), 'giải xong cửa toán ở Soi quân')
check(!(await gateOpen()), 'cửa toán đóng sau khi giải ở Soi quân')

console.log('\n▶ Ba mẹ tạm tắt / bật lại cửa toán trong Tùy chọn của bé')

const mathTogglePressed = () =>
  evaluate(`document.getElementById('kid-math-toggle')?.getAttribute('aria-pressed') ?? null`)
const clickOptionsButton = () =>
  evaluate(`(() => {
    const button = document.querySelector('button[aria-label="Tùy chọn của bé"]')
    if (!button) return false
    button.click()
    return true
  })()`)
const clickMathToggle = () =>
  evaluate(`(() => {
    const button = document.getElementById('kid-math-toggle')
    if (!button) return false
    button.click()
    return true
  })()`)
const reload = async () => {
  await evaluate(`location.reload()`)
  await sleep(2600)
}

check(await clickOptionsButton(), 'mở bảng ⚙️ Tùy chọn của bé')
await sleep(250)
check((await mathTogglePressed()) === 'true', 'Tùy chọn có mục 🧮 hỏi toán, mặc định BẬT')

check(await clickMathToggle(), 'bấm tắt cửa toán trong Tùy chọn')
await sleep(250)
check((await mathTogglePressed()) === 'false', 'mục 🧮 chuyển sang TẮT')
await clickOptionsButton()
await sleep(250)

// Tắt rồi thì vào lại trang cũng không bị hỏi toán, và trạng thái được nhớ.
await reload()
check(!(await gateOpen()), 'tắt rồi thì vào lại trang không bị hỏi toán')
await clickOptionsButton()
await sleep(250)
check((await mathTogglePressed()) === 'false', 'trạng thái TẮT được nhớ sau khi tải lại')

// Bật lại: cửa toán mở lại như cũ.
check(await clickMathToggle(), 'bấm bật lại cửa toán trong Tùy chọn')
await sleep(250)
check((await mathTogglePressed()) === 'true', 'mục 🧮 chuyển lại BẬT')
await clickOptionsButton()
await sleep(250)
await reload()
check(await waitFor('#kid-math-gate'), 'bật lại thì cửa toán mở lại khi vào trang')

console.log('\n▶ Hôm sau cửa toán tự bật lại')

// Giả lập ba mẹ tắt từ hôm qua: ghi ngày cũ vào bộ nhớ của app rồi mở lại trang.
await evaluate(`(() => {
  const key = 'hoc-vien-co-vua-nhi.v1'
  const raw = JSON.parse(localStorage.getItem(key) || '{}')
  raw.mathGateOffOn = '2020-01-01'
  localStorage.setItem(key, JSON.stringify(raw))
})()`)
await reload()
check(await waitFor('#kid-math-gate'), 'hôm sau vào trang là cửa toán mở lại')
check(
  (await evaluate(
    `JSON.parse(localStorage.getItem('hoc-vien-co-vua-nhi.v1') || '{}').mathGateOffOn ?? null`,
  )) === null,
  'ngày tắt cũ được tự xoá khi đã qua ngày mới',
)

close()
finish('BROWSER MATH')
