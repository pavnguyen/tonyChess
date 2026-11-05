/**
 * Kiểm tra phần thuần của "Buổi luyện hôm nay": tiến độ chỉ nhích khi bé làm
 * XONG đúng bài đang chờ, không phải lúc bấm ▶.
 *
 * Chạy: node scripts/smoke-session.ts
 */
import { advanceDone, itemKind, SESSION_KINDS } from '../src/lib/sessionProgress.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

const plan = [
  { id: 'opening:italian' },
  { id: 'puzzle:pin-01' },
  { id: 'endgame:lucena' },
  { id: 'hazard:daily' },
  { id: 'play:daily' },
]

console.log('\n▶ Buổi luyện hôm nay - tiến độ theo bài đã xong')

check(itemKind(plan[0]) === 'opening', 'nhận ra bài khai cuộc')
check(itemKind(plan[1]) === 'puzzle', 'nhận ra thế trung cuộc')
check(itemKind(plan[2]) === 'endgame', 'nhận ra thế tàn cuộc')
check(itemKind(undefined) === null, 'hết buổi thì không còn loại nào')
check(itemKind({ id: 'khong-ro' }) === null, 'id lạ không làm tiến độ nhảy')

check(advanceDone(plan, 0, 'opening') === 1, 'làm xong khai cuộc → 1/5')
check(advanceDone(plan, 1, 'puzzle') === 2, 'làm xong trung cuộc → 2/5')
check(advanceDone(plan, 2, 'endgame') === 3, 'làm xong tàn cuộc → 3/5')
check(advanceDone(plan, 3, 'hazard') === 4, 'trả lời đúng soi quân → 4/5')
check(advanceDone(plan, 4, 'play') === 5, 'chơi xong ván → 5/5')

check(advanceDone(plan, 3, 'opening') === 3, 'làm lại bài cũ KHÔNG đẩy tiến độ')
check(advanceDone(plan, 3, 'play') === 3, 'làm bài chưa tới lượt KHÔNG nhảy cóc')
check(advanceDone(plan, 5, 'play') === 5, 'xong buổi rồi thì đứng yên')
check(advanceDone(plan, 0, 'play') === 0, 'vào giữa buổi bằng ▶ cũng không tính xong')

check(SESSION_KINDS.length === 5, 'đủ 5 loại bài trong buổi')

if (failures > 0) {
  console.log(`\n❌ ${failures} LỖI TIẾN ĐỘ BUỔI LUYỆN\n`)
  process.exit(1)
}

console.log('\n✅ SMOKE SESSION PASS!\n')
