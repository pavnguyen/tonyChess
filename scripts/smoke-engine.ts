/**
 * Kiểm tra bộ máy cờ vua: tự đấu, tìm chiếu bí, ăn quân treo, không đi nước sai luật.
 * Chạy: node scripts/smoke-engine.ts
 */
import { Chess } from 'chess.js'
import { ENDGAMES } from '../src/data/endgames.ts'
import { OPENINGS } from '../src/data/openings.ts'
import { TACTICS } from '../src/data/tactics.ts'
import { pickMove } from '../src/engine/minimax.ts'
import type { Difficulty } from '../src/engine/minimax.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Máy tự đấu với chính mình')
for (const [difficulty, maxPlies] of [
  ['easy', 160],
  ['medium', 60],
] as [Difficulty, number][]) {
  const game = new Chess()
  const started = Date.now()
  let plies = 0
  let illegal = false
  while (plies < maxPlies && !game.isGameOver()) {
    const move = pickMove(game.fen(), difficulty)
    if (!move) break
    try {
      game.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' })
    } catch {
      illegal = true
      break
    }
    plies += 1
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  check(!illegal, `${difficulty}: ${plies} nước, không có nước sai luật (${seconds}s)`)
  check(
    plies > 10,
    `${difficulty}: ván đấu diễn ra thật sự (${plies} nước)`,
  )
  const finished = game.isCheckmate() || game.isDraw() || game.isStalemate()
  if (finished) {
    check(true, `${difficulty}: kết thúc hợp lệ (${game.isCheckmate() ? 'chiếu bí' : 'hòa'})`)
  } else {
    check(true, `${difficulty}: chạm giới hạn ${maxPlies} nước, vẫn hợp lệ`)
  }
}

console.log('\n▶ Máy tìm được chiếu bí')
for (const challenge of ENDGAMES.filter((item) => item.goal === 'checkmate')) {
  const game = new Chess()
  game.load(challenge.fen)
  const move = pickMove(challenge.fen, 'hard')
  const probe = new Chess(challenge.fen)
  probe.move(move!.san)
  check(probe.isCheckmate(), `${challenge.id}: máy đi "${move?.san}" và chiếu bí ngay`)
}

console.log('\n▶ Máy biết ăn Hậu bị treo')
{
  const fen = '4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1'
  const move = pickMove(fen, 'hard')
  const probe = new Chess(fen)
  probe.move(move!.san)
  check(move?.san === 'exd5', `máy đi "${move?.san}" (mong đợi exd5 để ăn Hậu)`)
}

console.log('\n▶ Quiescence: máy Khó không sa vào bẫy "Tốt độc"')
{
  // Hậu Trắng có thể ăn Tốt d5, nhưng Mã f6 đen sẽ ăn lại Hậu. Không có quiescence
  // thì máy độ sâu 3 vẫn thấy "được một Tốt" và lao vào; có quiescence thì thấy rõ
  // chuỗi ăn-quân-lại và từ chối.
  const fen = '4k3/8/5n2/3p4/8/8/8/3QK3 w - - 0 1'
  const move = pickMove(fen, 'hard')
  check(move?.san !== 'Qxd5', `máy Khó từ chối Qxd5 (đi "${move?.san}")`)
  const master = pickMove(fen, 'master')
  check(master?.san !== 'Qxd5', `máy Siêu cũng từ chối Qxd5 (đi "${master?.san}")`)

  // Nhưng khi ăn quân THẬT SỰ có lợi thì quiescence vẫn phải ăn.
  const free = '4k3/8/8/4q3/3P4/8/8/4K3 w - - 0 1'
  const grab = pickMove(free, 'hard')
  check(grab?.to === 'e5', `quiescence vẫn ăn quân treo (đi "${grab?.san}")`)
}

console.log('\n▶ Máy luôn trả về nước hợp lệ trên mọi thế cờ của app')
{
  const fens: string[] = []
  for (const opening of OPENINGS) {
    const game = new Chess()
    fens.push(game.fen())
    for (const m of opening.moves) {
      game.move(m.san)
      fens.push(game.fen())
    }
  }
  for (const puzzle of TACTICS) fens.push(puzzle.fen)
  for (const challenge of ENDGAMES) fens.push(challenge.fen)

  let bad = 0
  let checked = 0
  for (const fen of fens) {
    const game = new Chess()
    game.load(fen)
    const legal = game.moves()
    if (legal.length === 0) continue
    const move = pickMove(fen, 'medium')
    checked += 1
    if (!move || !legal.includes(move.san)) bad += 1
  }
  check(bad === 0, `${checked} thế cờ được kiểm tra, ${bad} nước không hợp lệ`)
}

console.log(
  failures === 0 ? '\n✅ ENGINE PASS!\n' : `\n❌ ENGINE CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
