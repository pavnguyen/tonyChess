/**
 * Kiểm tra tab **Đấu tập tự do với chú Máy** sau khi tinh gọn độ khó:
 *   1. Chỉ còn **3 mức**: Vừa · Khó · Siêu (đã bỏ mức Dễ vì quá dễ).
 *   2. Nút **💡 Gợi ý**: bấm thì máy tìm nước mạnh nhất cho CHÍNH bé và vẽ **mũi tên
 *      vàng** chỉ nước đó (dùng engine JS chạy trong Web Worker).
 *   3. **Giới hạn 3 lần gợi ý mỗi ván**: đếm ngược trên nút, hết thì nút tự khoá;
 *      bấm ♟️ Ván mới thì được cấp lại đủ 3 lần.
 *
 * Chạy: npm run check:freeplay
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}/free-play`, {
  port: 9387,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra Đấu tập tự do.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const waitFor = async (selector, timeoutMs = 12000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true
    await sleep(150)
  }
  return false
}

const clickId = (id) =>
  evaluate(`
    (() => {
      const el = document.getElementById(${JSON.stringify(id)})
      if (!el) return false
      el.click()
      return true
    })()
  `)

/** Đếm mũi tên chỉ trong lớp phủ mũi tên của bàn cờ (không đếm icon trang). */
const arrowCount = () =>
  evaluate(`
    (() => {
      const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
      return overlay ? overlay.querySelectorAll('path').length : 0
    })()
  `)

const waitForArrow = async (timeoutMs = 8000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await arrowCount()) > 0) return true
    await sleep(200)
  }
  return false
}

/** Nội dung nút 💡 (đã áp text-transform uppercase). */
const hintLabel = () =>
  evaluate(`(document.getElementById('kid-freeplay-hint')?.innerText || '').trim()`)

/** Nút 💡 có đang bị khoá không. */
const hintDisabled = () =>
  evaluate(`Boolean(document.getElementById('kid-freeplay-hint')?.disabled)`)

/** Bấm 💡 rồi chờ máy tính xong (nút hết trạng thái “Đang tính…”). */
const pressHintAndWait = async () => {
  await clickId('kid-freeplay-hint')
  // Chờ React kịp bật trạng thái “Đang tính…” rồi mới chờ nó tắt.
  await sleep(400)
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    if (!(await hintBusy())) return true
    await sleep(200)
  }
  return false
}

const hintBusy = () =>
  evaluate(`/đang tính/i.test(document.getElementById('kid-freeplay-hint')?.innerText || '')`)

await sleep(2500)

console.log('\n▶ Độ khó tinh gọn: chỉ còn 3 mức')

check(await waitFor('#kid-board-board'), 'bàn cờ sẵn sàng')
check(await waitFor('#kid-freeplay-hint'), 'có nút “💡 Gợi ý”')

const tabTexts = await evaluate(
  `[...document.querySelectorAll('[role="tab"]')].map((t) => (t.innerText || '').trim())`,
)
const joined = JSON.stringify(tabTexts)
check(
  joined.includes('Vừa') && joined.includes('Khó') && joined.includes('Siêu'),
  `có đủ 3 mức Vừa · Khó · Siêu (${joined})`,
)
check(!joined.includes('Dễ'), `không còn mức Dễ (${joined})`)
check(Array.isArray(tabTexts) && tabTexts.length === 5, `đúng 5 nút tab: 2 chọn quân + 3 độ khó (${tabTexts.length})`)

console.log('\n▶ Bấm 💡 Gợi ý → máy vẽ mũi tên nước tốt nhất cho bé')

check((await arrowCount()) === 0, 'chưa bấm thì chưa có mũi tên gợi ý')
check(await clickId('kid-freeplay-hint'), 'bấm “💡 Gợi ý”')
check(await waitForArrow(), 'máy tính xong và vẽ mũi tên vàng chỉ nước nên đi')

console.log('\n▶ Giới hạn 3 lần gợi ý mỗi ván')

check((await hintLabel()).includes('(2)'), `bấm 1 lần → còn 2 (${await hintLabel()})`)
check(!(await hintDisabled()), 'còn lượt thì nút 💡 vẫn bấm được')

// Bấm thêm 2 lần nữa cho hết sạch 3 lượt.
check(await pressHintAndWait(), 'bấm lần 2 (máy tính xong)')
check(await pressHintAndWait(), 'bấm lần 3 (máy tính xong)')
check(/hết/i.test(await hintLabel()), `hết lượt → nút báo hết (${await hintLabel()})`)
check(await hintDisabled(), 'hết 3 lượt → nút 💡 tự khoá')

const arrowsAtLimit = await arrowCount()
check((await clickId('kid-freeplay-hint')) === true, 'vẫn gọi được nút (kiểm tra nút bị khoá chặn bấm)')
await sleep(400)
check((await arrowCount()) === arrowsAtLimit, 'bấm khi đã khoá thì không vẽ thêm gì')

console.log('\n▶ ♟️ Ván mới → cấp lại đủ 3 lần gợi ý')

check(
  await evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        /ván mới/i.test(b.innerText || ''),
      )
      if (!btn) return false
      btn.click()
      return true
    })()
  `),
  'bấm “♟️ Ván mới”',
)
await sleep(600)
check((await hintLabel()).includes('(3)'), `ván mới → nút 💡 hiện lại (3) (${await hintLabel()})`)
check(!(await hintDisabled()), 'ván mới → nút 💡 bấm được trở lại')

close()
finish('BROWSER FREEPLAY HINT')

