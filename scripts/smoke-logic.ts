/**
 * Smoke test các module logic thuần (không cần DOM).
 * Chạy: node scripts/smoke-logic.ts
 */
import { Chess } from 'chess.js'
import { ENDGAMES } from '../src/data/endgames.ts'
import { OPENINGS } from '../src/data/openings.ts'
import { TACTICS } from '../src/data/tactics.ts'
import { findHintMove } from '../src/lib/hints.ts'
import { formatSan, moveLabel, pieceFromSan } from '../src/lib/notation.ts'
import {
  computeHeatmap,
  findHangingPieces,
  HEATMAP_COLORS,
  legalTargets,
} from '../src/lib/threats.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Ký hiệu nước đi')
check(formatSan('Nf3', 'figurine') === '♘f3', 'figurine: Nf3 → ♘f3')
check(formatSan('Nf3', 'english') === 'Nf3', 'english: Nf3 → Nf3')
check(formatSan('Nf3', 'vietnamese') === 'Mf3', 'vietnamese: Nf3 → Mf3')
check(formatSan('e4', 'vietnamese') === 'e4', 'Tốt giữ nguyên: e4')
check(formatSan('O-O', 'figurine') === 'O-O', 'Nhập thành giữ nguyên: O-O')
check(pieceFromSan('Qh5#') === 'q' && pieceFromSan('d4') === 'p', 'đoán quân từ SAN')
check(moveLabel(0, 'd4', 'english') === '1. d4', 'số nước Trắng: 1. d4')
check(moveLabel(1, 'd5', 'english') === '1... d5', 'số nước Đen: 1... d5')

console.log('\n▶ Mắt Thần Cờ Vua (heatmap)')
for (const opening of OPENINGS) {
  const game = new Chess()
  const fen = game.fen()
  const map = computeHeatmap(game, 'white')
  const squares = Object.keys(map)
  // Đối chiếu với chính bảng màu của app (không viết lại mã màu ở đây), để đổi
  // gam màu không làm bài kiểm tra "chết" oan.
  const red = Object.values(map).filter(
    (style) => style.backgroundColor === HEATMAP_COLORS.danger,
  ).length
  check(squares.length === 64, `${opening.id}: tô đủ 64 ô (FEN ${fen.slice(0, 12)}…)`)
  check(red > 0, `${opening.id}: thế đầu ván có ${red} ô bị đe dọa`)
  const targets = legalTargets(game, 'e2')
  check(Object.keys(targets).length === 2, `${opening.id}: Tốt e2 có 2 nước hợp lệ`)
}

console.log('\n▶ Cảnh báo quân bị treo (dấu ⚠️)')
{
  const start = new Chess()
  check(findHangingPieces(start, 'white').length === 0, 'thế đầu ván: không quân nào bị treo')

  const queenHang = new Chess('4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1')
  const hangingBlack = findHangingPieces(queenHang, 'black')
  check(
    hangingBlack.some((item) => item.square === 'd5' && item.defenders === 0),
    'Hậu đen ở d5 bị Tốt e4 treo (không ai đỡ) → có báo động',
  )
  const hangingWhite = findHangingPieces(queenHang, 'white')
  check(
    hangingWhite.some((item) => item.square === 'e4' && item.defenders === 0),
    'cùng thế cờ: Tốt e4 của Trắng bị Hậu d5 đe dọa → cũng báo động',
  )
  const heat = computeHeatmap(queenHang, 'black')
  check(
    Boolean(heat.d5?.backgroundImage) && Boolean(heat.d5?.boxShadow),
    'ô d5 được tô đỏ kèm huy hiệu cảnh báo',
  )

  // Quân đang được đỡ ngang giá thì không báo (Tốt đỡ Tốt).
  const defendedPawn = new Chess('4k3/8/2p5/3p4/2P5/8/8/4K3 b - - 0 1')
  check(
    !findHangingPieces(defendedPawn, 'black').some((item) => item.square === 'd5'),
    'Tốt d5 bị tấn công nhưng có Tốt ngang giá đỡ → không báo động',
  )
}

console.log('\n▶ Gợi ý tàn cuộc')
for (const challenge of ENDGAMES) {
  const game = new Chess()
  game.load(challenge.fen)
  const hint = findHintMove(game, challenge.goal, 'w')
  if (!hint) {
    check(false, `${challenge.id}: có nước gợi ý`)
    continue
  }
  const probe = new Chess(challenge.fen)
  const applied = probe.move(hint.san)
  const good =
    challenge.goal === 'promote'
      ? applied.piece === 'p'
      : probe.isCheckmate() || applied.san.includes('+')
  check(good, `${challenge.id}: gợi ý "${hint.san}" hợp lý cho mục tiêu ${challenge.goal}`)
}

console.log('\n▶ Đối thủ ngẫu nhiên đi được')
for (const puzzle of TACTICS) {
  const game = new Chess()
  game.load(puzzle.fen)
  game.move(puzzle.solution)
  // Các thế chiếu bí kết thúc ván ngay, không cần (và không thể) cho đối thủ đáp lại.
  if (game.isGameOver()) {
    check(true, `${puzzle.id}: ${puzzle.solution} kết thúc ván ngay (chiếu bí) - đúng như mong đợi`)
    continue
  }
  const options = game.moves()
  check(options.length > 0, `${puzzle.id}: sau ${puzzle.solution} đối thủ còn nước đi`)
}

console.log(
  failures === 0 ? '\n✅ SMOKE TEST LOGIC PASS!\n' : `\n❌ ${failures} LỖI LOGIC\n`,
)
process.exit(failures === 0 ? 0 : 1)
