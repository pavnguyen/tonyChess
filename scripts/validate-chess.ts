/**
 * Kiểm tra toàn bộ dữ liệu cờ vua bằng chess.js trước khi build UI.
 * Chạy: node scripts/validate-chess.ts
 */
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { OPENINGS } from '../src/data/openings.ts'
import { BEST_MOVES } from '../src/data/bestMoves.ts'
import { COUNTERS } from '../src/data/counters.ts'
import { ENDGAMES } from '../src/data/endgames.ts'
import { GOLD_PRINCIPLES } from '../src/data/goldPrinciples.ts'

let failures = 0
const fail = (msg: string) => {
  failures += 1
  console.error('  ✗ ' + msg)
}
const ok = (msg: string) => console.log('  ✓ ' + msg)

console.log('\n▶ Khai cuộc')
for (const opening of OPENINGS) {
  const game = new Chess()
  let bad = false
  opening.moves.forEach((move, ply) => {
    let played
    try {
      played = game.move(move.san)
    } catch {
      fail(`${opening.id}: nước ${ply + 1} "${move.san}" KHÔNG hợp lệ`)
      bad = true
      return
    }
    if (move.annotation && move.annotation.san !== played.san) {
      fail(`${opening.id}: annotation.san "${move.annotation.san}" ≠ SAN thật "${played.san}"`)
      bad = true
    }
  })
  if (opening.side === 'white' && opening.moves.some((m, i) => i % 2 === 1 && m.annotation)) {
    fail(`${opening.id}: bài của Trắng nhưng có annotation ở ply lẻ`)
    bad = true
  }
  if (opening.side === 'black' && opening.moves.some((m, i) => i % 2 === 0 && m.annotation)) {
    fail(`${opening.id}: bài của Đen nhưng có annotation ở ply chẵn`)
    bad = true
  }
  if (!bad) ok(`${opening.id} - ${opening.moves.length} ply hợp lệ`)
}

console.log('\n▶ Khai cuộc - dòng chính & kế hoạch trung cuộc')
for (const opening of OPENINGS) {
  let bad = false

  // 1. Dòng chính phải đủ dài để "kế hoạch tiếp theo" có nghĩa.
  if (opening.moves.length < 10) {
    fail(
      `${opening.id}: dòng chính chỉ ${opening.moves.length} ply - cần ≥ 10 để dạy kế hoạch trung cuộc`,
    )
    bad = true
  }

  // 2. Kế hoạch trung cuộc phải cụ thể.
  if (opening.plan.points.length < 3 || opening.plan.points.some((p) => p.length < 20)) {
    fail(`${opening.id}: kế hoạch trung cuộc cần ≥ 3 việc, mỗi việc ≥ 20 ký tự`)
    bad = true
  }

  // 3. “Bé muốn gì?” - ý niệm cả khai cuộc phải viết rõ, đủ dài để bé hiểu mục tiêu.
  if (opening.goal.trim().length < 30) {
    fail(`${opening.id}: câu “bé muốn gì” cần ≥ 30 ký tự`)
    bad = true
  }

  if (!bad) {
    ok(`${opening.id} - dòng chính ${opening.moves.length} ply (${opening.plan.title})`)
  }
}

console.log('\n▶ Kế hoạch trung cuộc - quân được nhắc phải đứng đúng ô')
{
  /*
   * Mẫu “Đưa <quân> <ô>” luôn nói về QUÂN ĐANG Ở ô đó (điểm xuất phát), nên ô đó
   * phải thật sự có đúng loại quân ấy trong thế cờ cuối của dòng chính.
   *
   * Bài kiểm này bắt được đúng loại lỗi đã từng có: “Đưa Mã b1 lên d2” trong khi
   * Mã đã sang d2 từ lâu, hay “đe doạ Tốt e4 của Trắng” khi Trắng không còn Tốt ở e4.
   */
  const PIECE_WORD: Record<string, string> = {
    'Mã': 'n',
    'Tượng': 'b',
    'Xe': 'r',
    'Hậu': 'q',
    'Vua': 'k',
    'Tốt': 'p',
  }
  const SOURCE_RE = /(?:Đưa|đưa)\s+(Mã|Tượng|Xe|Hậu|Vua|Tốt)\s+([a-h][1-8])/g
  let bad = false
  let checked = 0

  for (const opening of OPENINGS) {
    const game = new Chess()
    for (const move of opening.moves) {
      try {
        game.move(move.san)
      } catch {
        /* dòng chính lỗi đã được báo ở phần trên */
      }
    }
    for (const point of opening.plan.points) {
      for (const match of point.matchAll(SOURCE_RE)) {
        const word = match[1]
        const square = match[2]
        checked += 1
        const cell = game.get(square as Square)
        if (!cell || cell.type !== PIECE_WORD[word]) {
          fail(
            `${opening.id}: kế hoạch nói “${word} ${square}” nhưng thế cờ cuối ${
              cell ? `có quân “${cell.type}”` : 'không có quân nào'
            } ở ô đó → “${point}”`,
          )
          bad = true
        }
      }
    }
  }

  if (!bad) ok(`${checked} chỗ “Đưa <quân> <ô>” trong kế hoạch đều khớp thế cờ thật`)
}

console.log('\n▶ Đối phó khai cuộc')
for (const lesson of COUNTERS) {
  let bad = false
  const game = new Chess()
  const kidSide = lesson.opponentSide === 'white' ? 'black' : 'white'

  // Liên kết hai chiều Khai cuộc ↔ Đối phó dựa vào quy ước `id = vs-<openingId>`;
  // sai quy ước là nút nhảy qua lại sẽ mở nhầm bài, nên kiểm thật chặt. Bài chỉ bàn
  // về một nước mở đầu phổ biến thì KHÔNG có `openingId` - bỏ qua phần liên kết.
  if (lesson.openingId) {
    if (lesson.id !== `vs-${lesson.openingId}`) {
      fail(`${lesson.id}: id phải theo quy ước "vs-<openingId>" (openingId="${lesson.openingId}")`)
      bad = true
    }
    const linkedOpening = OPENINGS.find((opening) => opening.id === lesson.openingId)
    if (!linkedOpening) {
      fail(`${lesson.id}: openingId "${lesson.openingId}" không có trong danh sách khai cuộc`)
      bad = true
    } else if (linkedOpening.side !== lesson.opponentSide) {
      fail(
        `${lesson.id}: khai cuộc ${lesson.openingId} thuộc phe ${linkedOpening.side} nhưng opponentSide=${lesson.opponentSide}`,
      )
      bad = true
    }
  }

  if (lesson.opponentPlan.trim().length < 30) {
    fail(`${lesson.id}: “đối thủ đang định làm gì” quá ngắn`)
    bad = true
  }

  if (lesson.moves.length < 8) {
    fail(`${lesson.id}: dòng đối phó chỉ ${lesson.moves.length} ply - cần ≥ 8 để thấy rõ ý đồ`)
    bad = true
  }
  if (lesson.idea.trim().length < 30) {
    fail(`${lesson.id}: ý tưởng đối phó quá ngắn`)
    bad = true
  }
  if (lesson.points.length < 3 || lesson.points.some((point) => point.length < 20)) {
    fail(`${lesson.id}: cần ≥ 3 việc, mỗi việc ≥ 20 ký tự`)
    bad = true
  }

  lesson.moves.forEach((move, ply) => {
    const kidPly = kidSide === 'white' ? ply % 2 === 0 : ply % 2 === 1
    let played
    try {
      played = game.move(move.san)
    } catch {
      fail(`${lesson.id}: nước ${ply + 1} "${move.san}" KHÔNG hợp lệ`)
      bad = true
      return
    }
    if (move.annotation && move.annotation.san !== played.san) {
      fail(`${lesson.id}: annotation.san "${move.annotation.san}" ≠ SAN thật "${played.san}"`)
      bad = true
    }
    // CHỈ nước của bé mới được có lời bình - nước đối thủ phải để trống.
    if (move.annotation && !kidPly) {
      fail(`${lesson.id}: nước ${ply + 1} là của ĐỐI THỦ nhưng lại có annotation`)
      bad = true
    }
    if (!move.annotation && kidPly) {
      fail(`${lesson.id}: nước ${ply + 1} là của BÉ nhưng thiếu annotation`)
      bad = true
    }
    if (move.annotation) {
      const words = move.annotation.rhyme.trim().split(/\s+/).length
      if (words < 4 || words > 6) {
        fail(`${lesson.id}: khẩu quyết "${move.annotation.rhyme}" có ${words} chữ, phải 4-6 chữ`)
        bad = true
      }
    }
  })

  if (!bad) ok(`${lesson.id} - ${lesson.moves.length} ply (${lesson.counterName})`)
}

console.log('\n▶ Đối phó khai cuộc - phủ đủ cả hai màu')
{
  let bad = false
  for (const side of ['white', 'black'] as const) {
    const count = COUNTERS.filter((lesson) => lesson.opponentSide === side).length
    if (count === 0) {
      fail(`chưa có bài đối phó nào cho đối thủ cầm ${side}`)
      bad = true
    }
  }
  if (!bad) {
    ok(
      `${COUNTERS.filter((l) => l.opponentSide === 'white').length} bài đối thủ cầm Trắng, ${COUNTERS.filter((l) => l.opponentSide === 'black').length} bài đối thủ cầm Đen`,
    )
  }
}

console.log('\n▶ Trung cuộc (tìm nước hay nhất)')
for (const puzzle of BEST_MOVES) {
  const game = new Chess()
  try {
    game.load(puzzle.fen)
  } catch (error) {
    fail(`${puzzle.id}: FEN không hợp lệ - ${String(error)}`)
    continue
  }
  if (game.turn() !== puzzle.side[0]) {
    fail(`${puzzle.id}: lượt đi là "${game.turn()}" nhưng side="${puzzle.side}"`)
    continue
  }
  const legal = game.moves()
  let bad = false
  if (!puzzle.goodMoves.includes(puzzle.bestSan)) {
    fail(`${puzzle.id}: goodMoves phải chứa nước hay nhất "${puzzle.bestSan}"`)
    bad = true
  }
  for (const san of puzzle.goodMoves) {
    if (!legal.includes(san)) {
      fail(`${puzzle.id}: nước được chấp nhận "${san}" KHÔNG hợp lệ trên FEN`)
      bad = true
    }
  }
  if (!legal.includes(puzzle.bestSan)) {
    fail(`${puzzle.id}: nước hay nhất "${puzzle.bestSan}" KHÔNG hợp lệ trên FEN`)
    bad = true
  }
  const words = puzzle.rhyme.trim().split(/\s+/).length
  if (words < 4 || words > 6) {
    fail(`${puzzle.id}: khẩu quyết "${puzzle.rhyme}" có ${words} chữ, phải 4-6 chữ`)
    bad = true
  }
  if (puzzle.explanation.trim().length < 20) {
    fail(`${puzzle.id}: lời giải thích quá ngắn`)
    bad = true
  }
  if (puzzle.hint.trim().length < 10) {
    fail(`${puzzle.id}: gợi ý quá ngắn`)
    bad = true
  }
  // Chuỗi "đánh tiếp": độ dài phải CHẴN (nước đầu là địch đáp, nước cuối là của bé)
  // và toàn bộ nước phải hợp lệ trên bàn cờ thật.
  if (puzzle.continuation) {
    if (puzzle.continuation.length === 0 || puzzle.continuation.length % 2 !== 0) {
      fail(`${puzzle.id}: continuation phải có độ dài chẵn (kết thúc bằng nước của bé)`)
      bad = true
    } else {
      const sim = new Chess()
      try {
        sim.load(puzzle.fen)
        sim.move(puzzle.bestSan)
        for (const san of puzzle.continuation) sim.move(san)
      } catch {
        fail(`${puzzle.id}: chuỗi "đánh tiếp" có nước không hợp lệ - ${puzzle.continuation.join(' ')}`)
        bad = true
      }
    }
  }
  if (!bad) ok(`${puzzle.id} - nước hay nhất ${puzzle.bestSan} (${puzzle.title})`)
}

console.log('\n▶ Trung cuộc - mỗi chủ đề có ít nhất 2 thế cờ')
{
  const themes = [...new Set(BEST_MOVES.map((puzzle) => puzzle.theme))]
  let bad = false
  for (const theme of themes) {
    const count = BEST_MOVES.filter((puzzle) => puzzle.theme === theme).length
    if (count < 2) {
      fail(`chủ đề ${theme} chỉ có ${count} thế (cần ≥ 2)`)
      bad = true
    }
  }
  if (!bad) ok(`${themes.length} chủ đề, mỗi chủ đề ≥ 2 thế cờ`)
}

console.log('\n▶ Tàn cuộc')
for (const challenge of ENDGAMES) {
  const game = new Chess()
  try {
    game.load(challenge.fen)
  } catch (error) {
    fail(`${challenge.id}: FEN không hợp lệ - ${String(error)}`)
    continue
  }
  if (game.turn() !== challenge.playerSide[0]) {
    fail(
      `${challenge.id}: lượt đi là "${game.turn()}" nhưng playerSide="${challenge.playerSide}"`,
    )
    continue
  }
  if (challenge.goal === 'promote') {
    const hasPawn = game
      .board()
      .flat()
      .some((square) => square && square.type === 'p' && square.color === challenge.playerSide[0])
    if (!hasPawn) fail(`${challenge.id}: mục tiêu phong Hậu nhưng không có Tốt nào`)
    else ok(`${challenge.id} - có Tốt của bé, lượt đi đúng`)
  } else {
    const matingMoves: string[] = []
    for (const san of game.moves()) {
      const probe = new Chess(game.fen())
      probe.move(san)
      if (probe.isCheckmate()) matingMoves.push(san)
    }
    if (matingMoves.length === 0) fail(`${challenge.id}: không tồn tại nước chiếu bí nào`)
    else ok(`${challenge.id} - có ${matingMoves.length} nước chiếu bí: ${matingMoves.join(', ')}`)
  }
}

console.log('\n▶ 10 nguyên tắc vàng (thẻ thói quen + 2 thế cờ minh hoạ mỗi thẻ)')
{
  let bad = false
  if (GOLD_PRINCIPLES.length !== 10) {
    fail(`cần đúng 10 nguyên tắc nhưng có ${GOLD_PRINCIPLES.length}`)
    bad = true
  }
  const SQUARE_RE = /^[a-h][1-8]$/
  GOLD_PRINCIPLES.forEach((principle, index) => {
    if (principle.order !== index + 1) {
      fail(`${principle.id}: số thứ tự ${principle.order} không khớp vị trí ${index + 1}`)
      bad = true
    }
    const words = principle.rhyme.trim().split(/\s+/).length
    if (words < 4 || words > 6) {
      fail(`${principle.id}: khẩu quyết "${principle.rhyme}" có ${words} chữ, phải 4-6 chữ`)
      bad = true
    }
    if (principle.ask.trim().length < 15 || principle.why.trim().length < 30) {
      fail(`${principle.id}: câu hỏi tự vấn hoặc lời giải thích quá ngắn`)
      bad = true
    }

    // Mỗi nguyên tắc phải có một thế "NÊN" (xanh) và một thế "KHÔNG NÊN" (đỏ),
    // đều là thế cờ thật, lượt Trắng, không đang bị chiếu.
    for (const [side, board] of [
      ['NÊN', principle.good],
      ['KHÔNG NÊN', principle.bad],
    ] as const) {
      const game = new Chess()
      try {
        game.load(board.fen)
      } catch (error) {
        fail(`${principle.id} (${side}): FEN không hợp lệ - ${String(error)}`)
        bad = true
        continue
      }
      if (game.isCheck()) {
        fail(`${principle.id} (${side}): thế minh hoạ đang có chiếu`)
        bad = true
      }
      if (game.turn() !== 'w') {
        fail(`${principle.id} (${side}): thế minh hoạ phải là lượt Trắng`)
        bad = true
      }
      const kings = game.board().flat().filter((cell) => cell && cell.type === 'k').length
      if (kings !== 2) {
        fail(`${principle.id} (${side}): phải có đủ hai Vua`)
        bad = true
      }
      if (board.note.trim().length < 20) {
        fail(`${principle.id} (${side}): lời chú thích quá ngắn`)
        bad = true
      }
      if (board.marks.length === 0) {
        fail(`${principle.id} (${side}): chưa tô ô nào để minh hoạ`)
        bad = true
      }
      const expectedTone = side === 'NÊN' ? 'good' : 'bad'
      for (const mark of board.marks) {
        if (!SQUARE_RE.test(mark.square)) {
          fail(`${principle.id} (${side}): ô "${mark.square}" không hợp lệ`)
          bad = true
        }
        if (mark.tone !== expectedTone) {
          fail(
            `${principle.id} (${side}): ô ${mark.square} tô "${mark.tone}" nhưng thế "${side}" chỉ nên tô "${expectedTone}"`,
          )
          bad = true
        }
        if (mark.label.trim().length < 3) {
          fail(`${principle.id} (${side}): nhãn ô ${mark.square} quá ngắn`)
          bad = true
        }
      }
    }
  })
  if (!bad) ok(`10 nguyên tắc vàng - đủ 10 thẻ, mỗi thẻ 2 thế cờ minh hoạ hợp lệ`)
}

console.log(
  failures === 0
    ? '\n✅ TẤT CẢ DỮ LIỆU CỜ VUA ĐỀU HỢP LỆ!\n'
    : `\n❌ CÓ ${failures} LỖI DỮ LIỆU\n`,
)
process.exit(failures === 0 ? 0 : 1)
