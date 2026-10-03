/**
 * Ghim bảng màu thật của app trong trình duyệt (gam "Sồi & Ngọc"):
 *   - nền trang màu giấy ngà, KHÔNG còn tím;
 *   - thanh trên cùng màu xanh rừng đậm;
 *   - bàn cờ đúng kiểu giải đấu: ô trắng #ffffff + ô xanh lá đậm #2f6b4f;
 *   - mũi tên gợi ý màu vàng đồng, không phải tím/xanh dương.
 *
 * Bài này chống việc "đổi gam rồi lỡ tay để sót màu cũ" - đúng loại lỗi đã xảy
 * ra khi đổi từ gam tím sang gam xanh rừng.
 *
 * Chạy: node scripts/browser-theme-test.mjs
 */
import { makeChecker, openPage, sleep } from './lib/cdp.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5198/'

const { skipped, failedToConnect, evaluate, close } = await openPage(`${APP_URL}#theme`, {
  port: 9347,
  windowSize: '1440,900',
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua bài kiểm tra bảng màu.')
  console.log('   Đặt biến môi trường CHROME_PATH để chạy bài này.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('  ✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const { check, finish } = makeChecker()

console.log('\n▶ Bảng màu "Sồi & Ngọc" trong trình duyệt thật')

await sleep(2500)

const palette = await evaluate(`
  (() => {
    const rgb = (value) => (value || '').replace(/\\s+/g, ' ')
    const header = document.querySelector('header')
    const body = getComputedStyle(document.body)
    // Ô cờ: lấy trực tiếp từ lưới bàn cờ.
    const squares = [...document.querySelectorAll('[id^="kid-board-square-"]')].filter((el) =>
      /^kid-board-square-[a-h][1-8]$/.test(el.id),
    )
    const first = document.getElementById('kid-board-square-a1')
    const second = document.getElementById('kid-board-square-b1')
    const styleOf = (el) => {
      if (!el) return null
      const inner = el.querySelector('div')
      return {
        own: rgb(getComputedStyle(el).backgroundColor),
        inner: inner ? rgb(getComputedStyle(inner).backgroundColor) : null,
      }
    }
    return {
      bodyBg: rgb(body.backgroundColor),
      bodyColor: rgb(body.color),
      font: rgb(body.fontFamily),
      headerImage: rgb(getComputedStyle(header).backgroundImage),
      headerColor: rgb(getComputedStyle(header).backgroundColor),
      squareCount: squares.length,
      a1: styleOf(first),
      b1: styleOf(second),
    }
  })()
`)

check(palette.squareCount === 64, `bàn cờ có đủ 64 ô (nhận ${palette.squareCount})`)

// --- 1. Nền trang: giấy ngà, tuyệt đối không phải tím.
check(
  palette.bodyBg === 'rgb(251, 249, 244)',
  `nền trang màu giấy ngà #fbf9f4 (nhận ${palette.bodyBg})`,
)
check(
  !/rgba?\(1[0-9]{2}, [0-9]{1,2}|purple|violet|#6d28d9/i.test(palette.bodyBg + palette.headerImage),
  'không còn vệt màu tím nào trên nền trang / thanh trên cùng',
)

// --- 2. Chữ chính dùng tông xanh đen, không phải tím.
check(palette.bodyColor === 'rgb(31, 42, 36)', `chữ chính màu xanh đen #1f2a24 (nhận ${palette.bodyColor})`)

// --- 3. Thanh trên cùng: gradient xanh rừng đậm.
check(
  palette.headerImage.includes('rgb(22, 49, 37)') || palette.headerImage.includes('linear-gradient'),
  `thanh trên cùng có gradient xanh rừng (${palette.headerImage.slice(0, 72)}…)`,
)
check(
  palette.headerImage.includes('rgb(22, 49, 37)'),
  'gradient bắt đầu từ xanh rừng đậm nhất #163125',
)

// --- 4. Bàn cờ: trắng + xanh lá đậm (a1 là ô xanh, b1 là ô trắng).
const empty = (value) => value === 'rgba(0, 0, 0, 0)' || value === null
check(
  !empty(palette.a1?.own) && !empty(palette.b1?.own),
  `hai ô liền nhau đều được tô màu (a1 ${palette.a1?.own}, b1 ${palette.b1?.own})`,
)
const boardColors = [palette.a1?.own, palette.b1?.own]
check(
  boardColors.includes('rgb(47, 107, 79)'),
  `có ô xanh lá đậm #2f6b4f (nhận ${palette.a1?.own} / ${palette.b1?.own})`,
)
check(
  boardColors.includes('rgb(255, 255, 255)'),
  `có ô trắng #ffffff (nhận ${palette.a1?.own} / ${palette.b1?.own})`,
)
check(
  !boardColors.some((color) => /rgb\(126, 166, 245\)|rgb\(253, 243, 216\)/.test(color ?? '')),
  'không còn ô xanh dương #7ea6f5 / ô kem #fdf3d8 của bản cũ',
)

// --- 5. Mũi tên gợi ý: vàng đồng, không phải hổ phách cũ.
// Thư viện vẽ mũi tên bằng `stroke` cho thân và `fill` cho tam giác đầu mũi tên,
// nên phải kiểm tra cả hai chỗ mới chắc là đổi màu hết.
const arrow = await evaluate(`
  (() => {
    const overlay = [...document.querySelectorAll('svg')].find((s) => s.style.zIndex === '20')
    if (!overlay) return null
    const body = overlay.querySelector('path')
    const head = overlay.querySelector('marker polygon')
    return {
      stroke: body ? getComputedStyle(body).stroke : null,
      head: head ? getComputedStyle(head).fill : null,
    }
  })()
`)
check(
  arrow?.stroke === 'rgb(217, 169, 63)',
  `thân mũi tên màu vàng đồng #d9a93f (nhận ${arrow?.stroke})`,
)
check(arrow?.head === 'rgb(217, 169, 63)', `đầu mũi tên cũng vàng đồng (nhận ${arrow?.head})`)

// --- 6. Bộ nút dùng đúng gam mới và không còn bóng/màu tím.
const buttonColors = await evaluate(`
  (() => {
    const unique = new Set()
    for (const button of document.querySelectorAll('button')) {
      unique.add(getComputedStyle(button).backgroundColor)
    }
    return [...unique]
  })()
`)
const hasColor = (value) => buttonColors.includes(value)
check(hasColor('rgb(217, 169, 63)'), 'có nút vàng đồng #d9a93f (nút “Tiến”, cúp, sao ⭐)')
check(hasColor('rgb(58, 117, 71)'), 'có nút xanh non #3a7547 (nút “Tự chạy”, “Bắt đầu 30s”)')
check(
  !buttonColors.some((color) => /rgb\(109, 40, 217\)|rgb\(124, 58, 237\)|rgb\(236, 72, 153\)/.test(color)),
  `không còn nút tím/hồng của bản cũ (các màu nút: ${buttonColors.join(', ')})`,
)

close()
finish('BROWSER THEME')
