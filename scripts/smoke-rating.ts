/**
 * Smoke test "điểm trình độ" mini-Elo (Giai đoạn 2).
 * Chạy: node scripts/smoke-rating.ts
 */
import {
  createRatingBook,
  DIFFICULTY_RATINGS,
  expectedScore,
  HISTORY_LIMIT,
  kFactor,
  K_TEEN,
  K_YOUNG,
  levelFor,
  levelProgress,
  LEVELS,
  nextLevelOf,
  START_RATING,
  suggestedBotLevel,
  suggestedDifficulty,
  themePercent,
  themeRating,
  updateRating,
  weakestTheme,
} from '../src/lib/rating.ts'
import type { PuzzleDifficulty, RatingAttempt } from '../src/lib/rating.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

const NOW = 1_700_000_000_000
const attempt = (
  difficulty: PuzzleDifficulty,
  correct: boolean,
  theme = 'fork',
  age: number | null = 8,
): RatingAttempt => ({ theme, difficulty, correct, age, now: NOW })

console.log('\n▶ Điểm xuất phát')
const fresh = createRatingBook()
check(START_RATING === 500, 'điểm khởi đầu là 500 (theo yêu cầu chủ dự án)')
check(fresh.overall === 500, 'sổ điểm mới mở ở đúng 500')
check(Object.keys(fresh.byTheme).length === 0, 'chưa có điểm riêng dạng nào')
check(fresh.history.length === 0, 'nhật ký ban đầu rỗng')

console.log('\n▶ Elo kỳ vọng & hệ số K')
check(Math.abs(expectedScore(500, 500) - 0.5) < 1e-9, 'ngang sức thì cơ hội 50%')
check(expectedScore(700, 500) > 0.5, 'điểm cao hơn thì kỳ vọng thắng lớn hơn')
check(expectedScore(500, 700) < 0.5, 'điểm thấp hơn thì kỳ vọng thắng nhỏ hơn')
check(expectedScore(500, 500) + expectedScore(500, 500) === 1, 'hai cơ hội cộng lại bằng 1')
check(kFactor(8) === K_YOUNG, 'bé nhỏ dùng hệ số K nhỏ (học mượt)')
check(kFactor(13) === K_TEEN, 'từ 13 tuổi dùng hệ số K lớn (bám sức thật)')
check(kFactor(20) === K_TEEN, 'người lớn cũng dùng hệ số K lớn')
check(kFactor(null) === K_YOUNG, 'chưa có tuổi thì mặc định như bé nhỏ')

console.log('\n▶ Làm đúng thì lên điểm')
const afterCorrect = updateRating(fresh, attempt('easy', true))
check(afterCorrect.overall > 500, 'làm đúng một câu là điểm tăng')
check(afterCorrect.byTheme.fork > 500, 'điểm riêng dạng cũng tăng theo')
check(afterCorrect.history.length === 1, 'nhật ký ghi lại đúng một lần')
check(afterCorrect.history[0].delta > 0, 'lần đúng ghi delta dương')
check(fresh.overall === 500, 'sổ cũ không bị sửa (trả về sổ mới)')

console.log('\n▶ Làm sai KHÔNG bao giờ bị trừ điểm')
const wrong = updateRating(fresh, attempt('hard', false))
check(wrong.overall === 500, 'sai một câu khó vẫn giữ nguyên 500')
check(wrong.byTheme.fork === 500, 'điểm riêng dạng cũng không bị kéo xuống')
check(wrong.history[0].delta === 0, 'lần sai ghi delta bằng 0')
let neverDrops = true
let book = fresh
for (let i = 0; i < 40; i += 1) {
  book = updateRating(book, attempt(i % 2 === 0 ? 'hard' : 'easy', false))
  if (book.overall < 500) neverDrops = false
}
check(neverDrops, 'sai liên tục 40 lần vẫn không rơi dưới điểm xuất phát')
check(book.overall === 500, 'sau toàn bộ lần sai, điểm đứng yên ở 500')

console.log('\n▶ Câu càng khó, thắng càng được nhiều điểm')
const easyWin = updateRating(fresh, attempt('easy', true)).overall
const hardWin = updateRating(fresh, attempt('hard', true)).overall
check(hardWin > easyWin, 'hạ câu khó được cộng nhiều hơn hạ câu dễ')
check(DIFFICULTY_RATINGS.easy < DIFFICULTY_RATINGS.medium, 'điểm quy của dễ < vừa')
check(DIFFICULTY_RATINGS.medium < DIFFICULTY_RATINGS.hard, 'điểm quy của vừa < khó')

console.log('\n▶ Nhật ký bị chặn trần')
let longBook = fresh
for (let i = 0; i < HISTORY_LIMIT + 30; i += 1) {
  longBook = updateRating(longBook, attempt('medium', true))
}
check(longBook.history.length === HISTORY_LIMIT, `nhật ký kẹp ở ${HISTORY_LIMIT} lần gần nhất`)

console.log('\n▶ Tên cấp độ bé nhìn thấy')
check(LEVELS.length === 5, 'có đúng 5 nấc cấp độ')
check(LEVELS[0].name === 'Mầm cờ' && LEVELS[0].min === 0, 'nấc đầu là Mầm cờ ở 0 điểm')
check(LEVELS[LEVELS.length - 1].name === 'Cao thủ nhí', 'nấc cuối là Cao thủ nhí')
check(levelFor(500).id === 'mam-co', 'mới vào vẫn là Mầm cờ')
check(levelFor(550).id === 'biet-di-co', 'chạm 550 lên Biết đi cờ')
check(levelFor(699).id === 'biet-di-co', '699 vẫn ở Biết đi cờ')
check(levelFor(700).id === 'chac-tay', 'chạm 700 lên Chơi chắc tay')
check(levelFor(850).id === 'sac-ben', 'chạm 850 lên Đánh sắc bén')
check(levelFor(1000).id === 'cao-thu-nhi', 'chạm 1000 lên Cao thủ nhí')
check(levelFor(9999).id === 'cao-thu-nhi', 'điểm rất cao vẫn ở nấc cuối cùng')
check(levelFor(0).id === 'mam-co', 'điểm 0 vẫn là Mầm cờ')

console.log('\n▶ Nấc kế tiếp & thanh tiến độ')
check(nextLevelOf(500)?.id === 'biet-di-co', 'từ Mầm cờ, nấc kế là Biết đi cờ')
check(nextLevelOf(1000) === null, 'ở nấc cao nhất thì không còn nấc kế')
check(Math.abs(levelProgress(500) - 500 / 550) < 0.001, 'mới vào 500 điểm đã gần chạm nấc kế (Mầm cờ 0→550)')
check(Math.abs(levelProgress(625) - 0.5) < 0.01, 'giữa nấc (550→700) thì thanh tiến độ ~50%')
check(levelProgress(1000) === 1, 'nấc cao nhất thì thanh tiến độ đầy')
check(levelProgress(0) >= 0 && levelProgress(9999) <= 1, 'tiến độ luôn kẹp trong 0..1')

console.log('\n▶ Gợi ý câu vừa sức')
check(suggestedDifficulty(500) === 'medium', 'bé 500 nhận câu vừa (600 gần nhất)')
check(suggestedDifficulty(450) === 'easy', 'bé thấp nhận câu dễ')
check(suggestedDifficulty(760) === 'hard', 'bé cao nhận câu khó')
const validTiers: PuzzleDifficulty[] = ['easy', 'medium', 'hard']
check(
  [0, 300, 500, 800, 2000].every((r) => validTiers.includes(suggestedDifficulty(r))),
  'mọi mức điểm đều trả về một mức câu hợp lệ',
)

console.log('\n▶ Gợi ý máy đấu')
check(suggestedBotLevel(500) === 'easy', 'điểm thấp đấu máy Dễ')
check(suggestedBotLevel(600) === 'medium', 'điểm vừa đấu máy Vừa')
check(suggestedBotLevel(800) === 'hard', 'điểm khá đấu máy Khó')
check(suggestedBotLevel(1000) === 'master', 'điểm cao đấu máy Siêu')
check(suggestedBotLevel(549) === 'easy', 'sát ngưỡng 550 vẫn ở mức Dễ')
check(suggestedBotLevel(950) === 'master', 'chạm 950 lên máy Siêu')

console.log('\n▶ Điểm riêng từng dạng & dạng yếu nhất')
const themed = updateRating(updateRating(fresh, attempt('hard', true, 'fork')), attempt('easy', true, 'pin'))
check(themeRating(themed, 'fork') > themeRating(themed, 'pin'), 'dạng luyện câu khó có điểm cao hơn')
check(themeRating(themed, 'chua-lam') === 500, 'dạng chưa làm lấy điểm xuất phát')
check(weakestTheme(themed, ['fork', 'pin']) === 'pin', 'chỉ đúng dạng yếu nhất')
check(weakestTheme(themed, ['fork', 'pin', 'skewer']) === 'skewer', 'dạng chưa làm tính là yếu nhất')
check(weakestTheme(themed, []) === null, 'không có dạng nào thì trả về null')
check(themePercent(500) === 0, 'thanh nhỏ: 500 điểm là 0%')
check(Math.abs(themePercent(750) - 0.5) < 1e-9, 'thanh nhỏ: 750 điểm là 50%')
check(themePercent(1000) === 1 && themePercent(5000) === 1, 'thanh nhỏ: từ 1000 là đầy 100%')

const total = 55
if (failures === 0) {
  console.log(`\n✅ RATING PASS! (${total} kiểm tra)\n`)
  process.exit(0)
}
console.error(`\n❌ RATING FAIL: ${failures} lỗi\n`)
process.exit(1)
