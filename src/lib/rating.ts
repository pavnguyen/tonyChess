/**
 * Mini-Elo - "điểm trình độ" của bé.
 *
 * Vì sao cần: độ khó cố định khiến bé giỏi thấy chán, bé yếu thấy nản. Điểm trình
 * độ giúp app tự chọn câu vừa sức và khoe tiến bộ bằng TÊN CẤP ĐỘ dễ thương thay
 * vì con số khô khan.
 *
 * Ba nguyên tắc đã chốt với chủ dự án:
 *  1. Điểm khởi đầu **500** để bé thấy tiến bộ nhanh.
 *  2. Bé thấy **tên cấp độ** (Mầm cờ → Cao thủ nhí), số Elo để dành cho bố mẹ.
 *  3. **Không bao giờ trừ điểm khi sai** - sai chỉ là "chưa tính là đúng", chỉ làm
 *     chậm tiến bộ chứ không kéo bé thụt lùi.
 *
 * Module CỐ TÌNH chỉ chứa logic thuần (không DOM, không React) để test được bằng
 * `node scripts/smoke-rating.ts`.
 */

/** Điểm xuất phát của một bé mới. */
export const START_RATING = 500

/** Điểm quy cho từng mức câu đố - càng khó điểm càng cao. */
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_RATINGS: Record<PuzzleDifficulty, number> = {
  easy: 450,
  medium: 600,
  hard: 750,
}

/** Hệ số K: bé nhỏ học nhanh (24), từ 13 tuổi dùng 32 cho bám sát sức thật. */
export const K_YOUNG = 24
export const K_TEEN = 32
export const TEEN_AGE = 13

/** Số lần gần nhất giữ lại trong nhật ký (không phình localStorage). */
export const HISTORY_LIMIT = 200

export interface RatingHistoryEntry {
  /** Thời điểm (ms). */
  t: number
  /** Dạng bài vừa làm (ví dụ `fork`, `endgame`). */
  theme: string
  /** Điểm được cộng sau lần đó (0 khi sai). */
  delta: number
}

export interface RatingBook {
  overall: number
  byTheme: Record<string, number>
  history: RatingHistoryEntry[]
}

export interface RatingAttempt {
  theme: string
  difficulty: PuzzleDifficulty
  correct: boolean
  /** Tuổi bé (null khi chưa nhập năm sinh → dùng hệ số của bé nhỏ). */
  age?: number | null
  now: number
}

export function createRatingBook(): RatingBook {
  return { overall: START_RATING, byTheme: {}, history: [] }
}

/** Điểm kỳ vọng bé giành được trước một câu có độ khó `opponent`. */
export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400))
}

export function kFactor(age: number | null | undefined): number {
  return typeof age === 'number' && age >= TEEN_AGE ? K_TEEN : K_YOUNG
}

/** Công thức Elo rút gọn, có chốt "không bao giờ giảm". */
function applyElo(rating: number, opponent: number, result: 0 | 1, k: number): number {
  const next = rating + k * (result - expectedScore(rating, opponent))
  // Sai (result = 0) cho `next < rating`; chốt lại để điểm chỉ đi lên.
  return Math.max(rating, Math.round(next))
}

/**
 * Ghi một lần làm bài vào sổ điểm.
 * Trả về sổ MỚI (không sửa bản cũ) để dùng với React state.
 */
export function updateRating(book: RatingBook, attempt: RatingAttempt): RatingBook {
  const k = kFactor(attempt.age)
  const opponent = DIFFICULTY_RATINGS[attempt.difficulty]
  const result: 0 | 1 = attempt.correct ? 1 : 0

  const overall = applyElo(book.overall, opponent, result, k)
  const themeRating = applyElo(book.byTheme[attempt.theme] ?? START_RATING, opponent, result, k)
  const delta = overall - book.overall

  const history = [...book.history, { t: attempt.now, theme: attempt.theme, delta }]
  return {
    overall,
    byTheme: { ...book.byTheme, [attempt.theme]: themeRating },
    history: history.length > HISTORY_LIMIT ? history.slice(-HISTORY_LIMIT) : history,
  }
}

export interface RatingLevel {
  id: string
  /** Tên bé nhìn thấy - 5 nấc đã chốt. */
  name: string
  emoji: string
  min: number
}

/** Năm nấc cấp độ bé nhìn thấy (đã chốt với chủ dự án). */
export const LEVELS: readonly RatingLevel[] = [
  { id: 'mam-co', name: 'Mầm cờ', emoji: '🌱', min: 0 },
  { id: 'biet-di-co', name: 'Biết đi cờ', emoji: '♟️', min: 550 },
  { id: 'chac-tay', name: 'Chơi chắc tay', emoji: '💪', min: 700 },
  { id: 'sac-ben', name: 'Đánh sắc bén', emoji: '⚡', min: 850 },
  { id: 'cao-thu-nhi', name: 'Cao thủ nhí', emoji: '👑', min: 1000 },
]

export function levelFor(rating: number): RatingLevel {
  let current = LEVELS[0]
  for (const level of LEVELS) {
    if (rating >= level.min) current = level
  }
  return current
}

/** Nấc kế tiếp để khoe "còn bao xa" - null khi đã ở nấc cao nhất. */
export function nextLevelOf(rating: number): RatingLevel | null {
  return LEVELS.find((level) => level.min > rating) ?? null
}

/** Tỉ lệ 0..1 để vẽ thanh tiến độ tới nấc kế tiếp. */
export function levelProgress(rating: number): number {
  const level = levelFor(rating)
  const next = nextLevelOf(rating)
  if (!next) return 1
  return Math.min(1, Math.max(0, (rating - level.min) / (next.min - level.min)))
}

/**
 * Mức câu "hơi trên sức" (§2.2): nhắm tới điểm hiện tại + 60 để bé luôn được
 * thử thách một chút mà không bị ngợp.
 */
export function suggestedDifficulty(rating: number): PuzzleDifficulty {
  const target = rating + 60
  const tiers: PuzzleDifficulty[] = ['easy', 'medium', 'hard']
  return tiers.reduce((best, tier) =>
    Math.abs(DIFFICULTY_RATINGS[tier] - target) < Math.abs(DIFFICULTY_RATINGS[best] - target)
      ? tier
      : best,
  )
}

/** Mức máy gợi ý cho tab "Đấu với Robot" theo điểm tổng. */
export function suggestedBotLevel(rating: number): 'easy' | 'medium' | 'hard' | 'master' {
  if (rating < 550) return 'easy'
  if (rating < 750) return 'medium'
  if (rating < 950) return 'hard'
  return 'master'
}

/** Điểm của một dạng bài (chưa làm thì lấy điểm khởi đầu). */
export function themeRating(book: RatingBook, theme: string): number {
  return book.byTheme[theme] ?? START_RATING
}

/** Tỉ lệ 0..1 cho thanh nhỏ: 500 → 0%, 1000+ → 100%. */
export function themePercent(rating: number): number {
  return Math.min(1, Math.max(0, (rating - START_RATING) / 500))
}

/** Dạng đòn yếu nhất trong danh sách - nơi bé cần luyện thêm. */
export function weakestTheme(book: RatingBook, themes: readonly string[]): string | null {
  let weakest: string | null = null
  let lowest = Infinity
  for (const theme of themes) {
    const value = themeRating(book, theme)
    if (value < lowest) {
      lowest = value
      weakest = theme
    }
  }
  return weakest
}
