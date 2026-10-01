/**
 * Kiểm tra hình học mũi tên vàng: mũi tên chỉ nước đi kế tiếp PHẢI nằm đúng
 * trên đường đi thật của quân cờ (đuôi ở ô xuất phát, đầu ở ô đích).
 *
 * Đây là bài kiểm tra chống lỗi tái phát: từng có bug đuôi mũi tên nhảy sang
 * phía Đen vì `arrowStartOffset` bị đặt sai đơn vị.
 *
 * Chạy: node scripts/browser-arrow-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

const { skipped, failedToConnect, evaluate, send, close } = await openPage(`${APP_URL}#arrow`, {
  port: 9334,
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra mũi tên.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

console.log('\n▶ Kiểm tra mũi tên vàng chỉ nước đi kế tiếp (Hệ thống London, ply 0)')

await sleep(2500)

const geometry = await evaluate(`
  (() => {
    const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
    if (!overlay) return { error: 'không tìm thấy lớp mũi tên' }
    const paths = [...overlay.querySelectorAll('path')]
    if (paths.length === 0) return { error: 'không có mũi tên nào được vẽ' }

    const box = (el) => {
      const r = el.getBoundingClientRect()
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        cx: (r.left + r.right) / 2,
        cy: (r.top + r.bottom) / 2,
        size: r.width,
      }
    }

    const square = (name) => {
      const el = document.getElementById('kid-board-square-' + name)
      if (!el) return null
      return box(el)
    }

    const arrow = box(paths[0])
    return {
      arrow,
      d2: square('d2'),
      d4: square('d4'),
      d7: square('d7'),
      d8: square('d8'),
      arrowCount: paths.length,
    }
  })()
`)

if (!geometry || geometry.error) {
  check(false, `không đọc được hình học: ${geometry?.error ?? 'không rõ'}`)
  close()
  finish('BROWSER ARROW')
}

check(geometry.arrowCount === 1, `vẽ đúng 1 mũi tên (nhận ${geometry.arrowCount})`)
check(Boolean(geometry.d2 && geometry.d4), 'tìm thấy ô d2 và d4 trên bàn cờ')

if (geometry.d2 && geometry.d4) {
  const square = geometry.d2.size
  const tolerance = square * 0.12
  const { arrow, d2, d4, d7, d8 } = geometry

  // 1. Đuôi mũi tên phải nằm trong ô xuất phát d2 (quân Trắng).
  check(
    arrow.bottom <= d2.bottom + tolerance && arrow.bottom >= d2.top - tolerance,
    `đuôi mũi tên ở ô d2 (đáy mũi tên ${arrow.bottom.toFixed(0)}px, d2 = ${d2.top.toFixed(0)}–${d2.bottom.toFixed(0)}px)`,
  )

  // 2. Đầu mũi tên phải nằm trong ô đích d4.
  check(
    arrow.top >= d4.top - tolerance && arrow.top <= d4.bottom + tolerance,
    `đầu mũi tên ở ô d4 (đỉnh mũi tên ${arrow.top.toFixed(0)}px, d4 = ${d4.top.toFixed(0)}–${d4.bottom.toFixed(0)}px)`,
  )

  // 3. Mũi tên phải vươn LÊN (hướng Trắng đi), không phải chúi xuống từ phía Đen.
  check(arrow.top < arrow.bottom, 'mũi tên có hướng từ dưới lên đúng chiều Trắng đi')
  check(
    arrow.top > d8.bottom && arrow.top > d7.bottom,
    'mũi tên KHÔNG chạm vào vùng quân Đen ở hàng 7–8',
  )

  // 4. Mũi tên nằm gọn trong cột d.
  check(
    arrow.left >= d2.left - tolerance && arrow.right <= d2.right + tolerance,
    'mũi tên nằm gọn trong cột d',
  )

  // 5. Mũi tên dài đúng 2 ô (d2 → d4), không phải 6 ô.
  const lengthInSquares = (arrow.bottom - arrow.top) / square
  check(
    lengthInSquares > 1.4 && lengthInSquares < 2.6,
    `mũi tên dài ~2 ô cờ (đo được ${lengthInSquares.toFixed(2)} ô)`,
  )
}

// ----------------------------------------------------------------
// Kịch bản 1b: quét nhiều nước - mũi tên LUÔN phải bắt đầu từ quân của bên
// đang đi. Đây là bài kiểm tra trực tiếp cho câu hỏi “quân Trắng đi trước mà
// sao mũi tên lại từ phía Đen?”.
// ----------------------------------------------------------------
console.log('\n▶ Quét nhiều nước liên tiếp trên bàn cờ Trắng (Hệ thống London)')

/**
 * Đọc CHÍNH XÁC hai đầu mũi tên từ toạ độ trong `d` của thẻ <path>, quy đổi ra
 * toạ độ màn hình rồi tra xem mỗi đầu nằm ở ô nào, ô đó có quân gì.
 *
 * Cách này đúng cho mọi hướng đi (ngang, dọc, chéo), không đoán theo khung bao.
 * Ngoài ra id của thẻ <marker> mũi tên do thư viện sinh ra còn ghi luôn cặp ô
 * xuất phát – đích (ví dụ `kid-board-arrowhead-0-c1-f4`) để đối chiếu chéo.
 */
const probeArrow = () =>
  evaluate(`
    (() => {
      const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
      if (!overlay) return { error: 'không tìm thấy lớp mũi tên' }
      const path = overlay.querySelector('path')
      if (!path) return { error: 'không có mũi tên nào được vẽ' }

      const d = path.getAttribute('d') || ''
      const nums = (d.match(/-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?/gi) || []).map(Number)
      if (nums.length < 4) return { error: 'không đọc được toạ độ mũi tên: ' + d }

      // Mũi tên của quân Mã được vẽ thành đường gấp khúc, nên lấy điểm ĐẦU TIÊN
      // và điểm CUỐI CÙNG của đường đi, không lấy điểm thứ hai.
      const startX = nums[0]
      const startY = nums[1]
      const endX = nums[nums.length - 2]
      const endY = nums[nums.length - 1]

      const ctm = overlay.getScreenCTM()
      const toScreen = (x, y) => {
        const p = overlay.createSVGPoint()
        p.x = x
        p.y = y
        return p.matrixTransform(ctm)
      }

      const squares = [...document.querySelectorAll('[id^="kid-board-square-"]')].map((el) => {
        const r = el.getBoundingClientRect()
        return {
          name: el.id.replace('kid-board-square-', ''),
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          piece: (el.querySelector('[id^="kid-board-piece-"]') || {}).id ?? null,
        }
      })
      const squareAt = (p) =>
        squares.find((s) => p.x >= s.left && p.x <= s.right && p.y >= s.top && p.y <= s.bottom)
      const describe = (s) => (s ? { name: s.name, piece: s.piece } : null)

      const marker = overlay.querySelector('marker')
      return {
        points: nums.length / 2,
        markerId: marker ? marker.id : null,
        from: describe(squareAt(toScreen(startX, startY))),
        to: describe(squareAt(toScreen(endX, endY))),
      }
    })()
  `)

// London là bài cờ Trắng: ply 0, 2, 4… là Trắng đi; ply lẻ là Đen đi.
const EXPECTED_COLORS = ['w', 'b', 'w', 'b', 'w', 'b']
const colorName = (c) => (c === 'w' ? 'Trắng' : 'Đen')

for (let ply = 0; ply < EXPECTED_COLORS.length; ply += 1) {
  if (ply > 0) {
    await evaluate(`
      (() => {
        const button = [...document.querySelectorAll('button')].find((b) =>
          b.textContent.includes('Tiến'),
        )
        if (button) button.click()
        return true
      })()
    `)
    await sleep(500)
  }

  const shot = await probeArrow()
  if (!shot || shot.error) {
    check(false, `ply ${ply}: ${shot?.error ?? 'không đọc được hình học'}`)
    continue
  }

  const expected = EXPECTED_COLORS[ply]
  const pieceColor = shot.from?.piece
    ? shot.from.piece.replace('kid-board-piece-', '')[0]
    : null

  // 1. Đuôi mũi tên phải nằm trên quân của BÊN ĐANG ĐI.
  check(
    pieceColor === expected,
    `ply ${ply}: mũi tên đi từ ô ${shot.from?.name ?? '?'}${
      shot.from?.piece ? ` (${shot.from.piece.replace('kid-board-piece-', '')})` : ' (TRỐNG)'
    } tới ô ${shot.to?.name ?? '?'} - đúng bên ${colorName(expected)} đang đi`,
  )

  // 2. Đối chiếu chéo với cặp ô mà chính thư viện bàn cờ ghi vào id mũi tên.
  check(
    Boolean(shot.markerId?.endsWith(`-${shot.from?.name}-${shot.to?.name}`)),
    `ply ${ply}: thư viện ghi nhận mũi tên ${shot.from?.name}→${shot.to?.name} (id: ${shot.markerId})`,
  )
}

// ----------------------------------------------------------------
// Kịch bản 1c: điều khiển Tiến / Lùi bằng phím mũi tên của bàn phím.
// ----------------------------------------------------------------
console.log('\n▶ Điều khiển Tiến / Lùi bằng phím mũi tên (◀ ▶ ▲ ▼)')

const VIRTUAL_KEY = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }

const pressKey = async (key) => {
  const code = VIRTUAL_KEY[key]
  for (const type of ['rawKeyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key,
      code: key,
      windowsVirtualKeyCode: code,
      nativeVirtualKeyCode: code,
    })
  }
  await sleep(450)
}

// Sau khi quét, bàn cờ đang ở ply 5 (nước e6 của Đen). Mỗi lần bấm phím, mũi tên
// phải nhảy sang đúng nước của ply mới - đọc từ ô mà đuôi mũi tên đứng.
const KEY_STEPS = [
  { key: 'ArrowLeft', ply: 4, from: 'g1' },
  { key: 'ArrowLeft', ply: 3, from: 'g8' },
  { key: 'ArrowUp', ply: 4, from: 'g1' },
  { key: 'ArrowRight', ply: 5, from: 'e7' },
  { key: 'ArrowDown', ply: 4, from: 'g1' },
]

for (const step of KEY_STEPS) {
  await pressKey(step.key)
  const shot = await probeArrow()
  check(
    shot?.from?.name === step.from,
    `bấm ${step.key}: lùi/tiến tới ply ${step.ply} - mũi tên ở ô ${
      shot?.from?.name ?? '?'
    } (cần ${step.from})`,
  )
}

// ----------------------------------------------------------------
// Kịch bản 2: bài cờ ĐEN (bàn cờ tự xoay 180°) - phải đo đúng toạ độ đã lật.
// ----------------------------------------------------------------
console.log('\n▶ Kiểm tra mũi tên trên bàn cờ ĐÃ XOAY (Phòng thủ Sicilian, nước c5)')

// Mở khoá tất cả bài học qua localStorage rồi tải lại trang.
await evaluate(`
  (() => {
    localStorage.setItem(
      'hoc-vien-co-vua-nhi.v1',
      JSON.stringify({
        stars: 0,
        completed: [],
        notation: 'figurine',
        soundOn: false,
        unlockAll: true,
      }),
    )
    location.hash = '#black'
    location.reload()
    return true
  })()
`)
await sleep(3000)

// Ô bài học trên bản đồ chỉ hiện số cấp + emoji, nên tìm qua tooltip (title).
const pickedLesson = await evaluate(`
  (() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      (b.getAttribute('title') || '').includes('Sicilian'),
    )
    if (!button) return 'not-found'
    button.click()
    return button.getAttribute('title')
  })()
`)
check(
  String(pickedLesson).includes('Sicilian'),
  `đã chọn bài cờ Đen (tooltip: ${pickedLesson})`,
)

// Sang ply 1 = nước của bé (c5).
await sleep(500)
const stepped = await evaluate(`
  (() => {
    const button = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Tiến'),
    )
    if (!button) return 'not-found'
    button.click()
    return button.textContent.trim()
  })()
`)
check(stepped.includes('Tiến'), `đã bấm “${stepped}” để xem nước c5 của bé`)

await sleep(700)

const flipped = await evaluate(`
  (() => {
    const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
    if (!overlay) return { error: 'không tìm thấy lớp mũi tên' }
    const paths = [...overlay.querySelectorAll('path')]
    if (paths.length === 0) return { error: 'không có mũi tên nào' }
    const box = (el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, size: r.width }
    }
    const square = (name) => {
      const el = document.getElementById('kid-board-square-' + name)
      return el ? box(el) : null
    }
    return { arrow: box(paths[0]), c7: square('c7'), c5: square('c5') }
  })()
`)

if (!flipped || flipped.error) {
  check(false, `không đọc được hình học bàn cờ xoay: ${flipped?.error ?? 'không rõ'}`)
} else if (!flipped.c7 || !flipped.c5) {
  check(false, 'không tìm thấy ô c7 / c5 trên bàn cờ xoay')
} else {
  const square = flipped.c7.size
  const tolerance = square * 0.12
  check(
    flipped.arrow.bottom <= flipped.c7.bottom + tolerance &&
      flipped.arrow.bottom >= flipped.c7.top - tolerance,
    `đuôi mũi tên ở ô c7 (đáy ${flipped.arrow.bottom.toFixed(0)}px, c7 = ${flipped.c7.top.toFixed(0)}–${flipped.c7.bottom.toFixed(0)}px)`,
  )
  check(
    flipped.arrow.top >= flipped.c5.top - tolerance &&
      flipped.arrow.top <= flipped.c5.bottom + tolerance,
    `đầu mũi tên ở ô c5 (đỉnh ${flipped.arrow.top.toFixed(0)}px, c5 = ${flipped.c5.top.toFixed(0)}–${flipped.c5.bottom.toFixed(0)}px)`,
  )
  const lengthInSquares = (flipped.arrow.bottom - flipped.arrow.top) / square
  check(
    lengthInSquares > 1.4 && lengthInSquares < 2.6,
    `mũi tên dài ~2 ô cờ (đo được ${lengthInSquares.toFixed(2)} ô)`,
  )

  // Bàn cờ đã xoay: hàng 7–8 phải nằm ở NỬA DƯỚI màn hình (sát mép bé ngồi).
  const orientationOk = await evaluate(`
    (() => {
      const seven = document.getElementById('kid-board-square-c7').getBoundingClientRect()
      const two = document.getElementById('kid-board-square-c2').getBoundingClientRect()
      return seven.top > two.top
    })()
  `)
  check(orientationOk === true, 'hàng 7–8 nằm sát mép bé ngồi (bàn cờ đã xoay 180°)')
}

close()
finish('BROWSER ARROW')
