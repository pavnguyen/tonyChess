/**
 * Ước lượng vui về "trình độ" của bé, chỉ để động viên - KHÔNG phải Elo thi đấu thật.
 *
 * Công thức cố tình đơn giản và minh bạch: bé mới biết luật ~600, mỗi hoạt động hoàn
 * thành cộng thêm 18, và trần ở 2000 (không ai "lên" mãi chỉ vì bấm nhiều).
 */
export function estimateElo(completedCount: number): number {
  return Math.min(2000, Math.round(600 + 18 * completedCount))
}

/**
 * Nhịp ôn tập ngắt quãng (đơn vị: ngày) theo từng "hộp": làm xong càng nhiều lần thì
 * càng lâu mới nhắc lại. Dùng chung cho mọi tab.
 */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16, 35]
