/**
 * Kiểm tra **giới hạn sức mạnh Stockfish** - phần quyết định mức “Khá” còn cửa thắng.
 *
 * Vì sao cần bài kiểm riêng: đây là chỗ dễ sai nhất mà mắt thường không thấy. Nếu quên
 * `UCI_LimitStrength true` thì chỉ cần một lần sửa code là Stockfish lại chạy hết sức
 * (mạnh hơn 2000 rất xa) và bé 1300 thua 100% số ván - app vẫn “chạy bình thường”.
 *
 * Chạy: node scripts/smoke-strength.ts
 */
import { MAX_ELO, MIN_ELO, strengthCommands } from '../src/engine/stockfishLoader.ts'

let failures = 0
const check = (ok: boolean, label: string) => {
  if (ok) console.log('  ✓ ' + label)
  else {
    failures += 1
    console.error('  ✗ ' + label)
  }
}

console.log('\n▶ Không truyền Elo = engine chạy hết sức')

const full = strengthCommands()
check(full.length === 1, 'chỉ gửi đúng một lệnh')
check(
  full[0] === 'setoption name UCI_LimitStrength value false',
  'tắt giới hạn sức mạnh (UCI_LimitStrength false)',
)

console.log('\n▶ Có Elo = giới hạn đúng mức')

const limited = strengthCommands(1500)
check(limited.length === 2, 'gửi hai lệnh: bật giới hạn + đặt Elo')
check(
  limited[0] === 'setoption name UCI_LimitStrength value true',
  'bật giới hạn sức mạnh',
)
check(limited[1] === 'setoption name UCI_Elo value 1500', 'đặt đúng Elo 1500')

console.log('\n▶ Kẹp Elo vào khoảng Stockfish nhận')

check(strengthCommands(900)[1] === `setoption name UCI_Elo value ${MIN_ELO}`, `Elo 900 → kẹp lên ${MIN_ELO}`)
check(strengthCommands(5000)[1] === `setoption name UCI_Elo value ${MAX_ELO}`, `Elo 5000 → kẹp xuống ${MAX_ELO}`)
check(strengthCommands(1520.6)[1] === 'setoption name UCI_Elo value 1521', 'Elo lẻ được làm tròn')

console.log('\n▶ Mức “Khá” của tab Đấu Máy phải nằm trong tầm bé thắng được')

const KID_LEVEL_ELO = 1500
const kid = strengthCommands(KID_LEVEL_ELO)
check(kid[0].endsWith('true'), 'mức Khá BẬT giới hạn sức mạnh')
check(
  kid[1] === `setoption name UCI_Elo value ${KID_LEVEL_ELO}`,
  `mức Khá chơi đúng ${KID_LEVEL_ELO} Elo, không phải Stockfish hết sức`,
)

console.log(
  failures === 0 ? '\n✅ SỨC MẠNH ENGINE PASS!\n' : `\n❌ SỨC MẠNH ENGINE CÓ ${failures} LỖI\n`,
)
process.exit(failures === 0 ? 0 : 1)
