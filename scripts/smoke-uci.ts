/**
 * Smoke test bộ phân tích giao thức UCI của Stockfish.
 * Chạy: node scripts/smoke-uci.ts
 */
import { extractBestMove, extractDepth, isReady, uciToEngineMove } from '../src/engine/uci.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Đọc nước đi từ chuỗi UCI')
check(
  extractBestMove(['info depth 10', 'bestmove e2e4 ponder e7e5']) === 'e2e4',
  'lấy đúng nước từ dòng bestmove (bỏ phần ponder)',
)
check(
  extractBestMove(['bestmove e2e4', 'info depth 2', 'bestmove g1f3']) === 'g1f3',
  'có nhiều dòng bestmove thì lấy dòng cuối',
)
check(extractBestMove(['bestmove (none)']) === null, 'bestmove (none) trả về null')
check(extractBestMove(['bestmove none']) === null, 'bestmove none trả về null')
check(extractBestMove(['info depth 3']) === null, 'không có bestmove thì trả về null')
check(extractBestMove([]) === null, 'danh sách rỗng trả về null')

console.log('\n▶ Đọc độ sâu & trạng thái sẵn sàng')
check(extractDepth(['info depth 8 score cp 20']) === 8, 'đọc được độ sâu')
check(
  extractDepth(['info depth 6', 'info depth 15 nodes 1000']) === 15,
  'lấy độ sâu ở dòng info cuối',
)
check(extractDepth(['uciok']) === null, 'không có depth thì trả về null')
check(isReady(['id name Stockfish', 'uciok']) === true, 'thấy uciok là đã sẵn sàng')
check(isReady(['id name Stockfish']) === false, 'chưa thấy uciok thì chưa sẵn sàng')

console.log('\n▶ Đổi nước UCI sang SAN')
{
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const e4 = uciToEngineMove(START, 'e2e4')
  check(e4?.san === 'e4' && e4.from === 'e2' && e4.to === 'e4', 'e2e4 → SAN "e4"')

  const knight = uciToEngineMove(START, 'g1f3')
  check(knight?.san === 'Nf3', 'g1f3 → SAN "Nf3"')

  const promoFen = 'k7/4P3/8/8/8/8/8/4K3 w - - 0 1'
  const promo = uciToEngineMove(promoFen, 'e7e8q')
  check(promo?.san === 'e8=Q+' && promo.promotion === 'q', 'e7e8q → SAN "e8=Q+" (phong Hậu, kèm chiếu)')

  check(uciToEngineMove(START, 'e2e5') === null, 'nước không hợp lệ (e2e5) trả về null')
  check(uciToEngineMove(START, 'zzzz') === null, 'chuỗi rác trả về null')
  check(uciToEngineMove(START, '') === null, 'chuỗi rỗng trả về null')
  check(uciToEngineMove('không phải FEN', 'e2e4') === null, 'FEN hỏng trả về null')
}

const total = 17
if (failures === 0) {
  console.log(`\n✅ UCI PASS! (${total} kiểm tra)\n`)
  process.exit(0)
}
console.error(`\n❌ UCI FAIL: ${failures} lỗi\n`)
process.exit(1)
