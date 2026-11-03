/**
 * Kiểm tra **lịch ôn bài Trung cuộc** (`src/lib/tacticsProgress.ts`) bằng đồng hồ giả.
 *
 * Vì sao quan trọng: đây là thứ biến 50 thế “giải xong là hết” thành vòng lặp đủ lâu để
 * bé **thuộc**. Sai một ngày là bé hoặc gặp lại quá sớm (chán), hoặc quá muộn (quên).
 *
 * Chạy: node scripts/smoke-tactics-schedule.ts
 */
import {
  duePuzzleIds,
  freshPuzzleIds,
  intervalDays,
  recordResult,
} from '../src/lib/tacticsProgress.ts'
import type { TacticsRecord } from '../src/lib/tacticsProgress.ts'

const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-11-01T08:00:00.000Z')

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

const daysUntil = (record: TacticsRecord, from: Date = NOW) =>
  Math.round((new Date(record.dueAt).getTime() - from.getTime()) / DAY)

console.log('\n▶ Khoảng cách ôn: 3 → 7 → 21 ngày')

check(intervalDays(1) === 3, 'lần đầu giải đúng → 3 ngày')
check(intervalDays(2) === 7, 'giải đúng 2 lần liền → 7 ngày')
check(intervalDays(3) === 21, 'giải đúng 3 lần liền → 21 ngày')
check(intervalDays(12) === 21, 'giải đúng nhiều lần → giữ 21 ngày (không phình vô hạn)')

console.log('\n▶ Ghi kết quả một thế')

let records: TacticsRecord[] = []
records = recordResult(records, 'p1', 'solved-clean', NOW)
check(records.length === 1, 'thế mới được ghi vào lịch')
check(records[0].streak === 1, 'chuỗi đúng = 1')
check(daysUntil(records[0]) === 3, `hẹn lại sau 3 ngày (${daysUntil(records[0])})`)

records = recordResult(records, 'p1', 'solved-clean', NOW)
check(records.length === 1, 'làm lại cùng thế không tạo bản ghi trùng')
check(records[0].streak === 2, 'chuỗi đúng = 2')
check(daysUntil(records[0]) === 7, `hẹn lại sau 7 ngày (${daysUntil(records[0])})`)

records = recordResult(records, 'p1', 'solved-clean', NOW)
check(records[0].streak === 3, 'chuỗi đúng = 3')
check(daysUntil(records[0]) === 21, `hẹn lại sau 21 ngày (${daysUntil(records[0])})`)

records = recordResult(records, 'p1', 'solved-with-help', NOW)
check(records[0].streak === 0, 'dùng gợi ý / đi sai → chuỗi về 0')
check(daysUntil(records[0]) === 1, 'dùng gợi ý → hẹn mai làm lại')

console.log('\n▶ Hàng đợi hôm nay')

const make = (id: string, dueInDays: number): TacticsRecord => ({
  id,
  streak: 1,
  dueAt: new Date(NOW.getTime() + dueInDays * DAY).toISOString(),
  lastAt: NOW.toISOString(),
})
const schedule: TacticsRecord[] = [make('b', -1), make('a', -5), make('c', 2)]
const ordered = ['a', 'b', 'c', 'd']

check(
  JSON.stringify(duePuzzleIds(schedule, ordered, NOW)) === JSON.stringify(['a', 'b']),
  'chỉ lấy thế đã tới hạn, giữ đúng thứ tự độ khó',
)
check(
  JSON.stringify(freshPuzzleIds(schedule, ordered)) === JSON.stringify(['d']),
  'thế mới là thế chưa từng làm',
)
check(
  duePuzzleIds([], ordered, NOW).length === 0 && freshPuzzleIds([], ordered).length === 4,
  'lịch trống → mọi thế đều là thế mới',
)

console.log(
  failures === 0 ? '\n✅ LỊCH ÔN TRUNG CUỘC PASS!\n' : `\n❌ LỊCH ÔN CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
