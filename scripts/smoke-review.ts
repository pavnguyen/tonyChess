/**
 * Kiểm tra **Tổng kết cả ván** (`src/lib/gameReview.ts`): 3 lỗi nặng nhất, kiểu lỗi,
 * và chỗ bé rời bài khai cuộc.
 *
 * Chạy: node scripts/smoke-review.ts
 */
import { OPENINGS } from '../src/data/openings.ts'
import { bookExit, moveNumber, reviewGame } from '../src/lib/gameReview.ts'
import type { Blunder } from '../src/lib/coach.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Số nước hiển thị cho bé')

check(moveNumber(0) === 1, 'ply 0 (nước Trắng đầu tiên) → “nước 1”')
check(moveNumber(1) === 1, 'ply 1 (nước Đen đáp) → vẫn “nước 1”')
check(moveNumber(22) === 12, 'ply 22 → “nước 12”')

console.log('\n▶ Rời bài khai cuộc ở đâu')

const opening = OPENINGS.find((item) => item.moves.length >= 10)
if (!opening) {
  failures += 1
  console.error('  ✗ không tìm được khai cuộc nào đủ 10 nửa nước để kiểm')
} else {
  const book = opening.moves.slice(0, 8).map((move) => move.san)
  const left = bookExit([...book, 'Qh5'])
  check(left !== null, `khớp bài “${opening.englishName}” rồi đi khác → có báo`)
  check(left?.ply === 8, `báo đúng nửa nước rời bài (8), nhận: ${left?.ply}`)
  check(left?.name === opening.englishName, 'báo đúng tên quốc tế của khai cuộc')
  check(left?.id === opening.id, 'báo đúng id để nhảy sang tab Khai cuộc')

  check(bookExit(book) === null, 'còn đúng bài (chưa đi khác) → không báo gì')
  check(bookExit(['e4']) === null, 'ván quá ngắn (1 nước) → không báo gì')
  check(
    bookExit(['a3', 'a6', 'h3', 'h6', 'a4', 'a5']) === null,
    'đi lung tung không theo bài nào → không báo sai bài',
  )
}

console.log('\n▶ Tổng kết ván: 3 lỗi nặng nhất + kiểu lỗi')

const blunder = (lossCp: number, ply: number): Blunder => ({
  date: new Date(2026, 10, 1, 12, ply).toISOString(),
  fen: `fen-${ply}`,
  san: 'Qh5',
  bestSan: 'Nf3',
  lossCp,
  ply,
})

const list: Blunder[] = [blunder(110, 1), blunder(340, 7), blunder(920, 15), blunder(160, 20)]
const review = reviewGame(
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6', 'd3'],
  list,
)

check(review.worst.length === 3, 'chỉ lấy 3 lỗi nặng nhất, không liệt kê hết')
check(review.worst[0].lossCp === 920, `lỗi nặng nhất đứng đầu (${review.worst[0].lossCp})`)
check(
  review.worst.every((item, i) => i === 0 || review.worst[i - 1].lossCp >= item.lossCp),
  'ba lỗi xếp giảm dần theo điểm mất',
)
check(review.groups.length >= 1 && review.groups.length <= 3, 'kiểu lỗi gọn trong 3 nhóm')
check(review.losses === 4, `đếm đúng số nước mất ≥ 1 điểm (4), nhận: ${review.losses}`)
check(review.exit === null || typeof review.exit.ply === 'number', 'phần rời bài khai cuộc trả về hợp lệ')

console.log('\n▶ Ván không có lỗi nào')

const clean = reviewGame(['e4', 'e5'], [])
check(clean.worst.length === 0, 'không lỗi → danh sách rỗng (không hiện thẻ tổng kết)')
check(clean.losses === 0, 'không lỗi → 0 nước mất điểm')

console.log(
  failures === 0 ? '\n✅ TỔNG KẾT VÁN PASS!\n' : `\n❌ TỔNG KẾT VÁN CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
