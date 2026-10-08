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

const { skipped, failedToConnect, evaluate, send, close } = await openPage(APP_URL, {
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

/** Bấm quân rồi ô đích bằng chuột thật, giống thao tác chạm của bé. */
const moveByClick = async (from, to) => {
  for (const square of [from, to]) {
    const point = await evaluate(`(() => {
      const r = document.getElementById('kid-board-square-${square}').getBoundingClientRect()
      return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }
    })()`)
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', {
        type, ...point, button: 'left', clickCount: 1,
        buttons: type === 'mousePressed' ? 1 : 0,
      })
    }
    await sleep(80)
  }
  // Chờ hoạt ảnh quân cờ kết thúc trước khi thao tác tiếp trên cùng bàn.
  await sleep(350)
}
const historyCount = () => evaluate(`document.querySelectorAll('#kid-endgame-history button').length`)
const status = () => evaluate(`document.getElementById('kid-endgame-status').innerText`)
const purpleSquares = () => evaluate(`
  [...document.querySelectorAll('[data-square]')].filter(el =>
    [...el.querySelectorAll('div')].some(child => child.style.backgroundColor === 'rgba(126, 106, 209, 0.42)')
  ).map(el => el.dataset.square).sort()
`)
const clickId = (id) => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`)

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

await clickId('kid-endgame-goal')
await sleep(100)
check((await purpleSquares()).includes('g8'), 'soi mục tiêu tô tím Vua Đen')
check(await clickByText('Gợi ý'), 'bấm “💡 Gợi ý” khi đang soi mục tiêu')
await sleep(100)
check(await evaluate(`document.getElementById('kid-endgame-goal').getAttribute('aria-pressed') === 'false'`), 'Gợi ý tự tắt soi mục tiêu để mũi tên không bị che')
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

console.log('\n▶ Mục tiêu, lịch sử và Đi lại')
await clickId('kid-endgame-goal')
await sleep(100)
check(JSON.stringify(await purpleSquares()) === JSON.stringify(['e5', 'e8']), 'phong Hậu tô đúng Tốt và ô phong cấp')
check(String(await evaluate(`document.getElementById('kid-endgame-explanation').innerText`)).includes('Mẹo của bài này'), 'giải thích là mẹo, không giả làm nước sắp tới')
check((await historyCount()) === 0, 'bài mới có lịch sử rỗng')
await moveByClick('e5', 'e6')
check(await hasPiece('wP', 'e6'), 'bấm quân và ô đích đi được e6')
check(String(await status()).includes('Máy đang nghĩ'), 'báo rõ đang chờ máy')
await clickId('kid-endgame-takeback')
await sleep(1100)
check((await historyCount()) === 0 && await hasPiece('wP', 'e5'), 'Đi lại trong lúc chờ hủy nước máy, trả về thế ban đầu')
await moveByClick('e5', 'e6')
await sleep(1200)
check((await historyCount()) === 2, 'lịch sử ghi cả nước bé và máy')
await clickId('kid-endgame-takeback')
await sleep(350)
check((await historyCount()) === 0 && await hasPiece('wP', 'e5'), 'Đi lại sau nước máy lùi cả cặp nước')
await moveByClick('e5', 'e6')
await sleep(1200)
await moveByClick('e6', 'e7')
await sleep(1200)
await evaluate(`document.querySelector('#kid-endgame-history button').click()`)
await sleep(1200)
check((await historyCount()) === 2 && await hasPiece('wP', 'e6'), 'bấm lịch sử quay về thế sau e6 rồi máy trả lời đúng một nước')
await moveByClick('e6', 'e7')
await clickChip('Chiếu bí hàng cuối bằng Hậu')
await sleep(1200)
check((await historyCount()) === 0 && await hasPiece('wQ', 'd1'), 'đổi bài khi máy đang chờ không nhận nước cũ')
await moveByClick('d1', 'd8')
await sleep(300)
check(String(await status()).includes('Đạt mục tiêu'), 'chiếu bí báo đạt mục tiêu')
check(await waitForSelector('[role="dialog"]'), 'chiếu bí mở lời chúc mừng')
check(String(await evaluate(`document.querySelector('[role="dialog"]').innerText`)).includes('Chiếu bí tuyệt vời'), 'chiếu bí hiện lời chúc mừng đúng')
await clickByText('Tuyệt vời!')
await clickId('kid-endgame-takeback')
await sleep(100)
check((await historyCount()) === 0 && String(await status()).includes('Đến lượt bé'), 'Đi lại sau chiếu bí mở lại lượt chơi')

await sleep(350)
await moveByClick('d1', 'd8')
await sleep(300)
check(String(await evaluate(`document.querySelector('[role="dialog"]').innerText`)).includes('Chiếu bí tuyệt vời'), 'chơi lại vẫn hiện lời chúc mừng')
await clickByText('Tuyệt vời!')

console.log('\n▶ Hòa không bị ghi nhận là hoàn thành')
await clickChip('Chiếu bí bằng Hậu + Vua')
await sleep(500)
await moveByClick('e7', 'e3')
await sleep(300)
check(String(await status()).includes('Thử lại'), 'hết nước đi nhưng không chiếu là hòa, cần thử lại')
check(String(await bodyText()).includes('Hòa cờ mất rồi!'), 'hòa có thông báo đúng')
await clickByText('Tuyệt vời!')
check(!String(await bodyText()).includes('Bé đã đạt mục tiêu!'), 'hòa không báo đạt mục tiêu')
await clickId('kid-endgame-takeback')
await sleep(350)
check(await hasPiece('wQ', 'e7') && String(await status()).includes('Đến lượt bé'), 'Đi lại sau hòa cho bé sửa nước vừa đi')

close()
finish('BROWSER ENDGAME')
