/**
 * Smoke test bộ lịch ôn tập ngắt quãng.
 * Chạy: node scripts/smoke-review.ts
 */
import {
  createReviewItem,
  DAY_MS,
  dueCount,
  dueItems,
  intervalDaysForBox,
  isDue,
  masteredPercent,
  MAX_BOX,
  recordAttempt,
  RELEARN_DELAY_MS,
  reviewKey,
  REVIEW_INTERVALS_DAYS,
  REVIEW_SESSION_SIZE,
  summarizeDeck,
} from '../src/lib/review.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

const T0 = 1_700_000_000_000

console.log('\n▶ Lịch hẹn theo hộp')
check(REVIEW_INTERVALS_DAYS.join(',') === '0,1,3,7,21', 'năm nấc: hôm nay → 1 → 3 → 7 → 21 ngày')
check(MAX_BOX === 4, 'hộp cao nhất là 4')
check(
  intervalDaysForBox(0) === 0 && intervalDaysForBox(1) === 1 && intervalDaysForBox(4) === 21,
  'hộp 0 → gặp ngay, hộp 1 → 1 ngày, hộp 4 → 21 ngày',
)
check(intervalDaysForBox(-5) === 0, 'hộp âm bị kẹp về 0')
check(intervalDaysForBox(99) === 21, 'hộp quá lớn bị kẹp về hộp cuối')

console.log('\n▶ Quân bài mới')
const fresh = createReviewItem('tactic:fork-1', T0)
check(fresh.box === 0 && fresh.lapses === 0 && fresh.seen === 0, 'quân bài mới: hộp 0, chưa sai lần nào')
check(isDue(fresh, T0), 'quân bài mới tới hạn ngay lập tức')

console.log('\n▶ Giải đúng thì hẹn xa dần')
let item = fresh
const expectedDays = [1, 3, 7, 21, 21]
for (let round = 0; round < expectedDays.length; round += 1) {
  const now = T0 + round * 1_000
  const before = item.box
  item = recordAttempt({ [item.key]: item }, item.key, true, now)[item.key]
  const waitedDays = (item.due - now) / DAY_MS
  check(
    waitedDays === expectedDays[round],
    `lần đúng ${round + 1}: hộp ${before} → ${item.box}, hẹn lại sau ${waitedDays} ngày`,
  )
}
check(item.box === MAX_BOX, 'giải đúng nhiều lần vẫn dừng ở hộp 4, không vượt trần')
check(item.seen === 5, 'đếm đủ 5 lần đã gặp')

console.log('\n▶ Giải sai thì quay về học lại')
const strong = { key: 'tactic:pin-2', box: 3, due: T0, lapses: 0, seen: 4 }
const afterWrong = recordAttempt({ [strong.key]: strong }, strong.key, false, T0)[strong.key]
check(afterWrong.box === 0, 'sai thì rơi thẳng về hộp 0')
check(afterWrong.due - T0 === RELEARN_DELAY_MS, 'sai thì hẹn lại sau 10 phút, ngay trong buổi học')
check(afterWrong.lapses === 1, 'đếm được 1 lần sai')
check(afterWrong.seen === 5, 'vẫn tính là một lần gặp')

console.log('\n▶ Tới hạn & thứ tự ưu tiên')
const deck = {
  a: { key: 'a', box: 1, due: T0 - 5 * DAY_MS, lapses: 0, seen: 2 },
  b: { key: 'b', box: 2, due: T0 - 1 * DAY_MS, lapses: 0, seen: 2 },
  c: { key: 'c', box: 0, due: T0 + 10 * DAY_MS, lapses: 0, seen: 2 },
}
check(dueCount(deck, T0) === 2, 'chỉ 2/3 quân bài đã tới hạn')
check(dueItems(deck, T0).map((i) => i.key).join(',') === 'a,b', 'quá hạn lâu nhất lên trước')
check(dueCount(deck, T0 + 20 * DAY_MS) === 3, 'tới hạn hết sau 20 ngày nữa')
check(!isDue(deck.c, T0), 'quân bài chưa tới hạn thì không nằm trong buổi ôn')

console.log('\n▶ Con số cho bố mẹ xem')
check(masteredPercent({}) === 0, 'bộ bài rỗng thì 0%')
const mixed = {
  x: { key: 'x', box: 4, due: T0, lapses: 0, seen: 5 },
  y: { key: 'y', box: 4, due: T0, lapses: 0, seen: 5 },
  z: { key: 'z', box: 1, due: T0, lapses: 3, seen: 4 },
  w: { key: 'w', box: 0, due: T0, lapses: 0, seen: 1 },
}
check(masteredPercent(mixed) === 50, '2/4 quân bài ở hộp cuối → 50% đã nhớ dai')
const summary = summarizeDeck(mixed, T0)
check(summary.total === 4 && summary.mastered === 2, 'tóm tắt đếm đúng tổng số và số đã thuộc')
check(summary.weakest.length === 1 && summary.weakest[0].key === 'z', 'chỉ ra được quân bài yếu nhất')

console.log('\n▶ Khoá và kích thước buổi ôn')
check(reviewKey('tactic', 'fork-1') === 'tactic:fork-1', 'khoá có tiền tố loại bài để không trùng nhau')
check(
  reviewKey('endgame', 'fork-1') !== reviewKey('tactic', 'fork-1'),
  'cùng id nhưng khác loại bài là hai quân bài khác nhau',
)
check(REVIEW_SESSION_SIZE === 6, 'một buổi ôn chỉ 6 câu cho vừa sức bé 7 tuổi')

const total = 17
if (failures === 0) {
  console.log(`\n✅ REVIEW PASS! (${total} kiểm tra)\n`)
  process.exit(0)
}
console.error(`\n❌ REVIEW FAIL: ${failures} lỗi\n`)
process.exit(1)
