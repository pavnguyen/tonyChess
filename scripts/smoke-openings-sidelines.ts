/**
 * Kiểm tra **biến phụ của khai cuộc** (`sidelines`): dòng đi hợp lệ, đúng phe bé, lời
 * bình chỉ nằm ở nước của bé, và biến phụ phải thật sự là *cùng một khai cuộc* (nửa nước
 * đầu giống dòng chính - nếu không thì chỉ là một khai cuộc khác gắn nhầm nhãn).
 *
 * Chạy: node scripts/smoke-openings-sidelines.ts
 */
import { Chess } from 'chess.js'
import { OPENINGS } from '../src/data/openings.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

/** Số nửa nước tối thiểu / tối đa của một biến phụ. */
const MIN_PLIES = 6
const MAX_PLIES = 16

const seen = new Set<string>()
const withLines = OPENINGS.filter((opening) => (opening.sidelines?.length ?? 0) > 0)

console.log(`\n▶ Biến phụ khai cuộc (${withLines.length} khai cuộc có biến phụ)`)

for (const opening of withLines) {
  const kidColor = opening.side === 'white' ? 'w' : 'b'
  check(opening.sidelines!.length >= 1, `${opening.id}: có biến phụ`)

  for (const line of opening.sidelines!) {
    const tag = `${opening.id}/${line.id}`
    if (seen.has(line.id)) {
      failures += 1
      console.error(`  ✗ ${tag}: id biến phụ bị trùng toàn cục`)
    }
    seen.add(line.id)

    check(line.label.length > 0 && line.label.length <= 24, `${tag}: nhãn ngắn (${line.label})`)
    check(line.idea.length >= 30, `${tag}: một câu “ý đồ” đủ ý`)

    const plies = line.moves.length
    check(plies >= MIN_PLIES && plies <= MAX_PLIES, `${tag}: ${plies} nửa nước (6–16)`)

    if (line.moves[0]?.san !== opening.moves[0]?.san) {
      failures += 1
      console.error(
        `  ✗ ${tag}: nửa nước đầu "${line.moves[0]?.san}" khác dòng chính "${opening.moves[0]?.san}"`,
      )
    }

    const game = new Chess()
    let legal = true
    for (const [ply, move] of line.moves.entries()) {
      let played
      try {
        played = game.move(move.san)
      } catch {
        failures += 1
        console.error(`  ✗ ${tag}: nửa nước ${ply + 1} "${move.san}" KHÔNG hợp lệ`)
        legal = false
        break
      }
      const kidPly = played.color === kidColor
      if (move.annotation && move.annotation.san !== played.san) {
        failures += 1
        console.error(`  ✗ ${tag}: annotation.san "${move.annotation.san}" ≠ SAN thật "${played.san}"`)
      }
      if (move.annotation && !kidPly) {
        failures += 1
        console.error(`  ✗ ${tag}: nửa nước ${ply + 1} là của ĐỐI THỦ nhưng có lời bình`)
      }
      if (!move.annotation && kidPly) {
        failures += 1
        console.error(`  ✗ ${tag}: nửa nước ${ply + 1} là của BÉ nhưng thiếu lời bình`)
      }
      if (move.annotation) {
        const words = move.annotation.rhyme.trim().split(/\s+/).length
        if (words < 4 || words > 6) {
          failures += 1
          console.error(`  ✗ ${tag}: khẩu quyết "${move.annotation.rhyme}" có ${words} chữ (cần 4–6)`)
        }
      }
    }
    if (legal) check(true, `${tag}: ${line.label} - ${plies} nửa nước hợp lệ`)
  }
}

console.log(
  failures === 0
    ? `\n✅ BIẾN PHỤ KHAI CUỘC PASS! (${seen.size} biến phụ)\n`
    : `\n❌ BIẾN PHỤ KHAI CUỘC: ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
