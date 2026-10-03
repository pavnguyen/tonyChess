/**
 * Kiểm tra tab **Tàn cuộc** /endgames sau khi tinh gọn:
 *   1. Trang chỉ còn dải 12 thế luyện + bảng chi tiết; các khung tham khảo cũ
 *      (Thư viện chiếu bí / Tàn cuộc Xe + Tốt / Nguyên tắc tàn cuộc) đã bị gỡ.
 *   2. Bấm một thẻ thì bàn cờ lớn đổi sang đúng thế cờ của bài đó.
 *   3. Bấm “💡 Gợi ý” thì bàn cờ hiện mũi tên + bong bóng đọc nước đi.
 *
 * Chạy: node scripts/browser-endgame-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, close } = await openPage(APP_URL, {
  port: 9371,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra Tàn cuộc.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const go = async (path) => {
  await evaluate(`location.href = ${JSON.stringify(`${APP_URL}${path}`)}`)
}

const waitForSelector = async (selector, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(150)
  }
  return false
}

/** Bấm thẻ luyện theo đúng `title` của thẻ. */
const clickChip = (title) =>
  evaluate(`
    (() => {
      const el = [...document.querySelectorAll('[data-endgame-id]')].find(
        (b) => b.getAttribute('title') === ${JSON.stringify(title)},
      )
      if (!el) return false
      el.click()
      return true
    })()
  `)

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

const hasPiece = (piece, square) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${piece}-${square}'))`)

const bodyText = () => evaluate(`document.body.innerText`)

await sleep(2000)
await go('/endgames')
check(await waitForSelector('[data-endgame-id]'), 'mở được tab Tàn cuộc')

console.log('\n▶ Trang tinh gọn: chỉ còn dải thế luyện + bảng chi tiết')

const title = String(await bodyText())
check(title.includes('Tàn cuộc cơ bản'), 'tiêu đề trang là “Tàn cuộc cơ bản”')
check(
  !(await evaluate(`Boolean(document.getElementById('kid-mate-library'))`)),
  'không còn khung “Thư viện chiếu bí”',
)
check(
  !(await evaluate(`Boolean(document.getElementById('kid-rook-endgames'))`)),
  'không còn khung “Tàn cuộc Xe + Tốt”',
)
check(
  (await evaluate(`document.querySelectorAll('[data-rook-id]').length`)) === 0,
  'không còn thẻ tàn cuộc Xe + Tốt nào trong DOM',
)
check(
  !(await evaluate(`Boolean(document.getElementById('kid-endgame-preview-note'))`)),
  'không còn chế độ “soi thế cờ”',
)
check(
  !(await evaluate(`Boolean(document.getElementById('kid-rook-play'))`)),
  'không còn nút chơi thật Xe + Tốt',
)

const chipCount = await evaluate(`document.querySelectorAll('[data-endgame-id]').length`)
check(chipCount === 12, `có đủ 12 thế luyện bấm được (${chipCount})`)

console.log('\n▶ Bấm thẻ để đổi bài luyện')

check(await clickChip('Chiếu bí hàng cuối bằng Hậu'), 'bấm thẻ “Chiếu bí hàng cuối bằng Hậu”')
await sleep(600)
check(await hasPiece('bK', 'g8'), 'bàn cờ soi đúng thế cờ mới (Vua Đen ở g8)')
check(await hasPiece('wQ', 'd1'), 'quân của bé đúng thế (Hậu Trắng ở d1)')
check(
  String(await bodyText()).includes('Chiếu bí hàng cuối bằng Hậu'),
  'bảng chi tiết hiện tên bài đang luyện',
)

console.log('\n▶ Gợi ý hiện mũi tên + bong bóng đọc nước')

check(await clickByText('Gợi ý'), 'bấm “💡 Gợi ý”')
const readout = await evaluate(`
  (() => {
    const el = document.getElementById('kid-board-coord-readout')
    return el ? el.innerText : null
  })()
`)
check(
  typeof readout === 'string' && readout.includes('d1') && readout.includes('d8'),
  `bong bóng đọc đúng nước gợi ý (${readout})`,
)

console.log('\n▶ Quay lại bài phong Hậu')

check(await clickChip('Tốt đua biến Hậu (dễ)'), 'bấm thẻ “Tốt đua biến Hậu (dễ)”')
await sleep(600)
check(await hasPiece('wP', 'e5'), 'bàn cờ trở về thế Tốt Trắng ở e5')
check(await hasPiece('wK', 'd6'), 'Vua Trắng ở d6 như thế ban đầu')

close()
finish('BROWSER ENDGAME')
