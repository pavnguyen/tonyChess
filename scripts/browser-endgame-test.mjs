/**
 * Kiểm tra tab **Tàn cuộc** `/endgames` sau khi thay bộ thế dễ bằng kỹ thuật thật:
 *   1. Có 20 thế kỹ thuật, chia hai mức rõ ràng: “Tàn cuộc cơ bản” (10 thế) và
 *      “Tàn cuộc nâng cao” (10 thế); các khung tham khảo cũ đã bị gỡ.
 *   2. Bấm thẻ thì bàn cờ lớn đổi sang đúng thế cờ của bài đó.
 *   3. “💡 Gợi ý” hiện mũi tên + bong bóng đọc nước; “🎯 Soi mục tiêu” tô xanh thép
 *      đúng Tốt + ô phong cấp.
 *   4. Lịch sử / Đi lại chạy đúng, đổi bài giữa lúc máy đang nghĩ không nhận nước cũ.
 *   5. Thắng thật: Tượng đôi chiếu bí trong 1 nước → mở lời chúc mừng; còn nước
 *      đi tự nhốt Vua là hòa → báo “Thử lại”.
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

/** Bấm thẻ luyện theo `id` của bài - bền hơn so với so khớp chữ trong tiêu đề. */
const clickChip = (id) =>
  evaluate(`
    (() => {
      const el = document.querySelector('[data-endgame-id=${JSON.stringify(id)}]')
      if (!el) return false
      el.click()
      return true
    })()
  `)

const clickByText = (needle) =>
  evaluate(`
    (() => {
      const el = [...document.querySelectorAll('button')].find((b) =>
        (b.innerText || '').includes(${JSON.stringify(needle)}),
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
    [...el.querySelectorAll('div')].some(child => child.style.backgroundColor === 'rgba(51, 96, 111, 0.42)')
  ).map(el => el.dataset.square).sort()
`)
const clickId = (id) => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`)

await sleep(2000)
await go('/endgames')
check(await waitForSelector('[data-endgame-id]'), 'mở được tab Tàn cuộc')

console.log('\n▶ Chỉ còn bộ thế kỹ thuật, không còn khung tham khảo cũ')

check(String(await bodyText()).includes('Tàn cuộc cơ bản'), 'tiêu đề trang là “Tàn cuộc cơ bản”')
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

const ids = await evaluate(
  `[...document.querySelectorAll('[data-endgame-id]')].map((el) => el.dataset.endgameId)`,
)
check(ids.length === 20, `có đúng 20 thế luyện (${ids.length})`)
check(
  [
    'opposition',
    'rook-pawn',
    'bishop-knight',
    'bishop-pair',
    'passed-pawn',
    'two-pawns',
    'pawn-escort',
    'queen-mate',
    'rook-mate',
    'ladder-mate',
    'queen-mate-edge',
    'kp-sixth',
    'lucena',
    'back-rank-mate',
    'queen-back-rank-mate',
    'kp-two-push',
    'rook-pawn-vs-king',
    'two-pawns-tandem',
    'queen-and-pawn',
    'knight-smother-mate',
  ].every((id) => ids.includes(id)),
  `đủ 20 thế kỹ thuật (${ids.join(', ')})`,
)
const endgameText = String(await bodyText())
check(
  endgameText.includes('Tàn cuộc cơ bản') && endgameText.includes('Tàn cuộc nâng cao'),
  'chia rõ hai mức “Tàn cuộc cơ bản” và “Tàn cuộc nâng cao”',
)

console.log('\n▶ Bấm thẻ để đổi bài luyện')

check(await clickChip('bishop-pair'), 'bấm thẻ “Tượng đôi chiếu bí”')
await sleep(600)
check(await hasPiece('bK', 'h8'), 'bàn cờ soi đúng thế cờ mới (Vua Đen ở h8)')
check(await hasPiece('wB', 'a3'), 'Tượng Trắng ở a3 như thế ban đầu')
check(await hasPiece('wB', 'b1'), 'Tượng Trắng thứ hai ở b1')
check(String(await bodyText()).includes('Tượng đôi'), 'bảng chi tiết hiện tên bài đang luyện')

console.log('\n▶ Gợi ý và soi mục tiêu')

check(await clickChip('opposition'), 'bấm thẻ “Vua–Tốt: ô đối diện”')
await sleep(600)
check(await hasPiece('wP', 'f6'), 'thế Vua–Tốt có Tốt Trắng ở f6')
check(await hasPiece('bK', 'f8'), 'Vua Đen ở f8 chặn trước mặt Tốt')
await clickId('kid-endgame-goal')
await sleep(150)
const purple = await purpleSquares()
check(purple.includes('f6') && purple.includes('f8'), `soi mục tiêu tô xanh thép Tốt + ô phong cấp (${purple})`)
check(await clickByText('Gợi ý'), 'bấm “💡 Gợi ý” khi đang soi mục tiêu')
await sleep(150)
check(
  await evaluate(`document.getElementById('kid-endgame-goal').getAttribute('aria-pressed') === 'false'`),
  'Gợi ý tự tắt soi mục tiêu để mũi tên không bị che',
)
const readout = await evaluate(`
  (() => {
    const el = document.getElementById('kid-board-coord-readout')
    return el ? el.innerText : null
  })()
`)
check(typeof readout === 'string' && readout.length > 0, `bong bóng đọc nước gợi ý (${readout})`)
check(
  String(await evaluate(`document.getElementById('kid-endgame-explanation').innerText`)).includes(
    'Mẹo của bài này',
  ),
  'giải thích là mẹo, không giả làm nước sắp tới',
)

console.log('\n▶ Tốt thông hành: lịch sử, Đi lại, đổi bài khi máy đang chờ')

check(await clickChip('passed-pawn'), 'bấm thẻ “Tốt thông hành”')
await sleep(600)
check(await hasPiece('wP', 'b5'), 'Tốt Trắng ở b5')
check((await historyCount()) === 0, 'bài mới có lịch sử rỗng')
await moveByClick('b5', 'b6')
check(await hasPiece('wP', 'b6'), 'bấm quân và ô đích đi được b6')
check(String(await status()).includes('Máy đang nghĩ'), 'báo rõ đang chờ máy')
await clickId('kid-endgame-takeback')
await sleep(1100)
check((await historyCount()) === 0 && await hasPiece('wP', 'b5'), 'Đi lại trong lúc chờ hủy nước máy, trả về thế ban đầu')
await moveByClick('b5', 'b6')
await sleep(1400)
check((await historyCount()) === 2, 'lịch sử ghi cả nước bé và máy')
await clickId('kid-endgame-takeback')
await sleep(400)
check((await historyCount()) === 0 && await hasPiece('wP', 'b5'), 'Đi lại sau nước máy lùi cả cặp nước')
await moveByClick('b5', 'b6')
await clickChip('bishop-pair')
await sleep(1200)
check((await historyCount()) === 0 && await hasPiece('wB', 'a3'), 'đổi bài khi máy đang chờ không nhận nước cũ')

console.log('\n▶ Chiếu bí bằng Tượng đôi = thắng thật')

await moveByClick('a3', 'b2')
await sleep(400)
check(String(await status()).includes('Đạt mục tiêu'), 'chiếu bí báo đạt mục tiêu')
check(await waitForSelector('[role="dialog"]'), 'chiếu bí mở lời chúc mừng')
check(
  String(await evaluate(`document.querySelector('[role="dialog"]').innerText`)).includes(
    'Chiếu bí tuyệt vời',
  ),
  'chiếu bí hiện lời chúc mừng đúng',
)
await clickByText('Tuyệt vời!')
await clickId('kid-endgame-takeback')
await sleep(200)
check(
  (await historyCount()) === 0 && String(await status()).includes('Đến lượt bé'),
  'Đi lại sau chiếu bí mở lại lượt chơi',
)

console.log('\n▶ Tự nhốt Vua = hòa, không tính là hoàn thành')

// Tượng b1 sang c2 vẫn giữ ô h7 nhưng không chiếu → Vua Đen hết nước đi, hòa cờ.
await moveByClick('b1', 'c2')
await sleep(400)
check(String(await status()).includes('Thử lại'), 'hết nước đi mà không chiếu là hòa, cần thử lại')
check(String(await bodyText()).includes('Hòa cờ mất rồi!'), 'hòa có thông báo đúng')
check(!String(await bodyText()).includes('Bé đã đạt mục tiêu!'), 'hòa không báo đạt mục tiêu')
await clickByText('Tuyệt vời!')
await clickId('kid-endgame-takeback')
await sleep(400)
check(await hasPiece('wB', 'b1') && String(await status()).includes('Đến lượt bé'), 'Đi lại sau hòa cho bé sửa nước vừa đi')

console.log('\n▶ Không tràn ngang trên màn hình điện thoại')
const overflow = await evaluate(`
  (() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }))()
`)
check(
  Number(overflow.scrollW) <= Number(overflow.innerW) + 1,
  `không tràn ngang (${overflow.scrollW} ≤ ${overflow.innerW}px)`,
)

close()
finish('BROWSER ENDGAME')
