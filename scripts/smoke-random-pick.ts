/**
 * Kiểm tra "bài chọn sẵn mỗi lần mở app": bốc mới mỗi phiên, giữ nguyên khi
 * chuyển tab, luôn nằm trong danh sách.
 *
 * Chạy: node scripts/smoke-random-pick.ts
 */
import { randomIndex } from '../src/lib/randomPick.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

console.log('\n▶ Bài chọn sẵn mỗi lần mở app')

check(randomIndex(50, 'stable', () => 0.5) === randomIndex(50, 'stable', () => 0), 'gọi lại không bốc lại bài')
check(randomIndex(10, 'zero', () => 0) === 0, 'bốc trúng đầu danh sách khi số ngẫu nhiên = 0')
check(randomIndex(10, 'last', () => 0.999999) === 9, 'bốc trúng cuối danh sách khi số ngẫu nhiên sát 1')
check(randomIndex(1, 'single', () => 0.7) === 0, 'danh sách một bài luôn ra bài đó')

for (const length of [2, 10, 20, 50]) {
  let outOfRange = 0
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const index = randomIndex(length, `range-${length}-${attempt}`)
    if (index < 0 || index >= length) outOfRange += 1
  }
  check(outOfRange === 0, `200 lần bốc trong ${length} bài đều nằm trong danh sách`)
}

const spread = new Set(
  Array.from({ length: 200 }, (_, attempt) => randomIndex(20, `spread-${attempt}`)),
)
check(spread.size >= 5, `200 lần bốc ra ≥ 5 vị trí khác nhau (${spread.size})`)

check(randomIndex(0, 'empty') === 0, 'danh sách rỗng không làm sập trang')
check(randomIndex(-3, 'negative') === 0, 'độ dài âm cũng an toàn')

if (failures > 0) {
  console.log(`\n❌ ${failures} LỖI CHỌN BÀI NGẪU NHIÊN\n`)
  process.exit(1)
}

console.log('\n✅ SMOKE RANDOM PICK PASS!\n')
