/**
 * Kiểm tra chế độ “Học từng bước”:
 *   1. Quân cần đi được TÔ SÁNG (viền VÀNG ĐỒNG = quân của bé, viền XANH THÉP = ô đích).
 *   2. Bé KÉO-THẢ thật bằng chuột (sự kiện chuột thật qua CDP, không phải click
 *      bằng JS) thì nước đi được chấp nhận và bàn cờ tiến lên.
 *   3. Sau khi bé đi xong, đối thủ tự đáp trả rồi quân kế tiếp của bé lại sáng.
 *   4. Kéo sai nước thì bàn cờ KHÔNG tiến và hiện lời nhắc thử lại.
 *   5. Nút ◀ ▶ vẫn điều khiển được từng nước như trước.
 *
 * Chạy: node scripts/browser-learn-drag-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

// 1440×900 là bố cục 2 cột đã được bài kiểm tra layout xác nhận bàn cờ nằm
// trọn trong màn hình - cần thiết để toạ độ chuột rơi đúng lên quân cờ.
const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}#learn-drag`,
  { port: 9345, windowSize: '1440,900' },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra kéo-thả.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

// Màu lấy đúng từ `BOARD_MARKS` trong src/lib/notation.ts:
//   quân cần đi → nền rgba(217,169,63,.4) + viền #c08e22
//   ô đích      → nền rgba(147,192,205,.42) + viền #5f9faf
// (trình duyệt đổi hex sang rgb() khi đọc lại thuộc tính style)
const FROM_MARKS = ['217, 169, 63', '192, 142, 34']
const TO_MARKS = ['147, 192, 205', '95, 159, 175']

console.log('\n▶ Chế độ “Học từng bước”: tô sáng quân cần đi')

await sleep(2500)

/**
 * Thư viện bàn cờ gắn `squareStyles` vào một thẻ <div> CON bên trong ô cờ, nên
 * phải gom cả style của ô và của các thẻ con mới thấy được vệt tô sáng.
 */
const squareStyle = (name) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-board-square-${name}')
      if (!el) return null
      const parts = [el.getAttribute('style') || '']
      for (const kid of el.querySelectorAll('div')) parts.push(kid.getAttribute('style') || '')
      return parts.join(' | ')
    })()
  `)

const marks = (style, needles) =>
  typeof style === 'string' && needles.some((needle) => style.includes(needle))

const hasPiece = (pieceId) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${pieceId}'))`)

const bodyText = () => evaluate(`document.body.innerText`)

const clickButton = (text) =>
  evaluate(`
    (() => {
      const button = [...document.querySelectorAll('button')].find((b) =>
        b.textContent.includes(${JSON.stringify(text)}),
      )
      if (!button) return 'not-found'
      button.click()
      return button.textContent.trim()
    })()
  `)

// --- 1. Ngay từ đầu bài (ply 0, nước d4) bé phải thấy quân Tốt d2 được khoanh vàng.
const d2 = await squareStyle('d2')
const d4 = await squareStyle('d4')
check(marks(d2, FROM_MARKS), `quân cần đi (d2) có viền VÀNG ĐỒNG - ${d2}`)
check(marks(d4, TO_MARKS), `ô đích (d4) có viền XANH THÉP - ${d4}`)

const arrowCount = await evaluate(`
  (() => {
    const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
    return overlay ? overlay.querySelectorAll('path').length : 0
  })()
`)
check(arrowCount === 1, `vẫn có mũi tên vàng chỉ nước đi (nhận ${arrowCount})`)

// --- 2. “Luyện thuộc lòng” thì KHÔNG được gợi ý sẵn (bé phải tự nhớ).
const memorize = await clickButton('Luyện')
check(String(memorize) !== 'not-found', `đã chuyển sang chế độ “${memorize}”`)
await sleep(600)
const d2Memorize = await squareStyle('d2')
check(
  !marks(d2Memorize, FROM_MARKS),
  'chế độ thuộc lòng không tô sáng sẵn quân cần đi (để bé tự nhớ)',
)

await evaluate(`document.querySelector('[data-opening-goal]').click()`)
await sleep(100)
check(await evaluate(`document.querySelector('[data-opening-goal]').getAttribute('aria-pressed') === 'true'`), 'soi mục tiêu khai cuộc bật được ở chế độ luyện')
check(String(await clickButton('Gợi ý')) !== 'not-found', 'bấm Gợi ý để quay về nước đang luyện')
await sleep(100)
check(await evaluate(`document.querySelector('[data-opening-goal]').getAttribute('aria-pressed') === 'false'`), 'Gợi ý tắt soi mục tiêu khai cuộc')

const backToLearn = await clickButton('Học từng bước')
check(String(backToLearn) !== 'not-found', `đã quay lại “${backToLearn}”`)
await sleep(600)

// --- 3. Kéo-thả THẬT bằng chuột (dnd-kit dùng pointer events).
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
  send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: 'left',
    clickCount: 1,
    ...extra,
  })

const dragPiece = async (from, to) => {
  const a = await rectOf(from)
  const b = await rectOf(to)
  if (!a || !b) return false
  await mouse('mousePressed', a.x, a.y, { buttons: 1 })
  await sleep(80)
  // Nhiều bước nhỏ để vượt ngưỡng kích hoạt kéo và để dnd-kit cập nhật ô đích.
  for (let step = 1; step <= 6; step += 1) {
    await mouse('mouseMoved', a.x + ((b.x - a.x) * step) / 6, a.y + ((b.y - a.y) * step) / 6, {
      buttons: 1,
    })
    await sleep(60)
  }
  await mouse('mouseReleased', b.x, b.y, { buttons: 0 })
  return true
}

console.log('\n▶ Bé kéo-thả quân bằng chuột (d2 → d4)')

check(await dragPiece('d2', 'd4'), 'đã gửi chuỗi sự kiện chuột kéo quân d2 → d4')

// Đối thủ (Đen) tự đáp trả sau 600ms → chờ đủ để tới nước kế tiếp của bé.
await sleep(1500)

check(await hasPiece('wP-d4'), 'quân Tốt Trắng đã nằm ở d4 (nước kéo-thả được chấp nhận)')
check(!(await hasPiece('wP-d2')), 'ô d2 đã trống (quân thật sự được di chuyển)')
check(await hasPiece('bP-d5'), 'đối thủ Đen tự đáp trả d5 sau khi bé đi xong')
check(
  (await hasPiece('wB-c1')) && !(await hasPiece('wB-f4')),
  'bàn cờ dừng đúng ở nước của bé (Tượng còn ở c1, chưa đi f4)',
)

// --- 4. Quân kế tiếp của bé phải lại được tô sáng.
const c1 = await squareStyle('c1')
const f4 = await squareStyle('f4')
check(marks(c1, FROM_MARKS), `quân kế tiếp (Tượng c1) có viền VÀNG ĐỒNG - ${c1}`)
check(marks(f4, TO_MARKS), `ô đích kế tiếp (f4) có viền XANH THÉP - ${f4}`)

// --- 5. Bé cũng kéo được bằng cách bấm-chọn rồi bấm-đích (dự phòng cho iPad).
console.log('\n▶ Bé bấm ô c1 rồi bấm ô f4 (cách đi dự phòng)')

const clickSquare = async (square) => {
  const point = await rectOf(square)
  await mouse('mousePressed', point.x, point.y, { buttons: 1 })
  await mouse('mouseReleased', point.x, point.y, { buttons: 0 })
  await sleep(250)
}

await clickSquare('c1')
await clickSquare('f4')
await sleep(1500)
check(await hasPiece('wB-f4'), 'bấm-chọn-bấm-đích cũng đi được quân (Tượng tới f4)')
check(await hasPiece('bN-f6'), 'đối thủ tự đáp trả Mã f6')

// --- 6. Kéo một nước SAI (e2 → e4) thì bàn cờ không được tiến.
console.log('\n▶ Kéo sai nước (e2 → e4) thì bàn cờ giữ nguyên')

await dragPiece('e2', 'e4')
await sleep(1200)

const text = await bodyText()
check(await hasPiece('wN-g1'), 'bàn cờ không tiến khi bé kéo sai nước')
check(await hasPiece('wP-e2'), 'quân Tốt e2 trở về đúng ô (nước sai bị huỷ)')
check(
  text.includes('chưa đúng') || text.includes('thử lại'),
  'hiện lời nhắc “nước này chưa đúng rồi, bé thử lại nhé”',
)

// --- 7. Bé vẫn bấm ◀ ▶ để xem lại được từng nước.
console.log('\n▶ Vẫn điều khiển được bằng nút ◀ ▶')

check(String(await clickButton('Lùi')) !== 'not-found', 'đã bấm “◀ Lùi”')
await sleep(600)
check(await hasPiece('wN-g1'), 'bấm Lùi một nước: bàn cờ lùi về thế trước khi Đen đi')
check(
  !(await bodyText()).includes('chưa đúng'),
  'lời nhắc “nước chưa đúng” được xoá khi bé bấm Lùi',
)

await clickButton('Lùi')
await sleep(600)
const c1Again = await squareStyle('c1')
const f4Again = await squareStyle('f4')
check(marks(c1Again, FROM_MARKS), `lùi về nước của bé: Tượng c1 lại có viền VÀNG - ${c1Again}`)
check(marks(f4Again, TO_MARKS), `lùi về nước của bé: ô f4 lại có viền XANH - ${f4Again}`)

close()
finish('BROWSER LEARN-DRAG')
