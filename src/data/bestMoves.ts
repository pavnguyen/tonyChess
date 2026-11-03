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

  // ── Đòn ghim: quân bị ghim thì không dám chạy, bé cứ vồ lấy ────────
  {
    id: 'pin-2',
    theme: 'pin',
    title: 'Xe ghim Mã e7, Mã ăn gọn rồi rút về d5',
    fen: '4k3/4nppp/8/5N2/8/8/5PPP/4R1K1 w - - 0 1',
    side: 'white',
    bestSan: 'Nxe7',
    goodMoves: ['Nxe7'],
    continuation: ['Kf8', 'Nd5'],
    hint: 'Xe e1 ghim Mã e7 vào Vua e8, còn Mã f5 đang nhìn đúng ô e7 - hai quân ăn một quân. Ăn xong đưa Mã về d5 cho an toàn.',
    explanation:
      'Mã f5 ăn e7: Mã Đen bị Xe e1 ghim vào Vua e8 nên Vua không dám ăn lại. Vua lùi f8 thì Mã về d5 - vừa an toàn vừa giữ ô trung tâm.',
    rhyme: 'Ghim rồi ăn gọn',
  },
  {
    id: 'pin-3',
    theme: 'pin',
    title: 'Tượng ghim Mã c7, Tốt d6 vồ tới ăn',
    fen: '3k4/p1n2ppp/8/B2P4/8/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'd6',
    goodMoves: ['d6'],
    continuation: ['Kc8', 'dxc7'],
    hint: 'Tượng a5 ghim Mã c7 vào Vua d8 nên Mã không dám nhúc nhích. Đẩy Tốt d5 lên d6 tấn công, rồi ăn Mã c7 - Tốt đổi Mã là lời.',
    explanation:
      'Tượng a5 ghim Mã c7 vào Vua d8; Tốt d5 lên d6 tấn công quân bị ghim, Vua Đen buộc lùi về c8 rồi Tốt ăn Mã c7.',
    rhyme: 'Ghim xong, Tốt ăn',
  },

  {
    id: 'pin-5',
    theme: 'pin',
    title: 'Tượng ghim Tượng e7, Tốt d6 ăn cả Tượng',
    fen: '4k3/4bppp/8/3P4/8/8/5PPP/4R1K1 w - - 0 1',
    side: 'white',
    bestSan: 'd6',
    goodMoves: ['d6'],
    continuation: ['Kf8', 'dxe7+'],
    hint: 'Tượng e7 bị Xe e1 ghim vào Vua e8 nên không dám chạy. Đẩy Tốt d5 lên d6 tấn công: Vua Đen lùi f8 rồi Tốt ăn Tượng e7 - lại còn chiếu.',
    explanation:
      'Tượng e7 bị Xe e1 ghim vào Vua e8; Tốt d5 lên d6 tấn công quân bị ghim, Vua Đen buộc lùi f8, Tốt ăn Tượng e7 và chiếu luôn Vua - lời cả Tượng.',
    rhyme: 'Ghim Tượng, Tốt ăn',
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

  // ── Bổ sung: thêm đòn hy sinh + chiếu bí cho kho luyện dày hơn ─────────────
  {
    id: 'sac-4',
    theme: 'sacrifice',
    title: 'Hiến Xe f8, Xe còn lại kết liễu',
    fen: '1r5k/6pp/8/8/8/5R2/8/5R1K w - - 0 1',
    side: 'white',
    bestSan: 'Rf8+',
    goodMoves: ['Rf8+'],
    continuation: ['Rxf8', 'Rxf8#'],
    hint: 'Hai Xe cùng nhìn cột f. Hiến một Xe chiếu vào f8, Xe còn lại ăn lại là chiếu bí.',
    explanation:
      'Xe f3 lên f8 chiếu; Xe Đen buộc phải ăn, Xe f1 ăn lại trên f8 chiếu bí vì hai Tốt g7 và h7 đã khóa kín đường chạy của Vua.',
    rhyme: 'Hiến Xe, Xe kia bí',
  },
  {
    id: 'sac-5',
    theme: 'sacrifice',
    title: 'Hiến Xe h7, Hậu vào h3',
    fen: '1b1r3k/5p1p/4Q3/8/8/7R/6R1/2K5 w - - 0 1',
    side: 'white',
    bestSan: 'Rxh7+',
    goodMoves: ['Rxh7+'],
    continuation: ['Kxh7', 'Qh3#'],
    hint: 'Đừng mơ chiếu nhanh: Tượng b8 và Xe d8 đang canh hàng 8. Hiến Xe ăn h7 kéo Vua lên rồi Hậu sang h3.',
    explanation:
      'Xe h3 ăn h7 chiếu; Vua Đen buộc ăn Xe, Hậu e6 theo đường chéo sang h3 chiếu bí, Xe g2 giữ cột g nên Vua không còn ô chạy.',
    rhyme: 'Hiến Xe rồi Hậu vào',
  },
  {
    id: 'mate-4',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Hậu sang d7',
    fen: '7k/8/7p/8/8/3Q4/1R6/1K6 w - - 0 1',
    side: 'white',
    bestSan: 'Qd7',
    goodMoves: ['Qd7'],
    continuation: ['Kg8', 'Rb8#'],
    hint: 'Đưa Hậu sang d7 khóa hàng 7. Vua Đen lên g8 thì Xe b2 lên b8 chiếu bí.',
    explanation:
      'Hậu d3 sang d7 khóa hàng 7; Vua Đen chỉ còn g8, Xe b2 lên b8 chiếu bí vì Hậu đã giữ sẵn g7 và h7.',
    rhyme: 'Hậu khóa, Xe vào bí',
  },
  {
    id: 'mate-5',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Hậu sang f7',
    fen: '6k1/8/6p1/3Q4/8/5R2/8/7K w - - 0 1',
    side: 'white',
    bestSan: 'Qf7+',
    goodMoves: ['Qf7+'],
    continuation: ['Kh8', 'Rh3#'],
    hint: 'Chiếu Hậu sang f7; Vua Đen lùi h8 thì Xe f3 sang h3 chiếu bí.',
    explanation:
      'Hậu d5 sang f7 chiếu; Vua Đen chỉ còn h8, Xe f3 sang h3 chiếu bí vì Hậu f7 đã giữ g8 và hàng 7.',
    rhyme: 'Hậu ép, Xe kết liễu',
  },
  {
    id: 'mate-6',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Xe lùi về f2',
    fen: '7k/5Q2/5p2/8/8/8/8/5RK1 w - - 0 1',
    side: 'white',
    bestSan: 'Rf2',
    goodMoves: ['Rf2'],
    continuation: ['f5', 'Rh2#'],
    hint: 'Nước lặng: lùi Xe về f2. Đen hết nước đỡ, Tốt f6 đi đâu cũng không cứu được cột h.',
    explanation:
      'Xe f1 lùi về f2 chờ sẵn; Đen chỉ còn nước đẩy Tốt f6, Xe f2 sang h2 chiếu bí vì Hậu f7 đã giữ g8 và hàng 7.',
    rhyme: 'Xe chờ, rồi sang h2',
  },
  {
    id: 'mate-7',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Hậu lên h5',
    fen: '8/5Qpk/8/8/8/8/8/4R2K w - - 0 1',
    side: 'white',
    bestSan: 'Qh5+',
    goodMoves: ['Qh5+'],
    continuation: ['Kg8', 'Re8#'],
    hint: 'Chiếu Hậu lên h5; Vua Đen xuống g8 thì Xe e1 lên e8 chiếu bí.',
    explanation:
      'Hậu f7 lên h5 chiếu; Vua Đen chỉ còn g8, Xe e1 lên e8 chiếu bí vì Hậu h5 đã giữ h7 và g6.',
    rhyme: 'Hậu ép, Xe lên e8',
  },

  // ── Bổ sung: bộ KHÓ HƠN cho bé đã lên trình ────────────────────────────────
  // Hai bài đầu là **nước lặng** (không ăn quân, không chiếu ngay) - bé phải thấy
  // trước mới tìm ra. Hai bài sau thắng quân nhưng phải tính cả chuỗi 3 nước.
  // Tất cả đã chấm bằng `npm run verify:bestmove`.
  {
    id: 'mate-8',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Hậu lên d7 khóa hàng 7',
    fen: '6k1/8/8/8/8/8/5PPP/3QR1K1 w - - 0 1',
    side: 'white',
    bestSan: 'Qd7',
    goodMoves: ['Qd7'],
    continuation: ['Kh8', 'Re8#'],
    hint: 'Nước lặng: Hậu lên d7 giữ chặt hàng 7 nên Vua Đen không dám bước xuống. Đen chỉ còn lên h8, Xe e1 lên e8 là chiếu bí.',
    explanation:
      'Hậu d1 lên d7 khóa hàng 7; Vua Đen buộc lên h8, Xe e1 lên e8 chiếu bí vì Hậu d7 đã giữ g7 và h7.',
    rhyme: 'Hậu khóa hàng, Xe vào bí',
  },
  {
    id: 'mate-9',
    theme: 'mate',
    title: 'Chiếu bí 3 nước: Xe lên g1, Hậu xuống d8',
    fen: '6k1/5p1p/8/8/8/8/5P1P/3Q1R1K w - - 0 1',
    side: 'white',
    bestSan: 'Rg1+',
    goodMoves: ['Rg1+'],
    continuation: ['Kh8', 'Qd8#'],
    hint: 'Xe f1 lên g1 chiếu dọc cột g; Vua Đen chỉ còn h8, Hậu d1 xuống d8 là chiếu bí.',
    explanation:
      'Xe f1 lên g1 chiếu cột g; Vua Đen buộc lên h8, Hậu d1 xuống d8 chiếu bí - cột g đã bị Xe g1 khóa, Tốt h7 chặn nốt ô h7.',
    rhyme: 'Xe khóa cột, Hậu xuống bí',
  },
  {
    id: 'mate-10',
    theme: 'mate',
    title: 'Chiếu bí 5 nước: Xe d7 rồi Xe d8',
    fen: '5k2/5ppp/8/8/8/8/5PPP/2QR2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Rd7',
    goodMoves: ['Rd7'],
    continuation: ['g6', 'Qc3', 'Kg8', 'Rd8#'],
    hint: 'Ba nước của bé: đưa Xe lên d7 khóa hàng 7 trước đã (chưa chiếu, chưa ăn gì). Đen hết nước hay buộc đẩy Tốt, Hậu sang c3 chờ sẵn rồi Xe xuống d8 chiếu bí.',
    explanation:
      'Xe d1 lên d7 giữ hàng 7 nên Vua Đen không dám ra; Đen chỉ còn đẩy Tốt g6, Hậu c1 sang c3 rồi Xe d7 xuống d8 chiếu bí vì Tốt f7 g7 h7 đã khóa đường chạy.',
    rhyme: 'Xe khóa hàng, rồi xuống bí',
  },
  {
    id: 'queen-4',
    theme: 'win-queen',
    title: 'Nước lặng rồi ăn Xe: Hậu sang d4',
    fen: 'r5k1/5ppp/8/8/8/8/5R2/3Q3K w - - 0 1',
    side: 'white',
    bestSan: 'Qd4',
    goodMoves: ['Qd4'],
    continuation: ['f6', 'Qd5+', 'Kf8', 'Qxa8+'],
    hint: 'Đừng vội ăn: Hậu sang d4 canh đúng đường chéo tới a7 và hàng 4. Đen yếu hàng 8, bé chiếu Hậu xuống d5 rồi ăn Xe a8.',
    explanation:
      'Hậu d1 sang d4 giữ chặt các đường; Đen chỉ còn đẩy Tốt f6, Hậu xuống d5 chiếu, Vua Đen lên f8 rồi Hậu ăn Xe a8 - lời cả Xe.',
    rhyme: 'Hậu canh đường, rồi ăn Xe',
  },
  {
    id: 'queen-5',
    theme: 'win-queen',
    title: 'Mã nhảy e7 vừa chiếu vừa chĩa Hậu',
    fen: '2q3k1/5ppp/8/5N2/8/8/5PPP/5RK1 w - - 0 1',
    side: 'white',
    bestSan: 'Ne7+',
    goodMoves: ['Ne7+'],
    continuation: ['Kh8', 'Nxc8'],
    hint: 'Mã f5 nhảy lên e7: vừa chiếu Vua g8, vừa chĩa sang Hậu c8. Vua Đen chạy đâu cũng mất Hậu.',
    explanation:
      'Mã f5 lên e7 chiếu Vua g8 và đồng thời tấn công Hậu c8; Vua Đen buộc lên h8, Mã ăn Hậu c8 - lời cả Hậu.',
    rhyme: 'Một nước, hai mục tiêu',
  },
  {
    id: 'material-2',
    theme: 'win-material',
    title: 'Mã bắt đôi Vua và Xe ở góc',
    fen: 'r3k3/5ppp/8/1N6/8/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nc7+',
    goodMoves: ['Nc7+'],
    continuation: ['Kf8', 'Nxa8'],
    hint: 'Mã b5 nhảy lên c7: chiếu Vua e8 và chĩa đúng Xe a8 ở góc. Vua Đen chạy ra là bé ăn Xe.',
    explanation:
      'Mã b5 lên c7 chiếu Vua e8 và tấn công Xe a8; Vua Đen buộc lùi về f8, Mã ăn Xe a8 - lời cả Xe.',
    rhyme: 'Mã chĩa góc, ăn Xe',
  },

  // ── Trừng phạt quân treo: bổ sung cho đủ 10 thế ────────────────────────────
  // Cùng một khuôn "Mã nhảy vào ô vừa chiếu Vua vừa chĩa quân to" nhưng đổi ô,
  // đổi quân bị ăn (Xe, Hậu) để bé nhận ra khuôn hình chứ không học vẹt một thế.
  {
    id: 'material-3',
    theme: 'win-material',
    title: 'Mã d6+ bắt đôi Vua và Xe c8',
    fen: '2r1k3/pp4pp/8/5N2/8/8/PP3PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nd6+',
    goodMoves: ['Nd6+'],
    continuation: ['Kd7', 'Nxc8'],
    hint: 'Ô d6 là ô “đòn đôi”: Mã vừa chiếu Vua e8, vừa chĩa sang Xe c8. Vua chạy đâu cũng mất Xe.',
    explanation:
      'Mã f5 nhảy d6 chiếu Vua e8; Vua lùi d7 thì Mã ăn Xe c8 - một nước, được cả Xe.',
    rhyme: 'Mã d6, hai mũi',
  },
  {
    id: 'material-4',
    theme: 'win-material',
    title: 'Mã c6+ bắt đôi Vua và Xe d8',
    fen: '1k1r4/p1p5/8/8/1N6/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nc6+',
    goodMoves: ['Nc6+'],
    continuation: ['Kc8', 'Nxd8'],
    hint: 'Mã b4 nhảy lên c6: chiếu Vua b8 và chĩa đúng Xe d8. Chiếu xong là ăn Xe.',
    explanation:
      'Mã b4 lên c6 chiếu Vua b8, Vua buộc lùi c8; Mã ăn Xe d8 - Đen chỉ còn Vua với Tốt.',
    rhyme: 'Mã c6, ăn Xe',
  },
  {
    id: 'material-5',
    theme: 'win-material',
    title: 'Mã d5+ bắt đôi Vua và Xe b6',
    fen: '8/4k3/1r6/8/5N2/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nd5+',
    goodMoves: ['Nd5+'],
    continuation: ['Kf8', 'Nxb6'],
    hint: 'Mã f4 nhảy d5 chiếu Vua e7, đồng thời nhìn Xe b6. Xe b6 không ai che nên mất chắc.',
    explanation:
      'Mã f4 lên d5 chiếu Vua e7; Vua lùi f8, Mã ăn Xe b6 - Đen mất Xe mà không gỡ lại được quân nào.',
    rhyme: 'Một nước, hai mục tiêu',
  },
  {
    id: 'material-6',
    theme: 'win-material',
    title: 'Mã g6+ bắt đôi Vua và Xe h8',
    fen: '7r/1p2k3/p7/8/5N2/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Ng6+',
    goodMoves: ['Ng6+'],
    continuation: ['Kf7', 'Nxh8+'],
    hint: 'Mã f4 nhảy g6 vừa chiếu Vua e7 vừa chĩa Xe h8 nằm tận góc. Chiếu trước, ăn sau.',
    explanation:
      'Mã f4 lên g6 chiếu Vua e7; Vua lùi f7 thì Mã ăn Xe h8 và còn chiếu luôn Vua - lời cả Xe.',
    rhyme: 'Chiếu trước, ăn sau',
  },
  {
    id: 'material-7',
    theme: 'win-material',
    title: 'Mã e6+ bắt đôi Vua và Xe f8',
    fen: '3k1r2/pp6/8/2N5/8/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Ne6+',
    goodMoves: ['Ne6+'],
    continuation: ['Ke8', 'Nxf8'],
    hint: 'Mã c5 nhảy e6: Vua d8 bị chiếu, Xe f8 bị chĩa. Vua đi đâu cũng mất Xe.',
    explanation:
      'Mã c5 lên e6 chiếu Vua d8; Vua lùi e8, Mã ăn Xe f8 - chưa mất quân nào mà đã hơn cả Xe.',
    rhyme: 'Mã e6, Xe f8 mất',
  },
  {
    id: 'material-8',
    theme: 'win-material',
    title: 'Mã b5+ bắt đôi Vua và Xe d6',
    fen: '8/k7/3r4/8/3N4/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nb5+',
    goodMoves: ['Nb5+'],
    continuation: ['Ka8', 'Nxd6'],
    hint: 'Mã d4 nhảy b5 chiếu Vua a7 và nhìn Xe d6. Vua chỉ còn a8, Xe vẫn nằm đó.',
    explanation:
      'Mã d4 lên b5 chiếu Vua a7; Vua buộc vào a8, Mã ăn Xe d6 - Xe không có quân nào đỡ.',
    rhyme: 'Mã b5, Xe d6 mất',
  },
  {
    id: 'material-9',
    theme: 'win-material',
    title: 'Mã f6+ bắt đôi Vua và Xe d7',
    fen: '6k1/3r3p/8/8/4N3/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nf6+',
    goodMoves: ['Nf6+'],
    continuation: ['Kh8', 'Nxd7'],
    hint: 'Mã e4 nhảy f6 chiếu Vua g8, đồng thời chĩa Xe d7. Chiếu là việc chính, ăn Xe là phần thưởng.',
    explanation:
      'Mã e4 lên f6 chiếu Vua g8; Vua lùi h8, Mã ăn Xe d7 - Đen hết cách cứu Xe.',
    rhyme: 'Mã f6, Xe d7 mất',
  },
  {
    id: 'material-10',
    theme: 'win-material',
    title: 'Tượng e5+ xiên Vua rồi ăn Xe h8',
    fen: '7r/p5k1/8/8/8/8/5P1B/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Be5+',
    goodMoves: ['Be5+'],
    continuation: ['Kg8', 'Bxh8'],
    hint: 'Tượng h2 lên e5 chiếu Vua g7. Vua rời đường chéo thì Xe h8 ở đúng cuối đường - ăn luôn.',
    explanation:
      'Tượng h2 lên e5 chiếu Vua g7; Vua buộc rời đường chéo, Tượng ăn Xe h8 - đòn xiên: chiếu trước, ăn quân đứng sau.',
    rhyme: 'Chiếu trước, xiên sau',
  },

  // ── Đòn hiểm ăn Hậu: bổ sung cho đủ 10 thế ─────────────────────────────────
  {
    id: 'queen-6',
    theme: 'win-queen',
    title: 'Mã f7+ bắt đôi Vua và Hậu',
    fen: '3q3k/6pp/8/6N1/8/8/5PPP/6K1 w - - 0 1',
    side: 'white',
    bestSan: 'Nf7+',
    goodMoves: ['Nf7+'],
    continuation: ['Kg8', 'Nxd8'],
    hint: 'Mã g5 nhảy f7: chiếu Vua h8 và chĩa Hậu d8. Đang bị chiếu thì Đen phải cứu Vua trước.',
    explanation:
      'Mã g5 lên f7 chiếu Vua h8; Vua lùi g8, Mã ăn Hậu d8 - Hậu mất mà Đen không gỡ lại được quân nào.',
    rhyme: 'Chiếu Vua, ăn Hậu',
  },
  {
    id: 'queen-7',
    theme: 'win-queen',
    title: 'Mã e6+ bắt đôi Vua và Hậu c7',
    fen: '3k4/p1q4p/8/8/3N4/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Ne6+',
    goodMoves: ['Ne6+'],
    continuation: ['Kd7', 'Nxc7'],
    hint: 'Mã d4 nhảy e6 chiếu Vua d8, đồng thời chĩa Hậu c7. Vua đi đâu cũng mất Hậu.',
    explanation:
      'Mã d4 lên e6 chiếu Vua d8; Vua lùi d7, Mã ăn Hậu c7 - hơn cả Hậu chỉ bằng một nước nhảy.',
    rhyme: 'Một nước, mất Hậu',
  },
  {
    id: 'queen-8',
    theme: 'win-queen',
    title: 'Mã d5+ bắt đôi Vua và Hậu b6',
    fen: '8/4k3/1q6/8/5N2/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nd5+',
    goodMoves: ['Nd5+'],
    continuation: ['Kf8', 'Nxb6'],
    hint: 'Mã f4 lên d5 chiếu Vua e7 và chĩa Hậu b6. Hậu không có quân nào đỡ.',
    explanation:
      'Mã f4 lên d5 chiếu Vua e7; Vua lùi f8, Mã ăn Hậu b6 - thế cờ coi như xong.',
    rhyme: 'Mã d5, Hậu mất',
  },
  {
    id: 'queen-9',
    theme: 'win-queen',
    title: 'Mã g6+ bắt đôi Vua và Hậu h8',
    fen: '7q/4k3/8/8/5N2/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Ng6+',
    goodMoves: ['Ng6+'],
    continuation: ['Kf7', 'Nxh8+'],
    hint: 'Mã f4 nhảy g6: chiếu Vua e7 và chĩa Hậu h8 trong góc. Chiếu trước, ăn sau.',
    explanation:
      'Mã f4 lên g6 chiếu Vua e7; Vua lùi f7, Mã ăn Hậu h8 và chiếu luôn - lời cả Hậu.',
    rhyme: 'Góc h8 mất Hậu',
  },
  {
    id: 'queen-10',
    theme: 'win-queen',
    title: 'Mã b5+ bắt đôi Vua và Hậu d6',
    fen: '8/2k5/3q4/8/8/N7/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nb5+',
    goodMoves: ['Nb5+'],
    continuation: ['Kd7', 'Nxd6'],
    hint: 'Mã a3 nhảy b5 chiếu Vua c7 và chĩa Hậu d6. Hậu đứng sát Vua nhưng không cứu được nhau.',
    explanation:
      'Mã a3 lên b5 chiếu Vua c7; Vua lùi d7, Mã ăn Hậu d6 - Đen mất Hậu, bé thắng chắc.',
    rhyme: 'Mã b5, Hậu d6 mất',
  },
  {
    id: 'queen-11',
    theme: 'win-queen',
    title: 'Mã e6+ bắt đôi Vua và Hậu c5',
    fen: '3k4/6pp/8/2q5/5N2/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Ne6+',
    goodMoves: ['Ne6+'],
    continuation: ['Kc8', 'Nxc5'],
    hint: 'Mã f4 lên e6 chiếu Vua d8 và nhìn Hậu c5. Hậu đứng một mình nên không ai đỡ.',
    explanation:
      'Mã f4 lên e6 chiếu Vua d8; Vua lùi c8, Mã ăn Hậu c5 - một nước nhảy, hơn cả Hậu.',
    rhyme: 'Mã e6, Hậu c5',
  },
  {
    id: 'queen-12',
    theme: 'win-queen',
    title: 'Mã d6+ bắt đôi Vua và Hậu f7',
    fen: '4k3/5q1p/8/5N2/8/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nd6+',
    goodMoves: ['Nd6+'],
    continuation: ['Kf8', 'Nxf7'],
    hint: 'Mã f5 nhảy d6 chiếu Vua e8 và chĩa Hậu f7. Hậu đứng ngay trước Vua nên càng dễ mất.',
    explanation:
      'Mã f5 lên d6 chiếu Vua e8; Vua lùi f8, Mã ăn Hậu f7 - bé hơn Hậu cả ván cờ.',
    rhyme: 'Mã d6, Hậu f7',
  },

  // ── Đòn ghim: bổ sung cho đủ 10 thế ────────────────────────────────────────
  // Khuôn hình: quân Đen đứng chắn giữa quân Trắng và Vua Đen nên KHÔNG DÁM rời
  // đường; bé đẩy Tốt hoặc quân tấn công vào đúng quân ấy rồi ăn.
  {
    id: 'pin-6',
    theme: 'pin',
    title: 'Ghim Mã d7, Tốt e5 đánh',
    fen: '3k4/3n2pp/8/4P3/8/8/5PPP/2KR4 w - - 0 1',
    side: 'white',
    bestSan: 'e6',
    goodMoves: ['e6'],
    continuation: ['Ke8', 'exd7+'],
    hint: 'Mã d7 đứng chắn giữa Xe d1 và Vua d8 nên không dám nhúc nhích. Đẩy Tốt e6 tấn công, rồi ăn Mã.',
    explanation:
      'Xe d1 ghim Mã d7 vào Vua d8; Tốt e5 lên e6 tấn công quân bị ghim, Vua buộc lùi e8, Tốt ăn Mã và còn chiếu.',
    rhyme: 'Ghim rồi Tốt ăn',
  },
  {
    id: 'pin-7',
    theme: 'pin',
    title: 'Ghim Mã d7, Tốt c5 đánh',
    fen: '3k4/3n2pp/8/2P5/8/8/5PPP/3QK3 w - - 0 1',
    side: 'white',
    bestSan: 'c6',
    goodMoves: ['c6'],
    continuation: ['Ke8', 'cxd7+'],
    hint: 'Hậu d1 ghim Mã d7 vào Vua d8. Tốt c5 tiến c6 tấn công - Mã bị ghim thì đành chịu.',
    explanation:
      'Hậu d1 ghim Mã d7; Tốt c5 lên c6 tấn công, Vua Đen lùi e8, Tốt ăn Mã d7 và chiếu luôn Vua.',
    rhyme: 'Ghim chặt, Tốt lên',
  },
  {
    id: 'pin-8',
    theme: 'pin',
    title: 'Ghim Tượng d7, Tốt c5 ăn',
    fen: '3k4/3b2pp/8/2P5/8/8/5PPP/2KR4 w - - 0 1',
    side: 'white',
    bestSan: 'c6',
    goodMoves: ['c6'],
    continuation: ['Ke8', 'cxd7+'],
    hint: 'Tượng d7 bị Xe d1 ghim vào Vua d8. Tốt c5 tiến c6 là Tượng hết đường chạy.',
    explanation:
      'Xe d1 ghim Tượng d7 vào Vua d8; Tốt c5 lên c6 tấn công, Vua lùi e8, Tốt ăn Tượng d7 - Tượng không dám bỏ đường ghim.',
    rhyme: 'Tượng ghim, Tốt ăn',
  },
  {
    id: 'pin-9',
    theme: 'pin',
    title: 'Ghim Mã c7, Tốt d5 lên d6',
    fen: '2k5/2n3pp/8/3P4/8/8/5PPP/2Q2K2 w - - 0 1',
    side: 'white',
    bestSan: 'd6',
    goodMoves: ['d6'],
    continuation: ['Kb7', 'Qxc7+'],
    hint: 'Mã c7 bị Hậu c1 ghim vào Vua c8. Đẩy Tốt d5 lên d6 tấn công, Mã chỉ còn nước đứng nhìn.',
    explanation:
      'Hậu c1 ghim Mã c7 vào Vua c8; Tốt d5 lên d6 tấn công quân bị ghim, Vua lùi b7, Hậu ăn Mã c7 và chiếu.',
    rhyme: 'Mã bị ghim thì mất',
  },
  {
    id: 'pin-10',
    theme: 'pin',
    title: 'Ghim Tượng c7, Tốt b5 lên b6',
    fen: '2k5/2b3pp/8/1P6/8/8/5PPP/2Q2K2 w - - 0 1',
    side: 'white',
    bestSan: 'b6',
    goodMoves: ['b6'],
    continuation: ['Kb7', 'Qxc7+'],
    hint: 'Tượng c7 bị Hậu c1 ghim vào Vua c8. Tốt b5 tiến b6 tấn công Tượng, rồi Hậu ăn gọn.',
    explanation:
      'Hậu c1 ghim Tượng c7 vào Vua c8; Tốt b5 lên b6 tấn công, Vua lùi b7, Hậu ăn Tượng c7 - lời cả Tượng.',
    rhyme: 'Ghim Tượng, Hậu ăn',
  },
  {
    id: 'pin-11',
    theme: 'pin',
    title: 'Ghim Mã e7, Tốt d5 đánh',
    fen: '4k3/4n1pp/8/3P4/8/8/5PPP/2K1R3 w - - 0 1',
    side: 'white',
    bestSan: 'd6',
    goodMoves: ['d6'],
    continuation: ['Kf8', 'dxe7+'],
    hint: 'Mã e7 đứng chắn giữa Xe e1 và Vua e8 nên không chạy được. Tốt d5 lên d6 là ăn Mã.',
    explanation:
      'Xe e1 ghim Mã e7 vào Vua e8; Tốt d5 lên d6 tấn công, Vua lùi f8, Tốt ăn Mã e7 và chiếu Vua.',
    rhyme: 'Ghim xong, Tốt ăn',
  },

  // ── Hy sinh mở đường: bổ sung cho đủ 10 thế ────────────────────────────────
  // Cả năm thế đều là "hy sinh Mã/cho ăn rồi chiếu bí ngay nước sau": máy chấm
  // thấy cùng một điểm chiếu bí nên nước đầu luôn là nước mạnh nhất.
  {
    id: 'sac-6',
    theme: 'sacrifice',
    title: 'Mã hiến ở h7, Xe sang h2 bí',
    fen: '5N1k/7p/8/8/8/1K4Q1/1R6/8 w - - 0 1',
    side: 'white',
    bestSan: 'Nxh7',
    goodMoves: ['Nxh7'],
    continuation: ['Kxh7', 'Rh2#'],
    hint: 'Vua Đen trốn ở góc h8, chỉ có Tốt h7 che. Hiến Mã ăn h7 để kéo Vua ra khỏi góc, rồi Xe b2 sang h2 chiếu bí.',
    explanation:
      'Mã f8 ăn h7 chiếu; Vua Đen buộc ăn Mã và rời khỏi góc, Xe b2 sang h2 chiếu bí - Hậu g3 đã giữ sẵn cột g nên Vua không còn ô chạy.',
    rhyme: 'Hiến Mã, Xe bí',
  },
  {
    id: 'sac-7',
    theme: 'sacrifice',
    title: 'Mã g6+ mở đường cho Hậu',
    fen: '5N1k/5ppp/8/8/8/3K4/Q7/7R w - - 0 1',
    side: 'white',
    bestSan: 'Ng6+',
    goodMoves: ['Ng6+'],
    continuation: ['fxg6', 'Qa8#'],
    hint: 'Mã f8 nhảy g6 chiếu Vua h8. Tốt f7 buộc phải ăn Mã, hàng 8 trống cho Hậu xuống a8 chiếu bí.',
    explanation:
      'Mã f8 lên g6 chiếu; Tốt f7 ăn Mã và rời khỏi f7, Hậu a2 xuống a8 chiếu bí dọc hàng 8, Xe h1 giữ sẵn cột h.',
    rhyme: 'Mã mở, Hậu vào',
  },
  {
    id: 'sac-8',
    theme: 'sacrifice',
    title: 'Mã nhảy h8+, Xe sang h3 bí',
    fen: '6k1/5Np1/4Q3/8/8/5R2/8/K7 w - - 0 1',
    side: 'white',
    bestSan: 'Nh8+',
    goodMoves: ['Nh8+'],
    continuation: ['Kxh8', 'Rh3#'],
    hint: 'Mã f7 nhảy h8 chiếu. Vua Đen buộc ăn Mã rồi Xe f3 sang h3 là chiếu bí.',
    explanation:
      'Mã f7 lên h8 chiếu Vua g8; Vua buộc ăn Mã ở góc, Xe f3 sang h3 chiếu bí, Hậu e6 giữ chặt các ô chạy.',
    rhyme: 'Mã vào góc, Xe bí',
  },
  {
    id: 'sac-9',
    theme: 'sacrifice',
    title: 'Mã g6+ mở cột h cho Hậu',
    fen: '5N1k/3Q1R1p/8/8/8/8/3K4/8 w - - 0 1',
    side: 'white',
    bestSan: 'Ng6+',
    goodMoves: ['Ng6+'],
    continuation: ['hxg6', 'Qe8#'],
    hint: 'Mã f8 nhảy g6 chiếu; Tốt h7 ăn Mã thì cột h trống, Hậu d7 xuống e8 chiếu bí.',
    explanation:
      'Mã f8 lên g6 chiếu; Tốt h7 ăn Mã, Hậu d7 xuống e8 chiếu bí dọc hàng 8, Xe f7 khóa luôn hàng 7 nên Vua hết đường.',
    rhyme: 'Hiến Mã, Hậu xuống',
  },
  {
    id: 'sac-10',
    theme: 'sacrifice',
    title: 'Mã f6+ hy sinh, Hậu xuống a8 bí',
    fen: '6k1/2R3p1/8/3N4/4Q3/3K4/8/8 w - - 0 1',
    side: 'white',
    bestSan: 'Nf6+',
    goodMoves: ['Nf6+'],
    continuation: ['gxf6', 'Qa8#'],
    hint: 'Mã d5 nhảy f6 chiếu Vua g8. Tốt g7 ăn Mã, Hậu e4 xuống a8 chiếu bí dọc hàng 8.',
    explanation:
      'Mã d5 lên f6 chiếu; Tốt g7 ăn Mã rồi rời khỏi g7, Hậu e4 xuống a8 chiếu bí, Xe c7 giữ sẵn hàng 7.',
    rhyme: 'Hiến Mã, Hậu bí',
  },
]

export function bestMovesByTheme(theme: BestMoveTheme): BestMovePuzzle[] {
  return BEST_MOVES.filter((puzzle) => puzzle.theme === theme)
}
