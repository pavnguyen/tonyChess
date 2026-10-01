import type { RankInfo } from '../types'

/** Thăng cấp danh hiệu theo số ⭐ tích lũy. */
export const RANKS: RankInfo[] = [
  { id: 'seed', title: 'Kỳ thủ Nhí', emoji: '🌱', minStars: 0 },
  { id: 'apprentice', title: 'Tập sự Cờ vua', emoji: '🐣', minStars: 8 },
  { id: 'knight', title: 'Kiện tướng Nhí', emoji: '🥉', minStars: 20 },
  { id: 'master', title: 'Đại Kiện tướng Nhí', emoji: '👑', minStars: 40 },
]

/** Danh hiệu hiện tại của bé theo số sao. */
export function currentRank(stars: number): RankInfo {
  return [...RANKS].reverse().find((rank) => stars >= rank.minStars) ?? RANKS[0]
}

/** Danh hiệu kế tiếp, `null` nếu bé đã đạt cấp cao nhất. */
export function nextRankOf(stars: number): RankInfo | null {
  return RANKS.find((rank) => rank.minStars > stars) ?? null
}
