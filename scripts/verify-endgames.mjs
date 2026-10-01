#!/usr/bin/env node
/**
 * Chứng minh kết quả (thắng / hòa) của các thế tàn cuộc Xe + Tốt bằng **Stockfish**.
 *
 * Khác với `validate-chess.ts` (chỉ kiểm FEN hợp lệ), script này hỏi engine đánh giá
 * thế cờ ở độ sâu cao rồi đối chiếu với `result` ghi trong dữ liệu:
 *   - `result: 'win'`  → bên đi trước phải ưu thế rõ (score ≥ +1.5, hoặc có mate).
 *   - `result: 'draw'` → thế cờ phải cân bằng (|score| ≤ 0.6).
 *
 * Chạy: npm run verify:endgames   (cần `npm run setup:engine` trước; ~1 phút)
 *
 * Lưu ý: đây là **đánh giá của engine**, không phải chứng minh hình thức (tablebase).
 * Với thế ít quân ở độ sâu 20+, Stockfish là bằng chứng thực tế tốt trong app trẻ em.
 */
import { createRequire } from 'node:module'
import { ROOK_ENDGAMES } from '../src/data/rookEndgames.ts'

const require = createRequire(import.meta.url)
let init
try {
  init = require('stockfish')
} catch {
  console.error('⚠️  Chưa cài gói `stockfish` (npm install). Bỏ qua bài kiểm này.')
  process.exit(0)
}

const DEPTH = 20
const WIN_CP = 150
const DRAW_CP = 60

let failures = 0
const check = (ok, label) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

const engine = await init('lite-single')

/** Một hàng đợi đơn giản: mỗi lúc chỉ một lệnh `go`. */
function evaluate(fen) {
  return new Promise((resolve, reject) => {
    const lines = []
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('quá hạn'))
    }, 30_000)
    const onLine = (line) => {
      lines.push(line)
      if (line.startsWith('bestmove')) {
        cleanup()
        resolve(lines)
      }
    }
    const cleanup = () => {
      clearTimeout(timer)
      engine.listener = null
    }
    engine.listener = onLine
    engine.sendCommand(`position fen ${fen}`)
    engine.sendCommand(`go depth ${DEPTH}`)
  })
}

/** Đọc điểm số cuối từ các dòng `info`, quy về góc nhìn bên ĐANG ĐI. */
function parseScore(lines) {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const mate = /score mate (-?\d+)/.exec(lines[i])
    if (mate) return { type: 'mate', value: Number(mate[1]) }
    const cp = /score cp (-?\d+)/.exec(lines[i])
    if (cp) return { type: 'cp', value: Number(cp[1]) }
  }
  return null
}

console.log(`\n▶ Chứng minh tàn cuộc Xe + Tốt bằng Stockfish (độ sâu ${DEPTH})\n`)

for (const lesson of ROOK_ENDGAMES) {
  let lines
  try {
    lines = await evaluate(lesson.fen)
  } catch (error) {
    check(false, `${lesson.id}: engine không trả lời (${String(error)})`)
    continue
  }
  const score = parseScore(lines)
  if (!score) {
    check(false, `${lesson.id}: không đọc được điểm từ engine`)
    continue
  }
  const shown = score.type === 'mate' ? `mate ${score.value}` : `cp ${score.value}`

  if (lesson.result === 'win') {
    const winning =
      (score.type === 'mate' && score.value > 0) ||
      (score.type === 'cp' && score.value >= WIN_CP)
    check(winning, `${lesson.id}: bên đi trước THẮNG (${shown})`)
  } else {
    const balanced =
      score.type === 'cp' && Math.abs(score.value) <= DRAW_CP
    check(balanced, `${lesson.id}: thế cờ HÒA (${shown})`)
  }
}

if (failures === 0) {
  console.log(`\n✅ ROOK ENDGAMES PASS! (${ROOK_ENDGAMES.length} thế đúng như ghi)\n`)
  process.exit(0)
}
console.error(`\n❌ ROOK ENDGAMES: ${failures} thế sai kết quả\n`)
process.exit(1)
