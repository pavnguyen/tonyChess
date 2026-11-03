/**
 * Kiểm tra phần **Trung cuộc** ở mức KHÁ/GIỎI (đã bỏ các bài trung bình):
 *   1. Mở sẵn đúng chủ đề qua đường dẫn `/tactics?theme=…`.
 *   2. Dòng “Khi nào dùng?” của chủ đề đủ rõ.
 *   3. Bài **nhiều nước**: bé đi nước đầu → máy đáp → bé đi nước kết liễu mới xong.
 *   4. Giải xong → “Xem lại lời giải” phát lại cả chuỗi kèm mũi tên.
 *
 * Thế dùng để kiểm: `material-1` (Mã bắt đôi hai Xe, 3 nước của bé):
 *   Nd6 → (máy Kf8) → Nxc8 → (máy f6) → Nxa7
 *
 * Chạy: node scripts/browser-tactics-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(APP_URL, {
  port: 9369,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra tab Trung cuộc.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const bodyText = () => evaluate(`document.body.innerText`)

const waitFor = async (selector, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(150)
  }
  return false
}

const waitForText = async (needle, timeoutMs = 10000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const text = String(await bodyText())
    if (text.includes(needle)) return true
    await sleep(150)
  }
  return false
}

const clickById = (id) =>
  evaluate(`
    (() => {
      const el = document.getElementById(${JSON.stringify(id)})
      if (!el) return false
      el.click()
      return true
    })()
  `)

const clickSquare = (square) =>
  evaluate(`
    (() => {
      const el = document.getElementById('kid-board-square-' + ${JSON.stringify(square)})
      if (!el) return false
      el.click()
      return true
    })()
  `)

/**
 * Đưa bé về đúng thế `material-1` trên bản đồ.
 *
 * Vì sao cần: chủ đề “Trừng phạt quân treo” nay có nhiều thế hơn một, nên phím ▶
 * ở phần trên đầu bài kiểm có thể đã đưa bé sang thế khác. Bài kiểm phải tự quay
 * về thế nó muốn giải thay vì tin rằng chủ đề chỉ có một bài.
 */
const selectMaterialOne = async () => {
  await evaluate(`
    (() => {
      const node = document.querySelector('[data-level-id="material-1"]')
      if (node) node.click()
      return true
    })()
  `)
  await sleep(500)
  // Bấm thế trên bản đồ mở bàn XEM TRƯỚC (không kéo quân được) → phải bấm “▶ Giải thế này”.
  if (await evaluate(`Boolean(document.getElementById('kid-tactic-start'))`)) {
    await clickById('kid-tactic-start')
    await sleep(400)
  }
}

/** Giải trọn thế `material-1`: 3 nước của bé, giữa mỗi nước có nước máy đáp. */
const solveMaterialOne = async () => {
  await clickSquare('c4')
  await sleep(250)
  await clickSquare('d6')
  await sleep(1500) // máy đáp Kf8
  await clickSquare('d6')
  await sleep(250)
  await clickSquare('c8')
  await sleep(1500) // máy đáp f6
  await clickSquare('c8')
  await sleep(250)
  await clickSquare('a7')
}

await sleep(2500)

console.log('\n▶ Trung cuộc chỉ còn bài mức khá/giỏi, mở đúng chủ đề qua đường dẫn')

await evaluate(`window.location.href = ${JSON.stringify(APP_URL + '/tactics?theme=win-material')}`)
await sleep(1800)
check(await waitFor('#kid-tactic-when'), 'hiện dòng “Khi nào dùng?” của chủ đề')

const url = await evaluate(`location.pathname + location.search`)
check(
  String(url).includes('/tactics') && String(url).includes('theme=win-material'),
  `mở thẳng tab Trung cuộc kèm chủ đề trên đường dẫn (${url})`,
)

const whenText = await evaluate(`document.getElementById('kid-tactic-when')?.innerText ?? ''`)
check(
  String(whenText).includes('Khi nào dùng?') && String(whenText).replace(/\s+/g, ' ').length >= 60,
  `“Khi nào dùng?” đủ rõ cho ba mẹ đọc (${String(whenText).replace(/\s+/g, ' ').slice(0, 90)}…)`,
)

check(
  await waitForText('Mã bắt đôi hai Xe rồi ăn tiếp'),
  'mở sẵn đúng thế cờ của chủ đề “Trừng phạt quân treo”',
)

console.log('\n▶ Bài nhiều nước: đi một nước chưa xong, phải đi hết chuỗi')

check(
  !String(await bodyText()).includes('Xem lại lời giải'),
  'chưa giải thì chưa có nút “Xem lại lời giải”',
)

check(await waitFor('#kid-tactic-think'), 'chưa giải và chưa gợi ý thì không lộ đáp án')

const stepChip = await evaluate(`document.getElementById('kid-tactic-step')?.innerText ?? ''`)
check(
  /Nước 1\/([2-9])/.test(String(stepChip)),
  `thế cờ này buộc bé đi nhiều nước (chip: ${String(stepChip).trim()})`,
)

// Nước đầu (Mã c4 → d6) KHÔNG được coi là giải xong.
await clickSquare('c4')
await sleep(250)
await clickSquare('d6')
await sleep(400)
check(
  !String(await bodyText()).includes('Chuẩn rồi'),
  'nước đầu tiên chưa phải kết thúc - bé còn phải suy nghĩ tiếp',
)

// Máy đáp Kf8 → bé ăn Xe c8; máy đáp f6 → bé ăn Tốt a7.
await sleep(1300)
await clickSquare('d6')
await sleep(250)
await clickSquare('c8')
await sleep(400)
check(
  !String(await bodyText()).includes('Chuẩn rồi'),
  'nước thứ hai vẫn chưa kết thúc chuỗi',
)
await sleep(1300)
await clickSquare('c8')
await sleep(250)
await clickSquare('a7')
check(await waitForText('Chuẩn rồi'), 'đi hết chuỗi 3 nước → báo giải xong')
check(await waitFor('#kid-tactic-replay'), 'hiện nút “Xem lại lời giải” sau khi giải')

await clickById('kid-tactic-replay')
await sleep(900)

/** Đếm mũi tên chỉ trong lớp phủ mũi tên của bàn cờ (không đếm icon trang). */
const arrowCount = () =>
  evaluate(`
    (() => {
      const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
      return overlay ? overlay.querySelectorAll('path').length : 0
    })()
  `)

const replaying = await evaluate(`
  (() => ({
    arrived: Boolean(document.getElementById('kid-board-piece-wN-d6')),
    onStart: Boolean(document.getElementById('kid-board-piece-wN-c4')),
  }))()
`)
check(replaying.arrived, 'phát lại: quân Mã được đi lại về ô d6')
check(!replaying.onStart, 'phát lại: Mã đã rời ô xuất phát c4')
const arrowsDuringReplay = await arrowCount()
check(arrowsDuringReplay > 0, `phát lại: có mũi tên vàng chỉ nước giải (${arrowsDuringReplay} mũi tên)`)

// Đợi phát lại xong: bàn cờ đi hết chuỗi (Mã đứng a7), mũi tên tự ẩn.
await sleep(3800)
check(
  await evaluate(`Boolean(document.getElementById('kid-board-piece-wN-a7'))`),
  'phát lại xong: bàn cờ ở đúng thế cuối chuỗi (Mã đã ở a7)',
)
const arrowsAfter = await arrowCount()
check(arrowsAfter === 0, `phát lại xong: mũi tên tự ẩn (${arrowsAfter} mũi tên)`)
check(await waitForText('Chuẩn rồi'), 'phát lại xong: bé vẫn có thể bấm “Thế cờ tiếp”')

console.log('\n▶ Nút đổi thế cờ vẫn hoạt động')

const present = (id) => evaluate(`Boolean(document.getElementById(${JSON.stringify(id)}))`)
const readBadge = () =>
  evaluate(`
    (() => {
      const el = [...document.querySelectorAll('span')].find((s) =>
        (s.innerText || '').trim().startsWith('Thế cờ '),
      )
      return el ? el.innerText.trim() : ''
    })()
  `)
const pressKey = async (key, code, vk) => {
  const base = { key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
}

check(await present('kid-tactic-prev'), 'có nút ◀ Thế trước')
check(await present('kid-tactic-next'), 'có nút ➡️ Thế cờ tiếp')
const badgeBefore = String(await readBadge())
check(badgeBefore.includes('Thế cờ 1/'), `bảng số thế cờ đúng (${badgeBefore})`)
await pressKey('ArrowRight', 'ArrowRight', 39)
await sleep(500)
const badgeAfter = String(await readBadge())
check(badgeAfter.startsWith('Thế cờ '), `phím ▶ không làm vỡ trang (${badgeAfter || 'trống'})`)

console.log('\n▶ Làm lại và đổi bài khi đang phát lời giải')

await selectMaterialOne()
await solveMaterialOne()
await waitFor('#kid-tactic-replay')
await evaluate(`document.querySelector('[role="dialog"]')?.click()`)
await clickById('kid-tactic-replay')
await evaluate(`[...document.querySelectorAll('button')].find(el => el.innerText.includes('Làm lại')).click()`)
await sleep(1600)
check(
  await evaluate(`Boolean(document.getElementById('kid-board-piece-wN-c4'))`),
  'Làm lại hủy lời giải đang phát, giữ thế ban đầu',
)
check(await waitFor('#kid-tactic-think'), 'Làm lại ẩn đáp án để bé tự giải')

await solveMaterialOne()
await waitFor('#kid-tactic-replay')
await evaluate(`document.querySelector('[role="dialog"]')?.click()`)
await clickById('kid-tactic-replay')
await clickById('kid-tactic-next')
await sleep(1600)
// Sang thế KẾ TIẾP (nay chủ đề có nhiều thế) nên bàn cờ phải là thế đầu của bài
// mới - thế của “Mã bắt đôi Vua và Xe ở góc”, Mã đứng b5 - chứ không còn là thế cũ.
check(
  await evaluate(`Boolean(document.getElementById('kid-board-piece-wN-b5'))`),
  'đổi thế hủy timer lời giải cũ, bàn cờ về thế đầu của bài mới',
)
check(await waitFor('#kid-tactic-think'), 'thế mới không lộ đáp án cũ')

close()
finish('BROWSER TACTICS')
