/**
 * **Elo ước lượng theo từng mảng** (khai cuộc / trung cuộc / tàn cuộc).
 *
 * Cố ý đơn giản và **giải thích được bằng tay** (spec `app-upgrade-spec.md` §5.2):
 * - Bắt đầu 1300 điểm mỗi mảng.
 * - Làm đúng một bài ở mức `n` → cộng `4 / 6 / 8` điểm; làm sai → trừ 2.
 * - Trung bình trượt trên 20 bài gần nhất; kẹp trong `[1200, 2000]`.
 *
 * Chỉ hiện ở tab **Tiến bộ**, không hiện trong lúc bé chơi.
 */
export type RatingArea = 'opening' | 'tactics' | 'endgame'

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.rating.v1'
const START = 1300
const WINDOW = 20
const MIN = 1200
const MAX = 2000
const GAIN = [0, 4, 6, 8] // mức 1/2/3 → điểm cộng
const PENALTY = 2

export const AREA_LABEL: Record<RatingArea, string> = {
  opening: 'Khai cuộc',
  tactics: 'Trung cuộc',
  endgame: 'Tàn cuộc',
}

interface Attempt {
  area: RatingArea
  ok: boolean
  level: number
  date: string
}

function read(): Attempt[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Attempt[]) : []
  } catch {
    return []
  }
}

function write(attempts: Attempt[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts.slice(-600)))
  } catch {
    /* bỏ qua khi trình duyệt chặn lưu trữ */
  }
}

/** Ghi nhận một lần làm bài (đúng/sai) để cập nhật mức ước lượng của mảng đó. */
export function recordAttempt(area: RatingArea, ok: boolean, level = 2) {
  const attempts = read()
  attempts.push({ area, ok, level: Math.min(3, Math.max(1, Math.round(level))), date: new Date().toISOString() })
  write(attempts)
}

/** Điểm ước lượng của một mảng. */
export function ratingFor(area: RatingArea): number {
  const attempts = read().filter((item) => item.area === area).slice(-WINDOW)
  if (attempts.length === 0) return START
  let score = START
  for (const attempt of attempts) {
    if (attempt.ok) score += GAIN[attempt.level] ?? GAIN[2]
    else score -= PENALTY
  }
  return Math.max(MIN, Math.min(MAX, Math.round(score)))
}

export function allRatings(): Record<RatingArea, number> {
  return {
    opening: ratingFor('opening'),
    tactics: ratingFor('tactics'),
    endgame: ratingFor('endgame'),
  }
}

/** Nhãn mức đang đạt, để bé/ba mẹ đọc dễ hơn một con số trần. */
export function ratingBand(value: number): string {
  if (value < 1400) return 'đang vào nhịp'
  if (value < 1500) return 'chắc tay'
  if (value < 1650) return 'khá'
  if (value < 1800) return 'khá cứng'
  return 'giỏi'
}

/** Số bài đã làm của từng mảng (cho dòng "đã luyện N bài"). */
export function attemptCount(area: RatingArea): number {
  return read().filter((item) => item.area === area).length
}

export function resetRatings() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* bỏ qua */
  }
}
