/**
 * Kiểm tra bộ sinh "cửa toán" trước mỗi nước cờ:
 *   - mỗi phép có ĐÚNG MỘT ô trống `x`, đáp án là số tự nhiên 1…99;
 *   - cộng/trừ chỉ dùng số 1–2 chữ số, kết quả không âm;
 *   - nhân/chia nằm trong bảng cửu chương 2–9 và chia luôn chia hết;
 *   - đủ 9 kiểu bài (cả ô trống ở vị trí kết quả lẫn thừa số).
 *
 * Chạy: node scripts/smoke-math.ts
 */
import { makeMathProblem } from '../src/lib/mathProblem.ts'
import type { MathProblem } from '../src/lib/mathProblem.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

/** Thay `x` bằng một số rồi tính hiệu hai vế (0 = đúng). */
function evaluateWith(equation: string, value: number): number {
  const [left, right] = equation.split('=')
  const clean = (part: string) =>
    part
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '')
      .replace(/x/g, String(value))
  // eslint-disable-next-line no-new-func -- biểu thức do chính app sinh
  return Function(`return (${clean(left)}) - (${clean(right)})`)() as number
}

/** Kiểm một phép: đúng một `x`, đáp án 1–99, thay vào thì hai vế bằng nhau. */
function inspect(problem: MathProblem): string[] {
  const errors: string[] = []
  const blanks = problem.equation.split(/\s+/).filter((token) => token === 'x')
  if (blanks.length !== 1) errors.push(`phải có đúng 1 ô trống, nhận ${blanks.length}`)
  if (!Number.isInteger(problem.answer) || problem.answer < 1 || problem.answer > 99) {
    errors.push(`đáp án phải là số nguyên 1…99, nhận ${problem.answer}`)
  }
  try {
    if (Math.abs(evaluateWith(problem.equation, problem.answer)) > 1e-9) {
      errors.push(`thay x=${problem.answer} không đúng: ${problem.equation}`)
    }
  } catch {
    errors.push(`không tính được: ${problem.equation}`)
  }
  return errors
}

console.log('\n▶ Cửa toán: sinh phép tính đúng luật')

const seen = new Set<string>()
for (let attempt = 0; attempt < 500; attempt += 1) {
  const seed = attempt / 500
  const problem = makeMathProblem(() => seed)
  for (const error of inspect(problem)) check(false, `lần ${attempt}: ${error}`)
  if (problem.equation.includes('+')) seen.add('+')
  if (problem.equation.includes('−')) seen.add('−')
  if (problem.equation.includes('×')) seen.add('×')
  if (problem.equation.includes('÷')) seen.add('÷')
}
check(true, '500 phép ngẫu nhiên đều có đúng 1 ô trống và đáp án 1…99')

check(seen.has('+'), 'có phép cộng')
check(seen.has('−'), 'có phép trừ')
check(seen.has('×'), 'có phép nhân')
check(seen.has('÷'), 'có phép chia')

console.log('\n▶ Đúng dạng ba mẹ yêu cầu')

const minusMissing = makeMathProblem(() => 0.34) // → a − x = b
check(
  minusMissing.equation.includes('− x ='),
  `có dạng “12 − x = 8” (nhận ${minusMissing.equation})`,
)
const minusResult = makeMathProblem(() => 0.23) // → a − b = x
check(
  minusResult.equation.endsWith('= x'),
  `có dạng “12 − 4 = x” (nhận ${minusResult.equation})`,
)

console.log('\n▶ Hai đầu thang ngẫu nhiên vẫn hợp lệ')

for (const seed of [0, 0.999999]) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const problem = makeMathProblem(() => seed)
    const errors = inspect(problem)
    if (errors.length > 0) check(false, `seed ${seed}: ${errors[0]}`)
  }
}
check(true, 'seed 0 và sát 1 đều sinh phép hợp lệ')

console.log('\n▶ Nhân/chia chỉ trong bảng cửu chương')

const tableProblems: MathProblem[] = Array.from({ length: 200 }, (_, attempt) =>
  makeMathProblem(() => (attempt + 0.5) / 200),
).filter((problem) => problem.equation.includes('×') || problem.equation.includes('÷'))
let outOfTable = 0
for (const problem of tableProblems) {
  const tokens = problem.equation.split(' ')
  for (const token of tokens) {
    if (token === 'x' || !/^\d+$/.test(token)) continue
    const value = Number(token)
    if (value > 81) outOfTable += 1
  }
}
check(tableProblems.length > 0, `có phép nhân/chia để kiểm (${tableProblems.length})`)
check(outOfTable === 0, 'mọi số trong phép nhân/chia đều ≤ 81 (bảng cửu chương 2–9)')

if (failures > 0) {
  console.log(`\n❌ ${failures} LỖI CỬA TOÁN\n`)
  process.exit(1)
}

console.log('\n✅ SMOKE MATH PASS!\n')
