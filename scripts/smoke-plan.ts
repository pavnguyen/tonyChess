/**
 * Smoke test module **“Kế hoạch theo thế cờ hiện tại”** (`src/lib/livePlan.ts`).
 *
 * Chạy: node scripts/smoke-plan.ts
 *
 * Mục đích: chứng minh kế hoạch sinh tự động **nói đúng chuyện của thế cờ**, chứ
 * không phải câu chung chung. Mỗi quy tắc được dựng một thế cờ riêng để kiểm:
 *   - quân CỦA BÉ đang treo → cảnh báo đỏ;
 *   - quân ĐỐI THỦ đang treo → cơ hội ăn;
 *   - Vua còn quyền nhập thành → nhắc nhập thành;
 *   - Tốt sắp phong cấp → nhắc đẩy tiếp;
 *   - luôn có nước engine đề xuất, và nước đó phải **đi được thật** trên thế cờ.
 */
import { Chess } from 'chess.js'
import { BEST_MOVES } from '../src/data/bestMoves.ts'
import { OPENINGS } from '../src/data/openings.ts'
import { isPlanFocusPlayable, isSideMoveLegal, parsePlanFocus } from '../src/lib/planFocus.ts'
import { buildLivePlan, MAX_LIVE_PLAN_ITEMS } from '../src/lib/livePlan.ts'
import type { LivePlan } from '../src/lib/livePlan.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

const kinds = (plan: LivePlan) => plan.items.map((item) => item.kind)
const texts = (plan: LivePlan) => plan.items.map((item) => item.text).join(' | ')

/** Kiểm `san` có phải nước hợp lệ ở `fen` không. */
const isLegal = (fen: string, san: string) => {
  const game = new Chess()
  try {
    game.load(fen)
    return Boolean(game.move(san))
  } catch {
    return false
  }
}

console.log('\n▶ Kế hoạch theo thế cờ hiện tại (sinh từ engine)')

check(buildLivePlan('không-phải-fen', 'white') === null, 'FEN hỏng → trả null (không làm sập trang)')

// --- 1. Quân CỦA BÉ đang treo: Tượng trắng ở d4 bị Xe đen ở d5 tấn công, không ai đỡ.
const hangingOwn = '4k3/8/8/3r4/3B4/8/8/4K3 w - - 0 1'
const planDanger = buildLivePlan(hangingOwn, 'white')
check(planDanger !== null, 'thế cờ có quân bị treo → dựng được kế hoạch')
if (planDanger) {
  check(kinds(planDanger).includes('danger'), 'có việc loại “nguy hiểm” (đỏ)')
  check(
    planDanger.items[0]?.text.includes('Tượng') && planDanger.items[0]?.text.includes('d4'),
    `cảnh báo đúng quân và đúng ô (“${planDanger.items[0]?.text}”)`,
  )
  check(planDanger.items[0]?.icon === '🚨', 'việc nguy hiểm đứng ĐẦU TIÊN')
}

// --- 2. Quân ĐỐI THỦ đang treo: Tượng đen ở d4 bị Xe trắng ở d3 tấn công.
const hangingFoe = '4k3/8/8/8/3b4/3R4/8/4K3 w - - 0 1'
const planChance = buildLivePlan(hangingFoe, 'white')
if (planChance) {
  check(kinds(planChance).includes('chance'), 'có việc loại “cơ hội” (ăn quân)')
  check(
    texts(planChance).includes('Đối thủ treo Tượng ở d4'),
    `chỉ đúng quân đang treo của đối thủ (“${texts(planChance)}”)`,
  )
} else {
  check(false, 'thế cờ đối thủ treo quân → dựng được kế hoạch')
}

// --- 3. Vua còn quyền nhập thành → nhắc nhập thành.
const canCastle = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1'
const planCastle = buildLivePlan(canCastle, 'white')
if (planCastle) {
  check(texts(planCastle).includes('nhập thành'), 'thế cờ Vua còn quyền nhập thành → nhắc nhập thành')
} else {
  check(false, 'thế cờ đầy đủ → dựng được kế hoạch')
}

// --- 4. Tốt sắp phong cấp → nhắc đẩy tiếp cho tới Hậu.
const promoting = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
const planPromote = buildLivePlan(promoting, 'white')
if (planPromote) {
  check(
    planPromote.items.some((item) => item.text.includes('thành Hậu')),
    `Tốt a7 còn 1 bước → nhắc phong cấp (“${texts(planPromote)}”)`,
  )
  check(
    planPromote.items.some((item) => item.text.includes('1 bước')),
    'nói đúng số bước còn lại',
  )
} else {
  check(false, 'thế cờ Tốt sắp phong cấp → dựng được kế hoạch')
}

// --- 5. Luật chung cho MỌI thế cờ của app: đủ việc, không quá 4 việc, nước engine đi được thật.
console.log('\n▶ Luật chung trên mọi thế cờ của app')
const positions = [
  { name: 'thế cờ ban đầu', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  ...BEST_MOVES.map((puzzle) => ({ name: puzzle.id, fen: puzzle.fen })),
]
let engineCount = 0
let legalCount = 0
let cappedCount = 0
let minItems = Number.POSITIVE_INFINITY
for (const position of positions) {
  const plan = buildLivePlan(position.fen, 'white')
  if (!plan) {
    check(false, `${position.name}: dựng được kế hoạch`)
    continue
  }
  minItems = Math.min(minItems, plan.items.length)
  if (plan.items.length > MAX_LIVE_PLAN_ITEMS) {
    check(false, `${position.name}: vượt quá ${MAX_LIVE_PLAN_ITEMS} việc (${plan.items.length})`)
  } else {
    cappedCount += 1
  }
  if (!plan.engineSan) continue
  engineCount += 1
  if (isLegal(position.fen, plan.engineSan)) legalCount += 1
  else check(false, `${position.name}: nước máy "${plan.engineSan}" KHÔNG đi được`)
}
check(cappedCount === positions.length, `mọi thế cờ đều ≤ ${MAX_LIVE_PLAN_ITEMS} việc`)
check(minItems >= 2, `thế cờ nào cũng có ít nhất 2 việc (ít nhất ${minItems})`)
check(engineCount >= positions.length - 1, `gần như mọi thế cờ đều có nước máy đề xuất (${engineCount}/${positions.length})`)
check(legalCount === engineCount, `mọi nước máy đề xuất đều hợp lệ (${legalCount}/${engineCount})`)

// --- 6. Phần ĐỌC THẾ CỜ phải ổn định (không phụ thuộc thời gian chạy engine).
// Riêng nước máy đề xuất chỉ cần “đi được thật” - mức `hard` chạy theo ngân sách thời
// gian nên có thể lệch nhau chút ít giữa hai lần gọi.
const first = buildLivePlan(canCastle, 'white')
const second = buildLivePlan(canCastle, 'white')
const readingOf = (plan: LivePlan | null) =>
  (plan?.items ?? [])
    .filter((item) => item.kind !== 'engine')
    .map((item) => item.text)
    .join(' | ')
check(
  first !== null && second !== null && readingOf(first) === readingOf(second),
  'hai lần gọi cùng thế cờ cho cùng nhận xét về thế cờ',
)
check(
  readingOf(first).length > 0,
  `nhận xét về thế cờ không rỗng (“${readingOf(first)}”)`,
)

// --- 7. Lời đánh giá phải khớp thế cờ: Trắng hơn Hậu thì phải nói “bé hơn”.
const upAQueen = '4k3/8/8/8/8/8/8/3QK3 w - - 0 1'
const planBetter = buildLivePlan(upAQueen, 'white')
check(planBetter?.mood === 'better', `Trắng hơn Hậu → “bé đang hơn” (${planBetter?.evalText})`)
check(
  planBetter?.evalText.startsWith('bé hơn') === true,
  `câu đánh giá viết theo góc nhìn của bé (“${planBetter?.evalText}”)`,
)
const planWorse = buildLivePlan(upAQueen, 'black')
check(planWorse?.mood === 'worse', `nhìn từ phía Đen thì ngược lại (“${planWorse?.evalText}”)`)

// --- 8. Soi ô cờ theo câu kế hoạch trung cuộc (`src/lib/planFocus.ts`).
// Đây là cách biến phần kế hoạch thành TRỰC QUAN mà không phải thêm dữ liệu: mỗi câu
// kế hoạch vốn đã có sẵn số ô, chỉ cần đọc lại chính câu đó.
console.log('\n▶ Soi ô cờ theo câu kế hoạch trung cuộc')
check(parsePlanFocus('').squares.length === 0, 'câu rỗng → không tô ô nào')
check(parsePlanFocus('cột Hậu').squares.length === 0, '“cột Hậu” KHÔNG bị hiểu nhầm thành cột h')
const focusFile = parsePlanFocus('Đưa Xe vào cột e')
check(
  focusFile.squares.length === 8 && focusFile.squares.every((square) => square[0] === 'e'),
  `“cột e” → tô đủ 8 ô của cột e (${focusFile.squares.join(', ')})`,
)
const focusTwo = parsePlanFocus('Đưa Mã b1 lên d2')
check(
  focusTwo.squares.join(',') === 'b1,d2',
  `đọc đúng ô và sắp theo thứ tự bàn cờ (${focusTwo.squares.join(', ')})`,
)
check(
  parsePlanFocus('Nhảy Nc6 rồi Bg3').squares.join(',') === 'c6,g3',
  'đọc được cả khi ô dính ký hiệu quân (Nc6, Bg3)',
)

// Mũi tên “từ ô này sang ô kia”.
check(
  parsePlanFocus('Đưa Mã b1 lên d2 rồi chuyển sang cánh Vua').arrow?.from === 'b1' &&
    parsePlanFocus('Đưa Mã b1 lên d2 rồi chuyển sang cánh Vua').arrow?.to === 'd2',
  '“Đưa Mã b1 lên d2” → mũi tên b1 → d2',
)
check(
  parsePlanFocus('Đưa Xe f8 lên e8 giữ ô e5').arrow?.to === 'e8',
  'ô đích là ô đầu tiên sau phần nguồn, không phải ô nhắc ở cuối câu',
)
check(
  parsePlanFocus('Đưa Xe a8 sang cột c vừa mở.').arrow === null,
  'nói “sang cột c” → KHÔNG vẽ mũi tên (không đoán bừa ô đích)',
)
check(
  parsePlanFocus('Đẩy Tốt b6 rồi đưa Tượng c8 ra b7 để tăng sức ép.').prep.join(',') === 'b6',
  'nhận ra nước dọn đường “Đẩy Tốt b6” đứng trước mũi tên',
)
check(
  parsePlanFocus('Đánh sang cánh Hậu bằng ...b5 rồi đưa Tượng c8 lên b7.').prep.join(',') === 'b5',
  'nhận ra nước dọn đường viết gọn “...b5”',
)
check(parsePlanFocus('Đẩy Tốt f5 rồi f4.').arrow === null, 'câu “đẩy” không phải “đưa” → không vẽ mũi tên')
check(parsePlanFocus('Giữ Tượng g2 quét đường chéo dài.').arrow === null, 'câu chỉ nói giữ quân → không vẽ mũi tên')

/** Thế cờ cuối dòng chính của một khai cuộc. */
const finalFenOf = (moves: typeof OPENINGS[number]['moves']) => {
  const game = new Chess()
  for (const move of moves) {
    try {
      game.move(move.san)
    } catch {
      break
    }
  }
  return game.fen()
}

const allPlanPoints = OPENINGS.flatMap((opening) =>
  opening.plan.points.map((point) => ({
    id: opening.id,
    point,
    side: opening.side,
    fen: finalFenOf(opening.moves),
    focus: parsePlanFocus(point),
  })),
)
const blindPoints = allPlanPoints.filter((item) => item.focus.squares.length === 0)
check(
  blindPoints.length === 0,
  `mọi câu kế hoạch đều soi được ô cờ (${allPlanPoints.length - blindPoints.length}/${allPlanPoints.length})`,
)
for (const item of blindPoints) console.log(`      · ${item.id}: ${item.point}`)
check(
  allPlanPoints.length >= 30,
  `đủ số câu kế hoạch của 10 khai cuộc Trắng/Đen (${allPlanPoints.length} câu)`,
)

const arrowPoints = allPlanPoints.filter((item) => item.focus.arrow !== null)
check(
  arrowPoints.length >= 5,
  `đủ nhiều câu nói rõ “từ ô nào sang ô nào” để vẽ mũi tên (${arrowPoints.length} câu)`,
)
// Mỗi câu có mũi tên phải LÀM ĐƯỢC THẬT: đi các nước Tốt dọn đường nhắc trong câu
// rồi tới nước của mũi tên (kế hoạch hai bước vẫn tính là đúng).
let impossible = 0
let straightAway = 0
for (const item of arrowPoints) {
  const arrow = item.focus.arrow
  if (!arrow) continue
  if (!isPlanFocusPlayable(item.fen, item.side, item.point)) {
    impossible += 1
    check(false, `${item.id}: câu này KHÔNG làm được → “${item.point}”`)
    continue
  }
  if (isSideMoveLegal(item.fen, item.side, arrow.from, arrow.to)) straightAway += 1
}
check(
  impossible === 0,
  `mọi câu có mũi tên đều làm được thật trên thế cờ cuối (${arrowPoints.length} câu)`,
)
check(
  straightAway >= 5,
  `phần lớn mũi tên đi được NGAY ở thế cờ cuối, không cần bước dọn đường (${straightAway}/${arrowPoints.length})`,
)
check(
  isSideMoveLegal('4k3/8/8/8/8/8/8/4K3 w - - 0 1', 'white', 'e1', 'e2') &&
    !isSideMoveLegal('4k3/8/8/8/8/8/8/4K3 w - - 0 1', 'white', 'e1', 'e3'),
  'hàm kiểm nước đi: cho Vua đi 1 ô, chặn Vua đi 2 ô',
)
check(
  isSideMoveLegal('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'black', 'a1', 'a8') === false,
  'hàm kiểm nước đi không cho bên không có quân đi',
)

console.log(
  failures === 0 ? '\n✅ KẾ HOẠCH THEO THẾ CỜ PASS!\n' : `\n❌ KẾ HOẠCH THEO THẾ CỜ: ${failures} lỗi\n`,
)
process.exit(failures === 0 ? 0 : 1)
