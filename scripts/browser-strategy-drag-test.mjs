/**
 * Kiểm tra tab Chiến lược: bé kéo-thả nước đi của mình THẬT thì bàn cờ phải
 * cập nhật theo thế cờ sống (không được bật ngược về FEN gốc), và một nước
 * ĂN QUÂN phải ăn được - quân bị ăn biến mất khỏi bàn.
 *
 * Bài giảng mặc định là “Đòn bẩy cấu trúc Tốt” (minority-attack):
 *   bé:  Rb1 → b4 → b5 → bxc6   ·   đối thủ tự đáp: h6 → Rfe8 → Nd7 → bxc6
 *
 * Chạy: node scripts/browser-strategy-drag-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${APP_URL}/strategy`,
  { port: 9353, windowSize: '1440,900' },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra kéo-thả Chiến lược.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

await sleep(2500)

const hasPiece = (pieceId) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${pieceId}'))`)

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

console.log('\n▶ Chiến lược: nước đi của bé phải cập nhật bàn cờ sống')

check(await hasPiece('wR-a1'), 'mở bài: Xe Trắng còn ở a1 (đúng FEN gốc)')

// 1. Rb1 - nước đầu tiên của bé.
await dragPiece('a1', 'b1')
await sleep(1500)
check(await hasPiece('wR-b1'), 'sau khi bé kéo Rb1, Xe nằm ở b1 (bàn cờ không bật về thế gốc)')
check(!(await hasPiece('wR-a1')), 'ô a1 đã trống (quân thật sự được di chuyển)')
check(await hasPiece('bP-h6'), 'đối thủ tự đáp h6 sau nước của bé')

// 2. b4
await dragPiece('b2', 'b4')
await sleep(1500)
check(await hasPiece('wP-b4'), 'bé đẩy Tốt b4 (nước 2)')
check(await hasPiece('bR-e8'), 'đối thủ đáp Rfe8')

// 3. b5
await dragPiece('b4', 'b5')
await sleep(1500)
check(await hasPiece('wP-b5'), 'bé đẩy Tốt b5 (nước 3)')
check(await hasPiece('bN-d7'), 'đối thủ đáp Nd7')

// 4. bxc6 - NƯỚC ĂN QUÂN. Kiểm tra ngay trong lúc Tốt Trắng còn đứng c6.
await dragPiece('b5', 'c6')
await sleep(150)
check(await hasPiece('wP-c6'), 'bé ĂN Tốt Đen ở c6: Tốt Trắng đứng được ở c6')
check(!(await hasPiece('bP-c6')), 'Tốt Đen ở c6 đã biến mất (quân bị ăn thật sự bị bỏ khỏi bàn)')

// Đối thủ lấy lại bằng Tốt b7.
await sleep(1400)
check(await hasPiece('bP-c6'), 'Đối thủ lấy lại c6 bằng Tốt b7')
check(!(await hasPiece('wP-b5')), 'Tốt Trắng ở b5 đã đi mất (nước ăn quân không bị bật lại)')
check(
  !(await bodyText()).includes('chưa đúng'),
  'không có lời nhắc “nước chưa đúng” cho chuỗi nước đúng',
)

close()
finish('BROWSER STRATEGY-DRAG')
