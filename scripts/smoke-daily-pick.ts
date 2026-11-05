/**
 * Kiểm tra "bài mặc định của hôm nay": cùng ngày thì ổn định, qua ngày thì đổi,
 * và luôn nằm trong danh sách.
 *
 * Chạy: node scripts/smoke-daily-pick.ts
 */
import { dailyIndex, dayKey, hashString } from '../src/lib/dailyPick.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

const at = (day: number) => new Date(2026, 10, day, 9, 30)

console.log('\n▶ Bài mặc định theo ngày')

check(dayKey(at(5)) === '2026-11-05', 'khoá ngày theo giờ máy (YYYY-MM-DD)')
check(hashString('co-vua') === hashString('co-vua'), 'băm chuỗi là tất định')
check(hashString('co-vua') !== hashString('co-vua-nhi'), 'băm chuỗi khác nhau cho kết quả khác')

check(
  dailyIndex(50, 'tactic', at(5)) === dailyIndex(50, 'tactic', at(5)),
  'mở lại trong cùng ngày → vẫn đúng thế đó',
)
check(
  dayKey(at(5)) === dayKey(new Date(2026, 10, 5, 23, 59)),
  'trong ngày (kể cả 23:59) không đổi bài',
)

for (const length of [1, 2, 10, 20, 50]) {
  for (let day = 1; day <= 28; day += 1) {
    const index = dailyIndex(length, 'tactic', at(day))
    if (index < 0 || index >= length) {
      check(false, `chỉ số ${index} nằm ngoài 0..${length - 1}`)
    }
  }
}
check(true, 'mọi chỉ số đều nằm trong danh sách (1, 2, 10, 20, 50)')

const week = Array.from({ length: 7 }, (_, offset) => dailyIndex(20, 'opening', at(1 + offset)))
check(new Set(week).size >= 3, `7 ngày liên tiếp có ≥ 3 khai cuộc khác nhau (${new Set(week).size})`)

check(dailyIndex(0, 'tactic', at(5)) === 0, 'danh sách rỗng không làm sập trang')
check(dailyIndex(-3, 'tactic', at(5)) === 0, 'độ dài âm cũng an toàn')

if (failures > 0) {
  console.log(`\n❌ ${failures} LỖI CHỌN BÀI THEO NGÀY\n`)
  process.exit(1)
}

console.log('\n✅ SMOKE DAILY PICK PASS!\n')
