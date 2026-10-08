/**
 * Kiểm tra bố cục: nội dung chính phải nằm gọn trong màn hình, hạn chế tối đa
 * việc bé phải cuộn dọc / cuộn ngang, và bàn cờ phải đủ to.
 *
 * Chạy: node scripts/browser-layout-test.mjs  (cần `npx vite preview --port 5198`)
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const BASE = process.env.APP_URL ?? 'http://localhost:5198'

// `minBoard`: bàn cờ phải chiếm phần lớn khung nhìn, không được teo nhỏ lại.
// `mustFitHeight`: cả trang không được cuộn dọc (cửa sổ rộng như máy tính).
// Mọi khung nhìn đều phải thấy TRỌN khối bàn cờ (bàn cờ + băng giải thích / nút)
// mà không cần cuộn - đó là điều bé cần nhất.
const VIEWPORTS = [
  { name: 'Máy tính 1440×900', width: 1440, height: 900, mustFitHeight: true, minBoard: 600 },
  { name: 'Laptop 1366×768', width: 1366, height: 768, mustFitHeight: true, minBoard: 480 },
  { name: 'Tablet 1024×768', width: 1024, height: 768, mustFitHeight: true, minBoard: 440 },
  { name: 'Cửa sổ hẹp 980×720', width: 980, height: 720, mustFitHeight: true, minBoard: 360 },
  { name: 'Cửa sổ vuông 1200×1200', width: 1200, height: 1200, mustFitHeight: true, minBoard: 480 },
  { name: 'Máy tính dọc 1024×1366', width: 1024, height: 1366, mustFitHeight: false, minBoard: 600 },
  { name: 'iPad dọc 820×1180', width: 820, height: 1180, mustFitHeight: false, minBoard: 600 },
  { name: 'Điện thoại 390×844', width: 390, height: 844, mustFitHeight: false, minBoard: 330 },
  // iPhone 15 Pro Max: dựng đứng thì bàn cờ phải rộng gần hết màn hình (9 khung
  // ảnh 8 cột), nằm ngang thì chiều cao là thứ khan hiếm - lúc đó khối bàn cờ
  // phải tự tách 2 cột để bé vẫn thấy TRỌN bàn cờ mà không phải cuộn trang.
  { name: 'iPhone 15 Pro Max dọc 430×932', width: 430, height: 932, mustFitHeight: false, minBoard: 370 },
  {
    name: 'iPhone 15 Pro Max ngang 932×430',
    width: 932,
    height: 430,
    mustFitHeight: false,
    minBoard: 290,
  },
]

const ROUTES = [
  { path: '/', name: 'Khai cuộc' },
  // Trang Đối phó có thêm hàng trạng thái (đối thủ + màu quân) trên bàn cờ nên chấp
  // nhận bàn cờ nhỏ hơn một chút, giống cách xử lý của trang Chiến lược.
  { path: '/counters', name: 'Đối phó khai cuộc', minBoardScale: 0.9 },
  { path: '/tactics', name: 'Nước hay nhất' },
  { path: '/endgames', name: 'Tàn cuộc' },
  // Trang Chiến lược có nhiều nút điều khiển dưới bàn cờ hơn nên chừa nhiều chỗ hơn.
  { path: '/strategy', name: 'Chiến lược', minBoardScale: 0.86 },
  { path: '/free-play', name: 'Đấu Máy' },
]

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${BASE}/#layout`,
  { port: 9335 },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra bố cục.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

console.log('\n▶ Kiểm tra bố cục: hạn chế cuộn dọc / cuộn ngang')

const measure = () =>
  evaluate(`
    (() => {
      const de = document.documentElement
      const boardEl0 = document.getElementById('kid-board-board')
      const board = boardEl0 ?? document.querySelector('div[class*="aspect-square"]')
      const card = board && board.closest('.card-pop')
      const cols = [...document.querySelectorAll('div')].filter((el) => {
        const s = getComputedStyle(el)
        return s.overflowY === 'auto' && el.scrollHeight > el.clientHeight + 2
      })
      const worst = cols
        .map((el) => el.scrollHeight - el.clientHeight)
        .sort((a, b) => b - a)[0] ?? 0
      const rect = board ? board.getBoundingClientRect() : null
      const cardRect = card ? card.getBoundingClientRect() : null
      return {
        card: cardRect
          ? { top: cardRect.top, bottom: cardRect.bottom, left: cardRect.left, right: cardRect.right }
          : null,
        scrollW: de.scrollWidth,
        scrollH: de.scrollHeight,
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        hiddenColumns: cols.length,
        worstHidden: worst,
        board: rect
          ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, size: rect.width }
          : null,
      }
    })()
  `)

/**
 * Chờ cho bàn cờ thật sự được render thay vì ngủ một khoảng cố định: khi cả bộ
 * bài kiểm tra chạy liên tiếp, Chrome lúc nhanh lúc chậm nên chờ cứng dễ "báo
 * lỗi oan" (từng có lần báo "không tìm thấy bàn cờ" dù bố cục hoàn toàn đúng).
 */
const waitForBoard = async (timeoutMs = 10000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    let ready = false
    try {
      ready = await evaluate(
        `Boolean(document.getElementById('kid-board-board'))`,
      )
    } catch {
      // Trang đang chuyển hướng → thử lại.
    }
    if (ready) {
      // Thêm một nhịp ngắn để font và hiệu ứng bố cục ổn định.
      await sleep(350)
      return true
    }
    await sleep(150)
  }
  return false
}

for (const viewport of VIEWPORTS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  console.log(`\n  ── ${viewport.name} ──`)

  for (const route of ROUTES) {
    // Vài trang có nhiều nút điều khiển dưới bàn cờ hơn nên chấp nhận bàn cờ nhỏ
    // hơn một chút, tính theo tỉ lệ của từng khung nhìn.
    const minBoard = Math.round(viewport.minBoard * (route.minBoardScale ?? 1))
    await evaluate(`location.href = ${JSON.stringify(`${BASE}${route.path}`)}`)

    await waitForBoard()
    const m = await measure()
    if (!m) {
      check(false, `${route.name}: không đo được bố cục`)
      continue
    }

    // 1. Không bao giờ được tràn ngang.
    check(
      m.scrollW <= m.innerW + 2,
      `${route.name}: không tràn ngang (${m.scrollW} ≤ ${m.innerW}px)`,
    )

    // 2. Trên máy tính/tablet: cả trang không được cuộn dọc.
    if (viewport.mustFitHeight) {
      check(
        m.scrollH <= m.innerH + 2,
        `${route.name}: trang không cuộn dọc (${m.scrollH} ≤ ${m.innerH}px)`,
      )
    }

    // 3. Bàn cờ luôn nằm trọn trong màn hình.
    if (m.board) {
      check(
        m.board.top >= -2 &&
          m.board.bottom <= m.innerH + 2 &&
          m.board.left >= -2 &&
          m.board.right <= m.innerW + 2,
        `${route.name}: bàn cờ nằm trọn trong màn hình (${Math.round(m.board.size)}px)`,
      )
      check(
        m.board.size >= minBoard,
        `${route.name}: bàn cờ đủ lớn (${Math.round(m.board.size)} ≥ ${minBoard}px)`,
      )
    } else {
      check(false, `${route.name}: không tìm thấy bàn cờ`)
    }

    // 4. Cả khối bàn cờ (kèm băng giải thích / nút bên dưới) phải nằm trong màn hình.
    if (m.card) {
      check(
        m.card.top >= -2 && m.card.bottom <= m.innerH + 2,
        `${route.name}: thấy trọn khối bàn cờ, không phải cuộn (đáy ${Math.round(
          m.card.bottom,
        )} ≤ ${m.innerH}px)`,
      )
      const slack = m.innerH - m.card.bottom
      if (slack > 40) console.log(`     ℹ còn dư ${Math.round(slack)}px dưới khối bàn cờ`)
    }

    const reading = await evaluate(`(() => {
      const root = document.querySelector('.lesson-reader')
      const text = root ? [...root.querySelectorAll('p, li')].filter(el =>
        el.innerText.trim() && el.getClientRects().length) : []
      return { present: Boolean(root), count: text.length,
        small: text.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).length }
    })()`)
    check(reading.present && reading.count > 0 && reading.small === 0,
      `${route.name}: câu hướng dẫn trong vùng đọc ít nhất 16px`)

    // Thanh tab phải hiển thị đủ 6 tab, không bị cắt mất tab nào.
    const tabCount = await evaluate(`document.querySelectorAll('nav a').length`)
    check(tabCount === 6, `${route.name}: thanh tab có đủ 6 tab (${tabCount})`)

    if (route.path === '/strategy') {
      // Cả 20 thế minh họa và trạng thái thử thách ở mọi cỡ màn hình:
      // lời giải dài giờ nằm trong cột đọc, không được làm bàn cờ teo lại.
      const ids = await evaluate(`[...document.querySelectorAll('[data-principle-id]')].map(el => el.dataset.principleId)`)
      for (const id of ids) {
        await evaluate(`document.querySelector('[data-principle-id="${id}"]').click()`)
        for (const label of ['Nên làm', 'Không nên', 'Thử xem bé hiểu chưa']) {
          await evaluate(`[...document.querySelectorAll('button')].find(el => el.innerText.includes('${label}')).click()`)
          await sleep(80)
          const example = await measure()
          check(example.scrollW <= example.innerW + 2 && example.board.size >= minBoard &&
            example.card.bottom <= example.innerH + 2,
            `Chiến lược ${id} / ${label}: chữ lớn không lấn bàn cờ`)
        }
        await evaluate(`[...document.querySelectorAll('button')].find(el => el.innerText.includes('Xem bài học')).click()`)
      }
    }

    if (m.hiddenColumns > 0) {
      console.log(
        `     ℹ ${route.name}: ${m.hiddenColumns} cột phải cuộn nội bộ, nhiều nhất ${m.worstHidden}px`,
      )
    }
  }
}

close()
finish('BROWSER LAYOUT')
