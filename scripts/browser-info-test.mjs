/**
 * Kiểm tra nút **ⓘ** (giải thích tại chỗ) trong trình duyệt thật:
 *   1. Nút có mặt ở MỌI chỗ đáng có: thanh tiêu đề (`app`), khai cuộc đang học
 *      (`opening:*`), cây khai cuộc, bản đồ Cúp Vàng, từng đòn chiến thuật, từng thế
 *      tàn cuộc Xe+Tốt, từng khái niệm vị trí, từng bài giảng.
 *   2. Bấm nút → bảng giải thích mở ra, có đúng nhãn (📜 Lịch sử / 👤 Tác giả / …) và
 *      nội dung đúng chủ đề (không phải nội dung của chỗ khác).
 *   3. Đóng được, và bảng nằm trọn trong màn hình - không phá bố cục “không cuộn”.
 *
 * Chạy: node scripts/browser-info-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}#info`, {
  port: 9366,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra nút ⓘ.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

// Tìm nút ⓘ theo thuộc tính `data-info-topic` thay vì `id`: một khoá nội dung có thể
// được gắn ở vài khung trên cùng trang (id sẽ trùng), còn thuộc tính này vẫn tra được.
const hasInfo = (topic) =>
  evaluate(`
    [...document.querySelectorAll('[data-info-topic]')].some(
      (el) => el.dataset.infoTopic === ${JSON.stringify(topic)},
    )
  `)

const openInfo = (topic) =>
  evaluate(`
    (() => {
      const button = [...document.querySelectorAll('[data-info-topic]')].find(
        (el) => el.dataset.infoTopic === ${JSON.stringify(topic)},
      )
      if (!button) return false
      button.click()
      return true
    })()
  `)

/** Chờ nút ⓘ đầu tiên xuất hiện - trang SPA cần một nhịp để gắn giao diện. */
const waitForInfo = async (timeoutMs = 8000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector('[data-info-topic]'))`)) return true
    await sleep(120)
  }
  return false
}

/**
 * Chờ nút ⓘ của MỘT chủ đề cụ thể. Cần thiết vì các trang bài học được tải lười:
 * thanh tiêu đề (`app`) hiện ngay, còn khung của trang thì vài trăm ms sau mới tới.
 */
const waitForTopic = async (topic, timeoutMs = 8000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await hasInfo(topic)) return true
    await sleep(120)
  }
  return false
}

const panelText = (topic) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-info-panel-' + ${JSON.stringify(topic)})
      return el ? el.innerText : ''
    })()
  `)

const closeInfo = () =>
  evaluate(`
    (() => {
      const button = document.querySelector('button[aria-label="Đóng giải thích"]')
      if (!button) return false
      button.click()
      return true
    })()
  `)

const waitForPanel = async (topic, timeoutMs = 3000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const text = String(await panelText(topic))
    if (text.trim().length > 0) return text
    await sleep(80)
  }
  return ''
}

const navigate = async (path) => {
  const base = APP_URL.replace(/\/$/, '')
  await evaluate(`location.href = ${JSON.stringify(`${base}${path}`)}`)
  await waitForInfo()
  await sleep(200)
}

/**
 * Một ca kiểm gọn: nút tồn tại → mở → bảng có nội dung chứa `expect` → đóng được.
 */
const expectTopic = async (topic, expect, label) => {
  const exists = await waitForTopic(topic)
  check(exists, `${label}: có nút ⓘ`)
  if (!exists) return
  await openInfo(topic)
  const text = await waitForPanel(topic)
  check(text.length > 0, `${label}: bấm ⓘ thì bảng giải thích mở ra`)
  if (expect) {
    check(
      text.includes(expect),
      `${label}: nội dung đúng chủ đề (tìm “${expect}”)`,
    )
  }
  const closed = await closeInfo()
  check(closed, `${label}: bảng đóng được`)
  check(
    String(await panelText(topic)).length === 0,
    `${label}: sau khi đóng thì bảng biến mất`,
  )
}

console.log('\n▶ Nút ⓘ (giải thích tại chỗ)')

// --- Tab Khai cuộc: logo/thanh tiêu đề, khai cuộc đang học, cây, bản đồ.
await navigate('/')
await expectTopic('app', 'Nam An - Cờ Vua', 'Thanh tiêu đề (giới thiệu app)')
await expectTopic('opening:london', '1922', 'Khai cuộc đang học (lịch sử Hệ thống London)')
await expectTopic('tree', 'ngã ba', 'Cây khai cuộc')
await expectTopic('cup', 'Cúp Vàng', 'Bản đồ chinh phục (Cúp Vàng & mở khoá)')

// Nút ⓘ của khai cuộc phải đổi theo bài đang chọn - chọn một bài khác và kiểm lại.
// (Dải chọn khai cuộc là các nút trong bản đồ leo cấp.)
const switched = await evaluate(`
  (() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Ván cờ Ý'),
    )
    if (!button || button.disabled) return 'not-found'
    button.click()
    return button.textContent.trim()
  })()
`)
if (switched === 'not-found') {
  console.log('  (bỏ qua: khai cuộc thứ hai chưa mở khoá trên hồ sơ này)')
} else {
  await sleep(400)
  const exists = await waitForTopic('opening:italian', 4000)
  check(exists, 'Đổi sang “Ván cờ Ý” → nút ⓘ đổi theo khai cuộc mới')
  if (exists) {
    await openInfo('opening:italian')
    const text = await waitForPanel('opening:italian')
    check(text.includes('Greco'), 'nội dung ⓘ nói về lịch sử Ván cờ Ý (Gioachino Greco)')
    await closeInfo()
  }
}

// --- Tab Trung cuộc: đòn chiến thuật mặc định (Bắt đôi).
await navigate('/tactics')
await expectTopic('tactic:fork', 'Bắt đôi', 'Trung cuộc - đòn “Bắt đôi”')

// --- Tab Tàn cuộc: thế Xe + Tốt Lucena.
await navigate('/endgames')
await expectTopic('endgame:lucena', 'Lucena', 'Tàn cuộc Xe + Tốt - thế Lucena')

// --- Tab Chiến lược: bài giảng mặc định + khái niệm vị trí.
await navigate('/strategy')
await expectTopic('lecture:minority-attack', 'b4-b5', 'Bài giảng - Đòn bẩy cấu trúc Tốt')
await expectTopic('positional:outpost', 'Tiền đồn', 'Chiến lược vị trí - Tiền đồn')

// --- 4. Bảng nằm trọn màn hình và không làm trang tràn ngang.
await navigate('/')
await openInfo('app')
await waitForPanel('app')
const fits = await evaluate(`
  (() => {
    const el = document.getElementById('kid-info-panel-app')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      innerW: window.innerWidth, innerH: window.innerHeight,
      scrollW: document.documentElement.scrollWidth,
    }
  })()
`)
if (fits) {
  check(
    fits.left >= -2 && fits.right <= fits.innerW + 2,
    `bảng ⓘ nằm gọn bề ngang (${Math.round(fits.right - fits.left)}px)`,
  )
  check(
    fits.top >= -2 && fits.bottom <= fits.innerH + 2,
    'bảng ⓘ nằm gọn chiều cao màn hình',
  )
  check(
    fits.scrollW <= fits.innerW + 2,
    `bảng ⓘ mở mà trang không tràn ngang (${fits.scrollW} ≤ ${fits.innerW}px)`,
  )
}
await closeInfo()

close()
finish('NÚT ⓘ')
