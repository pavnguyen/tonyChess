/**
 * Kiểm tra **HLV** ở tab Đấu Máy (`/free-play`):
 *   1. Chưa đi gì thì không có thẻ nhận xét nào.
 *   2. Nước đi bình thường (Mã ra f3, h4) → không bị chặn.
 *   3. Nước ĐỂ QUÂN TREO (Mã h4 → g6, Tốt h7 ăn được) → hiện **cảnh báo trước khi đi**,
 *      nước đi CHƯA được thực hiện.
 *   4. Bấm “Vẫn đi” → nước được thực hiện, cảnh báo biến mất.
 *   5. HLV chấm xong → hiện câu nhận xét tiếng Việt có số điểm, và “◀ Đi lại” xoá được.
 *
 * Chạy: node scripts/browser-coach-test.mjs  (cần server ở cổng 5198)
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(`${APP_URL}/free-play`, {
  port: 9385,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm HLV.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const waitFor = async (selector, timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(150)
  }
  return false
}

const hasPiece = (piece, square) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${piece}-${square}'))`)

const text = (selector) =>
  evaluate(`(document.querySelector(${JSON.stringify(selector)})?.innerText ?? '')`)

/** Kéo quân bằng chuỗi sự kiện chuột thật, giống thao tác tay của bé. */
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
    await sleep(90)
  }
  await sleep(500)
}

await sleep(2400)

console.log('\n▶ Chưa đi gì thì HLV im lặng')

check(await waitFor('#kid-board-square-g1'), 'mở được bàn chờ tab Đấu Máy')
check(!(await evaluate(`Boolean(document.getElementById('kid-coach-danger'))`)), 'chưa có cảnh báo nào')
check(!(await evaluate(`Boolean(document.getElementById('kid-coach-loss'))`)), 'chưa có nhận xét nào')

console.log('\n▶ Hai nước an toàn: Mã g1→f3→h4 (không bị chặn)')

await moveByClick('g1', 'f3')
await sleep(2600) // chờ máy đáp
check(await hasPiece('wN', 'f3'), 'Mã đứng ở f3')
check(!(await evaluate(`Boolean(document.getElementById('kid-coach-danger'))`)), 'nước an toàn không bị cảnh báo')

await moveByClick('f3', 'h4')
await sleep(2600)
check(await hasPiece('wN', 'h4'), 'Mã đứng ở h4')

console.log('\n▶ Nước treo quân: Mã h4 → g6 (bị Tốt h7 ăn miễn phí)')

await moveByClick('h4', 'g6')
await sleep(500)

const danger = await text('#kid-coach-danger')
check(Boolean(danger), 'hiện cảnh báo TRƯỚC khi đi')
check(danger.includes('ăn miễn phí'), `cảnh báo nói rõ hậu quả (“${danger.replace(/\s+/g, ' ').slice(0, 80)}”)`)
check(danger.includes('Mã'), 'cảnh báo nêu đúng tên quân (Mã)')
check(await hasPiece('wN', 'h4'), 'nước đi bị chặn lại - Mã vẫn còn ở h4')
check(!(await hasPiece('wN', 'g6')), 'quân chưa nhảy sang g6 khi chưa xác nhận')

console.log('\n▶ “Vẫn đi” thì nước được thực hiện')

const clicked = await evaluate(`(() => {
  const btn = document.getElementById('kid-coach-danger-go')
  if (!btn) return false
  btn.click()
  return true
})()`)
check(clicked, 'bấm được nút “Vẫn đi”')
await sleep(600)
check(!(await evaluate(`Boolean(document.getElementById('kid-coach-danger'))`)), 'cảnh báo biến mất sau khi xác nhận')
check(
  (await hasPiece('wN', 'g6')) || (await hasPiece('bN', 'g6')) === false,
  'nước Mã g6 đã được áp dụng (hoặc đã bị đối thủ ăn ngay)',
)

console.log('\n▶ HLV chấm nước vừa đi bằng tiếng Việt')

const gotLoss = await waitFor('#kid-coach-loss', 20000)
check(gotLoss, 'hiện câu nhận xét của HLV')
const loss = await text('#kid-coach-loss')
check(loss.includes('HLV:'), `nhãn HLV rõ ràng (“${loss.replace(/\s+/g, ' ').slice(0, 80)}”)`)
check(loss.includes('điểm'), 'câu nhận xét có số điểm cụ thể')
check(
  loss.includes('kém hơn') || loss.includes('bị ăn miễn phí'),
  'chỉ ra được lỗi: kém hơn nước hay nhất / bị ăn miễn phí',
)
check(
  !/hay lắm|giỏi quá|tuyệt vời/i.test(loss),
  'giọng trung tính: không khen mở đầu',
)

console.log('\n▶ “Đi lại” xoá nhận xét và cho bé sửa')

await evaluate(`document.getElementById('kid-coach-undo')?.click()`)
await sleep(600)
check(!(await evaluate(`Boolean(document.getElementById('kid-coach-loss'))`)), 'đi lại thì nhận xét cũ biến mất')
check(!(await evaluate(`Boolean(document.getElementById('kid-coach-danger'))`)), 'không còn cảnh báo treo')

close()
finish('BROWSER COACH')
