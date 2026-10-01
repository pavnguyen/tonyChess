import type { Side } from '../types'

/**
 * Thư viện thế chiếu bí (§4.2).
 *
 * Đây là bộ "thẻ nhận dạng" để bé nhìn là nhớ: mỗi thẻ là một thế cờ có **chuỗi
 * nước tối ưu ngắn** dẫn tới chiếu bí. Mọi chuỗi nước đều được **máy kiểm chứng**
 * trong `scripts/validate-chess.ts` (hợp lệ, kết thúc đúng bằng chiếu bí, và độ dài
 * khớp `mateIn`), nên không thể sai sót bằng tay.
 *
 * Ghi chú: các thế kỹ thuật dài hơi (Tượng đôi, Mã + Tượng) chưa đưa vào đây vì
 * chuỗi nước dài, khó kiểm chứng tự động rẻ tiền; sẽ bổ sung khi có bước kiểm riêng.
 */

export type MateTier = 'basic' | 'intermediate'

export interface MatePattern {
  id: string
  title: string
  tier: MateTier
  emoji: string
  /** Thế cờ bắt đầu. */
  fen: string
  /** Bên tấn công (bên đi trước và chiếu bí). */
  playerSide: Side
  /** Số nước của bên tấn công để chiếu bí, chơi tối ưu cả hai bên. */
  mateIn: number
  /** Chuỗi nửa nước SAN tối ưu (cả hai bên), kết thúc bằng chiếu bí. */
  line: string[]
  explanation: string
  /** Khẩu quyết vè 4-6 chữ. */
  rhyme: string
}

export const MATES: MatePattern[] = [
  {
    id: 'mate-queen-edge',
    title: 'Hậu + Vua dồn Vua ra mép',
    tier: 'basic',
    emoji: '👑',
    fen: 'k7/2Q5/K7/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    mateIn: 1,
    line: ['Qc8#'],
    explanation:
      'Vua Đen đã bị dồn sát mép bàn. Hậu xuống cạnh Vua, lại được Vua Trắng che nên Vua Đen không thể ăn.',
    rhyme: 'Hậu áp sát bí ngay',
  },
  {
    id: 'mate-rook-edge',
    title: 'Xe + Vua chiếu bí ở mép',
    tier: 'basic',
    emoji: '🏰',
    fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
    playerSide: 'white',
    mateIn: 1,
    line: ['Ra8#'],
    explanation:
      'Vua Trắng ở g6 đã khóa các ô g7, h7. Xe xuống hàng 8 chiếu từ xa - Vua Đen hết đường chạy.',
    rhyme: 'Xe lên hàng Vua hết',
  },
  {
    id: 'mate-ladder',
    title: 'Thang Xe (2 Xe đuổi Vua)',
    tier: 'intermediate',
    emoji: '🪜',
    fen: '7k/8/8/8/8/8/6R1/R6K w - - 0 1',
    playerSide: 'white',
    mateIn: 2,
    line: ['Ra3', 'Kh7', 'Rh3#'],
    explanation:
      'Một Xe canh hàng trên, Xe kia chiếu từ cạnh bàn. Hai Xe đẩy Vua lùi mãi tới khi hết đường - không quân nào cứu được.',
    rhyme: 'Thang Xe đuổi Vua',
  },
  {
    id: 'mate-back-rank-rook',
    title: 'Chiếu bí hàng cuối (Xe)',
    tier: 'basic',
    emoji: '🧱',
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    playerSide: 'white',
    mateIn: 1,
    line: ['Ra8#'],
    explanation:
      'Ba Tốt f7, g7, h7 của Đen tự chặn đường Vua. Chỉ một nước Xe lên hàng 8 là chiếu bí.',
    rhyme: 'Hàng cuối khoá Vua',
  },
  {
    id: 'mate-back-rank-queen',
    title: 'Chiếu bí hàng cuối (Hậu)',
    tier: 'basic',
    emoji: '🔥',
    fen: '6k1/5ppp/8/3Q4/8/8/8/6K1 w - - 0 1',
    playerSide: 'white',
    mateIn: 1,
    line: ['Qa8#'],
    explanation:
      'Không cần ăn gì cả: Hậu tràn xuống hàng 8 chiếu dọc hàng, Vua Đen bị chính Tốt của mình nhốt lại.',
    rhyme: 'Hậu tràn hàng cuối',
  },
  {
    id: 'mate-smothered',
    title: 'Chiếu bí ngạt bằng Mã',
    tier: 'intermediate',
    emoji: '🕸️',
    fen: '6rk/6pp/8/4N3/8/8/8/4K3 w - - 0 1',
    playerSide: 'white',
    mateIn: 1,
    line: ['Nf7#'],
    explanation:
      'Vua Đen ở h8 bị Xe g8 và hai Tốt g7, h7 của chính mình bưng kín. Mã nhảy f7 là bí, không quân nào đỡ được.',
    rhyme: 'Vua ngạt vì quân nhà',
  },
  {
    id: 'mate-arabian',
    title: 'Bí kiểu Ả Rập (Xe + Mã)',
    tier: 'intermediate',
    emoji: '🐎',
    fen: '7k/R7/5N2/8/8/8/8/4K3 w - - 0 1',
    playerSide: 'white',
    mateIn: 1,
    line: ['Rh7#'],
    explanation:
      'Xe xuống h7 sát Vua, còn Mã f6 giữ chặt hai ô thoát g8 và g7. Vua Đen không thể ăn Xe vì Mã đang che.',
    rhyme: 'Mã giữ Xe bí',
  },
]

export function matesByTier(tier: MateTier): MatePattern[] {
  return MATES.filter((pattern) => pattern.tier === tier)
}
