/**
 * Kiểm tra toàn bộ dữ liệu cờ vua bằng chess.js trước khi build UI.
 * Chạy: node scripts/validate-chess.ts
 */
import { Chess } from 'chess.js'
import { OPENINGS } from '../src/data/openings.ts'
import { TACTICS } from '../src/data/tactics.ts'
import { ENDGAMES } from '../src/data/endgames.ts'

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

console.log(
  failures === 0
    ? '\n✅ TẤT CẢ DỮ LIỆU CỜ VUA ĐỀU HỢP LỆ!\n'
    : `\n❌ CÓ ${failures} LỖI DỮ LIỆU\n`,
)
process.exit(failures === 0 ? 0 : 1)
