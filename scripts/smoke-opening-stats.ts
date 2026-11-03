/**
 * Kiểm tra phần **% ván Lichess** (`src/lib/openingStats.ts`) ở chỗ KHÔNG cần mạng:
 * thế cờ mốc phải đúng, và mọi khai cuộc phải có mốc đo nằm trong dòng chính của nó.
 *
 * Vì sao cần: cả tính năng đứng trên một giả định dễ sai - "mốc đo là nửa nước thứ N".
 * Lệch một nửa nước là con số % nói về một thế cờ khác hẳn, mà giao diện vẫn bình
 * thường. Mạng/API thì không kiểm ở đây được (Lichess chặn theo IP), nên bài này chỉ
 * chốt phần suy ra thế cờ và bảng mốc.
 *
 * Chạy: node scripts/smoke-opening-stats.ts
 */
import { OPENINGS } from '../src/data/openings.ts'
import { STATS_PLY, markerFen } from '../src/lib/openingStats.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Thế cờ mốc suy ra từ dòng chính')

const italian = OPENINGS.find((opening) => opening.id === 'italian')
if (!italian) {
  failures += 1
  console.error('  ✗ không tìm thấy khai cuộc italian để kiểm')
} else {
  const fen = markerFen(italian.moves, 5)
  check(
    fen === 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    `sau 5 nửa nước của Ván cờ Ý ra đúng thế cờ 3.Bc4 (${fen})`,
  )
  check(markerFen(italian.moves, 3)?.includes(' b ') === true, 'mốc lẻ cũng ra thế cờ hợp lệ')
  check(markerFen(italian.moves, italian.moves.length + 2) === null, 'xin mốc dài hơn dòng chính → null')
  check(markerFen(italian.moves, 0) === null, 'mốc 0 → null (không đo thế cờ ban đầu)')
  check(markerFen([{ san: 'Zz9' }], 1) === null, 'nước không hợp lệ → null, không ném lỗi')
}

console.log('\n▶ Bảng mốc đo phải khớp dữ liệu thật')

check(
  OPENINGS.every((opening) => typeof STATS_PLY[opening.id] === 'number'),
  `cả ${OPENINGS.length} khai cuộc đều có mốc đo`,
)
const tooLong = OPENINGS.filter(
  (opening) => (STATS_PLY[opening.id] ?? 0) > opening.moves.length,
)
check(
  tooLong.length === 0,
  tooLong.length === 0
    ? 'mốc đo không vượt quá dòng chính của bài'
    : `mốc đo vượt dòng chính: ${tooLong.map((item) => item.id).join(', ')}`,
)
check(
  OPENINGS.every((opening) => {
    const ply = STATS_PLY[opening.id] ?? 0
    // Mốc phải kết thúc bằng nước CỦA CHÍNH khai cuộc đó: nửa nước lẻ là của
    // Trắng, nửa nước chẵn là của Đen.
    const whiteMovedLast = ply % 2 === 1
    return opening.side === 'white' ? whiteMovedLast : !whiteMovedLast
  }),
  'nước cuối của mốc là nước của bên chơi khai cuộc (Ý → 3.Bc4, Sicilian → 1...c5)',
)
const markers = Object.values(STATS_PLY)
check(
  Math.max(...markers) <= 6,
  `mọi mốc nằm trong 3 nước đầu (mốc xa nhất: ${Math.max(...markers)} nửa nước)`,
)

console.log(
  failures === 0 ? '\n✅ % VÁN KHAI CUỘC PASS!\n' : `\n❌ % VÁN KHAI CUỘC CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
