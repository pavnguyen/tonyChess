import type { BestMovePuzzle, BestMoveTheme } from '../types'

/**
 * TRUNG CUỘC - "Tìm nước hay nhất" (thay cho bộ đố mẫu cũ).
 *
 * Bé soi một **thế cờ thật** rồi tự tìm nước mạnh nhất, thay vì học thuộc tên đòn.
 *
 * QUY TẮC DỮ LIỆU (đã siết lại):
 *  - **Mọi bài đều ≥ 3 nước**: bé đi nước đầu, máy đáp, bé đi nước kết liễu (hoặc dài
 *    hơn: 5 nước). Không còn bài "một nước là xong" vì loại đó bé không phải suy luận.
 *  - `bestSan` + chuỗi `continuation` đều đã được **máy chấm điểm** bằng
 *    `scripts/verify-bestmove.ts`: nước của bé phải nằm trong nhóm tốt nhất, và thế
 *    cờ cuối phải là chiếu bí hoặc thắng rõ ràng.
 *  - `continuation` luôn bắt đầu bằng **nước đáp của máy** và kết thúc bằng nước của
 *    bé, nên độ dài là số chẵn.
 */

export const BEST_MOVE_THEMES: Record<
  BestMoveTheme,
  { label: string; emoji: string; blurb: string; when: string }
> = {
  'win-material': {
    label: 'Trừng phạt quân treo',
    emoji: '🎯',
    blurb: 'Đối thủ để quân không ai che - ăn một quân to rồi ăn tiếp quân nữa.',
    when: 'Khi hai quân địch đứng cùng tầm một quân của bé, hoặc một quân đứng một mình.',
  },
  'win-queen': {
    label: 'Đòn hiểm ăn Hậu',
    emoji: '👸',
    blurb: 'Hậu là quân to nhất - ăn được Hậu rồi phải biết rút quân về an toàn.',
    when: 'Khi Hậu địch đứng lộ liễu, cùng đường với Vua hoặc quân của bé.',
  },
  pin: {
    label: 'Đòn ghim',
    emoji: '📌',
    blurb: 'Quân địch bị ghim không dám nhúc nhích - bé vồ tới và ăn gọn.',
    when: 'Khi một quân địch đứng chắn giữa quân bé và Vua địch trên cùng một đường.',
  },
}

export const BEST_MOVES: BestMovePuzzle[] = [
  // ── Trừng phạt quân treo (đòn đôi, ăn liền hai quân) ───────────────────────
  {
    id: 'material-1',
    theme: 'win-material',
    title: 'Mã bắt đôi hai Xe rồi ăn tiếp',
    fen: '2r1r1k1/pp3ppp/8/8/2N5/8/PP3PPP/R2R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Nd6',
    goodMoves: ['Nd6'],
    continuation: ['Kf8', 'Nxc8', 'f6', 'Nxa7'],
    hint: 'Một ô Mã chĩa vào CẢ HAI Xe (c8 và e8). Ăn xong một chiếc, bé còn ăn tiếp được quân nữa.',
    explanation:
      'Mã tới d6 chĩa hai mũi vào Xe c8 và Xe e8; Đen chỉ cứu được một chiếc, bé ăn chiếc còn lại rồi ăn luôn Tốt a7 - ba nước, hai quân.',
    rhyme: 'Một nước, hai Xe',
  },
  // ── Đòn hiểm ăn Hậu (ăn Hậu rồi rút quân an toàn) ───────────────────────────
  {
    // Bài KHÓ NHẤT của bộ: 3 nước của bé, nước đầu là chiếu mở đường chứ không ăn
    // quân - bé phải tính cả chuỗi dồn Hậu rồi mới đổi Xe lấy Hậu.
    id: 'queen-3',
    theme: 'win-queen',
    title: 'Dồn Hậu vào góc rồi đổi Xe lấy Hậu',
    fen: '6k1/5ppp/8/8/8/q7/5PPP/3RQRK1 w - - 0 1',
    side: 'white',
    bestSan: 'Rd8+',
    goodMoves: ['Rd8+'],
    continuation: ['Qf8', 'Qe7', 'h6', 'Rxf8+'],
    hint: 'Nước đầu KHÔNG ăn quân: chiếu Vua trước để Hậu Đen buộc phải xuống f8 chắn. Rồi đưa Hậu mình sang e7 ép tiếp, cuối cùng Xe đớp Hậu f8.',
    explanation:
      'Xe d8 chiếu, Hậu Đen chỉ còn nước xuống f8 chắn; Hậu Trắng sang e7 tấn công Hậu, Đen hết cách cứu nên nước cuối Xe đớp Hậu f8 - đổi một Xe lấy Hậu.',
    rhyme: 'Dồn Hậu rồi đổi',
  },

  // ── Đòn bắt đôi ────────────────────────────────────────────────────────────
  // ── Đòn ghim ───────────────────────────────────────────────────────────────
  {
    id: 'pin-1',
    theme: 'pin',
    title: 'Ghim Mã rồi vồ lấy',
    fen: '4k3/pp3ppp/2n5/1B6/3P4/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'd5',
    goodMoves: ['d5'],
    continuation: ['a6', 'dxc6', 'bxc6', 'Bxa6'],
    hint: 'Mã c6 bị Tượng b5 ghim nên không dám chạy. Đẩy Tốt tới tấn công, ăn Mã, rồi ăn luôn Tốt a6.',
    explanation:
      'Mã c6 bị ghim vào Vua e8 nên đứng im; Tốt d5 tấn công nó, bé ăn Mã rồi ăn tiếp Tốt a6 - ba nước, lời cả quân.',
    rhyme: 'Ghim rồi thì vồ',
  },
]

export function bestMovesByTheme(theme: BestMoveTheme): BestMovePuzzle[] {
  return BEST_MOVES.filter((puzzle) => puzzle.theme === theme)
}
