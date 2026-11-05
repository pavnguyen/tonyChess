/**
 * Kiểm tra chọn giọng tiếng Việt: mặc định phải là giọng NAM khi máy có.
 *
 * Chạy: node scripts/smoke-voice.ts
 */
import { chooseVietnameseVoice } from '../src/lib/voicePick.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

const voice = (name: string, lang = 'vi-VN') => ({ name, lang })

console.log('\n▶ Giọng tiếng Việt mặc định là giọng Nam')

check(
  chooseVietnameseVoice([
    voice('Microsoft HoaiMy Online (Natural) - Vietnamese'),
    voice('Microsoft NamMinh Online (Natural) - Vietnamese'),
  ])?.name === 'Microsoft NamMinh Online (Natural) - Vietnamese',
  'có NamMinh thì chọn NamMinh, không chọn Hoài My',
)

check(
  chooseVietnameseVoice([voice('Google Tiếng Việt'), voice('Minh (Vietnamese)')])?.name ===
    'Minh (Vietnamese)',
  'giọng có tên Nam thắng giọng Google mặc định',
)

check(
  chooseVietnameseVoice([voice('Linh'), voice('Vietnamese Male')])?.name === 'Vietnamese Male',
  'tên có “Male” cũng được nhận là giọng Nam',
)

check(
  chooseVietnameseVoice([voice('Linh'), voice('Mai')])?.name === 'Linh',
  'máy chỉ có giọng nữ thì vẫn đọc (không im lặng)',
)

check(
  chooseVietnameseVoice([voice('Samantha', 'en-US'), voice('Alex', 'en-US')]) === null,
  'không có giọng Việt thì trả null để trình duyệt tự chọn theo lang',
)

check(
  chooseVietnameseVoice([voice('Google Tiếng Việt'), voice('Linh')])?.name === 'Google Tiếng Việt',
  'không rõ nam/nữ thì tránh tên nữ đã biết',
)

if (failures > 0) {
  console.log(`\n❌ ${failures} LỖI CHỌN GIỌNG\n`)
  process.exit(1)
}

console.log('\n✅ SMOKE VOICE PASS!\n')
