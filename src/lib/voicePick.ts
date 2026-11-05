/**
 * Chọn giọng TIẾNG VIỆT - mặc định là **giọng Nam**.
 *
 * Bé nghe khẩu quyết bằng giọng Việt; trên máy thường có cả giọng nữ (Linh,
 * Hoài My, Google Tiếng Việt) lẫn giọng nam (Nam Minh của Microsoft, hoặc các
 * giọng có "Male"/"Nam" trong tên). Trước đây danh sách ưu tiên đặt giọng nữ
 * lên trước nên mặc định là nữ. Nay: tìm giọng nam trước, chỉ khi máy KHÔNG có
 * giọng nam nào mới dùng giọng Việt còn lại - không bao giờ im lặng.
 *
 * Hàm thuần, không phụ thuộc `window`, để `scripts/smoke-voice.ts` kiểm được.
 */
export interface VoiceLike {
  name: string
  lang?: string
}

/** Dấu hiệu tên giọng NAM (so khớp không phân biệt hoa thường). */
const MALE_HINTS = ['namminh', 'nam minh', 'male', 'minh', 'tuấn', 'tuan', 'hùng', 'hung', 'duy']

/** Dấu hiệu tên giọng NỮ - chỉ dùng để tránh khi còn lựa chọn khác. */
const FEMALE_HINTS = ['hoaimy', 'hoài my', 'female', 'linh', 'mai', 'lan', 'hương', 'huong']

const lower = (value: string) => value.toLowerCase()

/**
 * Giọng Việt nên dùng: nam → giọng Việt không rõ nữ → giọng Việt đầu tiên.
 * Trả `null` khi máy không có giọng Việt nào (để trình duyệt tự chọn theo `lang`).
 */
export function chooseVietnameseVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  const vi = voices.filter((voice) => lower(voice.lang ?? '').startsWith('vi'))
  if (vi.length === 0) return null

  const male = vi.find((voice) => MALE_HINTS.some((hint) => lower(voice.name).includes(hint)))
  if (male) return male

  const neutral = vi.find((voice) => !FEMALE_HINTS.some((hint) => lower(voice.name).includes(hint)))
  return neutral ?? vi[0]
}
