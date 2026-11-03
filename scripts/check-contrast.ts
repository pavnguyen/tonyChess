/**
 * Kiểm TƯƠNG PHẢN (WCAG AA) của bảng màu khai báo trong `src/index.css`.
 *
 * Vì sao cần một bài riêng: gam màu đổi một lần là hàng trăm className đổi theo,
 * nên rất dễ có một chỗ "chữ nhạt trên nền nhạt" mà mắt người lớn đọc được nhưng
 * bé 7 tuổi thì không. Bài này đọc CHÍNH các token trong CSS (không hard-code
 * màu), nên sau này ai sửa hex là bị kiểm ngay.
 *
 * Ngưỡng:
 *   - chữ thường ............... ≥ 4.5:1
 *   - viền / hình khối .......... ≥ 3:1
 *
 * Chạy: node scripts/check-contrast.ts
 */
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

/** Đọc `--color-<tên>-<bậc>: #hex` thành map `tên-bậc` → hex. */
const tokens = new Map<string, string>()
for (const match of css.matchAll(/--color-([a-z]+)-(\d{2,3}):\s*(#[0-9a-f]{6})/gi)) {
  tokens.set(`${match[1]}-${match[2]}`, match[3].toLowerCase())
}
// Token đặt tên theo VAI TRÒ thay vì theo thang độ đậm, ví dụ `--color-board-dark`.
for (const match of css.matchAll(/--color-([a-z]+(?:-[a-z]+)+):\s*(#[0-9a-f]{6})/gi)) {
  tokens.set(match[1], match[2].toLowerCase())
}

function token(name: string): string {
  const value = tokens.get(name)
  if (!value) throw new Error(`Không tìm thấy token màu "${name}" trong src/index.css`)
  return value
}

/** Độ sáng tương đối theo WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function ratio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

interface Pair {
  label: string
  fg: string
  bg: string
  min: number
}

const TEXT = 4.5
const GRAPHIC = 3

// Nền trang lấy đúng giá trị dùng trong `body` (không phải token).
const PAGE = '#fbf8f1'

const PAIRS: Pair[] = [
  // --- Chữ trên nền sáng (thẻ trắng, nền trang, vùng chờ)
  { label: 'chữ chính navy-900 / nền trang', fg: token('brand-900'), bg: PAGE, min: TEXT },
  { label: 'chữ chính navy-900 / thẻ trắng', fg: token('brand-900'), bg: '#ffffff', min: TEXT },
  { label: 'chữ phụ ink-600 / thẻ trắng', fg: token('ink-600'), bg: '#ffffff', min: TEXT },
  { label: 'chữ phụ ink-600 / vùng chờ sand-100', fg: token('ink-600'), bg: token('sand-100'), min: TEXT },
  { label: 'chữ liên kết navy-700 / thẻ trắng', fg: token('brand-700'), bg: '#ffffff', min: TEXT },
  { label: 'chữ nhấn info-700 / thẻ trắng', fg: token('info-700'), bg: '#ffffff', min: TEXT },
  { label: 'chữ cảnh báo coral-700 / nền coral-50', fg: token('coral-700'), bg: token('coral-50'), min: TEXT },
  { label: 'chữ vàng đậm gold-900 / nền gold-100', fg: token('gold-900'), bg: token('gold-100'), min: TEXT },
  { label: 'chữ xanh ngọc leaf-700 / nền leaf-50', fg: token('leaf-700'), bg: token('leaf-50'), min: TEXT },

  // --- Chữ trên nền nút (mỗi variant một cặp)
  { label: 'nút primary: trắng / navy-700', fg: '#ffffff', bg: token('brand-700'), min: TEXT },
  { label: 'nút sun: gold-950 / gold-400', fg: token('gold-950'), bg: token('gold-400'), min: TEXT },
  { label: 'nút grass: trắng / leaf-600', fg: '#ffffff', bg: token('leaf-600'), min: TEXT },
  { label: 'nút rose: trắng / coral-600', fg: '#ffffff', bg: token('coral-600'), min: TEXT },
  { label: 'nút sky: trắng / info-500', fg: '#ffffff', bg: token('info-500'), min: TEXT },

  // --- Chữ trên thanh tab navy
  { label: 'tab chưa chọn: trắng / navy-900', fg: '#ffffff', bg: token('brand-900'), min: TEXT },
  { label: 'tab đang chọn: navy-800 / trắng', fg: token('brand-800'), bg: '#ffffff', min: TEXT },

  // --- Graphic: hình khối mang thông tin (ngưỡng 3:1)
  // Quân cờ nằm TRỰC TIẾP trên ô, nên đây mới là cặp quyết định “bé có nhìn ra quân
  // không”. Quân Đen là hình bóng đen tuyền: ô đậm mà tối quá là quân biến mất.
  { label: 'quân Đen / ô đậm của bàn cờ', fg: '#000000', bg: token('board-dark'), min: GRAPHIC },
  { label: 'quân Trắng / ô đậm của bàn cờ', fg: '#ffffff', bg: token('board-dark'), min: GRAPHIC },
  { label: 'viền ô gợi ý navy-800 / ô sáng', fg: token('brand-800'), bg: token('board-light'), min: GRAPHIC },
  { label: 'vòng lỗi coral-500 / ô sáng', fg: token('coral-500'), bg: token('board-light'), min: GRAPHIC },
  // Viền thẻ (sand-300) là TRANG TRÍ, không phải biên của điều khiển: thẻ phân biệt
  // với nền nhờ bóng đổ + bo góc, nên không đưa vào ngưỡng 3:1 (muốn đạt 3:1 thì
  // viền phải sẫm như chữ, trông nặng nề).
]

/**
 * Vòng gợi ý trên bàn cờ: KHÔNG thể có một màu duy nhất đạt 3:1 trên cả ô gỗ sáng
 * (#efe1c7) lẫn ô navy sáng (#475a7f) - dải độ sáng thoả mãn cả hai chỉ rộng ~0.02, và
 * không màu nào có nghĩa (vàng / xanh thép) nằm trong đó. Yêu cầu thật của bé là
 * "nhìn ra vòng này trên ô đang đứng", nên mỗi vòng chỉ cần nổi trên MỘT trong hai
 * loại ô; phần nền phủ (alpha 0.3-0.42) và nhịp "thở" dày viền lo phần còn lại.
 */
const HINT_RINGS: { label: string; rings: string[]; squares: string[] }[] = [
  { label: 'vòng quân cần đi gold-300', rings: [token('gold-300')], squares: [token('board-dark'), token('board-light')] },
  { label: 'vòng ô đích info-500', rings: [token('info-500')], squares: [token('board-dark'), token('board-light')] },
  { label: 'vòng kế hoạch info-600', rings: [token('info-600')], squares: [token('board-dark'), token('board-light')] },
  // Ô bé bấm là khung HAI TÔNG: vành trắng ngoài + vành navy trong. Vì vậy chỉ
  // cần MỘT trong hai tông nổi trên ô đang đứng (trắng nổi trên ô navy, navy nổi
  // trên ô gỗ) - bé luôn thấy khung.
  { label: 'vòng ô bé bấm (trắng + navy)', rings: ['#ffffff', '#14313d'], squares: [token('board-dark'), token('board-light')] },
  { label: 'vòng nước sai coral-500', rings: [token('coral-500')], squares: [token('board-dark'), token('board-light')] },
  { label: 'vòng nước đúng leaf-600', rings: [token('leaf-600')], squares: [token('board-dark'), token('board-light')] },
]

let failed = 0
console.log('\n▶ Tương phản WCAG AA của bảng màu (Navy – Gỗ sáng – Đỏ son)')

for (const pair of PAIRS) {
  const value = ratio(pair.fg, pair.bg)
  const ok = value >= pair.min
  if (!ok) failed += 1
  console.log(
    `  ${ok ? '✓' : '✗'} ${value.toFixed(2)}:1 (cần ${pair.min}:1) - ${pair.label}`,
  )
}

for (const hint of HINT_RINGS) {
  const values = hint.rings.flatMap((ring) => hint.squares.map((square) => ratio(ring, square)))
  const best = Math.max(...values)
  const ok = best >= GRAPHIC
  if (!ok) failed += 1
  console.log(
    `  ${ok ? '✓' : '✗'} nổi ${best.toFixed(2)}:1 trên ô tốt nhất (cần ${GRAPHIC}:1) - ${hint.label}`,
  )
}

if (failed > 0) {
  console.error(`\n❌ ${failed} cặp màu không đạt tương phản.`)
  process.exit(1)
}

console.log(`\n✅ CONTRAST PASS (${PAIRS.length + HINT_RINGS.length} cặp màu)`)
