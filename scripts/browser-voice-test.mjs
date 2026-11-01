/**
 * Kiểm tra **giọng đọc** sau khi bỏ bảng chọn giọng trong ⚙️:
 *   1. ⚙️ KHÔNG còn danh sách giọng / nút 🔊 nghe thử (bảng đã được gỡ cho gọn).
 *   2. Vẫn còn một dòng cho biết app tự chọn giọng hay nhất.
 *   3. App thật sự đọc bằng **giọng Mỹ tự nhiên** (không phải giọng “đồ chơi”
 *      kiểu Albert / Bells / Bad News): bắt lấy utterance khi bé chạm một ô cờ.
 *
 * Chạy: node scripts/browser-voice-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

/** Giọng "đồ chơi" của macOS - nếu app tự chọn phải tránh. */
const NOVELTY = [
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Deranged',
  'Good News',
  'Grandma',
  'Grandpa',
  'Hysterical',
  'Jester',
  'Junior',
  'Organ',
  'Pipe Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
]

const { skipped, failedToConnect, evaluate, close } = await openPage(APP_URL, {
  port: 9381,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra giọng đọc.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const openGear = () =>
  evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find(
        (b) => (b.getAttribute('title') || '') === 'Tùy chọn của bé',
      )
      if (!btn) return false
      btn.click()
      return true
    })()
  `)

await sleep(2200)

console.log('\n▶ ⚙️ gọn: không còn bảng chọn giọng')

check(await openGear(), 'mở được bảng ⚙️ Tùy chọn của bé')
await sleep(400)

const panel = await evaluate(`
  (() => {
    const list = document.getElementById('kid-voice-list')
    return {
      hasList: Boolean(list),
      rows: document.querySelectorAll('[data-voice-name]').length,
      previewButtons: [...document.querySelectorAll('#kid-voice-list button')].length,
      hasNote: [...document.querySelectorAll('p')].some((p) =>
        p.innerText.includes('Giọng đọc'),
      ),
      text: (document.body.innerText || '').replace(/\\s+/g, ' '),
    }
  })()
`)

check(!panel.hasList, 'không còn danh sách giọng đọc trong ⚙️')
check(panel.rows === 0, `không còn dòng chọn giọng nào (${panel.rows})`)
check(panel.previewButtons === 0, 'không còn nút 🔊 nghe thử từng giọng')
check(panel.hasNote, 'vẫn có một dòng cho biết app tự chọn giọng hay nhất')
check(
  !NOVELTY.some((name) => panel.text.includes(`· ${name}`)),
  'không hiện tên các giọng “đồ chơi” trong bảng tuỳ chọn',
)

console.log('\n▶ App đọc bằng giọng Mỹ tự nhiên (không phải giọng đồ chơi)')

// Chặn hẳn việc phát âm thanh thật, chỉ ghi lại utterance để kiểm.
await evaluate(`
  (() => {
    window.__spoken = []
    const synth = window.speechSynthesis
    if (!synth) return
    synth.speak = (utterance) => {
      window.__spoken.push({
        text: utterance.text || '',
        lang: utterance.lang || '',
        voice: utterance.voice ? utterance.voice.name : null,
      })
    }
  })()
`)

// Đóng ⚙️ rồi chạm một ô cờ ở tab Khai cuộc → app đọc tên ô.
await evaluate(`
  (() => {
    const closeBtn = [...document.querySelectorAll('button')].find(
      (b) => (b.getAttribute('title') || '') === 'Tùy chọn của bé',
    )
    if (closeBtn) closeBtn.click()
  })()
`)
await sleep(300)

const tapped = await evaluate(`
  (() => {
    const square = document.getElementById('kid-board-square-e2')
    if (!square) return 'no-square'
    square.click()
    return 'e2'
  })()
`)
check(tapped === 'e2', 'chạm được ô cờ e2 trên bàn cờ')

await sleep(600)
const spoken = await evaluate(`window.__spoken || []`)
check(Array.isArray(spoken) && spoken.length > 0, `app có đọc toạ độ ô cờ (${spoken?.length} câu)`)

const first = (spoken ?? []).find((item) => item.text) ?? null
check(Boolean(first), `câu đọc đầu tiên: “${first?.text ?? ''}”`)
check(first?.lang === 'en-US', `đọc bằng giọng Mỹ (lang=${first?.lang})`)

const voiceName = first?.voice ?? ''
const isNovelty = NOVELTY.some((name) => voiceName === name || voiceName.startsWith(`${name} (`))
check(
  !voiceName || !isNovelty,
  voiceName
    ? `giọng tự chọn không phải giọng đồ chơi (“${voiceName}”)`
    : 'máy không có giọng tiếng Anh riêng → dùng giọng mặc định của trình duyệt',
)

close()
finish('BROWSER VOICE')
