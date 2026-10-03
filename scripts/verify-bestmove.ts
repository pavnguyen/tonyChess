/**
 * Chứng minh nước "hay nhất" của tab Trung cuộc bằng **chính engine của app**.
 *
 * Khác `validate-chess.ts` (chỉ kiểm FEN hợp lệ), script này chấm điểm MỌI nước ở mỗi
 * thế cờ bằng engine rồi đối chiếu với `bestSan` ghi trong dữ liệu: nước đó phải nằm
 * trong nhóm tốt nhất (cách nước số 1 không quá `MARGIN` điểm). Nhờ vậy app dạy đúng
 * nước mạnh nhất, không phán bừa.
 *
 * Chạy: npm run verify:bestmove
 */
import { BEST_MOVES } from '../src/data/bestMoves.ts'
import { rankMoves } from '../src/engine/minimax.ts'

/** Chênh lệch tối đa (centipawn) so với nước số 1 để vẫn coi là "hay nhất". */
const MARGIN = 60
/** Ngân sách thời gian cho mỗi thế (ms) - để máy chấm cho hết, không cắt ngang. */
const BUDGET = 60_000

let failures = 0
const ok = (msg: string) => console.log('  ✓ ' + msg)
const fail = (msg: string) => {
  failures += 1
  console.error('  ✗ ' + msg)
}

console.log(`\n▶ Trung cuộc - máy chấm nước hay nhất (margin ${MARGIN}cp)\n`)

for (const puzzle of BEST_MOVES) {
  const ranked = rankMoves(puzzle.fen, 'hard', BUDGET)
  if (ranked.length === 0) {
    fail(`${puzzle.id}: FEN lỗi hoặc thế cờ không có nước đi`)
    continue
  }

  const best = ranked[0]
  const mine = ranked.find((move) => move.san === puzzle.bestSan)
  if (!mine) {
    fail(`${puzzle.id}: nước "${puzzle.bestSan}" không có trong danh sách nước hợp lệ`)
    continue
  }

  const gap = best.score - mine.score
  const top3 = ranked
    .slice(0, 3)
    .map((move) => `${move.san}(${move.score})`)
    .join(', ')

  if (gap <= MARGIN) {
    ok(`${puzzle.id}: ${puzzle.bestSan} là nước hay nhất (máy: ${top3})`)
  } else {
    fail(
      `${puzzle.id}: "${puzzle.bestSan}"(${mine.score}) kém máy ${gap} điểm - máy thích "${best.san}"(${best.score}); top: ${top3}`,
    )
  }
}

console.log(
  failures === 0
    ? `\n✅ TRUNG CUỘC PASS! (${BEST_MOVES.length} thế đúng như ghi)\n`
    : `\n❌ TRUNG CUỘC: ${failures} thế sai nước hay nhất\n`,
)
process.exit(failures === 0 ? 0 : 1)
