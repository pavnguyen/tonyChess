/**
 * Smoke test kho nội dung cho nút **ⓘ** (`src/lib/info.ts`).
 *
 * Chạy: node scripts/smoke-info.ts
 *
 * Mục đích: nút ⓘ tự ẩn khi thiếu nội dung - nên nếu ai thêm một khai cuộc / đòn /
 * thế tàn cuộc mới mà quên viết giải thích thì **không ai thấy gì cả**. Bài kiểm này
 * bắt đúng những trường hợp đó:
 *   - mọi khoá trong `REQUIRED_INFO_IDS` đều có nội dung;
 *   - tiêu đề và thân bài không rỗng, `tag` nằm trong danh sách hợp lệ;
 *   - **mọi khoá mà app gọi tới** (khai cuộc, đòn, tàn cuộc Xe+Tốt, khái niệm vị trí,
 *     bài giảng) đều có giải thích - để nút ⓘ không biến mất ở đúng chỗ quan trọng.
 */
import { OPENINGS } from '../src/data/openings.ts'
import { TACTIC_META, TACTICS } from '../src/data/tactics.ts'
import { ROOK_ENDGAMES } from '../src/data/rookEndgames.ts'
import { POSITIONAL } from '../src/data/positional.ts'
import { GM_LECTURES } from '../src/data/gmLectures.ts'
import { INFO, INFO_TAGS, REQUIRED_INFO_IDS, infoById } from '../src/lib/info.ts'

let failures = 0
const check = (condition: boolean, label: string) => {
  if (condition) {
    console.log('  ✓ ' + label)
  } else {
    console.log('  ✗ ' + label)
    failures += 1
  }
}

const allowedTags: readonly string[] = INFO_TAGS

console.log('\n▶ Kho nội dung nút ⓘ (giải thích tại chỗ)')

// --- 1. Mọi khoá bắt buộc đều có, nội dung đầy đủ, tag hợp lệ.
let missing = 0
let badShape = 0
let badTag = 0
for (const id of REQUIRED_INFO_IDS) {
  const entry = infoById(id)
  if (!entry) {
    missing += 1
    check(false, `${id}: có nội dung`)
    continue
  }
  const bodyOk =
    Array.isArray(entry.body) &&
    entry.body.length > 0 &&
    entry.body.every((paragraph) => typeof paragraph === 'string' && paragraph.trim().length > 0)
  if (entry.title.trim().length === 0 || !bodyOk) {
    badShape += 1
    check(false, `${id}: tiêu đề và thân bài không rỗng`)
  }
  if (!allowedTags.includes(entry.tag)) {
    badTag += 1
    check(false, `${id}: tag “${entry.tag}” không hợp lệ`)
  }
}
check(missing === 0, `mọi khoá bắt buộc đều tồn tại (${REQUIRED_INFO_IDS.length} khoá)`)
check(badShape === 0, 'mọi mục đều có tiêu đề và ít nhất một đoạn thân bài')
check(badTag === 0, 'mọi mục dùng đúng một trong các nhãn hợp lệ')

// --- 2. Không có mục nào bị “mồ côi” (không nằm trong danh sách bắt buộc) - dấu hiệu
//        của việc quên đăng ký, khiến bài kiểm không bao giờ soi tới.
const required = new Set(REQUIRED_INFO_IDS)
const orphans = Object.keys(INFO).filter((id) => !required.has(id))
check(orphans.length === 0, `không có mục mồ côi${orphans.length ? ` (${orphans.join(', ')})` : ''}`)

// --- 3. Mọi thứ app CÓ THỂ gọi tới đều phải có nội dung, nếu không nút ⓘ sẽ biến mất.
const wanted: string[] = [
  ...OPENINGS.map((opening) => `opening:${opening.id}`),
  ...Object.keys(TACTIC_META).map((type) => `tactic:${type}`),
  ...ROOK_ENDGAMES.map((lesson) => `endgame:${lesson.id}`),
  ...POSITIONAL.map((lesson) => `positional:${lesson.concept}`),
  ...GM_LECTURES.map((lecture) => `lecture:${lecture.id}`),
]
const missingWanted = wanted.filter((id) => !infoById(id))
check(
  missingWanted.length === 0,
  `mọi mục app gọi tới đều có giải thích (${wanted.length} mục)${
    missingWanted.length ? ` - thiếu: ${missingWanted.join(', ')}` : ''
  }`,
)
check(TACTICS.length > 0, 'dữ liệu đòn chiến thuật tải được (để đối chiếu khoá)')

console.log(
  failures === 0 ? '\n✅ NỘI DUNG NÚT ⓘ PASS!\n' : `\n❌ NỘI DUNG NÚT ⓘ: ${failures} lỗi\n`,
)
process.exit(failures === 0 ? 0 : 1)
