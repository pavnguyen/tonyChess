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
  mate: {
    label: 'Chiếu bí 3 nước',
    emoji: '🏁',
    blurb: 'Tính trước ba nước: bé đi, đối thủ đỡ một nước, bé kết liễu bằng chiếu bí.',
    when: 'Khi Vua địch đã bị dồn vào góc và quân của bé đã áp sát.',
  },
  sacrifice: {
    label: 'Hy sinh mở đường',
    emoji: '💥',
    blurb: 'Cho đối thủ ăn một quân để mở đúng đường cho đòn chiếu bí phía sau.',
    when: 'Khi quân địch đang đứng chắn ngay đường mà quân bé cần chiếu bí.',
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

  // ── Hy sinh mở đường (cho Đen ăn quân để mở đúng đường chiếu bí) ─────────────
  {
    id: 'sac-1',
    theme: 'sacrifice',
    title: 'Hiến Xe f8, Hậu vào d8',
    fen: '6k1/6p1/8/4N3/8/5R2/8/3Q2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Rf8+',
    goodMoves: ['Rf8+'],
    continuation: ['Kh7', 'Qh5#'],
    hint: 'Chiếu Xe lên f8. Vua Đen ăn Xe thì cột d trống cho Hậu; né lên h7 thì Hậu sang h5 chiếu bí.',
    explanation:
      'Xe f3 lên f8 chiếu. Vua ăn Xe thì Hậu d1 xuống d8 chiếu bí; Vua né lên h7 thì Hậu sang h5 chiếu bí, Mã e5 đã giữ sẵn ô g6 và f7.',
    rhyme: 'Hiến Xe, Hậu vào d8',
  },
  {
    id: 'sac-2',
    theme: 'sacrifice',
    title: 'Hiến Xe h6 mở đường cho Hậu',
    fen: '2b4k/6p1/7p/3B4/6Q1/7R/8/6K1 w - - 0 1',
    side: 'white',
    bestSan: 'Rxh6+',
    goodMoves: ['Rxh6+'],
    continuation: ['gxh6', 'Qg8#'],
    hint: 'Tốt g7 đang che Vua. Hiến Xe ăn h6 để Tốt g7 phải rời chỗ, rồi Hậu xuống g8 chiếu bí.',
    explanation:
      'Xe h3 ăn Tốt h6 chiếu; Tốt g7 buộc phải ăn Xe và rời khỏi ô g7, Hậu g4 xuống g8 chiếu bí, Tượng d5 giữ sẵn các ô chạy của Vua.',
    rhyme: 'Hiến Xe cho Hậu vào',
  },
  {
    id: 'sac-3',
    theme: 'sacrifice',
    title: 'Mã ăn g6, hai Xe kết liễu',
    fen: '7k/R3N2p/6p1/8/8/5R2/8/7K w - - 0 1',
    side: 'white',
    bestSan: 'Nxg6+',
    goodMoves: ['Nxg6+'],
    continuation: ['hxg6', 'Rf8#'],
    hint: 'Mã ăn Tốt g6 chiếu. Tốt h7 ăn lại thì Xe f8 chiếu bí; Vua né lên g8 cũng không thoát.',
    explanation:
      'Mã e7 ăn g6 chiếu; Tốt h7 ăn Mã thì Xe f3 lên f8 chiếu bí vì Xe a7 đã giữ sẵn hàng 7. Vua chạy lên g8 cũng bị Xe f8 chiếu bí.',
    rhyme: 'Mã mở đường cho Xe',
  },

  // ── Chiếu bí trong 3 nước (bé đi, Đen đỡ một nước, bé bí) ─────────────────
  {
    id: 'mate-1',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Hậu sang f7',
    fen: '8/4N2k/4Q1p1/8/8/8/8/2K5 w - - 0 1',
    side: 'white',
    bestSan: 'Qf7+',
    goodMoves: ['Qf7+'],
    continuation: ['Kh8', 'Nxg6#'],
    hint: 'Chiếu Hậu sang f7. Vua lùi h8 thì Mã e7 ăn g6 chiếu bí; Vua lên h6 thì Hậu ăn g6 là bí.',
    explanation:
      'Hậu e6 sang f7 chiếu. Vua Đen lùi về h8 thì Mã e7 ăn Tốt g6 chiếu bí, còn Vua lên h6 thì Hậu ăn g6 chiếu bí.',
    rhyme: 'Hậu ép, Mã kết liễu',
  },
  {
    id: 'mate-2',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Hậu xuống g8',
    fen: '8/6k1/4Q1p1/3B4/8/5N2/8/2K5 w - - 0 1',
    side: 'white',
    bestSan: 'Qg8+',
    goodMoves: ['Qg8+'],
    continuation: ['Kh6', 'Qh8#'],
    hint: 'Đưa Hậu xuống g8 chiếu, Vua Đen buộc lên h6 rồi Hậu sang h8 là hết đường.',
    explanation:
      'Hậu e6 xuống g8 chiếu; Vua Đen chỉ còn h6, Hậu sang h8 chiếu bí vì Tượng d5 và Mã f3 đã giữ hết các ô chạy quanh Vua.',
    rhyme: 'Hậu xuống g8, Vua hết đường',
  },
  {
    id: 'mate-3',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: hai Xe dồn Vua',
    fen: '4b3/7k/5p2/8/8/8/8/2K1R2R w - - 0 1',
    side: 'white',
    bestSan: 'Reg1+',
    goodMoves: ['Reg1+'],
    continuation: ['Bh5', 'Rxh5#'],
    hint: 'Chiếu bằng Xe e1 lên g1; Tượng Đen buộc chắn vào h5, rồi Xe h1 ăn Tượng là chiếu bí.',
    explanation:
      'Xe e1 sang g1 chiếu, Tượng e8 chỉ còn nước chắn vào h5; Xe h1 ăn Tượng h5 chiếu bí, còn Xe g1 giữ cột g.',
    rhyme: 'Hai Xe dồn Vua vào góc',
  },
]

export function bestMovesByTheme(theme: BestMoveTheme): BestMovePuzzle[] {
  return BEST_MOVES.filter((puzzle) => puzzle.theme === theme)
}
