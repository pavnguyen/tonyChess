/**
 * Smoke test lộ trình 7 → 18 tuổi.
 * Chạy: node scripts/smoke-stages.ts
 */
import {
  ageFromBirthYear,
  DEFAULT_STAGE_ID,
  MAX_TRACKED_AGE,
  nextStageOf,
  reviewStepsFor,
  shouldAutoHint,
  STAGES,
  stageById,
  stageForAge,
  suggestedStage,
} from '../src/lib/stages.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Bốn giai đoạn phủ kín 7 → 18 tuổi')
check(STAGES.length === 4, 'có đúng 4 giai đoạn')
check(STAGES[0].ages[0] === 7, 'bắt đầu từ 7 tuổi')
check(STAGES[STAGES.length - 1].ages[1] === MAX_TRACKED_AGE, 'giai đoạn cuối chạm 18 tuổi')
let contiguous = true
for (let i = 1; i < STAGES.length; i += 1) {
  if (STAGES[i].ages[0] !== STAGES[i - 1].ages[1] + 1) contiguous = false
}
check(contiguous, 'các khoảng tuổi nối liền nhau, không hở cũng không chồng')
check(
  STAGES.every((stage) => stage.focus.length > 0 && stage.promotion.length > 0),
  'giai đoạn nào cũng có trọng tâm và mốc lên cấp',
)
const allUnlocks = STAGES.flatMap((stage) => [...stage.unlocks])
check(new Set(allUnlocks).size === allUnlocks.length, 'không giai đoạn nào mở khoá trùng nhau')
check(
  STAGES.every((stage) => stage.unlocks.length >= 4),
  'mỗi giai đoạn mở khoá ít nhất 4 thứ mới',
)

console.log('\n▶ Chọn giai đoạn theo tuổi')
check(stageForAge(5).id === 'nhi', 'bé 5 tuổi vẫn dùng bản Nhí')
check(stageForAge(7).id === 'nhi' && stageForAge(9).id === 'nhi', '7-9 tuổi → Nhí Tò Mò')
check(stageForAge(10).id === 'thieu-nhi' && stageForAge(12).id === 'thieu-nhi', '10-12 → Thiếu Nhi')
check(stageForAge(13).id === 'thieu-nien' && stageForAge(15).id === 'thieu-nien', '13-15 → Thiếu Niên')
check(stageForAge(16).id === 'chuyen-nghiep', '16-18 → Kỳ Thủ Trưởng Thành')
check(stageForAge(25).id === 'chuyen-nghiep', 'người lớn vẫn dùng được bản cuối')
check(stageForAge(11.9).id === 'thieu-nhi', 'tuổi lẻ được cắt thành số nguyên')

console.log('\n▶ Suy ra từ năm sinh')
const NOW = new Date('2026-10-01T00:00:00Z')
check(ageFromBirthYear(2019, NOW) === 7, 'sinh 2019 → 7 tuổi vào 2026')
check(ageFromBirthYear(2026, NOW) === 0, 'sinh năm nay → 0 tuổi')
check(ageFromBirthYear(2030, NOW) === 0, 'năm sinh ở tương lai không ra số âm')
check(suggestedStage({ birthYear: 2019 }, NOW).id === 'nhi', 'bé sinh 2019 được gợi ý bản Nhí')
check(suggestedStage({ birthYear: 2011 }, NOW).id === 'thieu-nien', 'sinh 2011 → gợi ý Thiếu Niên')
check(suggestedStage({ age: 11 }, NOW).id === 'thieu-nhi', 'chỉ có tuổi thì vẫn suy ra được')
check(suggestedStage({}, NOW).id === DEFAULT_STAGE_ID, 'không có thông tin gì → dùng mặc định')
check(
  suggestedStage({ birthYear: 2011, age: 7 }, NOW).id === 'thieu-nien',
  'năm sinh được ưu tiên hơn tuổi (tự lớn theo thời gian)',
)

console.log('\n▶ Đi lên từng nấc')
check(nextStageOf('nhi').id === 'thieu-nhi', 'Nhí → Thiếu Nhi')
check(nextStageOf('thieu-nhi').id === 'thieu-nien', 'Thiếu Nhi → Thiếu Niên')
check(nextStageOf('thieu-nien').id === 'chuyen-nghiep', 'Thiếu Niên → Trưởng Thành')
check(nextStageOf('chuyen-nghiep') === null, 'bản cuối không còn nấc nào để lên')
check(stageById('thieu-nien').label === 'Thiếu Niên Chiến Lược', 'tra giai đoạn theo id')

console.log('\n▶ Bé càng lớn, app càng nghiêm túc')
const botOrder = ['easy', 'medium', 'hard', 'master']
check(
  STAGES.every((stage, i) => botOrder.indexOf(stage.botLevel) === i),
  'độ mạnh của máy tăng đều qua 4 giai đoạn',
)
check(
  STAGES.every((stage, i) => i === 0 || stage.sessionSize > STAGES[i - 1].sessionSize),
  'buổi ôn dài dần theo tuổi (6 → 8 → 12 → 20 câu)',
)
check(STAGES[0].notation === 'figurine', 'bé nhỏ đọc ký hiệu hình quân cờ')
check(
  STAGES.slice(1).every((stage) => stage.notation === 'english'),
  'từ 10 tuổi trở lên dùng ký hiệu chuẩn quốc tế',
)
check(
  STAGES[0].showRhyme && STAGES[1].showRhyme && !STAGES[2].showRhyme && !STAGES[3].showRhyme,
  'vè 4-6 chữ tắt dần từ 13 tuổi',
)
check(STAGES[0].confetti && STAGES[1].confetti && !STAGES[2].confetti, 'hiệu ứng ăn mừng tắt từ 13 tuổi')
check(
  STAGES[3].showEmoji === false && STAGES[3].showCoachBanner === false,
  'bản trưởng thành bỏ emoji và banner dạy học',
)
check(STAGES[0].boardNotation === false && STAGES[3].boardNotation === true, 'toạ độ ô hiện từ 10 tuổi')

console.log('\n▶ Gợi ý & lịch ôn theo giai đoạn')
check(reviewStepsFor(STAGES[0]) === 3, 'bé Nhí chỉ ôn 3 nấc cho mau gặp lại')
check(reviewStepsFor(STAGES[3]) === 5, 'kỳ thủ lớn ôn đủ 5 nấc')
check(reviewStepsFor({ ...STAGES[0], reviewSteps: 99 }) === 5, 'số nấc bị kẹp ở 5')
check(reviewStepsFor({ ...STAGES[0], reviewSteps: 0 }) === 2, 'số nấc bị kẹp dưới ở 2')
check(shouldAutoHint(STAGES[0], 0) === false, 'bé Nhí: chưa sai thì chưa gợi ý')
check(shouldAutoHint(STAGES[0], 1) === true, 'bé Nhí: sai một lần là tự hiện gợi ý')
check(shouldAutoHint(STAGES[1], 3) === false, 'từ 10 tuổi: gợi ý chỉ hiện khi bé bấm xin')
check(shouldAutoHint(STAGES[3], 5) === false, 'bản trưởng thành: không gợi ý, phải tự tính')
check(STAGES.every((stage) => shouldAutoHint(stage, 0) === false), 'chưa làm gì thì không ai bị gợi ý trước')

const total = 43
if (failures === 0) {
  console.log(`\n✅ STAGES PASS! (${total} kiểm tra)\n`)
  process.exit(0)
}
console.error(`\n❌ STAGES FAIL: ${failures} lỗi\n`)
process.exit(1)
