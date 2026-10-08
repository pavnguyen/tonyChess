/**
 * Kiểm tra hai tab "đố" cũng có trợ giúp giống tab Khai cuộc:
 *   - Tab **Trung cuộc**: bấm 💡 Gợi ý mới hiện quân cần đi (viền vàng) + ô đích
 *     (viền xanh) + mũi tên; bé **kéo-thả thật bằng chuột** là giải được bài.
 *   - Tab **Tàn cuộc**: y như vậy, nhưng thế cờ đổi sau mỗi nước nên gợi ý được
 *     tính lại theo thế mới.
 *
 * Điểm quan trọng: trước khi bấm Gợi ý thì KHÔNG được lộ đáp án.
 *
 * Chạy: node scripts/browser-hint-drag-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

const { skipped, failedToConnect, evaluate, send, close } = await openPage(`${APP_URL}#hint-drag`, {
  port: 9349,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra gợi ý + kéo-thả.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

// Màu lấy từ `BOARD_MARKS` (src/lib/notation.ts); trình duyệt trả về dạng rgb().
const GOLD_RING = '192, 142, 34' // #c08e22 - quân cần đi
const STEEL_RING = '95, 159, 175' // #5f9faf - ô đích

console.log('\n▶ Tab Trung cuộc: gợi ý chỉ hiện khi bé hỏi')

const goto = async (path) => {
  await evaluate(`location.href = ${JSON.stringify(`${APP_URL}${path}`)}`)
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(200)
    try {
      if (await evaluate(`Boolean(document.getElementById('kid-board-board'))`)) {
        await sleep(400)
        return true
      }
    } catch {
      /* đang chuyển trang */
    }
  }
  return false
}

const clickButton = (text) =>
  evaluate(`
    (() => {
      const button = [...document.querySelectorAll('button')].find((b) =>
        b.textContent.includes(${JSON.stringify(text)}),
      )
      if (!button) return 'not-found'
      if (button.disabled) return 'disabled'
      button.click()
      return button.textContent.trim()
    })()
  `)

/** Đọc các ô đang được tô sáng + mũi tên đang vẽ (kèm cặp ô thư viện ghi trong id). */
const readMarks = () =>
  evaluate(`
    (() => {
      const gold = []
      const steel = []
      for (const el of document.querySelectorAll('[id^="kid-board-square-"]')) {
        const parts = [el.getAttribute('style') || '']
        for (const kid of el.querySelectorAll('div')) parts.push(kid.getAttribute('style') || '')
        const style = parts.join(' | ')
        const name = el.id.replace('kid-board-square-', '')
        if (style.includes('${GOLD_RING}')) gold.push(name)
        if (style.includes('${STEEL_RING}')) steel.push(name)
      }
      const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
      const marker = overlay ? overlay.querySelector('marker') : null
      return {
        gold,
        steel,
        arrows: overlay ? overlay.querySelectorAll('path').length : 0,
        markerId: marker ? marker.id : null,
      }
    })()
  `)

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

/** Kéo quân bằng chuỗi sự kiện chuột thật (dnd-kit nghe pointer events). */
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

const bodyText = () => evaluate(`document.body.innerText`)

/**
 * Đọc lớp tô sáng của một ô cờ: tên animation đang chạy, độ dày viền và nền
 * HIỆN TẠI (getComputedStyle trả về giá trị đang được animation nội suy).
 */
const probeLayer = (square) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-board-square-' + ${JSON.stringify(square)})
      if (!el) return null
      const layer = [...el.querySelectorAll('div')].find((d) =>
        (d.getAttribute('style') || '').includes('hint-breathe'),
      )
      if (!layer) return null
      const style = getComputedStyle(layer)
      return {
        name: style.animationName,
        duration: style.animationDuration,
        shadow: style.boxShadow,
        bg: style.backgroundColor,
        state: layer.getAnimations().map((a) => a.playState)[0] ?? null,
      }
    })()
  `)

/**
 * Quân đang nằm ở một ô (vd "wN-c7"), hoặc null nếu ô trống.
 * Id quân cờ có dạng `kid-board-piece-<quân>-<ô>` nên phải tìm theo HẬU TỐ, không
 * thể ghép "kid-board-piece-" + ô.
 */
const pieceAt = (square) =>
  evaluate(`
    (() => {
      const suffix = ${JSON.stringify(`-${square}`)}
      const piece = [...document.querySelectorAll('[id^="kid-board-piece-"]')].find((el) =>
        el.id.endsWith(suffix),
      )
      return piece ? piece.id.replace('kid-board-piece-', '') : null
    })()
  `)

check(await goto('/tactics'), 'mở được tab Trung cuộc')

// “Mắt Thần Cờ Vua” phải TẮT sẵn: bàn cờ mặc định sạch, bé/ba mẹ tự bật khi cần.
const eyePressed = await evaluate(
  `document.getElementById('kid-eye-toggle')?.getAttribute('aria-pressed')`,
)
check(eyePressed === 'false', `Mắt Thần Cờ Vua tắt sẵn khi mới mở tab (aria-pressed=${eyePressed})`)

const before = await readMarks()
check(before.gold.length === 0, `chưa bấm Gợi ý thì KHÔNG lộ quân cần đi (${before.gold.length} ô vàng)`)
check(before.arrows === 0, `chưa bấm Gợi ý thì chưa vẽ mũi tên (${before.arrows} mũi tên)`)

const hintClicked = await clickButton('Gợi ý')
check(String(hintClicked) !== 'not-found', `đã bấm “${hintClicked}”`)
await sleep(700)

const after = await readMarks()
check(after.gold.length === 1, `đúng 1 quân được khoanh VÀNG ĐỒNG (${after.gold.join(', ')})`)
check(after.steel.length === 1, `đúng 1 ô đích được khoanh XANH THÉP (${after.steel.join(', ')})`)
check(after.arrows === 1, `vẽ 1 mũi tên chỉ nước đi (${after.arrows})`)
check(
  Boolean(after.markerId?.endsWith(`-${after.gold[0]}-${after.steel[0]}`)),
  `mũi tên đi từ quân viền vàng sang ô viền xanh (id: ${after.markerId})`,
)

console.log('\n▶ Ô gợi ý “thở” nhẹ để bé 7 tuổi nhận ra ngay')

const goldLayer = await probeLayer(after.gold[0])
const steelLayer = await probeLayer(after.steel[0])
check(
  goldLayer?.name === 'hint-breathe-gold',
  `ô quân cần đi chạy nhịp hint-breathe-gold (nhận ${goldLayer?.name})`,
)
check(
  steelLayer?.name === 'hint-breathe-steel',
  `ô đích chạy nhịp hint-breathe-steel (nhận ${steelLayer?.name})`,
)
check(goldLayer?.duration === '1.5s', `chu kỳ 1.5 giây - nhịp chậm, không chói (nhận ${goldLayer?.duration})`)

// Bằng chứng nhịp thật sự chạy: đo lại sau ~nửa chu kỳ, viền/nền phải khác đi.
await sleep(720)
const goldLayerLater = await probeLayer(after.gold[0])
check(
  Boolean(goldLayer && goldLayerLater) &&
    (goldLayer.shadow !== goldLayerLater.shadow || goldLayer.bg !== goldLayerLater.bg),
  `viền/nền đổi theo thời gian → nhịp thở có thật (${goldLayer?.shadow} → ${goldLayerLater?.shadow})`,
)

// Bé bật "giảm chuyển động" thì phải tắt nhịp, chỉ còn viền tĩnh.
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
})
await sleep(200)
const reduced = await probeLayer(after.gold[0])
check(
  reduced?.name === 'none',
  `bật “giảm chuyển động” thì tắt nhịp thở (nhận ${reduced?.name})`,
)
check(
  String(reduced?.shadow).includes('192, 142, 34'),
  `vẫn giữ viền vàng tĩnh để bé thấy quân cần đi (${reduced?.shadow})`,
)
await send('Emulation.setEmulatedMedia', { features: [] })
await sleep(200)

console.log('\n▶ Kéo quân theo gợi ý là giải được bài đố')

check(await dragPiece(after.gold[0], after.steel[0]), `đã kéo chuột ${after.gold[0]} → ${after.steel[0]}`)
await sleep(900)

const solvedText = await bodyText()
check(
  solvedText.includes('Nước hay nhất') || solvedText.includes('Đánh tiếp tuyệt vời'),
  'giải đúng thì báo lời chúc mừng “Nước hay nhất!”',
)
const solvedPiece = await pieceAt(after.steel[0])
check(
  String(solvedPiece).startsWith('w'),
  `quân của bé đã nằm ở ô đích sau khi kéo (${solvedPiece ?? 'ô trống'})`,
)
const cleared = await readMarks()
check(cleared.gold.length === 0, 'giải xong thì vệt gợi ý được xoá sạch')

console.log('\n▶ Tab Tàn cuộc: gợi ý + kéo-thả theo thế cờ hiện tại')

check(await goto('/endgames'), 'mở được tab Tàn cuộc')

const endBefore = await readMarks()
check(endBefore.gold.length === 0, `chưa bấm Gợi ý thì chưa lộ nước đi (${endBefore.gold.length} ô vàng)`)

const endHint = await clickButton('Gợi ý')
check(String(endHint) !== 'not-found', `đã bấm “${endHint}”`)
await sleep(800)

const endAfter = await readMarks()
check(endAfter.gold.length === 1, `đúng 1 quân được khoanh VÀNG ĐỒNG (${endAfter.gold.join(', ')})`)
check(endAfter.steel.length === 1, `đúng 1 ô đích được khoanh XANH THÉP (${endAfter.steel.join(', ')})`)
check(endAfter.arrows === 1, `vẽ 1 mũi tên chỉ nước hay nhất (${endAfter.arrows})`)

// Quân được gợi ý phải là quân của BÉ (Trắng) - đúng chủ đích "quân cần đi".
const hintPiece = await pieceAt(endAfter.gold[0])
check(
  String(hintPiece).startsWith('w'),
  `quân được khoanh vàng đúng là quân của bé (${hintPiece ?? 'ô trống'})`,
)

const moveCount = await evaluate(`
  (() => {
    const chip = [...document.querySelectorAll('span')].find((el) => /^\\d+ nước$/.test(el.textContent.trim()))
    return chip ? parseInt(chip.textContent, 10) : -1
  })()
`)

check(
  await dragPiece(endAfter.gold[0], endAfter.steel[0]),
  `đã kéo chuột ${endAfter.gold[0]} → ${endAfter.steel[0]}`,
)
await sleep(1600)

const afterMove = await evaluate(`
  (() => {
    const chip = [...document.querySelectorAll('span')].find((el) => /^\\d+ nước$/.test(el.textContent.trim()))
    return chip ? parseInt(chip.textContent, 10) : -1
  })()
`)
check(
  afterMove === -1 ? false : afterMove > moveCount,
  `bàn cờ tiến lên sau khi bé kéo (${moveCount} → ${afterMove} nước, tính cả nước đáp trả của Vua Đen)`,
)

const endCleared = await readMarks()
check(endCleared.gold.length === 0, 'đi xong thì vệt gợi ý được xoá để bé tự suy nghĩ nước sau')

close()
finish('BROWSER HINT-DRAG')
