import type { BestMovePuzzle, BestMoveTheme } from '../types'

/**
 * TRUNG CUỘC - "Tìm nước hay nhất" (thay cho bộ đố mẫu cũ).
 *
 * Bé soi một **thế cờ thật** rồi tự tìm nước mạnh nhất, thay vì học thuộc tên đòn.
 * Mỗi nước `bestSan` đều đã được **máy kiểm chứng** là tốt nhất (hoặc đồng hạng tốt
 * nhất) bằng `scripts/verify-bestmove.ts` - chạy engine chấm điểm từng nước rồi đối
 * chiếu. Nhờ vậy app dạy đúng nước của engine, không phán bừa theo cảm tính.
 *
 * Thế nào có `continuation` thì còn dạy bé **đánh tiếp để kết liễu**: sau nước hay
 * nhất, máy tự đáp lại rồi bé phải tự tìm nốt các nước còn lại của chuỗi.
 */

export const BEST_MOVE_THEMES: Record<
  BestMoveTheme,
  { label: string; emoji: string; blurb: string; when: string }
> = {
  attack: {
    label: 'Tấn công Vua',
    emoji: '👑',
    blurb: 'Vua đối phương lộ liễu - tìm nước kết liễu ngay khi còn cơ hội.',
    when: 'Khi Vua địch bị nhốt sau quân của chính nó, không còn ô thoát.',
  },
  'win-material': {
    label: 'Trừng phạt quân treo',
    emoji: '🎯',
    blurb: 'Đối thủ để quân không ai che - tìm nước ăn gọn một quân to.',
    when: 'Khi hai quân địch đứng cùng tầm một quân của bé, hoặc một quân đứng một mình.',
  },
  'win-queen': {
    label: 'Đòn hiểm ăn Hậu',
    emoji: '👸',
    blurb: 'Hậu là quân to nhất - chỉ cần một nước khéo là bắt được cả Hậu.',
    when: 'Khi Hậu địch đứng lộ liễu, cùng đường với Vua hoặc quân của bé.',
  },
  'passed-pawn': {
    label: 'Tốt thông tiến',
    emoji: '♟️',
    blurb: 'Tốt thông không còn Tốt địch cản đường - đẩy nó tiến là mạnh nhất.',
    when: 'Khi một Tốt của bé không còn Tốt đối phương nào chặn trên cùng cột.',
  },
  fork: {
    label: 'Đòn bắt đôi',
    emoji: '🍴',
    blurb: 'Một nước chĩa vào HAI quân địch cùng lúc - địch chỉ cứu được một.',
    when: 'Khi hai quân địch đứng lọt vào tầm của cùng một quân bé (nhất là Mã).',
  },
  pin: {
    label: 'Đòn ghim',
    emoji: '📌',
    blurb: 'Quân địch bị ghim không dám nhúc nhích - bé tha hồ vây bắt.',
    when: 'Khi một quân địch đứng chắn giữa quân bé và Vua địch trên cùng một đường.',
  },
  'mate-two': {
    label: 'Chiếu bí 2 nước',
    emoji: '🏁',
    blurb: 'Bé tính trước hai nước và tự tay kết liễu Vua địch.',
    when: 'Khi Vua địch gần hết đường - nước đầu ép Vua vào ô, nước sau là chiếu bí.',
  },
}

export const BEST_MOVES: BestMovePuzzle[] = [
  // ── Tấn công Vua ─────────────────────────────────────────────────────────
  {
    id: 'attack-1',
    theme: 'attack',
    title: 'Xe tràn xuống hàng cuối',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Rd8#',
    goodMoves: ['Rd8#'],
    hint: 'Ba Tốt f7, g7, h7 nhốt Vua Đen. Đưa Xe xuống hàng 8 ngay.',
    explanation:
      'Ba Tốt f7, g7, h7 của Đen chặn hết đường lùi cho Vua; Xe xuống d8 chiếu bí theo hàng cuối.',
    rhyme: 'Hàng cuối là hết',
  },
  {
    id: 'attack-2',
    theme: 'attack',
    title: 'Mã nhảy chiếu bí ngạt',
    fen: '6rk/6pp/8/6N1/8/8/5PPP/6K1 w - - 0 1',
    side: 'white',
    bestSan: 'Nf7#',
    goodMoves: ['Nf7#'],
    hint: 'Vua Đen bị Xe g8 và hai Tốt g7, h7 của chính nó quây kín. Tìm ô Mã đáp xuống.',
    explanation:
      'Vua Đen ở h8 bị Xe g8 cùng hai Tốt g7, h7 của chính mình vây kín; Mã nhảy f7 là chiếu bí, không quân nào đỡ được.',
    rhyme: 'Vua ngạt vì quân nhà',
  },
  {
    id: 'attack-3',
    theme: 'attack',
    title: 'Hậu giáng xuống hàng cuối',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1',
    side: 'white',
    bestSan: 'Qe8#',
    goodMoves: ['Qe8#'],
    hint: 'Ba Tốt f7, g7, h7 vẫn nhốt Vua Đen. Đưa Hậu xuống hàng 8.',
    explanation:
      'Vua Đen bị chính ba Tốt f7, g7, h7 nhốt ở g8; Hậu xuống e8 chiếu bí theo hàng cuối, không ô nào thoát.',
    rhyme: 'Hậu xuống hàng cuối',
  },
  {
    id: 'attack-4',
    theme: 'attack',
    title: 'Hậu ép Vua vào góc',
    fen: '7k/8/6QK/8/8/8/8/8 w - - 0 1',
    side: 'white',
    bestSan: 'Qg7#',
    goodMoves: ['Qg7#'],
    hint: 'Vua Đen đứng sát góc h8. Đưa Hậu xuống g7, ngay cạnh Vua mà lại được Vua Trắng che.',
    explanation:
      'Hậu xuống g7 chiếu Vua h8 và được Vua Trắng ở h6 che; Vua Đen hết ô vì g8, h7 đều nằm trong tầm Hậu.',
    rhyme: 'Hậu ép sát góc',
  },

  // ── Trừng phạt quân treo ──────────────────────────────────────────────────
  {
    id: 'material-1',
    theme: 'win-material',
    title: 'Mã bắt đôi hai Xe',
    fen: '2r1r1k1/pp3ppp/8/8/2N5/8/PP3PPP/R2R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Nd6',
    goodMoves: ['Nd6'],
    hint: 'Tìm ô mà Mã chĩa vào CẢ HAI Xe đen cùng lúc (cột c và cột e).',
    explanation:
      'Mã tới d6 chĩa hai mũi vào Xe c8 lẫn Xe e8 - Đen chỉ cứu được một chiếc, bé ăn gọn chiếc còn lại.',
    rhyme: 'Một nước hai Xe',
  },
  {
    id: 'material-2',
    theme: 'win-material',
    title: 'Mã bắt đôi Vua và Xe',
    fen: 'r3k3/pp3ppp/8/1N6/8/8/PP3PPP/6K1 w - - 0 1',
    side: 'white',
    bestSan: 'Nc7+',
    goodMoves: ['Nc7+'],
    continuation: ['Kd8', 'Nxa8'],
    hint: 'Nhảy Mã vào ô vừa chiếu Vua e8 vừa tấn công Xe a8, rồi đánh tiếp ăn Xe.',
    explanation:
      'Mã tới c7 vừa chiếu Vua e8 vừa tấn công Xe a8; Vua buộc phải tránh, rồi Mã ung dung ăn Xe.',
    rhyme: 'Mã nhảy bắt đôi',
  },
  {
    id: 'material-3',
    theme: 'win-material',
    title: 'Xe đớp Mã treo',
    fen: '6k1/5ppp/8/3n4/8/8/5PPP/3R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Rxd5',
    goodMoves: ['Rxd5'],
    hint: 'Mã Đen đứng một mình, không ai che. Xe của bé ăn được nó không?',
    explanation:
      'Mã Đen ở d5 không được quân nào che; Xe từ d1 tràn xuống d5 ăn gọn cả Mã mà không mất gì.',
    rhyme: 'Quân treo thì mất',
  },

  // ── Đòn hiểm ăn Hậu ───────────────────────────────────────────────────────
  {
    id: 'queen-1',
    theme: 'win-queen',
    title: 'Tượng đớp Hậu lộ liễu',
    fen: '4k3/3q4/8/1B6/8/8/8/3R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Bxd7+',
    goodMoves: ['Bxd7+'],
    hint: 'Hậu Đen đứng lộ liễu ở d7. Quân nào của bé ăn được nó?',
    explanation:
      'Hậu Đen ở d7 tuy có Vua che nhưng đứng lộ liễu; Tượng b5 đớp ngay d7 - Đen chỉ còn cách lấy Vua ăn lại, và Trắng đổi Tượng lấy Hậu quá hời.',
    rhyme: 'Tượng xuyên tim Hậu',
  },
  {
    id: 'queen-2',
    theme: 'win-queen',
    title: 'Xe xiên Vua lấy Hậu',
    fen: '4q3/8/8/4k3/8/8/8/3R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Re1+',
    goodMoves: ['Re1+'],
    hint: 'Chiếu Vua trên cột e để Vua phải rời đi, rồi ăn Hậu phía sau.',
    explanation:
      'Xe chiếu Vua từ e1; Vua Đen buộc phải rời cột e, để lộ Hậu e8 đứng sau - Xe ăn gọn.',
    rhyme: 'Xiên Vua mất Hậu',
  },
  {
    id: 'queen-3',
    theme: 'win-queen',
    title: 'Xe ăn Hậu đứng trống',
    fen: '4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1',
    side: 'white',
    bestSan: 'Rxd5',
    goodMoves: ['Rxd5'],
    hint: 'Hậu Đen ở d5 không có ai che. Xe ở d1 của bé thẳng cột với nó.',
    explanation:
      'Hậu Đen ở d5 đứng trống không ai che; Xe d1 tràn lên d5 ăn gọn Hậu, thu về cả một quân lớn.',
    rhyme: 'Hậu trống, Xe đớp',
  },

  // ── Tốt thông tiến ────────────────────────────────────────────────────────
  {
    id: 'pawn-1',
    theme: 'passed-pawn',
    title: 'Tốt thông tiến lên',
    fen: '6k1/5ppp/8/3P4/8/8/5PPP/3R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'd6',
    goodMoves: ['d6'],
    hint: 'Tốt d5 đã hết Tốt Đen cản đường. Đẩy nó tiến lên.',
    explanation:
      'Tốt d5 không còn Tốt Đen nào chặn trên cột, nên tiến d6 là nước mạnh nhất - Tốt thông càng gần hàng 8 càng nguy hiểm.',
    rhyme: 'Tốt thông cứ tiến',
  },
  {
    id: 'pawn-2',
    theme: 'passed-pawn',
    title: 'Vua hộ tống Tốt thông',
    fen: '8/8/8/4P3/4K3/8/4k3/8 w - - 0 1',
    side: 'white',
    bestSan: 'e6',
    goodMoves: ['e6'],
    hint: 'Vua Trắng đứng sau Tốt. Đẩy Tốt thông lên một bước.',
    explanation:
      'Ở thế Vua + Tốt, Vua đi sau hộ tống Tốt; đẩy e6 rồi Vua tiến theo là cách đưa Tốt lên phong Hậu.',
    rhyme: 'Vua sau, Tốt tiến',
  },
  {
    id: 'pawn-3',
    theme: 'passed-pawn',
    title: 'Tốt tới đích thành Hậu',
    fen: '8/4P3/8/8/8/4k3/8/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'e8=Q+',
    goodMoves: ['e8=Q+'],
    hint: 'Tốt Trắng đã đứng sát hàng cuối. Cho nó bước nốt một ô.',
    explanation:
      'Tốt Trắng ở e7 chỉ còn một bước là tới hàng 8; đẩy e8 phong Hậu vừa thành quân to nhất vừa chiếu Vua Đen.',
    rhyme: 'Tốt tới đích thành Hậu',
  },

  // ── Đòn bắt đôi ───────────────────────────────────────────────────────────
  {
    id: 'fork-1',
    theme: 'fork',
    title: 'Mã bắt đôi Vua và Hậu',
    fen: '4k3/1q6/8/8/4N3/8/8/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nd6+',
    goodMoves: ['Nd6+'],
    continuation: ['Kd8', 'Nxb7+'],
    hint: 'Tìm ô Mã vừa chiếu Vua e8 vừa chĩa thẳng vào Hậu b7.',
    explanation:
      'Mã nhảy d6 vừa chiếu Vua e8 vừa tấn công Hậu b7; Vua buộc phải tránh, rồi Mã ung dung ăn Hậu.',
    rhyme: 'Mã nhảy bắt đôi Hậu',
  },
  {
    id: 'fork-2',
    theme: 'fork',
    title: 'Mã bắt đôi Vua và Xe',
    fen: '4k3/7r/8/8/4N3/8/8/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'Nf6+',
    goodMoves: ['Nf6+'],
    continuation: ['Kd8', 'Nxh7'],
    hint: 'Tìm ô Mã vừa chiếu Vua e8 vừa chĩa thẳng vào Xe h7.',
    explanation:
      'Mã nhảy f6 vừa chiếu Vua e8 vừa tấn công Xe h7; Vua buộc phải tránh, rồi Mã thong thả ăn Xe.',
    rhyme: 'Mã bắt Vua cùng Xe',
  },
  {
    id: 'fork-3',
    theme: 'fork',
    title: 'Tốt bắt đôi hai quân',
    fen: '6k1/5ppp/8/2n1b3/8/2PP4/5PPP/6K1 w - - 0 1',
    side: 'white',
    bestSan: 'd4',
    goodMoves: ['d4'],
    hint: 'Đẩy Tốt d3 lên một ô để nó chĩa vào cả Mã c5 lẫn Tượng e5.',
    explanation:
      'Tốt tiến d4 cùng lúc tấn công Mã c5 và Tượng e5; Tốt lại được Tốt c3 che, nên Đen mất một quân.',
    rhyme: 'Tốt đẩy bắt đôi',
  },

  // ── Đòn ghim ──────────────────────────────────────────────────────────────
  {
    id: 'pin-1',
    theme: 'pin',
    title: 'Mã bị ghim, Tốt vồ tới',
    fen: '4k3/pp3ppp/2n5/1B6/3P4/8/5PPP/4K3 w - - 0 1',
    side: 'white',
    bestSan: 'd5',
    goodMoves: ['d5'],
    hint: 'Mã c6 bị Tượng b5 ghim, không dám nhúc nhích. Đưa Tốt tới tấn công nó.',
    explanation:
      'Mã Đen ở c6 bị Tượng b5 ghim vào Vua e8 nên không thể chạy; Tốt tiến d5 tấn công nó, bé sẽ ăn gọn Mã.',
    rhyme: 'Ghim rồi thì vồ',
  },
  {
    id: 'pin-2',
    theme: 'pin',
    title: 'Ghim Hậu rồi Xe đớp',
    fen: '3k4/3q4/8/8/8/8/8/3R2K1 w - - 0 1',
    side: 'white',
    bestSan: 'Rxd7+',
    goodMoves: ['Rxd7+'],
    hint: 'Hậu Đen đứng trên cột d, ngay trước mũi Xe của bé. Ăn nó đi.',
    explanation:
      'Xe d1 thẳng cột với Hậu d7; ăn Hậu ngay lập tức - dù Vua ăn lại Xe thì Trắng vẫn lời lớn vì Hậu quý hơn Xe.',
    rhyme: 'Ghim Hậu, Xe đớp liền',
  },

  // ── Chiếu bí 2 nước ───────────────────────────────────────────────────────
  {
    id: 'mate-two-1',
    theme: 'mate-two',
    title: 'Thang Xe đuổi Vua',
    fen: '7k/8/5K2/8/8/8/1R6/R7 w - - 0 1',
    side: 'white',
    bestSan: 'Ra8+',
    goodMoves: ['Ra8+'],
    continuation: ['Kh7', 'Rh2#'],
    hint: 'Chiếu Vua lên hàng 8, ép nó vào góc, rồi đưa Xe thứ hai chặn lối chạy.',
    explanation:
      'Xe a8 chiếu đuổi Vua lên h7; Vua bị Vua Trắng f6 khoá ô g7, rồi Xe b2 sang h2 chiếu dọc cột h là chiếu bí.',
    rhyme: 'Thang Xe leo hai bước',
  },
  {
    id: 'mate-two-2',
    theme: 'mate-two',
    title: 'Thang Xe cánh Hậu',
    fen: 'k7/8/2K5/8/8/8/6R1/7R w - - 0 1',
    side: 'white',
    bestSan: 'Rh8+',
    goodMoves: ['Rh8+'],
    continuation: ['Ka7', 'Ra2#'],
    hint: 'Chiếu Vua Đen lên hàng 8, rồi đưa Xe thứ hai xuống chiếu bí trên cột a.',
    explanation:
      'Xe h8 chiếu ép Vua a8 chạy lên a7; Xe g2 sang a2 chiếu dọc cột a, Vua hết đường vì Vua Trắng đã khoá b7, b6.',
    rhyme: 'Thang Xe bên Hậu',
  },
]

export function bestMovesByTheme(theme: BestMoveTheme): BestMovePuzzle[] {
  return BEST_MOVES.filter((puzzle) => puzzle.theme === theme)
}
