/**
 * Kiểm tra mục **🔈 Giọng đọc** trong ⚙️ Tùy chọn của bé:
 *   1. Danh sách giọng tiếng Anh máy có hiện ra (hoặc lời nhắc nếu máy không có).
 *   2. MỖI dòng có nút 🔊 nghe thử riêng, bấm được và không gây lỗi.
 *   3. Chọn một giọng thì lưu vào `localStorage` và còn nguyên sau khi tải lại.
 *
 * Chạy: node scripts/browser-voice-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')
const VOICE_STORAGE_KEY = 'hoc-vien-co-vua-nhi.voice.v1'

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

const voiceState = () =>
  evaluate(`
    (() => {
      const list = document.getElementById('kid-voice-list')
      const note = [...document.querySelectorAll('p')].find((p) =>
        p.innerText.includes('chưa có giọng tiếng Anh'),
      )
      const rows = list ? [...list.querySelectorAll('[data-voice-name]')] : []
      return {
        hasList: Boolean(list),
        rowCount: rows.length,
        previewButtons: rows.filter((r) => (r.innerText || '').includes('🔊')).length,
        hasNote: Boolean(note),
        selected: rows
          .filter((r) => r.querySelector('button[aria-pressed="true"]'))
          .map((r) => r.getAttribute('data-voice-name')),
      }
    })()
  `)

await sleep(2200)
await evaluate(`localStorage.removeItem(${JSON.stringify(VOICE_STORAGE_KEY)})`)
await evaluate('location.reload()')
await sleep(2200)

console.log('\n▶ Mục “Giọng đọc” trong ⚙️')
check(await openGear(), 'mở được bảng ⚙️ Tùy chọn của bé')
await sleep(400)

const state = await voiceState()
check(
  state.hasList || state.hasNote,
  state.hasList
    ? 'hiện danh sách giọng đọc tiếng Anh'
    : 'máy không có giọng tiếng Anh → hiện lời nhắc thay vì ô trống',
)

if (!state.hasList || state.rowCount <= 1) {
  console.log('  (bỏ qua phần chọn giọng: máy này không có giọng tiếng Anh nào)')
  close()
  finish('BROWSER VOICE')
}

check(state.rowCount >= 2, `có ít nhất 2 dòng giọng (Tự động + ${state.rowCount - 1} giọng máy có)`)
check(state.previewButtons === state.rowCount, `MỖI dòng đều có nút 🔊 nghe thử riêng (${state.previewButtons}/${state.rowCount})`)
check(state.selected.length === 1, 'đúng một dòng đang được chọn (mặc định là “Tự động”)')

// --- Bấm 🔊 ở một dòng bất kỳ: phải không gây lỗi. ---
const previewed = await evaluate(`
  (() => {
    const list = document.getElementById('kid-voice-list')
    const rows = [...list.querySelectorAll('[data-voice-name]')]
    const row = rows[1]
    if (!row) return 'no-row'
    const buttons = [...row.querySelectorAll('button')]
    buttons[buttons.length - 1].click()
    return row.getAttribute('data-voice-name')
  })()
`)
check(typeof previewed === 'string' && previewed !== 'no-row', `bấm “🔊 Nghe thử” riêng của giọng “${previewed}” không lỗi`)

// --- Chọn chính dòng đó (bấm tên) rồi kiểm tra lưu lại. ---
const picked = await evaluate(`
  (() => {
    const list = document.getElementById('kid-voice-list')
    const row = [...list.querySelectorAll('[data-voice-name]')].find(
      (r) => r.getAttribute('data-voice-name') === ${JSON.stringify(previewed)},
    )
    if (!row) return null
    row.querySelector('button').click()
    return row.getAttribute('data-voice-name')
  })()
`)
check(picked === previewed, `chọn được giọng “${picked}” bằng cách bấm tên`)
const stored = await evaluate(`localStorage.getItem(${JSON.stringify(VOICE_STORAGE_KEY)})`)
check(stored === picked, `lựa chọn được lưu vào localStorage (“${stored}”)`)

console.log('\n▶ Nhớ lựa chọn qua lần tải lại')
await evaluate('location.reload()')
await sleep(2200)
await openGear()
await sleep(400)
const after = await voiceState()
check(
  after.selected.length === 1 && after.selected[0] === picked,
  `tải lại trang vẫn giữ giọng đã chọn (${after.selected[0]})`,
)

close()
finish('BROWSER VOICE')
