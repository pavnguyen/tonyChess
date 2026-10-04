/**
 * Kiểm tra khung “Gợi ý cho ba mẹ” (§10) trong trình duyệt thật:
 *   1. Hiện ở MỌI tab (5 tab), mặc định MỞ, có 1-2 câu hỏi đúng bài bé đang học.
 *   2. Đổi bài (khai cuộc / bài giảng) thì câu hỏi đổi theo - không phải câu chung.
 *   3. Thu gọn được: khi thu chỉ còn MỘT nút nhỏ, trạng thái nhớ trong `localStorage`
 *      và sống qua lần tải lại trang.
 *   4. Khung KHÔNG có điểm số/Elo, và không còn chọn lứa tuổi / năm sinh (đã gỡ).
 *   5. Khung KHÔNG phá bố cục “không cuộn”: không tràn ngang ở điện thoại 390px và
 *      không làm trang cao thêm ở màn hình máy tính.
 *
 * Chạy: node scripts/browser-parent-tips-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'
const STORAGE_KEY = 'hoc-vien-co-vua-nhi.parent-tips.v1'

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}#parent-tips`,
  { port: 9365, windowSize: '1440,900' },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra khung gợi ý cho ba mẹ.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

/** Chờ một phần tử xuất hiện (trang tải lại khi đổi tab nên phải chờ). */
const waitFor = async (id, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    let ready = false
    try {
      ready = await evaluate(`Boolean(document.getElementById(${JSON.stringify(id)}))`)
    } catch {
      /* trang đang chuyển hướng */
    }
    if (ready) return true
    await sleep(150)
  }
  return false
}

const exists = (id) => evaluate(`Boolean(document.getElementById(${JSON.stringify(id)}))`)

const bodyText = () =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-parent-tips-body')
      return el ? el.innerText : ''
    })()
  `)

/**
 * Chờ tới khi khung hiện câu hỏi chứa `text`.
 *
 * Cần thiết vì trang bài học được tải LƯỜI: ngay sau khi tải lại, khung đã hiện
 * với câu hỏi chung của tab, rồi vài trăm ms sau trang mới “báo lên” bài đang mở
 * và khung đổi sang câu hỏi riêng. Đọc ngay lập tức sẽ bắt được trạng thái cũ.
 */
const waitForText = async (text, timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const current = String(await bodyText())
    if (current.includes(text)) return true
    await sleep(150)
  }
  return false
}

const questions = () =>
  evaluate(`
    [...document.querySelectorAll('#kid-parent-tips-body ul li')].map((li) => li.innerText)
  `)

const layout = () =>
  evaluate(`
    (() => {
      const de = document.documentElement
      const frame = document.getElementById('kid-parent-tips')
      const toggle = document.getElementById('kid-parent-tips-toggle')
      const body = document.getElementById('kid-parent-tips-body')
      const rectOf = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
      }
      return {
        scrollW: de.scrollWidth,
        scrollH: de.scrollHeight,
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        frame: rectOf(frame),
        toggle: rectOf(toggle),
        body: rectOf(body),
      }
    })()
  `)

const navigate = async (path) => {
  const base = APP_URL.replace(/\/$/, '')
  await evaluate(`location.href = ${JSON.stringify(`${base}${path}`)}`)
  await waitFor('kid-parent-tips-toggle')
  // Nhịp ngắn để tên bài + số liệu render xong.
  await sleep(350)
}

const clickId = (id) =>
  evaluate(`
    (() => {
      const el = document.getElementById(${JSON.stringify(id)})
      if (!el) return false
      el.click()
      return true
    })()
  `)

/** Bấm một nút theo nhãn chứa `text` (dùng cho dải chọn bài giảng). */
const clickButtonWithText = (text, selector = 'body') =>
  evaluate(`
    (() => {
      const button = [...document.querySelectorAll(${JSON.stringify(selector)} + ' button')].find((b) =>
        b.textContent.includes(${JSON.stringify(text)}),
      )
      if (!button) return 'not-found'
      button.click()
      return button.textContent.trim()
    })()
  `)

console.log('\n▶ Khung “Gợi ý cho ba mẹ” (§10)')

// Bắt đầu từ trang sạch: bài kiểm tra chạy lại nhiều lần nên trạng thái thu/mở cũ
// còn nằm trong localStorage của hồ sơ Chrome này.
await evaluate(`localStorage.removeItem(${JSON.stringify(STORAGE_KEY)})`)
await evaluate('location.reload()')
await waitFor('kid-parent-tips-toggle')
await waitFor('kid-parent-tips-body')

// --- 1. Mặc định mở, có câu hỏi đúng bài đang học (London ở tab Khai cuộc).
check(await exists('kid-parent-tips'), 'khung hiện ở tab Khai cuộc')
check(
  await exists('kid-parent-tips-body'),
  'lần đầu mở app thì khung MỞ sẵn (ba mẹ thấy ngay, không phải đi tìm)',
)
// Nhãn nào có CSS `uppercase` thì `innerText` trả về chữ HOA.
check(
  String(await bodyText()).includes('GỢI Ý CHO BA MẸ'),
  'khung có tiêu đề “Gợi ý cho ba mẹ”',
)
check(
  await waitForText('Tượng ra f4'),
  'câu hỏi là câu RIÊNG của bài London (không phải câu chung của tab)',
)
const firstText = String(await bodyText())
check(
  !firstText.includes('Kim tự tháp Tốt'),
  'câu hỏi chung của tab đã nhường chỗ cho câu hỏi riêng của bài',
)
const firstQuestions = await questions()
check(
  firstQuestions.length >= 1 && firstQuestions.length <= 2,
  `khung hiện 1-2 câu hỏi cho ba mẹ (${firstQuestions.length})`,
)

// --- 2. Khối 🔒 của ba mẹ: chỉ còn việc chọn lứa tuổi. KHÔNG có điểm số.
const frameText = String(await bodyText())
check(!/Elo|Điểm từng dạng đòn/.test(frameText), 'khung KHÔNG còn điểm số/Elo (app học cờ, không hơn thua)')
check(
  !(await exists('kid-parent-tips-elo')),
  'không còn ô Elo trong khung ba mẹ',
)
check(
  (await evaluate(`document.querySelectorAll('#kid-parent-tips-body [aria-pressed]').length`)) === 0,
  'khung ba mẹ không còn nút chọn giai đoạn tuổi',
)
check(!(await exists('kid-parent-birth-year')), 'không còn ô nhập năm sinh của bé')

// --- 3. Thu gọn → chỉ còn một nút nhỏ, trạng thái nhớ lại.
await clickId('kid-parent-tips-toggle')
await sleep(250)
check(!(await exists('kid-parent-tips-body')), 'bấm ▾ thì khung thu gọn (không còn nội dung)')
const collapsed = await layout()
check(
  collapsed.toggle.width <= 220 && collapsed.toggle.height <= 48,
  `khi thu gọn chỉ còn một nút nhỏ (${Math.round(collapsed.toggle.width)}×${Math.round(collapsed.toggle.height)}px)`,
)
check(
  collapsed.frame.width <= 230 && collapsed.frame.height <= 60,
  'khối thu gọn chiếm rất ít chỗ trên màn hình',
)
const stored = await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEY)})`)
check(stored === 'closed', `trạng thái thu gọn được nhớ trong localStorage (“${stored}”)`)

await evaluate('location.reload()')
await waitFor('kid-parent-tips-toggle')
await sleep(350)
check(
  !(await exists('kid-parent-tips-body')),
  'tải lại trang thì khung vẫn thu gọn như ba mẹ đã để',
)

await clickId('kid-parent-tips-toggle')
await sleep(250)
check(await exists('kid-parent-tips-body'), 'bấm ▸ thì khung mở lại')
check(
  (await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEY)})`)) === 'open',
  'trạng thái mở cũng được nhớ',
)

// --- 4. Không phá bố cục “không cuộn” khi khung đang MỞ.
const desktop = await layout()
check(
  desktop.scrollW <= desktop.innerW + 2,
  `máy tính 1440×900: khung mở mà không tràn ngang (${desktop.scrollW} ≤ ${desktop.innerW}px)`,
)
check(
  desktop.scrollH <= desktop.innerH + 2,
  `máy tính 1440×900: khung mở mà trang không cao thêm (${desktop.scrollH} ≤ ${desktop.innerH}px)`,
)
if (desktop.body) {
  check(
    desktop.body.bottom <= desktop.innerH + 2 && desktop.body.right <= desktop.innerW + 2,
    'khung mở nằm trọn trong màn hình',
  )
}

await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: false,
})
await navigate('/')
const phone = await layout()
check(
  phone.scrollW <= phone.innerW + 2,
  `điện thoại 390×844: khung mở mà không tràn ngang (${phone.scrollW} ≤ ${phone.innerW}px)`,
)
if (phone.body) {
  check(
    phone.body.left >= -2 && phone.body.right <= phone.innerW + 2,
    `khung mở nằm gọn bề ngang màn hình (${Math.round(phone.body.width)}px)`,
  )
}

// --- 5. Hiện ở MỌI tab, câu hỏi đổi theo tab.
// Hai tab đầu/cuối có bài học riêng nên khung hiện câu hỏi CỦA BÀI đang mở,
// không phải câu chung của tab - đó chính là điều cần kiểm.
const ROUTES = [
  { path: '/', name: 'Khai cuộc', keyword: 'Tượng ra f4', notKeyword: 'Kim tự tháp Tốt' },
  { path: '/counters', name: 'Đối phó', keyword: 'đang chơi khai cuộc gì' },
  { path: '/tactics', name: 'Trung cuộc', keyword: 'mạnh nhất' },
  { path: '/endgames', name: 'Tàn cuộc', keyword: 'Vua phải đi' },
  { path: '/strategy', name: 'Chiến lược', keyword: 'bốn nguyên tắc vàng' },
  { path: '/free-play', name: 'Đấu với Robot', keyword: 'Đối thủ vừa đi để làm gì' },
]

for (const route of ROUTES) {
  await navigate(route.path)
  const ok = await exists('kid-parent-tips-toggle')
  check(ok, `${route.name}: khung vẫn hiện`)
  if (!ok) continue
  if (!(await exists('kid-parent-tips-body'))) {
    check(false, `${route.name}: khung phải đang mở để đọc câu hỏi`)
    continue
  }
  // Chờ câu hỏi đúng xuất hiện: trang bài học tải lười nên khung đổi câu hỏi sau
  // khi trang render xong - đọc ngay có thể bắt được câu chung của tab.
  const arrived = await waitForText(route.keyword)
  check(arrived, `${route.name}: câu hỏi đúng tab (tìm “${route.keyword}”)`)
  if (route.notKeyword) {
    check(
      !String(await bodyText()).includes(route.notKeyword),
      `${route.name}: bài học đang mở nên câu hỏi riêng thay câu chung của tab`,
    )
  }
}

// --- 6. Mở một thẻ nguyên tắc vàng thì câu hỏi đổi theo ngay (không tải lại trang).
await navigate('/strategy')
check(
  await waitForText('bốn nguyên tắc vàng'),
  'tab Chiến lược: hiện câu hỏi chung của tab',
)
const clicked = await clickButtonWithText('Đưa Xe vào cột mở')
check(clicked !== 'not-found', `bấm được thẻ “Đưa Xe vào cột mở”`)
check(
  await waitForText('cột nào đang hết Tốt'),
  'mở thẻ nguyên tắc → khung đổi câu hỏi của nguyên tắc đó (không tải lại trang)',
)
const afterSwitch = String(await bodyText())
check(
  !afterSwitch.includes('bốn nguyên tắc vàng đầu tiên là gì'),
  'câu hỏi chung của tab đã được thay hẳn',
)

close()
finish('KHUNG GỢI Ý CHO BA MẸ')
