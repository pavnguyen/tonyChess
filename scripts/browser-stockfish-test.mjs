/**
 * Kiểm tra thật trong trình duyệt: bản Stockfish WASM đi kèm (public/stockfish/)
 * khởi động được và trả về một nước hợp lệ.
 *
 * Chỉ mở một Worker tới tệp tĩnh - đúng con đường mà app dùng ở mức "Siêu".
 *
 * Chạy: node scripts/browser-stockfish-test.mjs  (cần `npx vite preview --port 5198`)
 */
import { Chess } from 'chess.js'
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = new URL('/free-play', process.env.APP_URL ?? 'http://localhost:5198').href

const { skipped, failedToConnect, evaluate, close } = await openPage(APP_URL, {
  port: 9357,
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra trình duyệt.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

console.log('\n▶ Kiểm tra trình duyệt: Stockfish WASM (bản đi kèm)')

await sleep(1500)

// Xác nhận tệp tĩnh phục vụ được (đúng cả khi build xong).
const served = await evaluate(`
  fetch('/stockfish/stockfish-19-lite-single.js', { method: 'HEAD' })
    .then((r) => r.status)
    .catch(() => 0)
`, true)
check(served === 200, `tệp engine được phục vụ (HTTP ${served})`)

const wasmServed = await evaluate(`
  fetch('/stockfish/stockfish-19-lite-single.wasm', { method: 'HEAD' })
    .then((r) => r.status)
    .catch(() => 0)
`, true)
check(wasmServed === 200, `tệp WASM được phục vụ (HTTP ${wasmServed})`)

// Chạy thẳng engine trong một Worker: uci → uciok → position/go → bestmove.
const result = await evaluate(
  `
  new Promise((resolve) => {
    const lines = []
    let worker
    try {
      worker = new Worker('/stockfish/stockfish-19-lite-single.js')
    } catch (error) {
      resolve({ error: 'không tạo được Worker: ' + String(error) })
      return
    }
    let finished = false
    const done = (payload) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      try { worker.terminate() } catch (e) {}
      resolve(payload)
    }
    const timer = setTimeout(() => done({ error: 'hết giờ 30s', lines }), 30000)

    worker.onmessage = (event) => {
      const line = String(event.data)
      lines.push(line)
      if (line.trim() === 'uciok') {
        worker.postMessage('position startpos')
        worker.postMessage('go depth 12')
      }
      if (line.startsWith('bestmove')) done({ bestmove: line, lines })
    }
    worker.onerror = (event) => done({ error: 'worker lỗi: ' + (event.message || '') })
    worker.postMessage('uci')
  })
`,
  true,
)

if (result && result.error) {
  check(false, `engine chạy được (lỗi: ${result.error})`)
} else if (result && result.bestmove) {
  check(true, `engine trả về: “${result.bestmove.trim()}”`)

  const infoLines = (result.lines ?? []).filter((line) => line.startsWith('info'))
  check(infoLines.length > 0, `engine thật sự tìm kiếm (${infoLines.length} dòng "info")`)

  const token = result.bestmove.trim().split(/\s+/)[1]
  check(
    /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(token),
    `nước đi đúng định dạng UCI: “${token}”`,
  )

  const probe = new Chess()
  let legal = false
  try {
    probe.move({ from: token.slice(0, 2), to: token.slice(2, 4), promotion: token[4] ?? 'q' })
    legal = true
  } catch {
    legal = false
  }
  check(legal, `nước đi hợp lệ trên thế cờ xuất phát (“${probe.history().at(-1) ?? token}”)`)
} else {
  check(false, 'engine KHÔNG trả về nước đi')
}

// ── Phần 2: chính app dùng Stockfish ở mức "Siêu" ─────────────────────────────
console.log('\n▶ Kiểm tra: app dùng Stockfish ở mức Siêu')

const pickedMaster = await evaluate(`
  (() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.closest('[role="tablist"]') && b.textContent.includes('Siêu'),
    )
    if (!btn) return 'not-found'
    btn.click()
    return btn.textContent.trim()
  })()
`)
check(
  typeof pickedMaster === 'string' && pickedMaster.includes('Siêu'),
  `đã bấm chọn mức “Siêu” (nút: ${pickedMaster})`,
)

// Cho bé cầm quân Đen → máy (Trắng) đi nước đầu tiên bằng Stockfish.
await evaluate(`
  (() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.closest('[role="tablist"]') && b.textContent.includes('Đen'),
    )
    if (btn) btn.click()
    return true
  })()
`)

let engineMoved = false
for (let attempt = 0; attempt < 40 && !engineMoved; attempt += 1) {
  await sleep(500)
  const status = await evaluate(`
    (() => {
      const badge = [...document.querySelectorAll('p,span,div')].find((el) =>
        /Lượt của bé|Chờ máy đi|đang suy nghĩ|bị chiếu/.test(el.textContent || ''),
      )
      return badge ? badge.textContent.trim() : ''
    })()
  `)
  if (typeof status === 'string' && /Lượt của bé|bị chiếu/.test(status)) engineMoved = true
}
check(engineMoved, 'sau khi bé cầm quân Đen, máy (Stockfish) đã đi nước đầu và trao lượt lại')

close()
finish('BROWSER STOCKFISH')
