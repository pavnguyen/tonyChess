import type { BestMovePuzzle, BestMoveTheme } from '../types'

/**
 * TRUNG CUỘC - "Tìm nước hay nhất" (thay cho bộ đố mẫu cũ).
 *
 * Bé soi một **thế cờ thật** rồi tự tìm nước mạnh nhất, thay vì học thuộc tên đòn.
 * Mỗi nước `bestSan` đều đã được **máy kiểm chứng** là tốt nhất (hoặc đồng hạng tốt
 * nhất) bằng `scripts/verify-bestmove.ts` - chạy engine chấm điểm từng nước rồi đối
 * chiếu. Nhờ vậy app dạy đúng nước của engine, không phán bừa theo cảm tính.
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
    hint: 'Nhảy Mã vào ô vừa chiếu Vua e8 vừa tấn công Xe a8.',
    explanation:
      'Mã tới c7 vừa chiếu Vua e8 vừa tấn công Xe a8; Vua buộc phải tránh, rồi Mã ung dung ăn Xe.',
    rhyme: 'Mã nhảy bắt đôi',
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
]

export function bestMovesByTheme(theme: BestMoveTheme): BestMovePuzzle[] {
  return BEST_MOVES.filter((puzzle) => puzzle.theme === theme)
}
