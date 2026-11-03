import { OPENINGS } from '../data/openings.ts'
import { groupBlunders, worstOf } from './coach.ts'
import type { Blunder, BlunderGroup } from './coach.ts'

/**
 * **Tổng kết cả ván** - phần HLV nói sau khi ván kết thúc.
 *
 * Trước đây app chỉ nhận xét *nước vừa đi*; bé chơi xong không biết cả ván mình
 * hỏng ở đâu. Module này gom lại thành ba thứ bé dùng được ngay:
 *   1. **3 lỗi nặng nhất** (bấm vào là luyện lại đúng thế cờ đó);
 *   2. **kiểu lỗi** (treo quân / mất Hậu / sai nặng) để bé thấy thói quen của mình;
 *   3. **bé rời bài khai cuộc từ nước nào** - để biết nên mở lại bài nào.
 *
 * Toàn bộ hàm ở đây là hàm thuần (không đụng localStorage, không gọi engine) nên
 * `scripts/smoke-review.ts` chấm được bằng dữ liệu kịch bản.
 */

export interface BookExit {
  /** Số nửa nước bé còn đi đúng bài. */
  ply: number
  /** Tên quốc tế của khai cuộc bé đã đi đúng (hiện cho ba mẹ đọc). */
  name: string
  /** Id khai cuộc để nhảy sang tab Khai cuộc. */
  id: string
}

export interface GameReview {
  /** 3 lỗi nặng nhất, nặng nhất đứng đầu. */
  worst: Blunder[]
  /** Kiểu lỗi, nhiều/nặng nhất đứng đầu. */
  groups: BlunderGroup[]
  /** Rời bài khai cuộc ở đâu; `null` = không khớp bài nào trong app. */
  exit: BookExit | null
  /** Tổng số nước bé mất ≥ 1 điểm. */
  losses: number
}

/**
 * Bé còn đi đúng **dòng chính** của một khai cuộc trong app tới ply nào?
 *
 * Chỉ tính khi khớp ≥ 4 nửa nước (2 nước) - khớp 1-2 nước đầu thì khai cuộc nào
 * cũng giống nhau, báo “đúng bài” sẽ vô nghĩa. Trả về khai cuộc khớp dài nhất mà
 * bé **đã rời khỏi** (ngắn hơn độ dài ván).
 */
export function bookExit(sans: readonly string[]): BookExit | null {
  if (sans.length < 5) return null
  /**
   * Khớp sâu nhất của **mọi** khai cuộc. Nếu có bài phủ trọn cả ván thì bé *chưa*
   * rời bài nào - phải im lặng. Nếu không, báo đúng bài khớp sâu nhất (bài khác chỉ
   * trùng 3-4 nước đầu thì không tính, vì nước đầu khai cuộc nào cũng giống nhau).
   */
  let deepest = 0
  let best: BookExit | null = null
  for (const opening of OPENINGS) {
    const line = opening.moves
    let matched = 0
    while (matched < line.length && matched < sans.length && line[matched].san === sans[matched]) {
      matched += 1
    }
    if (matched > deepest) deepest = matched
    if (matched < 4) continue
    if (!best || matched > best.ply) {
      best = { ply: matched, name: opening.englishName, id: opening.id }
    }
  }
  if (deepest >= sans.length) return null // ván chưa rời bài
  return best
}

export function reviewGame(sans: readonly string[], blunders: readonly Blunder[]): GameReview {
  return {
    worst: worstOf(blunders, 3),
    groups: groupBlunders(blunders).slice(0, 3),
    exit: bookExit(sans),
    losses: blunders.filter((item) => item.lossCp >= 100).length,
  }
}

/** Số nước (không phải nửa nước) để hiện cho bé: ply 9 → “nước 5”. */
export function moveNumber(ply: number): number {
  return Math.floor(ply / 2) + 1
}
