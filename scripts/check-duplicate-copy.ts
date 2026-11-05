/**
 * Bắt nội dung LẶP GIỮA CÁC TRƯỜNG của cùng một bài.
 *
 * Vì sao cần: app ưu tiên "chất hơn lượng", nhưng không có gì ngăn một lần sửa
 * tay biến `hint` và `steps` thành hai câu gần y hệt, hay `counterName` được
 * nhắc lại nguyên văn trong `idea`. Bài kiểm này so bộ từ của hai câu: trùng
 * ≥ 90% (sau khi bỏ từ nối) là lỗi.
 *
 * Chạy: node scripts/check-duplicate-copy.ts
 */
import { OPENINGS } from '../src/data/openings.ts'
import { ENDGAMES } from '../src/data/endgames.ts'
import { COUNTERS } from '../src/data/counters.ts'

const THRESHOLD = 0.9
const MIN_WORDS = 5

/** Từ nối/đại từ không mang nội dung - bỏ để phép so không bị "nhiễu". */
const STOP = new Set([
  'của', 'và', 'là', 'thì', 'để', 'cho', 'bé', 'nhé', 'các', 'một', 'khi', 'với',
  'này', 'đó', 'sẽ', 'rồi', 'rất', 'hay', 'đi', 'quân', 'thì', 'ở', 'ra', 'vào',
  'lên', 'xuống', 'được', 'có', 'không', 'những', 'cái', 'con', 'mình', 'bạn',
])

function words(text: string): Set<string> {
  const all = text
    .toLowerCase()
    .normalize('NFC')
    .match(/[\p{L}\p{N}]+/gu) ?? []
  return new Set(all.filter((word) => !STOP.has(word)))
}

/** Tỉ lệ từ chung trên tổng số từ riêng của hai câu (Jaccard). */
function similarity(a: string, b: string): number {
  const left = words(a)
  const right = words(b)
  if (left.size < MIN_WORDS || right.size < MIN_WORDS) return 0
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1
  return shared / (left.size + right.size - shared)
}

let failures = 0
const fail = (msg: string) => {
  failures += 1
  console.error('  ✗ ' + msg)
}
const ok = (msg: string) => console.log('  ✓ ' + msg)

function compare(label: string, a: string, b: string) {
  const score = similarity(a, b)
  if (score >= THRESHOLD) {
    fail(`${label}: hai câu trùng ${Math.round(score * 100)}% từ - "${a.slice(0, 48)}…"`)
  }
}

console.log('\n▶ Nội dung lặp trong cùng một bài')

let endgameChecked = 0
for (const endgame of ENDGAMES) {
  for (const step of endgame.steps ?? []) {
    endgameChecked += 1
    compare(`${endgame.id} (hint ↔ bước)`, endgame.hint, step.text)
  }
}
ok(`tàn cuộc: ${endgameChecked} cặp hint ↔ bước đã so`)

let counterChecked = 0
for (const counter of COUNTERS) {
  counterChecked += 1
  compare(`${counter.id} (tên ↔ ý tưởng)`, counter.counterName, counter.idea)
}
ok(`đối phó: ${counterChecked} cặp tên ↔ ý tưởng đã so`)

let openingChecked = 0
for (const opening of OPENINGS) {
  for (const point of opening.plan.points) {
    openingChecked += 1
    compare(`${opening.id} (mục tiêu ↔ kế hoạch)`, opening.goal, point)
  }
}
ok(`khai cuộc: ${openingChecked} cặp mục tiêu ↔ kế hoạch đã so`)

if (failures > 0) {
  console.log(`\n❌ CÓ ${failures} CẶP NỘI DUNG LẶP\n`)
  process.exit(1)
}

console.log('\n✅ CHECK COPY PASS!\n')
