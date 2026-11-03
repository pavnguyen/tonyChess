/**
 * **Lịch ôn bài Trung cuộc** - để 50 thế không “giải xong là hết”.
 *
 * Cách làm giống Leitner đơn giản (không cần thuật toán phức tạp của Anki):
 *  - giải đúng **không gợi ý, không đi sai** → chuỗi +1, hẹn lại sau **3 → 7 → 21 ngày**;
 *  - có dùng 💡 hoặc đi sai → hẹn **mai**, chuỗi về 0.
 *
 * Nhờ vậy mỗi ngày bé chỉ thấy 5-8 thế đúng lúc sắp quên, còn thế mới thì lấy theo
 * thứ tự độ khó (danh sách trong app đã xếp dễ → khó).
 *
 * Hàm thuần + localStorage tách riêng để `scripts/smoke-tactics.ts` chấm được bằng
 * đồng hồ giả.
 */
const STORAGE_KEY = 'hoc-vien-co-vua-nhi.tactics.v1'
const DAY_MS = 24 * 60 * 60 * 1000

export type TacticsOutcome = 'solved-clean' | 'solved-with-help'

export interface TacticsRecord {
  id: string
  /** Số lần giải đúng liên tiếp (không gợi ý, không sai). */
  streak: number
  /** Lần tới hạn ôn (ISO). */
  dueAt: string
  /** Lần gần nhất bé làm (ISO). */
  lastAt: string
}

/** Khoảng cách ôn theo chuỗi: 3 → 7 → 21 ngày. */
export function intervalDays(streak: number): number {
  if (streak <= 1) return 3
  if (streak === 2) return 7
  return 21
}

export function loadRecords(): TacticsRecord[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is TacticsRecord =>
        Boolean(item) && typeof item.id === 'string' && typeof item.dueAt === 'string',
    )
  } catch {
    return []
  }
}

export function saveRecords(records: readonly TacticsRecord[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* chặn lưu trữ thì lịch chỉ có tác dụng trong phiên này */
  }
}

/** Ghi kết quả một thế và trả về danh sách mới (thế vừa làm đứng đầu). */
export function recordResult(
  records: readonly TacticsRecord[],
  id: string,
  outcome: TacticsOutcome,
  now: Date = new Date(),
): TacticsRecord[] {
  const previous = records.find((item) => item.id === id)
  const streak = outcome === 'solved-clean' ? (previous?.streak ?? 0) + 1 : 0
  const days = outcome === 'solved-clean' ? intervalDays(streak) : 1
  const entry: TacticsRecord = {
    id,
    streak,
    dueAt: new Date(now.getTime() + days * DAY_MS).toISOString(),
    lastAt: now.toISOString(),
  }
  return [entry, ...records.filter((item) => item.id !== id)]
}

/** Các thế đã tới hạn ôn, giữ đúng thứ tự độ khó của `orderedIds`. */
export function duePuzzleIds(
  records: readonly TacticsRecord[],
  orderedIds: readonly string[],
  now: Date = new Date(),
): string[] {
  const due = new Set(
    records.filter((item) => new Date(item.dueAt).getTime() <= now.getTime()).map((item) => item.id),
  )
  return orderedIds.filter((id) => due.has(id))
}

/** Các thế bé chưa từng làm, theo thứ tự độ khó. */
export function freshPuzzleIds(
  records: readonly TacticsRecord[],
  orderedIds: readonly string[],
): string[] {
  const seen = new Set(records.map((item) => item.id))
  return orderedIds.filter((id) => !seen.has(id))
}
