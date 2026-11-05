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
  { label: string; emoji: string; when: string }
> = {
  'win-material': {
    label: 'Trừng phạt quân treo',
    emoji: '🎯',
    when: 'Khi hai quân địch đứng cùng tầm một quân của bé, hoặc một quân đứng một mình.',
  },
  'win-queen': {
    label: 'Đòn hiểm ăn Hậu',
    emoji: '👸',
    when: 'Khi Hậu địch đứng lộ liễu, cùng đường với Vua hoặc quân của bé.',
  },
  pin: {
    label: 'Đòn ghim',
    emoji: '📌',
    when: 'Khi một quân địch đứng chắn giữa quân bé và Vua địch trên cùng một đường.',
  },
  mate: {
    label: 'Chiếu bí 3 nước',
    emoji: '🏁',
    when: 'Khi Vua địch đã bị dồn vào góc và quân của bé đã áp sát.',
  },
  sacrifice: {
    label: 'Hy sinh mở đường',
    emoji: '💥',
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
    hint: 'Mã có ô nào chĩa vào cả Xe c8 lẫn Xe e8? Ăn một chiếc rồi ăn tiếp.',
    explanation:
      'Mã d6 chĩa hai Xe c8 và e8; Đen cứu được một chiếc, bé ăn chiếc kia rồi ăn tiếp Tốt a7.',
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
    hint: 'Nước đầu chưa ăn quân: chiếu Vua để Hậu Đen xuống f8, rồi ép tiếp bằng Hậu e7.',
    explanation:
      'Xe d8 chiếu, Hậu Đen buộc xuống f8 chắn; Hậu e7 ép tiếp, nước cuối Xe đớp Hậu f8 - đổi Xe lấy Hậu.',
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
    hint: 'Mã c6 bị Tượng b5 ghim nên đứng im. Đẩy Tốt tấn công nó.',
    explanation:
      'Mã c6 bị ghim vào Vua e8 nên đứng im; Tốt d5 tấn công, bé ăn Mã rồi ăn Tốt a6.',
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
    hint: 'Mã f5 và Xe e1 cùng nhìn ô e7. Ăn xong nhớ rút Mã về d5.',
    explanation:
      'Mã f5 ăn e7; Mã Đen bị ghim nên Vua không dám ăn lại. Vua lùi f8, Mã về d5 an toàn.',
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
    hint: 'Mã c7 bị Tượng a5 ghim. Đẩy Tốt d5 lên d6 vồ lấy nó.',
    explanation:
      'Tượng a5 ghim Mã c7 vào Vua d8; Tốt d5 lên d6 tấn công, Vua lùi c8, Tốt ăn Mã.',
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
    hint: 'Tượng e7 bị Xe e1 ghim. Đẩy Tốt d5 lên d6 là ăn được, lại còn chiếu.',
    explanation:
      'Tượng e7 bị ghim vào Vua e8; Tốt d6 tấn công, Vua lùi f8, Tốt ăn Tượng và chiếu luôn.',
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
    hint: 'Chiếu Xe lên f8: Vua ăn thì Hậu vào d8, Vua né h7 thì Hậu sang h5.',
    explanation:
      'Xe f3 lên f8 chiếu: Vua ăn Xe thì Hậu d8 chiếu bí; Vua né h7 thì Hậu h5 chiếu bí.',
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
    hint: 'Tốt g7 đang che Vua. Hiến Xe ăn h6 để kéo Tốt g7 rời chỗ.',
    explanation:
      'Xe ăn h6 chiếu; Tốt g7 buộc ăn Xe và rời g7, Hậu xuống g8 chiếu bí.',
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
    hint: 'Mã ăn g6 chiếu. Tốt h7 ăn lại thì Xe f8 chiếu bí.',
    explanation:
      'Mã ăn g6 chiếu; Tốt h7 ăn Mã thì Xe f8 bí. Vua lên g8 cũng bị Xe f8 bí.',
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
    hint: 'Chiếu Hậu sang f7. Vua lùi h8 thì Mã ăn g6 bí; Vua lên h6 thì Hậu ăn g6.',
    explanation:
      'Hậu f7 chiếu: Vua lùi h8 thì Mã ăn g6 bí; Vua lên h6 thì Hậu ăn g6 bí.',
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
    hint: 'Đưa Hậu xuống g8 chiếu; Vua chỉ còn h6 rồi Hậu sang h8.',
    explanation:
      'Hậu g8 chiếu; Vua chỉ còn h6, Hậu sang h8 chiếu bí - Tượng và Mã đã giữ hết ô chạy.',
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
    hint: 'Chiếu bằng Xe e1 lên g1, Tượng buộc chắn h5 rồi Xe h1 ăn.',
    explanation:
      'Xe g1 chiếu, Tượng chỉ còn nước chắn vào h5; Xe h1 ăn Tượng là chiếu bí.',
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
    hint: 'Hai Xe cùng nhìn cột f: hiến một chiếc ở f8, chiếc kia ăn lại.',
    explanation:
      'Xe f8 chiếu; Xe Đen buộc ăn, Xe f1 ăn lại trên f8 chiếu bí - Tốt g7 h7 đã khóa đường chạy.',
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
    hint: 'Tượng b8 và Xe d8 đang canh hàng 8. Hiến Xe ăn h7 để kéo Vua lên.',
    explanation:
      'Xe ăn h7 chiếu; Vua buộc ăn Xe, Hậu sang h3 chiếu bí (Xe g2 giữ cột g).',
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
    hint: 'Đưa Hậu sang d7 khóa hàng 7, rồi Xe b2 lên b8.',
    explanation:
      'Hậu d7 khóa hàng 7; Vua chỉ còn g8, Xe b8 chiếu bí.',
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
    hint: 'Chiếu Hậu sang f7; Vua lùi h8 thì Xe sang h3.',
    explanation:
      'Hậu f7 chiếu; Vua chỉ còn h8, Xe sang h3 chiếu bí.',
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
    hint: 'Nước lặng: lùi Xe về f2 chờ sẵn. Đen chỉ còn đẩy Tốt f6.',
    explanation:
      'Xe lùi f2 chờ sẵn; Đen chỉ còn đẩy Tốt f6, Xe sang h2 chiếu bí.',
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
    hint: 'Chiếu Hậu lên h5; Vua xuống g8 thì Xe e1 lên e8.',
    explanation:
      'Hậu h5 chiếu; Vua chỉ còn g8, Xe e8 chiếu bí.',
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
    hint: 'Nước lặng: Hậu lên d7 khóa hàng 7, rồi Xe e1 lên e8 khi Vua lên h8.',
    explanation:
      'Hậu d7 khóa hàng 7; Vua buộc lên h8, Xe e8 chiếu bí.',
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
    hint: 'Xe f1 lên g1 chiếu cột g; Vua lên h8 rồi Hậu d1 xuống d8.',
    explanation:
      'Xe g1 chiếu cột g; Vua buộc lên h8, Hậu d8 chiếu bí - Tốt h7 chặn nốt ô h7.',
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
    hint: 'Ba nước: đưa Xe lên d7 khóa hàng 7 trước (chưa chiếu). Rồi Hậu sang c3, Xe xuống d8.',
    explanation:
      'Xe d7 giữ hàng 7; Đen chỉ còn đẩy Tốt g6, Hậu sang c3 rồi Xe xuống d8 chiếu bí.',
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
    hint: 'Đừng vội ăn: Hậu sang d4 canh đường chéo a7 và hàng 4, rồi chiếu d5 để ăn Xe.',
    explanation:
      'Hậu d4 canh các đường; Đen chỉ còn đẩy Tốt f6, Hậu d5 chiếu rồi ăn Xe a8.',
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
    hint: 'Mã nhảy e7: vừa chiếu Vua g8 vừa chĩa Hậu c8.',
    explanation:
      'Mã e7 vừa chiếu Vua g8 vừa chĩa Hậu c8; Vua lên h8, Mã ăn Hậu.',
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
    hint: 'Mã nhảy c7: vừa chiếu Vua e8 vừa chĩa Xe a8 ở góc.',
    explanation:
      'Mã c7 chiếu Vua e8 và chĩa Xe a8; Vua lùi f8, Mã ăn Xe.',
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
    hint: 'Ô d6 là ô đòn đôi: Mã chiếu Vua e8 và chĩa Xe c8.',
    explanation:
      'Mã d6 chiếu Vua e8; Vua lùi d7, Mã ăn Xe c8.',
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
    hint: 'Mã b4 lên c6: chiếu Vua b8 và chĩa Xe d8.',
    explanation:
      'Mã c6 chiếu Vua b8; Vua buộc lùi c8, Mã ăn Xe d8.',
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
    hint: 'Mã f4 lên d5: chiếu Vua e7, đồng thời nhìn Xe b6 không ai che.',
    explanation:
      'Mã d5 chiếu Vua e7; Vua lùi f8, Mã ăn Xe b6.',
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
    hint: 'Mã f4 lên g6: chiếu Vua e7 và chĩa Xe h8 tận góc.',
    explanation:
      'Mã g6 chiếu Vua e7; Vua lùi f7, Mã ăn Xe h8 và chiếu luôn.',
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
    hint: 'Mã c5 lên e6: Vua d8 bị chiếu, Xe f8 bị chĩa.',
    explanation:
      'Mã e6 chiếu Vua d8; Vua lùi e8, Mã ăn Xe f8 - chưa mất quân nào.',
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
    hint: 'Mã d4 lên b5: chiếu Vua a7 và nhìn Xe d6.',
    explanation:
      'Mã b5 chiếu Vua a7; Vua vào a8, Mã ăn Xe d6.',
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
    hint: 'Mã e4 lên f6: chiếu Vua g8 và chĩa Xe d7.',
    explanation:
      'Mã f6 chiếu Vua g8; Vua lùi h8, Mã ăn Xe d7.',
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
    hint: 'Tượng h2 lên e5 chiếu Vua g7; Vua rời đường chéo thì Xe h8 bị ăn.',
    explanation:
      'Tượng e5 chiếu Vua g7; Vua rời đường chéo, Tượng ăn Xe h8 - đòn xiên.',
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
    hint: 'Mã g5 lên f7: chiếu Vua h8 và chĩa Hậu d8.',
    explanation:
      'Mã f7 chiếu Vua h8; Vua lùi g8, Mã ăn Hậu d8.',
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
    hint: 'Mã d4 lên e6: chiếu Vua d8 và chĩa Hậu c7.',
    explanation:
      'Mã e6 chiếu Vua d8; Vua lùi d7, Mã ăn Hậu c7.',
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
    hint: 'Mã f4 lên d5: chiếu Vua e7 và chĩa Hậu b6.',
    explanation:
      'Mã d5 chiếu Vua e7; Vua lùi f8, Mã ăn Hậu b6.',
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
    hint: 'Mã f4 lên g6: chiếu Vua e7 và chĩa Hậu h8 trong góc.',
    explanation:
      'Mã g6 chiếu Vua e7; Vua lùi f7, Mã ăn Hậu h8 và chiếu luôn.',
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
    hint: 'Mã a3 lên b5: chiếu Vua c7 và chĩa Hậu d6.',
    explanation:
      'Mã b5 chiếu Vua c7; Vua lùi d7, Mã ăn Hậu d6.',
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
    hint: 'Mã f4 lên e6: chiếu Vua d8 và nhìn Hậu c5 đứng một mình.',
    explanation:
      'Mã e6 chiếu Vua d8; Vua lùi c8, Mã ăn Hậu c5.',
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
    hint: 'Mã f5 lên d6: chiếu Vua e8 và chĩa Hậu f7.',
    explanation:
      'Mã d6 chiếu Vua e8; Vua lùi f8, Mã ăn Hậu f7.',
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
    hint: 'Mã d7 bị Xe d1 ghim. Đẩy Tốt e6 tấn công nó.',
    explanation:
      'Xe d1 ghim Mã d7 vào Vua d8; Tốt e6 tấn công, Vua lùi e8, Tốt ăn Mã và chiếu.',
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
    hint: 'Hậu d1 ghim Mã d7. Tốt c5 tiến c6 là ăn được.',
    explanation:
      'Hậu d1 ghim Mã d7; Tốt c6 tấn công, Vua lùi e8, Tốt ăn Mã và chiếu.',
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
    hint: 'Tượng d7 bị Xe d1 ghim. Tốt c5 tiến c6 là hết đường chạy.',
    explanation:
      'Xe d1 ghim Tượng d7; Tốt c6 tấn công, Vua lùi e8, Tốt ăn Tượng.',
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
    hint: 'Mã c7 bị Hậu c1 ghim. Đẩy Tốt d5 lên d6 vồ lấy.',
    explanation:
      'Hậu c1 ghim Mã c7; Tốt d6 tấn công, Vua lùi b7, Hậu ăn Mã và chiếu.',
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
    hint: 'Tượng c7 bị Hậu c1 ghim. Tốt b5 tiến b6, rồi Hậu ăn.',
    explanation:
      'Hậu c1 ghim Tượng c7; Tốt b6 tấn công, Vua lùi b7, Hậu ăn Tượng.',
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
    hint: 'Mã e7 bị Xe e1 ghim. Tốt d5 lên d6 là ăn Mã.',
    explanation:
      'Xe e1 ghim Mã e7; Tốt d6 tấn công, Vua lùi f8, Tốt ăn Mã và chiếu.',
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
    hint: 'Vua Đen trốn ở h8, chỉ có Tốt h7 che. Hiến Mã ăn h7 để kéo Vua ra.',
    explanation:
      'Mã ăn h7 chiếu; Vua buộc ăn Mã và rời góc, Xe sang h2 chiếu bí.',
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
    hint: 'Mã lên g6 chiếu Vua h8. Tốt f7 ăn Mã là hàng 8 trống.',
    explanation:
      'Mã g6 chiếu; Tốt f7 ăn Mã và rời f7, Hậu xuống a8 chiếu bí.',
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
    hint: 'Mã f7 lên h8 chiếu; Vua buộc ăn Mã rồi Xe sang h3.',
    explanation:
      'Mã h8 chiếu Vua g8; Vua buộc ăn Mã ở góc, Xe sang h3 chiếu bí.',
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
    hint: 'Mã lên g6 chiếu; Tốt h7 ăn Mã thì cột h trống cho Hậu xuống e8.',
    explanation:
      'Mã g6 chiếu; Tốt h7 ăn Mã, Hậu xuống e8 chiếu bí (Xe f7 đã khóa hàng 7).',
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
    hint: 'Mã d5 lên f6 chiếu Vua g8; Tốt g7 ăn Mã rồi Hậu xuống a8.',
    explanation:
      'Mã f6 chiếu; Tốt g7 ăn Mã và rời g7, Hậu xuống a8 chiếu bí.',
    rhyme: 'Hiến Mã, Hậu bí',
  },
]
