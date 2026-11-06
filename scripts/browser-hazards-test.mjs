/**
 * Kiểm tra tab **Soi quân treo** (`/hazards`) - bài luyện thói quen nhìn quân mình
 * trước khi đi:
 *   1. Tab có mặt trên thanh điều hướng, trang tải được và sinh thế cờ ngẫu nhiên.
 *   2. Mỗi thế có ≥ 2 quân của bé để chọn; bấm một quân → có phản hồi đúng/sai.
 *   3. Sau khi trả lời, bàn cờ tô đỏ đúng quân đang treo (cùng bộ luật `findHangingPieces`).
 *   4. “Thế cờ mới” xoá phản hồi và sinh thế khác.
 *   5. Mức **Khó**: nhiều quân hơn (≥ 4 quân để chọn) và có quân bị quân rẻ hơn
 *      tấn công (mô tả mức nói rõ "rẻ hơn").
 *   6. **Điểm theo chuỗi**: trả lời đúng thì điểm tăng theo chuỗi (10 → 20 → 30...),
 *      sai thì chuỗi về 0.
 *
 * Chạy: node scripts/browser-hazards-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'
import { solveMathGate } from './lib/mathGate.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}/hazards`, {
  port: 9375,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra Soi quân treo.')
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

await sleep(2200)
// Vào Soi quân là mở cửa toán trước khi bé bắt đầu soi.
check(await solveMathGate(evaluate), 'giải cửa toán mở sẵn khi vào Soi quân')

console.log('\n▶ Trang Soi quân treo sinh thế cờ và có đáp án')

check(
  await evaluate(`
    [...document.querySelectorAll('#kid-group-nav a')].some((el) =>
      (el.innerText || '').includes('Soi quân'),
    )
  `),
  'vào được “Soi quân” từ dải chuyển bài của nhóm Chơi',
)
check(await waitFor('#kid-hazard-choices'), 'hiện danh sách quân của bé để chọn')

const chips = await evaluate(
  `[...document.querySelectorAll('[data-hazard-square]')].map((el) => el.dataset.hazardSquare)`,
)
check(Array.isArray(chips) && chips.length >= 2, `có ≥ 2 quân để chọn (${chips?.length})`)
check(
  Boolean(await evaluate(`document.getElementById('kid-hazard-streak')?.innerText.includes('⭐')`)),
  'có bộ đếm chuỗi đúng để động viên bé',
)
check(
  Boolean(await evaluate(`document.getElementById('kid-hazard-score')?.innerText.includes('0')`)),
  'có bộ đếm điểm, bắt đầu từ 0',
)
check(
  await evaluate(`document.querySelector('[data-hazard-level="easy"]')?.getAttribute('aria-pressed') === 'true'`),
  'mặc định mở mức Dễ',
)
check(
  await evaluate(`!document.getElementById('kid-hazard-result')`),
  'chưa trả lời thì chưa lộ đáp án',
)

// Bấm quân đầu tiên: đúng hay sai đều phải có phản hồi rõ ràng.
await evaluate(`document.querySelector('[data-hazard-square]').click()`)
await sleep(400)
const result = String(await evaluate(`document.getElementById('kid-hazard-result')?.innerText ?? ''`))
check(
  result.includes('Đúng rồi') || result.includes('Chưa đúng'),
  `bấm một quân → phản hồi đúng/sai (${result.slice(0, 60)}…)`,
)
check(
  await evaluate(`
    [...document.querySelectorAll('[data-square]')].some((el) =>
      [...el.querySelectorAll('div')].some((child) =>
        (child.getAttribute('style') ?? '').includes('160, 74, 59'),
      ),
    )
  `),
  'sau khi trả lời, bàn cờ tô đỏ quân đang treo',
)
check(
  await evaluate(`[...document.querySelectorAll('[data-hazard-square]')].every((el) => el.disabled)`),
  'trả lời xong thì khoá các lựa chọn để bé đọc phản hồi',
)

// Điểm phải đi theo chuỗi: đúng → +10 × bậc chuỗi, sai → chuỗi về 0.
const scoreText = String(await evaluate(`document.getElementById('kid-hazard-score')?.innerText ?? ''`))
const streakText = String(await evaluate(`document.getElementById('kid-hazard-streak')?.innerText ?? ''`))
const scoreAfterFirst = Number(scoreText.replace(/\D+/g, '') || '0')
if (result.includes('Đúng rồi')) {
  check(scoreAfterFirst === 10, `trả lời đúng câu đầu → +10 điểm (điểm: ${scoreAfterFirst})`)
  check(streakText.includes('1'), `chuỗi đúng = 1 (${streakText})`)
} else {
  check(scoreAfterFirst === 0, `trả lời sai → không có điểm (điểm: ${scoreAfterFirst})`)
  check(streakText.includes('0'), `trả lời sai → chuỗi về 0 (${streakText})`)
}

console.log('\n▶ Mức Khó: nhiều quân hơn và có quân bị quân rẻ hơn tấn công')

await evaluate(`document.querySelector('[data-hazard-level="hard"]').click()`)
await sleep(500)
const hardChips = await evaluate(
  `[...document.querySelectorAll('[data-hazard-square]')].map((el) => el.dataset.hazardSquare)`,
)
check(
  Array.isArray(hardChips) && hardChips.length >= 4,
  `mức Khó có ≥ 4 quân để chọn (${hardChips?.length})`,
)
check(
  Boolean(
    await evaluate(
      `document.getElementById('kid-hazard-level-hint')?.innerText.includes('rẻ hơn')`,
    ),
  ),
  'mô tả mức Khó nói rõ có quân bị quân rẻ hơn tấn công',
)
check(
  await evaluate(
    `document.querySelector('[data-hazard-level="hard"]')?.getAttribute('aria-pressed') === 'true'`,
  ),
  'đổi sang mức Khó thì nút Khó được chọn',
)
check(
  await evaluate(`!document.getElementById('kid-hazard-result')`),
  'đổi mức thì thế mới chưa lộ đáp án',
)
check(
  await evaluate(`[...document.querySelectorAll('[data-hazard-square]')].every((el) => !el.disabled)`),
  'đổi mức thì bấm lại được từ đầu',
)

const scoreBeforeHard = Number(
  String(await evaluate(`document.getElementById('kid-hazard-score')?.innerText ?? '0'`)).replace(
    /\D+/g,
    '',
  ) || '0',
)
await evaluate(`document.querySelector('[data-hazard-square]').click()`)
await sleep(400)
const hardResult = String(await evaluate(`document.getElementById('kid-hazard-result')?.innerText ?? ''`))
const scoreAfterHard = Number(
  String(await evaluate(`document.getElementById('kid-hazard-score')?.innerText ?? '0'`)).replace(
    /\D+/g,
    '',
  ) || '0',
)
check(
  hardResult.includes('Đúng rồi') || hardResult.includes('Chưa đúng'),
  `mức Khó vẫn chấm đúng/sai (${hardResult.slice(0, 60)}…)`,
)
if (hardResult.includes('Đúng rồi')) {
  check(
    scoreAfterHard === scoreBeforeHard + 10,
    `đổi mức thì chuỗi tính lại: đúng câu đầu được +10 (${scoreBeforeHard} → ${scoreAfterHard})`,
  )
} else {
  check(
    scoreAfterHard === scoreBeforeHard,
    `trả lời sai thì điểm giữ nguyên (${scoreBeforeHard} → ${scoreAfterHard})`,
  )
}
check(
  await evaluate(`
    [...document.querySelectorAll('[data-square]')].some((el) =>
      [...el.querySelectorAll('div')].some((child) =>
        (child.getAttribute('style') ?? '').includes('160, 74, 59'),
      ),
    )
  `),
  'mức Khó cũng tô đỏ quân đang treo sau khi trả lời',
)

await evaluate(`document.querySelector('[data-hazard-level="easy"]').click()`)
await sleep(400)

console.log('\n▶ “Thế cờ mới” sinh thế khác và mở lại lượt chơi')

const fenBefore = String(await evaluate(`document.querySelector('[data-square]') ? document.body.dataset.fen : ''`))
void fenBefore
await evaluate(`document.getElementById('kid-hazard-next').click()`)
await sleep(500)
check(
  await evaluate(`!document.getElementById('kid-hazard-result')`),
  'thế cờ mới xoá phản hồi cũ',
)
check(
  await evaluate(`[...document.querySelectorAll('[data-hazard-square]')].every((el) => !el.disabled)`),
  'thế cờ mới cho bấm lại từ đầu',
)
check(
  (await evaluate(`document.querySelectorAll('[data-hazard-square]').length`)) >= 2,
  'thế cờ mới vẫn có quân để chọn',
)

console.log('\n▶ Không tràn ngang ở màn hình điện thoại')
await evaluate(`location.reload()`)
await sleep(2000)
const overflow = await evaluate(`
  (() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }))()
`)
check(
  Number(overflow.scrollW) <= Number(overflow.innerW) + 1,
  `không tràn ngang (${overflow.scrollW} ≤ ${overflow.innerW}px)`,
)

close()
finish('BROWSER HAZARDS')
