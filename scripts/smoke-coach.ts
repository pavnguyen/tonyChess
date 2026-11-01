/**
 * Kiểm tra **HLV**: câu nhận xét tiếng Việt theo đúng ngưỡng, và cách nhóm sổ lỗi.
 * Chạy: node scripts/smoke-coach.ts
 */
import {
  describeDanger,
  describeLoss,
  groupBlunders,
  lossBand,
  lossPoints,
  worstOf,
} from '../src/lib/coach.ts'
import type { Blunder } from '../src/lib/coach.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Ngưỡng báo lỗi (chỉ nói khi mất ≥ 1 điểm)')

check(lossBand(0) === 'none', 'nước tốt (0 điểm) → im lặng')
check(lossBand(99) === 'none', 'kém 0.99 điểm → vẫn im lặng')
check(lossBand(100) === 'small', 'kém đúng 1.0 điểm → bắt đầu báo (mức nhẹ)')
check(lossBand(199) === 'small', '1.99 điểm → mức nhẹ')
check(lossBand(200) === 'piece', '2.0 điểm → mức “gần mất quân”')
check(lossBand(500) === 'heavy', '5.0 điểm → mức “mất quân”')
check(lossPoints(137) === '1.4', 'đổi 137 centipawn → “1.4” điểm')
check(describeLoss(0, '♞f5') === '', 'không có câu nào khi nước đi tốt')

console.log('\n▶ Câu nhận xét tiếng Việt')

const small = describeLoss(120, '♞f5')
check(small.includes('kém hơn') && small.includes('♞f5') && small.includes('1.2'), `nhẹ: “${small}”`)

const piece = describeLoss(310, '♞f5')
check(piece.includes('3.1') && piece.includes('quân nhỏ'), `vừa: “${piece}”`)

const heavy = describeLoss(640, '♞f5')
check(heavy.includes('6.4') && heavy.includes('mất quân') && heavy.includes('Đi lại'), `nặng: “${heavy}”`)

const hanging = describeLoss(310, '♞f5', 'Mã f3')
check(hanging.includes('Mã f3') && hanging.includes('ăn miễn phí'), `chỉ đúng quân bị treo: “${hanging}”`)

check(
  !small.includes('hay lắm') && !small.includes('giỏi'),
  'giọng trung tính: không khen mở đầu',
)

console.log('\n▶ Cảnh báo trước khi đi')

check(describeDanger([]) === '', 'không có quân nào bị treo → không cảnh báo')
check(describeDanger(['Mã f3']).includes('Mã f3'), 'cảnh báo nêu đúng tên quân + ô')
check(describeDanger(['Mã f3']).includes('bị ăn miễn phí'), 'nói rõ hậu quả: bị ăn miễn phí')
check(describeDanger(['Mã f3', 'Xe d1']).includes('Xe d1'), 'nhiều quân thì liệt kê hết')

console.log('\n▶ Sổ lỗi: nhóm theo kiểu lỗi')

const blunder = (lossCp: number, ply: number, san = 'Qh5'): Blunder => ({
  date: new Date(2026, 10, ply).toISOString(),
  fen: `fen-${ply}`,
  san,
  bestSan: 'Nf3',
  lossCp,
  ply,
})

const list: Blunder[] = [
  blunder(120, 1),
  blunder(310, 2),
  blunder(900, 3),
  blunder(150, 4),
  blunder(700, 5),
]
const groups = groupBlunders(list)
check(groups.length >= 2, `gom được ${groups.length} nhóm lỗi`)
check(
  groups.some((group) => group.label.includes('Mất Hậu')),
  'có nhóm “Mất Hậu” cho lỗi ≥ 8 điểm',
)
const top = worstOf(list, 3)
check(top.length === 3 && top[0].lossCp === 900, 'ba lỗi nặng nhất xếp giảm dần')
check(worstOf(list, 1)[0].lossCp === Math.max(...list.map((item) => item.lossCp)), 'lỗi nặng nhất đúng')

console.log(
  failures === 0 ? '\n✅ COACH PASS!\n' : `\n❌ COACH CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
