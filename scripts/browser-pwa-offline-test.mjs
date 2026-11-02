/**
 * Kiểm tra app đã **cài** được và **chạy được khi mất mạng** - đúng cảnh bé mở app
 * từ màn hình chính trên điện thoại rồi đi vào nơi không có wifi.
 *
 * Cách làm: mở Chrome headless ở khung điện thoại 390×844 (mobile + touch), chờ
 * service worker cài xong, **tắt mạng bằng DevTools** (`Network.emulateNetworkConditions`
 * offline), tải lại trang rồi vào tab Đấu ván - nơi cần engine Stockfish.
 *
 * Chạy: node scripts/browser-pwa-offline-test.mjs  (cần `npx vite preview --port 5198`)
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5198/').replace(/\/$/, '')

const { skipped, failedToConnect, evaluate, send, close } = await openPage(APP_URL, {
  port: 9381,
  windowSize: '390,844',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm PWA offline.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

const waitFor = async (expression, timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if (await evaluate(expression)) return true
    } catch {
      /* trang đang tải lại */
    }
    await sleep(200)
  }
  return false
}

const setOffline = (offline) =>
  send('Network.emulateNetworkConditions', {
    offline,
    latency: 0,
    downloadThroughput: offline ? 0 : -1,
    uploadThroughput: offline ? 0 : -1,
  })

console.log('\n▶ PWA trên khung điện thoại: cài xong thì mở được khi mất mạng')

await send('Network.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  mobile: true,
})
await send('Emulation.setTouchEmulationEnabled', { enabled: true })
await send('Page.reload')
await sleep(1500)

const manifestHref = await evaluate(
  `document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? ''`,
)
check(
  String(manifestHref).includes('manifest.webmanifest'),
  `trang khai báo manifest để cài ra màn hình chính (${manifestHref || 'không có'})`,
)

// Service worker + bộ nhớ đệm phải sẵn sàng TRƯỚC khi tắt mạng.
const swReady = await waitFor(
  `(async () => {
    const reg = await navigator.serviceWorker.ready.catch(() => null)
    return Boolean(reg && reg.active)
  })()`,
)
check(swReady, 'service worker đã cài và đang chạy (điều kiện để cài app)')

// Workbox lưu mỗi tệp kèm `?__WB_REVISION__=…` nên phải liệt kê KHOÁ của cache
// rồi so khớp theo chuỗi, chứ `cache.match('/index.html')` sẽ trượt.
const cached = await evaluate(
  `(async () => {
    const keys = await caches.keys()
    const urls = []
    for (const key of keys) {
      const cache = await caches.open(key)
      for (const request of await cache.keys()) urls.push(request.url)
    }
    return {
      keys,
      total: urls.length,
      engine: urls.some((url) => url.includes('stockfish') && url.includes('.wasm')),
      home: urls.some((url) => url.includes('index.html') || url.endsWith('/')),
    }
  })()`,
  true,
)
check(cached?.home, `trang chủ đã được cache để mở offline (${cached?.total ?? 0} tệp)`)
check(cached?.engine, 'engine Stockfish (WASM) đã được cache để chơi offline')

// ── TẮT MẠNG ────────────────────────────────────────────────────────────────
await setOffline(true)
await sleep(300)

// Dùng GET (không phải HEAD): service worker chỉ đáp ứng request GET từ cache.
const offlineFetch = await evaluate(
  `fetch('/stockfish/stockfish-19-lite-single.js')
    .then((r) => (r.ok ? 200 : r.status))
    .catch(() => 0)`,
  true,
)
check(offlineFetch === 200, `tắt mạng rồi vẫn tải được file engine (HTTP ${offlineFetch})`)

await send('Page.reload')
await sleep(2500)

const navOffline = await waitFor(`Boolean(document.getElementById('kid-tab-nav'))`)
check(navOffline, 'tắt mạng rồi tải lại: app vẫn mở (thanh 3 nhóm hiện ra)')

// Font TỰ HOST phải nằm trong precache: mất mạng mà font rơi về font hệ thống thì
// dấu tiếng Việt đổi dáng và cả thiết kế lệch - đúng lỗi đã gặp khi còn dùng Google Fonts.
const offlineFont = await evaluate(
  `document.fonts.check('16px "Be Vietnam Pro"')`,
  true,
)
check(
  offlineFont === true,
  'tắt mạng vẫn có font Be Vietnam Pro (chữ không rơi về font hệ thống)',
)

// Mở đúng tab Đấu ván khi đang offline.
await evaluate(`window.location.href = ${JSON.stringify(`${APP_URL}/free-play`)}`)
const boardOffline = await waitFor(
  `Boolean(document.getElementById('kid-board-board'))`,
  15000,
)
check(boardOffline, 'tắt mạng vào tab Đấu ván: bàn cờ vẫn hiện')

const fightButtons = await evaluate(`
  (() => {
    const labels = [...document.querySelectorAll('[role="tablist"] button')].map((b) =>
      (b.textContent || '').trim(),
    )
    return labels
  })()
`)
check(
  Array.isArray(fightButtons) && fightButtons.some((label) => label.includes('Dễ')),
  `tab Đấu ván hiện đủ mức chọn khi offline (${(fightButtons ?? []).join(' · ')})`,
)

// Engine thật sự chạy được offline (Worker + WASM đều lấy từ cache).
const engine = await evaluate(
  `
  new Promise((resolve) => {
    let worker
    try {
      worker = new Worker('/stockfish/stockfish-19-lite-single.js')
    } catch (error) {
      resolve({ error: String(error) })
      return
    }
    let done = false
    const finishWith = (payload) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try { worker.terminate() } catch (e) {}
      resolve(payload)
    }
    const timer = setTimeout(() => finishWith({ error: 'hết giờ 30s' }), 30000)
    worker.onmessage = (event) => {
      const line = String(event.data)
      if (line.trim() === 'uciok') {
        worker.postMessage('position startpos')
        worker.postMessage('go depth 10')
      }
      if (line.startsWith('bestmove')) finishWith({ bestmove: line.trim() })
    }
    worker.onerror = (event) => finishWith({ error: 'worker lỗi: ' + (event.message || '') })
    worker.postMessage('uci')
  })
`,
  true,
)

if (engine?.error) {
  check(false, `engine chạy offline (lỗi: ${engine.error})`)
} else if (engine?.bestmove) {
  const token = String(engine.bestmove).split(/\s+/)[1] ?? ''
  check(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(token), `engine chạy offline: “${engine.bestmove}”`)
} else {
  check(false, 'engine KHÔNG chạy được khi offline')
}

// Trả mạng lại để không ảnh hưởng bài kiểm sau (nếu chạy chung lượt).
await setOffline(false)

close()
finish('BROWSER PWA OFFLINE')
