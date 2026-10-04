/**
 * Kiểm tra phần **Trung cuộc** sau khi nâng cấp:
 *   1. Tab Khai cuộc có khung “Luyện đòn cho khai cuộc này”: 2 liên kết kèm đúng họ đòn.
 *   2. Bấm một liên kết → mở thẳng tab Trung cuộc với họ đòn đó (`/tactics?type=…`)
 *      và hiện đúng thế cờ của họ đòn ấy.
 *   3. Dòng “Khi nào dùng?” của họ đòn đang học đủ rõ.
 *   4. Giải xong → hiện nút “Xem lại đòn”; bấm thì nước giải được **đi lại** kèm mũi tên
 *      vàng (bé xem lại cho nhớ), đồng thời bàn cờ đọc to nước giải.
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

await sleep(2500)

console.log('\n▶ Trung cuộc mở sẵn đúng chủ đề qua đường dẫn')

await evaluate(`window.location.href = ${JSON.stringify(APP_URL + '/tactics?theme=passed-pawn')}`)
await sleep(1800)
check(await waitFor('#kid-tactic-when'), 'hiện dòng “Khi nào dùng?” của chủ đề')

const url = await evaluate(`location.pathname + location.search`)
check(
  String(url).includes('/tactics') && String(url).includes('theme=passed-pawn'),
  `mở thẳng tab Trung cuộc kèm chủ đề trên đường dẫn (${url})`,
)

const whenText = await evaluate(`document.getElementById('kid-tactic-when')?.innerText ?? ''`)
check(
  String(whenText).includes('Khi nào dùng?') && String(whenText).replace(/\s+/g, ' ').length >= 60,
  `“Khi nào dùng?” đủ rõ cho ba mẹ đọc (${String(whenText).replace(/\s+/g, ' ').slice(0, 90)}…)`,
)

check(
  await waitForText('Tốt thông tiến lên'),
  'mở sẵn đúng thế cờ đầu của chủ đề “Tốt thông tiến”',
)

console.log('\n▶ Giải xong → “Xem lại nước hay nhất” phát lại nước đúng')

check(
  !String(await bodyText()).includes('Xem lại nước hay nhất'),
  'chưa giải thì chưa có nút “Xem lại nước hay nhất”',
)

check(await waitFor('#kid-tactic-think'), 'chưa giải và chưa gợi ý thì không lộ đáp án')

// Giải thế pawn-1 bằng bấm-chọn-đi: Tốt d5 → d6 (nước hay nhất theo máy).
await clickSquare('d5')
await sleep(250)
await clickSquare('d6')
check(await waitForText('Chuẩn rồi'), 'đi đúng nước d6 → báo giải xong')
check(await waitFor('#kid-tactic-replay'), 'hiện nút “Xem lại nước hay nhất” sau khi giải')

const speechReady = await evaluate(`
  (() => {
    if (!window.speechSynthesis) return false
    window.__spoken = []
    window.speechSynthesis.speak = (utterance) => { window.__spoken.push(utterance.text) }
    window.speechSynthesis.cancel = () => {}
    return true
  })()
`)

await clickById('kid-tactic-replay')
await sleep(800)

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
    arrived: Boolean(document.getElementById('kid-board-piece-wP-d6')),
    onStart: Boolean(document.getElementById('kid-board-piece-wP-d5')),
  }))()
`)
check(replaying.arrived, 'phát lại: quân Tốt được đi lại về ô d6')
check(!replaying.onStart, 'phát lại: Tốt đã rời ô xuất phát d5')
const arrowsDuringReplay = await arrowCount()
check(arrowsDuringReplay > 0, `phát lại: có mũi tên vàng chỉ nước giải (${arrowsDuringReplay} mũi tên)`)

if (speechReady) {
  const spoken = await evaluate(`window.__spoken.slice()`)
  check(
    spoken.some((text) => /Pawn D 6/.test(text)),
    `phát lại: bàn cờ đọc to nước hay nhất theo giọng Mỹ (đã đọc: ${JSON.stringify(spoken)})`,
  )
} else {
  console.log('  ℹ Trình duyệt không có speechSynthesis - bỏ qua bài kiểm phát âm')
}

// Đợi phát lại xong: bàn cờ vẫn giữ thế đã giải, mũi tên tự ẩn.
await sleep(1200)
check(
  await evaluate(`Boolean(document.getElementById('kid-board-piece-wP-d6'))`),
  'phát lại xong: thế cờ vẫn ở đúng nước hay nhất (không bị lệch)',
)
const arrowsAfter = await arrowCount()
check(arrowsAfter === 0, `phát lại xong: mũi tên tự ẩn (${arrowsAfter} mũi tên)`)
check(await waitForText('Chuẩn rồi'), 'phát lại xong: bé vẫn có thể bấm “Thế cờ tiếp”')

console.log('\n▶ Phím tắt ◀ ▶ đổi thế cờ (như tab Khai cuộc)')

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
await pressKey('ArrowRight', 'ArrowRight', 39)
await sleep(500)
const badgeAfter = String(await readBadge())
check(
  badgeBefore && badgeAfter && badgeBefore !== badgeAfter,
  `phím ▶ sang thế cờ kế tiếp (${badgeBefore} → ${badgeAfter})`,
)

await pressKey('ArrowLeft', 'ArrowLeft', 37)
await sleep(500)
const badgeBack = String(await readBadge())
check(badgeBack === badgeBefore, `phím ◀ quay về thế cờ trước (${badgeBack})`)

console.log('\n▶ Làm lại và đổi bài khi đang phát lời giải')
// Quay về bài đầu đã giải rồi giải lại để phát lời giải.
await clickSquare('d5')
await sleep(250)
await clickSquare('d6')
await waitFor('#kid-tactic-replay')
await evaluate(`document.querySelector('[role="dialog"]')?.click()`)
await clickById('kid-tactic-replay')
await evaluate(`[...document.querySelectorAll('button')].find(el => el.innerText.includes('Làm lại')).click()`)
await sleep(1600)
check(await evaluate(`Boolean(document.getElementById('kid-board-piece-wP-d5'))`), 'Làm lại hủy lời giải đang phát, giữ thế ban đầu')
check(await waitFor('#kid-tactic-think'), 'Làm lại ẩn đáp án để bé tự giải')
await clickSquare('d5')
await sleep(250)
await clickSquare('d6')
await waitFor('#kid-tactic-replay')
await evaluate(`document.querySelector('[role="dialog"]')?.click()`)
await clickById('kid-tactic-replay')
await clickById('kid-tactic-next')
await sleep(1600)
check(await evaluate(`Boolean(document.getElementById('kid-board-piece-wP-e5'))`), 'đổi bài hủy timer lời giải cũ, giữ Tốt bài mới ở e5')
check(await waitFor('#kid-tactic-think'), 'bài mới không lộ đáp án cũ')

close()
finish('BROWSER TACTICS')
