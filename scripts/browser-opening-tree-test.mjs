/**
 * Kiểm tra “Cây khai cuộc phân nhánh” (§4.4) trong trình duyệt thật:
 *   1. Có khung “🌳 Cây khai cuộc” liệt kê các ngã ba, nhánh chính gắn ⭐.
 *   2. Có khung “🧭 Kế hoạch trung cuộc” với đủ 3 việc.
 *   3. Đi tới nước của ĐỐI THỦ ở ngã ba thì app DỪNG LẠI: khung chọn nhánh hiện ra
 *      và nút “Tiến” bị khoá (không để bé nhảy qua mất phần chọn nhánh).
 *   4. Bé bấm một nhánh KHÁC nhánh chính thì bàn cờ đi đúng theo nhánh đó.
 *   5. Bấm một nhánh trong khung “Cây khai cuộc” thì app nhảy thẳng tới nhánh ấy.
 *
 * Chạy: node scripts/browser-opening-tree-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}#opening-tree`, {
  port: 9364,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra cây khai cuộc.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const textOf = (selector) =>
  evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      return el ? el.innerText : null
    })()
  `)

const hasPiece = (pieceId) =>
  evaluate(`Boolean(document.getElementById('kid-board-piece-${pieceId}'))`)

const buttonTexts = (selector = 'body') =>
  evaluate(`
    [...document.querySelectorAll(${JSON.stringify(selector)} + ' button')].map((b) => b.textContent.trim())
  `)

/** Bấm nút đầu tiên có chứa `text` (trả về nhãn nút, hoặc 'not-found'). */
const clickButton = (text, selector = 'body') =>
  evaluate(`
    (() => {
      const button = [...document.querySelectorAll(${JSON.stringify(selector)} + ' button')].find((b) =>
        b.textContent.includes(${JSON.stringify(text)}),
      )
      if (!button) return 'not-found'
      button.click()
      return button.textContent.trim()
    })()
  `)

console.log('\n▶ Cây khai cuộc phân nhánh (§4.4)')

// Chờ bàn cờ + dữ liệu khai cuộc render xong.
let ready = false
for (let attempt = 0; attempt < 40 && !ready; attempt += 1) {
  await sleep(250)
  ready = await evaluate(`Boolean(document.getElementById('kid-opening-tree'))`)
}
check(ready, 'khung “🌳 Cây khai cuộc” đã hiện')

// --- 1. Cây khai cuộc: có ngã ba, nhánh chính gắn ⭐.
const treeText = String(await textOf('#kid-opening-tree'))
check(treeText.includes('Cây khai cuộc'), 'khung có tiêu đề “Cây khai cuộc”')
check(
  treeText.includes('3 ngã ba'),
  `khung báo đúng số ngã ba của London - “${treeText.replace(/\n/g, ' | ')}”`,
)
// Chuỗi này bị CSS `uppercase` đổi thành chữ HOA khi đọc `innerText`.
check(treeText.includes('ĐỐI THỦ ĐÁP'), 'có ngã ba của ĐỐI THỦ')
check(treeText.includes('BÉ CHỌN'), 'có ngã ba của BÉ (nhiều nước lý thuyết)')
check(treeText.includes('⭐'), 'nhánh chính được đánh dấu ⭐')
const treeButtons = await buttonTexts('#kid-opening-tree')
check(treeButtons.length >= 5, `khung có đủ nút nhánh (${treeButtons.length} nút: ${treeButtons.join(', ')})`)

// --- 2. Kế hoạch trung cuộc.
const planText = String(await textOf('#kid-opening-plan'))
check(planText.includes('Kế hoạch trung cuộc của Trắng'), 'khung kế hoạch có đúng tiêu đề')
const planPoints = await evaluate(`document.querySelectorAll('#kid-opening-plan li').length`)
check(planPoints === 3, `kế hoạch có đủ 3 việc (${planPoints})`)

// --- 3. Chưa tới ngã ba thì KHÔNG có khung chọn nhánh.
check(
  !(await evaluate(`Boolean(document.getElementById('kid-opening-fork'))`)),
  'chưa tới ngã ba thì không có khung chọn nhánh',
)

console.log('\n▶ Đi tới ngã ba của đối thủ thì app dừng lại')
// --- 4. Bấm “Tiến” 5 lần: 1.d4 d5 2.Bf4 Nf6 3.Nf3 → tới lượt Đen ở ngã ba.
for (let step = 0; step < 5; step += 1) {
  await clickButton('Tiến')
  await sleep(260)
}
// Chờ quân cờ “bay” xong: thư viện bàn cờ vẽ quân ở ô CŨ trong lúc chạy hiệu ứng,
// nên đọc DOM quá sớm sẽ tưởng bàn cờ chưa tiến (từng báo lỗi oan như vậy).
await sleep(450)
const forkText = await textOf('#kid-opening-fork')
check(forkText !== null, 'tới ngã ba: khung chọn nhánh đã hiện')
check(
  String(forkText).toUpperCase().includes('NGÃ BA') && String(forkText).includes('3 CÁCH ĐÁP'),
  `khung báo đúng số cách đáp của Đen - “${String(forkText).replace(/\n/g, ' | ')}”`,
)
const forkButtons = await buttonTexts('#kid-opening-fork')
check(
  forkButtons.length === 3 && forkButtons[0].includes('e6'),
  `khung có 3 nhánh, dòng chính e6 đứng đầu (${forkButtons.join(' | ')})`,
)
const forwardDisabled = await evaluate(`
  (() => {
    const button = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Tiến'))
    return button ? button.disabled : null
  })()
`)
check(forwardDisabled === true, 'nút “Tiến” bị khoá khi đang chờ bé chọn nhánh')
// Bàn cờ vẫn đứng ở nước thứ 5 của Đen (chưa tự đi).
check(
  await hasPiece('wN-f3'),
  'bàn cờ vẫn dừng đúng ở thế trước nước đáp của Đen (Mã Trắng còn ở f3)',
)

// --- 5. Bé chọn nhánh “c5” (không phải nhánh chính) → bàn cờ đi theo nhánh đó.
console.log('\n▶ Bé chọn một nhánh khác nhánh chính')
const chosen = await clickButton('c5', '#kid-opening-fork')
check(chosen !== 'not-found', `đã bấm nhánh “${chosen}”`)
await sleep(500)
check(
  !(await evaluate(`Boolean(document.getElementById('kid-opening-fork'))`)),
  'chọn xong thì khung chọn nhánh tự đóng',
)
check(await hasPiece('bP-c5'), 'quân Tốt Đen đã nằm ở c5 (đi đúng theo nhánh bé chọn)')
check(await hasPiece('wP-d4'), 'Tốt Trắng vẫn ở d4 (nhánh này Đen đổi Tốt ở trung tâm)')
const stripChip = await evaluate(`
  [...document.querySelectorAll('button')]
    .map((b) => b.textContent.trim())
    .filter((t) => t.includes('3...'))[0] ?? null
`)
check(
  stripChip === '3... c5',
  `dải nước đi hiện đúng nước vừa chọn (nhận ${JSON.stringify(stripChip)})`,
)

// --- 6. Bấm thẳng một nhánh trong khung “Cây khai cuộc” thì nhảy tới nhánh đó.
console.log('\n▶ Nhảy thẳng tới một nhánh từ khung “Cây khai cuộc”')
const jumped = await clickButton('e3', '#kid-opening-tree')
check(jumped !== 'not-found', `đã bấm nhánh “${jumped}” của BÉ trong cây`)
await sleep(500)
check(await hasPiece('wP-e3'), 'quân Tốt Trắng đã nằm ở e3 (nhảy đúng vào nhánh)')
check(!(await hasPiece('wN-f3')), 'Mã Trắng chưa ra f3 (đang ở nhánh e3 trước)')
check(!(await hasPiece('bP-c5')), 'bàn cờ đã bỏ nhánh c5 trước đó')

// --- 7. Kế hoạch SINH TỰ ĐỘNG theo thế cờ (mức 3 của §4.4).
console.log('\n▶ Kế hoạch theo thế cờ hiện tại (máy đọc thế cờ)')

// Chơi lại từ đầu: chưa hết khai cuộc thì chưa có gì để bàn.
await clickButton('Đầu')
await sleep(500)
check(
  !(await evaluate(`Boolean(document.getElementById('kid-live-plan'))`)),
  'chưa hết khai cuộc thì CHƯA hiện kế hoạch theo thế cờ',
)

// Đi hết dòng chính: gặp ngã ba thì chọn nhánh chính (nút có ⭐), hết nước thì dừng.
for (let step = 0; step < 24; step += 1) {
  const forkOpen = await evaluate(`Boolean(document.getElementById('kid-opening-fork'))`)
  if (forkOpen) {
    await clickButton('⭐', '#kid-opening-fork')
    await sleep(500)
    continue
  }
  const blocked = await evaluate(`
    (() => {
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Tiến'))
      return !button || button.disabled
    })()
  `)
  if (blocked) break
  await clickButton('Tiến')
  await sleep(300)
}
await sleep(600)

// Chờ máy đọc xong thế cờ (việc tính được đẩy ra khỏi đường render).
let planReady = false
for (let attempt = 0; attempt < 40 && !planReady; attempt += 1) {
  await sleep(250)
  planReady = await evaluate(
    `Boolean(document.querySelector('#kid-live-plan-items li'))`,
  )
}
check(planReady, 'hết khai cuộc → khung “🔎 Kế hoạch theo thế cờ hiện tại” đã hiện')

const livePlanText = String(await textOf('#kid-live-plan'))
check(livePlanText.includes('Kế hoạch theo thế cờ hiện tại'), 'khung có đúng tiêu đề')
check(livePlanText.includes('Máy đọc thế cờ'), 'khung có câu máy đánh giá thế cờ')
const itemCount = await evaluate(`document.querySelectorAll('#kid-live-plan-items li').length`)
check(
  itemCount >= 2 && itemCount <= 4,
  `kế hoạch có 2-4 việc vừa sức bé (${itemCount} việc)`,
)
check(
  await evaluate(`Boolean(document.querySelector('#kid-live-plan-items [data-kind="engine"]'))`),
  'có việc do ENGINE đề xuất (đúng tinh thần “sinh từ engine”)',
)
check(/Máy muốn đi/.test(livePlanText), 'nói rõ nước máy muốn đi')

// Kế hoạch này KHÁC kế hoạch viết tay: nó đọc chính thế cờ đang đứng.
const staticPlan = String(await textOf('#kid-opening-plan'))
check(
  livePlanText !== staticPlan && !staticPlan.includes('🤖'),
  'kế hoạch sinh tự động KHÁC 3 câu viết tay ở khung trên',
)

// Đổi thế cờ (lùi một nước) thì kế hoạch phải được tính lại, không giữ nguyên bản cũ.
const beforeBack = livePlanText
await clickButton('Lùi')
await sleep(900)
const afterBack = String(await textOf('#kid-live-plan'))
check(afterBack.length > 0, 'lùi một nước vẫn có kế hoạch (tính lại cho thế mới)')
check(afterBack !== beforeBack, 'khác thế cờ → kế hoạch được tính lại, không đứng yên')

close()
finish('BROWSER OPENING TREE')
