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
import { Chess } from 'chess.js'
import { BEST_MOVES } from '../src/data/bestMoves.ts'
import { evaluateWhite, rankMoves } from '../src/engine/minimax.ts'

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

  // ── Chuỗi "đánh tiếp": kiểm tra từng nước của bé cũng là nước hay nhất, và
  // cuối chuỗi phải là chiếu bí hoặc thế thắng rõ ràng cho bé.
  if (!puzzle.continuation?.length) continue
  const full = [puzzle.bestSan, ...puzzle.continuation]
  const sim = new Chess()
  sim.load(puzzle.fen)
  sim.move(puzzle.bestSan)
  let lineBad = false
  for (let i = 1; i < full.length; i += 1) {
    // i lẻ = nước đối thủ (ta tự đi), i chẵn = nước của bé (phải do máy chấm).
    if (i % 2 === 0) {
      const kidTurnFen = sim.fen()
      const rankedHere = rankMoves(kidTurnFen, 'hard', BUDGET)
      const top = rankedHere[0]
      const played = rankedHere.find((m) => m.san === full[i])
      if (!played || !top) {
        fail(`${puzzle.id}: nước bé "${full[i]}" không có trong danh sách hợp lệ`)
        lineBad = true
      } else if (top.score - played.score > MARGIN) {
        fail(
          `${puzzle.id}: nước bé "${full[i]}" kém máy ${top.score - played.score} điểm (máy thích "${top.san}")`,
        )
        lineBad = true
      }
    }
    try {
      sim.move(full[i])
    } catch {
      fail(`${puzzle.id}: nước "${full[i]}" trong chuỗi không hợp lệ`)
      lineBad = true
      break
    }
  }

  if (!lineBad) {
    const mate = sim.isCheckmate()
    const whiteEval = evaluateWhite(sim)
    const kidWhite = puzzle.side === 'white'
    const winning = kidWhite ? whiteEval >= 200 : whiteEval <= -200
    if (mate || winning) {
      ok(
        `${puzzle.id}: chuỗi đánh tiếp "${full.join(' ')}" - ${mate ? 'chiếu bí' : `thế thắng (${kidWhite ? '+' : ''}${Math.round(whiteEval / 100)})`}`,
      )
    } else {
      fail(
        `${puzzle.id}: chuỗi "${full.join(' ')}" chưa kết thúc thắng (eval ${Math.round(whiteEval / 100)})`,
      )
    }
  }
}

console.log(
  failures === 0
    ? `\n✅ TRUNG CUỘC PASS! (${BEST_MOVES.length} thế đúng như ghi)\n`
    : `\n❌ TRUNG CUỘC: ${failures} thế sai nước hay nhất\n`,
)
process.exit(failures === 0 ? 0 : 1)
