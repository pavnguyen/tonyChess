/**
 * Kiểm tra toàn bộ dữ liệu cờ vua bằng chess.js trước khi build UI.
 * Chạy: node scripts/validate-chess.ts
 */
import { Chess } from 'chess.js'
import { OPENINGS } from '../src/data/openings.ts'
import { TACTICS } from '../src/data/tactics.ts'
import { ENDGAMES } from '../src/data/endgames.ts'
import { GM_LECTURES } from '../src/data/gmLectures.ts'
import { PAWN_STRUCTURES } from '../src/data/pawnStructures.ts'

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

console.log('\n▶ Trung cuộc (đòn chiến thuật)')
for (const puzzle of TACTICS) {
  const game = new Chess()
  try {
    game.load(puzzle.fen)
  } catch (error) {
    fail(`${puzzle.id}: FEN không hợp lệ - ${String(error)}`)
    continue
  }
  let move
  try {
    move = game.move(puzzle.solution)
  } catch {
    fail(`${puzzle.id}: nước giải "${puzzle.solution}" KHÔNG hợp lệ trên FEN`)
    continue
  }
  const givesCheck = game.isCheck()
  const capturedValue = move.captured ? 1 : 0

  // Đếm số quân địch mà CHÍNH quân vừa đi đang tấn công (dùng attackers của chess.js).
  const foe = move.color === 'w' ? 'b' : 'w'
  let hits = 0
  const hitSquares: string[] = []
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== foe) continue
      if (game.attackers(cell.square, move.color).includes(move.to)) {
        hits += 1
        hitSquares.push(cell.square)
      }
    }
  }

  ok(
    `${puzzle.id} - ${puzzle.solution} hợp lệ${givesCheck ? ', chiếu Vua' : ''}${
      capturedValue ? ', ăn quân' : ''
    }, tấn công ${hits} quân (${hitSquares.join(', ')})`,
  )

  // Kiểm tra đúng bản chất từng loại đòn.
  if (puzzle.type === 'fork' && hits < 2) {
    fail(`${puzzle.id}: đòn BẮT ĐÔI nhưng chỉ tấn công ${hits} quân`)
  }
  if (puzzle.type === 'pin' && hits < 1) {
    fail(`${puzzle.id}: đòn GHIM nhưng Tượng/Xe không tấn công quân nào`)
  }
  if (puzzle.type === 'skewer') {
    if (!givesCheck) fail(`${puzzle.id}: đòn XIÊN nhưng nước giải không chiếu Vua`)
    if (hits < 1) fail(`${puzzle.id}: đòn XIÊN nhưng không tấn công quân nào`)
  }

  // ── Bốn đòn "hàng hiệu" ──
  const kingSquare = game
    .board()
    .flat()
    .find((cell) => cell && cell.type === 'k' && cell.color === foe)?.square

  if (puzzle.type === 'discovered') {
    if (!givesCheck) fail(`${puzzle.id}: ĐÒN MỞ phải chiếu Vua bằng quân ở phía sau`)
    if (kingSquare && game.attackers(kingSquare, move.color).includes(move.to)) {
      fail(`${puzzle.id}: ĐÒN MỞ nhưng chính quân vừa đi cũng chiếu Vua (đó là chiếu đôi)`)
    }
  }
  if (puzzle.type === 'double-check') {
    const attackers = kingSquare ? game.attackers(kingSquare, move.color) : []
    if (attackers.length < 2) {
      fail(`${puzzle.id}: CHIẾU ĐÔI nhưng chỉ có ${attackers.length} quân chiếu Vua`)
    }
    if (!attackers.includes(move.to)) {
      fail(`${puzzle.id}: CHIẾU ĐÔI nhưng quân vừa đi không chiếu Vua`)
    }
  }
  if (puzzle.type === 'back-rank') {
    if (!game.isCheckmate()) fail(`${puzzle.id}: CHIẾU BÍ HÀNG CUỐI nhưng nước giải không phải chiếu bí`)
    const mateRank = kingSquare ? Number(kingSquare[1]) : 0
    if (mateRank !== 1 && mateRank !== 8) {
      fail(`${puzzle.id}: CHIẾU BÍ HÀNG CUỐI nhưng Vua bị bí ở hàng ${mateRank}`)
    }
  }
  if (puzzle.type === 'smothered') {
    if (!game.isCheckmate()) fail(`${puzzle.id}: CHIẾU BÍ NGẠT nhưng nước giải không phải chiếu bí`)
    if (move.piece !== 'n') fail(`${puzzle.id}: CHIẾU BÍ NGẠT phải do Mã chiếu, không phải "${move.piece}"`)
  }
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

console.log('\n▶ Chiến lược GM (bài giảng có kịch bản)')
for (const lecture of GM_LECTURES) {
  const game = new Chess()
  try {
    game.load(lecture.fen)
  } catch (error) {
    fail(`${lecture.id}: FEN không hợp lệ - ${String(error)}`)
    continue
  }
  const playerChar = lecture.playerSide[0]
  // Bài có thể bắt đầu bằng nước của ĐEN (thế Philidor), nên phải suy từ FEN.
  const kidParity = game.turn() === playerChar ? 0 : 1
  let bad = false
  let kidSteps = 0
  let opponentSteps = 0

  lecture.moves.forEach((ply, index) => {
    const isKid = index % 2 === kidParity

    if (isKid && !ply.annotation) {
      fail(`${lecture.id}: nửa nước ${index + 1} là của BÉ nhưng thiếu lời giải thích`)
      bad = true
    }
    if (!isKid && ply.annotation) {
      fail(`${lecture.id}: nửa nước ${index + 1} là của ĐỐI THỦ nhưng lại có lời giải thích`)
      bad = true
    }

    if (ply.annotation) {
      const words = ply.annotation.rhyme.trim().split(/\s+/).length
      if (words < 4 || words > 6) {
        fail(`${lecture.id}: khẩu quyết "${ply.annotation.rhyme}" có ${words} chữ, phải 4-6 chữ`)
        bad = true
      }
      if (ply.annotation.reason.trim().length < 15) {
        fail(`${lecture.id}: lời giải thích cho ${ply.san} quá ngắn, bé sẽ không hiểu`)
        bad = true
      }
    }

    let played
    try {
      played = game.move(ply.san)
    } catch {
      fail(`${lecture.id}: nước ${index + 1} "${ply.san}" KHÔNG hợp lệ trên thế cờ`)
      bad = true
      return
    }
    if (ply.annotation && ply.annotation.san !== played.san) {
      fail(`${lecture.id}: annotation.san "${ply.annotation.san}" ≠ SAN thật "${played.san}"`)
      bad = true
    }
    if (isKid) kidSteps += 1
    else opponentSteps += 1

    // Ô được tô đỏ phải thật sự nằm trong tầm kiểm soát của bé sau nước đó.
    for (const square of ply.spotlight ?? []) {
      if (game.attackers(square, played.color).length === 0) {
        fail(`${lecture.id}: ô ${square} được tô là nguy hiểm nhưng quân của bé không kiểm soát nó`)
        bad = true
      }
    }
  })

  if (!bad) {
    const checks = lecture.moves.filter((ply) => ply.san.includes('+')).map((ply) => ply.san)
    ok(
      `${lecture.id} - ${lecture.moves.length} nửa nước hợp lệ (${kidSteps} nước của bé, ${opponentSteps} nước đối thủ)${
        checks.length ? `, có chiếu: ${checks.join(', ')}` : ''
      }`,
    )
  }
}

console.log('\n▶ Cấu trúc Tốt')
const squareFile = (square: string) => square[0]
const squareRank = (square: string) => Number(square[1])
// Hai cột cạnh nhau trong bàn cờ: c và e là hai bên của cột d.
const NEIGHBOURS = ['a:b', 'b:ac', 'c:bd', 'd:ce', 'e:df', 'f:eg', 'g:fh', 'h:g']
const neighbourFiles = (file: string) =>
  (NEIGHBOURS.find((pair) => pair.startsWith(`${file}:`))?.split(':')[1] ?? '').split('')

for (const structure of PAWN_STRUCTURES) {
  const game = new Chess()
  try {
    game.load(structure.fen)
  } catch (error) {
    fail(`${structure.id}: FEN không hợp lệ - ${String(error)}`)
    continue
  }
  if (game.isCheck()) {
    fail(`${structure.id}: thế cờ đang có chiếu, không phải hình minh hoạ cấu trúc Tốt`)
    continue
  }

  const pawns: { square: string; color: 'w' | 'b' }[] = []
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'p') pawns.push({ square: cell.square, color: cell.color })
    }
  }

  let bad = false
  for (const marker of structure.markers) {
    const pawn = pawns.find((item) => item.square === marker.square)
    if (!pawn) {
      fail(`${structure.id}: ô ${marker.square} được tô màu nhưng ở đó không có Tốt nào`)
      bad = true
      continue
    }
    // Màu tô phải khớp kết luận: Tốt xấu tô đỏ, Tốt khoẻ tô xanh.
    const expected = structure.verdict === 'bad' ? 'bad' : 'good'
    if (marker.tone !== expected) {
      fail(`${structure.id}: ô ${marker.square} tô "${marker.tone}" nhưng kết luận cả thế là "${expected}"`)
      bad = true
    }
  }

  const marked = structure.markers[0]?.square
  const focal = marked ? pawns.find((item) => item.square === marked) : undefined
  if (focal) {
    const foe = focal.color === 'w' ? 'b' : 'w'
    const file = squareFile(focal.square)
    const rank = squareRank(focal.square)
    const ahead = focal.color === 'w' ? (r: number) => r > rank : (r: number) => r < rank

    if (structure.id === 'passed-pawn') {
      const blockers = pawns.filter((item) => {
        if (item.color !== foe) return false
        const sameOrNextTo = squareFile(item.square) === file || neighbourFiles(file).includes(squareFile(item.square))
        return sameOrNextTo && ahead(squareRank(item.square))
      })
      if (blockers.length > 0) {
        fail(
          `${structure.id}: gọi là TỐT THÔNG nhưng vẫn còn Tốt địch cản: ${blockers.map((b) => b.square).join(', ')}`,
        )
        bad = true
      }
    }
    if (structure.id === 'doubled-pawns') {
      const sameFile = pawns.filter((item) => item.color === focal.color && squareFile(item.square) === file)
      if (sameFile.length < 2) {
        fail(`${structure.id}: gọi là TỐT CHỒNG nhưng cột ${file} chỉ có ${sameFile.length} Tốt`)
        bad = true
      }
    }
    if (structure.id === 'isolated-pawn') {
      const friends = pawns.filter(
        (item) => item.color === focal.color && neighbourFiles(file).includes(squareFile(item.square)),
      )
      if (friends.length > 0) {
        fail(
          `${structure.id}: gọi là TỐT CÔ LẬP nhưng vẫn có Tốt bạn bên cạnh: ${friends.map((f) => f.square).join(', ')}`,
        )
        bad = true
      }
    }
  }

  if (!bad) {
    ok(`${structure.id} - ${structure.name}: ${pawns.length} Tốt, ${structure.markers.length} ô được tô đúng bản chất`)
  }
}

console.log(
  failures === 0
    ? '\n✅ TẤT CẢ DỮ LIỆU CỜ VUA ĐỀU HỢP LỆ!\n'
    : `\n❌ CÓ ${failures} LỖI DỮ LIỆU\n`,
)
process.exit(failures === 0 ? 0 : 1)
