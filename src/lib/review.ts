/**
 * Ôn tập ngắt quãng (spaced repetition) kiểu hộp Leitner - trái tim của việc học lâu dài.
 *
 * Ý tưởng: một câu đố bé vừa giải đúng sẽ quay lại sau 1 ngày, rồi 3 ngày, 7 ngày, 21 ngày.
 * Giải sai thì quân bài rơi về hộp đầu và hẹn gặp lại sau 10 phút - vừa đủ để bé không quên
 * nhưng cũng không thấy nhàm.
 *
 * Một quân bài đi qua 5 nấc: hôm nay (vừa học) → 1 → 3 → 7 → 21 ngày.
 *
 * Module này CỐ TÌNH chỉ chứa logic thuần (không DOM, không React) để:
 *  - test được bằng `node scripts/smoke-review.ts` mà không cần trình duyệt,
 *  - dùng lại cho mọi loại bài: khai cuộc, đòn chiến thuật, tàn cuộc.
 */

export const DAY_MS = 86_400_000

/**
 * Số ngày hẹn lại theo từng hộp.
 * Hộp 0 = vừa học (gặp ngay trong buổi), hộp 4 = đã nhớ rất dai (21 ngày).
 */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 21] as const

/** Giải sai thì hẹn lại sau 10 phút - ngay trong buổi học, bé sẽ được gặp lại câu đó. */
export const RELEARN_DELAY_MS = 10 * 60 * 1000

/** Một buổi ôn chỉ nên ngắn: 7 tuổi tập trung được khoảng 6-8 câu là hết pin. */
export const REVIEW_SESSION_SIZE = 6

export type ReviewItem = {
  /** Khoá duy nhất, ví dụ `tactic:fork-1` hoặc `endgame:qk-vs-k`. */
  key: string
  /** Hộp Leitner hiện tại (0..4). */
  box: number
  /** Thời điểm (ms) lần tới nên ôn lại. */
  due: number
  /** Số lần bé làm sai câu này. */
  lapses: number
  /** Số lần đã gặp. */
  seen: number
}

export type ReviewDeck = Record<string, ReviewItem>

/** Hộp cao nhất có hẹn lại được (mốc cuối của REVIEW_INTERVALS_DAYS). */
export const MAX_BOX = REVIEW_INTERVALS_DAYS.length - 1

export function intervalDaysForBox(box: number): number {
  const safe = Math.min(Math.max(Math.trunc(box), 0), MAX_BOX)
  return REVIEW_INTERVALS_DAYS[safe]
}

/** Quân bài mới: gặp được ngay, chưa lần nào làm sai. */
export function createReviewItem(key: string, now: number): ReviewItem {
  return { key, box: 0, due: now, lapses: 0, seen: 0 }
}

/**
 * Cập nhật một quân bài sau khi bé làm.
 * - Đúng: lên hộp cao hơn (tối đa MAX_BOX) và hẹn lại xa hơn.
 * - Sai: rơi về hộp 0, hẹn lại sau RELEARN_DELAY_MS, tăng `lapses`.
 */
export function scheduleReview(item: ReviewItem, correct: boolean, now: number): ReviewItem {
  if (correct) {
    const box = Math.min(item.box + 1, MAX_BOX)
    return { ...item, box, due: now + intervalDaysForBox(box) * DAY_MS, seen: item.seen + 1 }
  }
  return { ...item, box: 0, due: now + RELEARN_DELAY_MS, lapses: item.lapses + 1, seen: item.seen + 1 }
}

/** Ghi kết quả của một câu vào bộ bài (tạo mới nếu chưa từng có). */
export function recordAttempt(
  deck: ReviewDeck,
  key: string,
  correct: boolean,
  now: number,
): ReviewDeck {
  const item = deck[key] ?? createReviewItem(key, now)
  return { ...deck, [key]: scheduleReview(item, correct, now) }
}

export function isDue(item: ReviewItem, now: number): boolean {
  return item.due <= now
}

/** Các quân bài đã tới hạn, quá hạn lâu nhất lên trước. */
export function dueItems(deck: ReviewDeck, now: number): ReviewItem[] {
  return Object.values(deck)
    .filter((item) => isDue(item, now))
    .sort((a, b) => a.due - b.due)
}

/** Số quân bài đã tới hạn - dùng để hiện huy hiệu đỏ trên tab “Ôn tập”. */
export function dueCount(deck: ReviewDeck, now: number): number {
  return dueItems(deck, now).length
}

/**
 * Bao nhiêu phần trăm bộ bài đã nằm ở hộp cuối (nhớ dai).
 * Đây là con số “bé đã thuộc bao nhiêu” đáng hiện cho bố mẹ xem, thay vì số câu đã giải.
 */
export function masteredPercent(deck: ReviewDeck): number {
  const items = Object.values(deck)
  if (items.length === 0) return 0
  const mastered = items.filter((item) => item.box >= MAX_BOX).length
  return Math.round((mastered / items.length) * 100)
}

/** Tóm tắt một bộ bài để hiển thị. */
export function summarizeDeck(deck: ReviewDeck, now: number) {
  const items = Object.values(deck)
  return {
    total: items.length,
    due: dueCount(deck, now),
    mastered: items.filter((item) => item.box >= MAX_BOX).length,
    masteredPercent: masteredPercent(deck),
    weakest: items
      .filter((item) => item.lapses > 0)
      .sort((a, b) => b.lapses - a.lapses)
      .slice(0, 3),
  }
}

export type ReviewKind = 'tactic' | 'opening' | 'endgame' | 'lecture' | 'structure'

export function reviewKey(kind: ReviewKind, id: string): string {
  return `${kind}:${id}`
}

export function kindOfKey(key: string): ReviewKind {
  return (key.split(':')[0] ?? 'tactic') as ReviewKind
}
