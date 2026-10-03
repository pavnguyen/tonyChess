/**
 * Smoke test các module logic thuần (không cần DOM).
 * Chạy: node scripts/smoke-logic.ts
 */
import { Chess } from 'chess.js'
import { ENDGAMES } from '../src/data/endgames.ts'
import { OPENINGS } from '../src/data/openings.ts'
import { BEST_MOVES, BEST_MOVE_THEMES } from '../src/data/bestMoves.ts'
import { coordinateLabels, splitSquare } from '../src/lib/coordinates.ts'
import {
  describeMoveEnglish,
  describeOpeningEnglish,
  describePieceEnglish,
  squareSpeech,
} from '../src/lib/speech.ts'
import { findHintMove } from '../src/lib/hints.ts'
import { tabKeyForPath, TIPS_BY_LESSON, TIPS_BY_TAB, tipsFor } from '../src/lib/parentTips.ts'
import {
  formatSan,
  formatSanLetters,
  moveLabel,
  NOTATION_LEGEND,
  NOTATION_OPTIONS,
  NOTATION_SYMBOLS,
  pieceFromSan,
} from '../src/lib/notation.ts'
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
check(formatSan('Nf3', 'figurine') === '♘Nf3', 'figurine: Nf3 → ♘Nf3 (hình + chuẩn quốc tế)')
check(formatSan('Nf3', 'vietnamese') === 'Mf3', 'vietnamese: Nf3 → Mf3')
check(formatSanLetters('Nf3') === 'Nf3', 'quốc tế thuần (bỏ hình): Nf3 → Nf3')
// Bảng chọn chỉ còn 2 tuýp: "Hình cờ + quốc tế" ĐÃ chứa ký hiệu quốc tế, nên
// lựa chọn "Chuẩn quốc tế" riêng là thừa và đã bị bỏ.
check(
  NOTATION_OPTIONS.length === 2 &&
    NOTATION_OPTIONS.map((option) => option.value).join() === 'figurine,vietnamese',
  'bảng chọn chỉ còn "Hình cờ + quốc tế" và "Tiếng Việt" (không có tuýp thuần quốc tế)',
)
check(formatSan('e4', 'figurine') === 'e4', 'Tốt giữ nguyên: e4')
check(formatSan('e4', 'vietnamese') === 'e4', 'Tốt giữ nguyên: e4')
check(formatSan('O-O', 'figurine') === 'O-O', 'Nhập thành giữ nguyên: O-O')
check(formatSan('Bc4', 'figurine') === '♗Bc4', 'figurine giữ cả ký hiệu Tượng: Bc4 → ♗Bc4')
check(
  formatSan('Nf3', 'figurine').includes('♘') && formatSan('Nf3', 'figurine').includes('N'),
  'tuýp hình cờ có ĐỦ cả hình lẫn ký hiệu FIDE',
)
check(pieceFromSan('Qh5#') === 'q' && pieceFromSan('d4') === 'p', 'đoán quân từ SAN')
check(moveLabel(0, 'd4', 'figurine') === '1. d4', 'số nước Trắng: 1. d4')
check(moveLabel(1, 'd5', 'figurine') === '1... d5', 'số nước Đen: 1... d5')

console.log('\n▶ Bảng đối chiếu ký hiệu (đủ để đọc trọn một biên bản cờ)')
const legendPieces = NOTATION_LEGEND.map((row) => row.piece)
check(
  legendPieces.join('') === 'kqrbnp',
  `bảng đối chiếu có đủ 6 quân (${legendPieces.join('')})`,
)
check(
  NOTATION_LEGEND.every((row) => row.glyph && row.fide !== undefined && row.viet !== undefined && row.name),
  'mỗi quân đều có hình cờ + ký hiệu FIDE + ký hiệu Việt + tên',
)
const symbols = NOTATION_SYMBOLS.map((row) => row.glyph)
const requiredSymbols = ['O-O', 'O-O-O', '+', '#', 'x', '=', 'e.p.', '!', '?', '1-0', '0-1', '½-½']
check(
  requiredSymbols.every((glyph) => symbols.includes(glyph)),
  `có đủ ký hiệu đặc biệt: nhập thành, chiếu, chiếu bí, ăn quân, phong cấp, qua đường, hay/dở, kết quả (${symbols.length})`,
)
check(
  new Set(symbols).size === symbols.length &&
    NOTATION_SYMBOLS.every((row) => row.meaning.length > 4 && row.sample.length > 0),
  'không ký hiệu nào trùng nhau và ký hiệu nào cũng có nghĩa + nước ví dụ',
)
// Nước ví dụ phải THẬT SỰ dùng đúng ký hiệu đó (bắt lỗi gõ nhầm, ví dụ "#" thành "+").
const symbolSamplesOk = NOTATION_SYMBOLS.filter((row) => row.sample !== row.glyph).every((row) => {
  if (row.glyph === 'e.p.') return row.sample.includes('e.p.')
  return row.sample.includes(row.glyph)
})
check(symbolSamplesOk, 'nước ví dụ của mỗi ký hiệu đều chứa đúng ký hiệu đó')
// Đối chiếu với nước cờ thật của app: chiếu bí phải kết thúc bằng "#".
const matePuzzles = BEST_MOVES.filter((puzzle) => puzzle.bestSan.includes('#'))
check(
  matePuzzles.length > 0 &&
    matePuzzles.every((puzzle) => {
      const probe = new Chess()
      probe.load(puzzle.fen)
      return probe.move(puzzle.bestSan) && probe.isCheckmate()
    }),
  `mọi nước hay nhất có dấu "#" đều thật sự chiếu bí (${matePuzzles.length} thế)`,
)

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
for (const puzzle of BEST_MOVES) {
  const game = new Chess()
  game.load(puzzle.fen)
  game.move(puzzle.bestSan)
  // Các thế chiếu bí kết thúc ván ngay, không cần (và không thể) cho đối thủ đáp lại.
  if (game.isGameOver()) {
    check(true, `${puzzle.id}: ${puzzle.bestSan} kết thúc ván ngay (chiếu bí) - đúng như mong đợi`)
    continue
  }
  const options = game.moves()
  check(options.length > 0, `${puzzle.id}: sau ${puzzle.bestSan} đối thủ còn nước đi`)
}

console.log('\n▶ Gợi ý cho ba mẹ (§10)')
check(tabKeyForPath('/') === '/', 'tab gốc: Khai cuộc')
check(tabKeyForPath('/tactics') === '/tactics', 'khớp đúng tab Trung cuộc')
check(tabKeyForPath('/free-play') === '/free-play', 'khớp tab Đấu với Robot')
check(tabKeyForPath('/khong-ton-tai') === '/', 'đường dẫn lạ → quay về mẫu của tab gốc')

for (const [route, tip] of Object.entries(TIPS_BY_TAB)) {
  check(
    tip.questions.length >= 1 && tip.questions.length <= 2,
    `${route}: có 1-2 câu hỏi (${tip.questions.length})`,
  )
  check(
    tip.questions.every((item) => item.q.trim().length >= 20),
    `${route}: câu hỏi đủ rõ để ba mẹ hỏi ngay`,
  )
  check(
    tip.questions.every((item) => item.a.trim().length >= 20),
    `${route}: câu hỏi nào cũng có đáp án gợi ý (ba mẹ không biết cờ vẫn dùng được)`,
  )
}

// Mỗi bài học đang dạy phải có câu hỏi RIÊNG, không rơi về mẫu chung.
for (const opening of OPENINGS) {
  const key = `opening:${opening.id}`
  check(Boolean(TIPS_BY_LESSON[key]?.length), `${key}: có câu hỏi riêng`)
}
const lessonTip = tipsFor('/strategy', 'opening:london')
const tabTip = tipsFor('/strategy', null)
check(
  lessonTip.questions[0].q === TIPS_BY_LESSON['opening:london'][0].q,
  'đang mở bài học → hiện đúng câu hỏi của bài đó',
)
check(
  tabTip.questions[0].q === TIPS_BY_TAB['/strategy'].questions[0].q,
  'không rõ bài → rơi về câu hỏi chung của tab',
)
check(
  Object.values(TIPS_BY_LESSON).every((items) => items.every((item) => item.a.trim().length >= 20)),
  'mọi câu hỏi riêng của bài học đều có đáp án gợi ý',
)
check(tipsFor('/endgames', 'opening:london').questions.length > 0, 'bài lạ trong tab khác vẫn có câu hỏi')

console.log('\n▶ Toạ độ bàn cờ (cột a-h, hàng 1-8)')
const whiteLabels = coordinateLabels('white')
const blackLabels = coordinateLabels('black')
check(
  whiteLabels.files.join('') === 'abcdefgh',
  `bàn Trắng: cột trái→phải là a…h (“${whiteLabels.files.join('')}”)`,
)
check(
  whiteLabels.ranks.join('') === '87654321',
  `bàn Trắng: hàng trên→dưới là 8…1 (“${whiteLabels.ranks.join('')}”)`,
)
check(
  blackLabels.files.join('') === 'hgfedcba',
  `bàn Đen (xoay 180°): cột đảo thành h…a (“${blackLabels.files.join('')}”)`,
)
check(
  blackLabels.ranks.join('') === '12345678',
  `bàn Đen: hàng đảo thành 1…8 (“${blackLabels.ranks.join('')}”)`,
)
// Bàn Đen phải là bản ĐẢO của bàn Trắng, không phải một danh sách viết tay dễ lệch.
check(
  blackLabels.files.join('') === [...whiteLabels.files].reverse().join('') &&
    blackLabels.ranks.join('') === [...whiteLabels.ranks].reverse().join(''),
  'hai hướng là ảnh đảo của nhau (không thể lệch nhau)',
)
check(
  splitSquare('e4')?.file === 'e' && splitSquare('e4')?.rank === '4',
  'tách ô “e4” thành cột e, hàng 4',
)
check(splitSquare('z9') === null && splitSquare('') === null, 'ô không hợp lệ → trả null')

console.log('\n▶ Trung cuộc: “Khi nào dùng?” + 4 chủ đề “Tìm nước hay nhất”')
const moveThemes = Object.keys(BEST_MOVE_THEMES) as (keyof typeof BEST_MOVE_THEMES)[]
for (const theme of moveThemes) {
  check(
    BEST_MOVE_THEMES[theme].when.trim().length >= 30,
    `${theme}: có dòng “Khi nào dùng?” đủ rõ (${BEST_MOVE_THEMES[theme].when.length} ký tự)`,
  )
  check(
    BEST_MOVES.filter((puzzle) => puzzle.theme === theme).length >= 2,
    `${theme}: có ít nhất 2 thế cờ để luyện (${BEST_MOVES.filter((p) => p.theme === theme).length})`,
  )
}
check(
  BEST_MOVES.every((puzzle) => puzzle.goodMoves.includes(puzzle.bestSan)),
  'mọi thế cờ đều chấp nhận chính nước hay nhất',
)

console.log('\n▶ Phát âm toạ độ & nước đi (giọng Mỹ qua Web Speech API)')
check(squareSpeech('e2') === 'E 2', `ô e2 đọc là “E 2” (“${squareSpeech('e2')}”)`)
check(squareSpeech('h8') === 'H 8', `ô h8 đọc là “H 8” (“${squareSpeech('h8')}”)`)
check(squareSpeech('z9') === '', 'ô không hợp lệ → không đọc gì')
check(
  describeMoveEnglish('Ne3') === 'Knight E 3',
  `Ne3 → “Knight E 3” (“${describeMoveEnglish('Ne3')}”)`,
)
check(describeMoveEnglish('e4') === 'Pawn E 4', `e4 → “Pawn E 4” (“${describeMoveEnglish('e4')}”)`)
check(
  describeMoveEnglish('exd5') === 'Pawn takes D 5',
  `exd5 → “Pawn takes D 5” (“${describeMoveEnglish('exd5')}”)`,
)
check(
  describeMoveEnglish('Nxe5+') === 'Knight takes E 5, check',
  `Nxe5+ → “Knight takes E 5, check” (“${describeMoveEnglish('Nxe5+')}”)`,
)
check(
  describeMoveEnglish('Qh7#') === 'Queen H 7, checkmate',
  `Qh7# → “Queen H 7, checkmate” (“${describeMoveEnglish('Qh7#')}”)`,
)
check(describeMoveEnglish('O-O') === 'Castles kingside', 'O-O → “Castles kingside”')
check(describeMoveEnglish('O-O-O') === 'Castles queenside', 'O-O-O → “Castles queenside”')
check(
  describeMoveEnglish('e8=Q+') === 'Pawn E 8, promotes to Queen, check',
  `e8=Q+ → “Pawn E 8, promotes to Queen, check” (“${describeMoveEnglish('e8=Q+')}”)`,
)
check(describeMoveEnglish('') === '', 'không có nước đi → không đọc gì')

// Bé CHỌN một quân → đọc TÊN QUÂN tiếng Anh (Bishop, Knight, Queen, Pawn…).
check(
  describePieceEnglish('p', 'e4') === 'Pawn E 4',
  `chọn Tốt e4 → “Pawn E 4” (“${describePieceEnglish('p', 'e4')}”)`,
)
check(
  describePieceEnglish('n', 'c3') === 'Knight C 3',
  `chọn Mã c3 → “Knight C 3” (“${describePieceEnglish('n', 'c3')}”)`,
)
check(
  describePieceEnglish('b', 'c1') === 'Bishop C 1',
  `chọn Tượng c1 → “Bishop C 1” (“${describePieceEnglish('b', 'c1')}”)`,
)
check(describePieceEnglish('q') === 'Queen', `chọn Hậu → “Queen” (“${describePieceEnglish('q')}”)`)
check(describePieceEnglish('r') === 'Rook', `chọn Xe → “Rook” (“${describePieceEnglish('r')}”)`)
check(describePieceEnglish('k') === 'King', `chọn Vua → “King” (“${describePieceEnglish('k')}”)`)
check(
  describePieceEnglish('wN', 'f3') === 'Knight F 3',
  'hiểu cả mã quân kiểu thư viện (wN) → “Knight F 3”',
)
check(describePieceEnglish('') === '', 'không có quân → không đọc gì')

// Bấm một khai cuộc → đọc TÊN tiếng Anh + tên Grand Master.
check(
  describeOpeningEnglish('London System', 'GM Magnus Carlsen') === 'London System, Magnus Carlsen',
  `khai cuộc London → “London System, Magnus Carlsen” (“${describeOpeningEnglish('London System', 'GM Magnus Carlsen')}”)`,
)
check(
  describeOpeningEnglish("King's Indian Defense", 'GM Hikaru Nakamura') ===
    "King's Indian Defense, Hikaru Nakamura",
  'bỏ tiền tố “GM” trước tên kỳ thủ cho gọn tai bé',
)
check(
  describeOpeningEnglish('French Defense') === 'French Defense',
  'không có tên kỳ thủ thì chỉ đọc',
)
check(describeOpeningEnglish('') === '', 'không có tên khai cuộc → không đọc gì')

// Bảo đảm KHÔNG nước nào của app rơi vào trường hợp “không đọc được”.
const silentMoves = OPENINGS.flatMap((opening) => opening.moves.map((move) => move.san)).filter(
  (san) => describeMoveEnglish(san) === '',
)
check(
  silentMoves.length === 0,
  `mọi nước trong 10 khai cuộc đều đọc được (${silentMoves.length} nước không đọc được)`,
)
if (silentMoves.length > 0) console.log('      · ' + silentMoves.join(', '))

console.log(
  failures === 0 ? '\n✅ SMOKE TEST LOGIC PASS!\n' : `\n❌ ${failures} LỖI LOGIC\n`,
)
process.exit(failures === 0 ? 0 : 1)
