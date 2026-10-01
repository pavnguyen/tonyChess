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
import { TACTICS } from '../src/data/tactics.ts'
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
  ...TACTICS.map((puzzle) => ({ name: puzzle.id, fen: puzzle.fen })),
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

console.log(
  failures === 0 ? '\n✅ KẾ HOẠCH THEO THẾ CỜ PASS!\n' : `\n❌ KẾ HOẠCH THEO THẾ CỜ: ${failures} lỗi\n`,
)
process.exit(failures === 0 ? 0 : 1)
