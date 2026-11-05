import type { EndgameChallenge } from '../types'

/**
 * Năm thế tàn cuộc **kỹ thuật thật** cho mức 1500+.
 *
 * Mỗi thế đã được kiểm bằng tìm kiếm "thắng cưỡng bức" thuần chess.js (Trắng thắng
 * dù Đen phòng thủ thế nào), không phải thế trang trí:
 * - `opposition`, `passed-pawn`: phong cấp cưỡng bức trong 5 nửa nước.
 * - `rook-pawn`: Xe Trắng lên a8 buộc đổi Xe rồi Tốt bắt chéo lên thành Hậu.
 * - `bishop-pair`, `bishop-knight`: chiếu bí ngay được (Tượng canh đường chéo h8,
 *   Vua giữ g7/g8, Mã giữ h7).
 */
export const ENDGAMES: EndgameChallenge[] = [
  {
    id: 'opposition',
    steps: [
      { icon: '♟️', text: 'Đẩy Tốt f6 lên f7' },
      { icon: '↔️', text: 'Vua Đen phải nhường ô f8' },
      { icon: '👑', text: 'Tốt f8 thành Hậu' },
    ],
    level: 'basic',
    title: 'Vua–Tốt: ô đối diện',
    goal: 'promote',
    fen: '5k2/8/4KP2/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Tốt f6 đã có Vua e6 che. Đẩy Tốt lên f7 - Vua Đen phải nhường ô f8.',
    explanation:
      'Hai Vua đối diện cách một ô: bên phải đi là bên nhường, nên Tốt cứ tiến là thành Hậu.',
    rhyme: 'Đối diện thì Vua kia phải nhường',
  },
  {
    id: 'rook-pawn',
    steps: [
      { icon: '🛡️', text: 'Đưa Xe lên a8 buộc đổi Xe' },
      { icon: '↗️', text: 'Tốt b7 bắt chéo lên a8' },
      { icon: '👑', text: 'Thành Hậu ở a8' },
    ],
    level: 'advanced',
    title: 'Xe + Tốt chọi Xe',
    goal: 'promote',
    fen: 'r3k3/1P6/8/8/8/8/8/R3K3 w - - 0 1',
    playerSide: 'white',
    hint: 'Xe Đen canh ô b8 nên đừng phong Hậu ngay. Đưa Xe lên a8 buộc Xe Đen phải đổi.',
    explanation:
      'Đổi Xe xong là hết người canh b8: Đen ăn thì Tốt bắt chéo lên a8 thành Hậu, Đen tránh thì bé ăn Xe.',
    rhyme: 'Đổi Xe mở đường cho Tốt',
  },
  {
    id: 'bishop-knight',
    steps: [
      { icon: '🤴', text: 'Vua f7 giữ g7, g8' },
      { icon: '🐴', text: 'Mã g5 giữ h7' },
      { icon: '🏹', text: 'Tượng c1 sang b2 chiếu h8' },
    ],
    level: 'advanced',
    title: 'Mã + Tượng chiếu bí',
    goal: 'checkmate',
    fen: '7k/5K2/8/6N1/8/8/8/2B5 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua giữ g7, g8, Mã g5 giữ h7. Còn thiếu nước Tượng chiếu vào h8.',
    explanation:
      'Mã giữ h7, Tượng chiếu h8: hai quân chia nhau hai màu ô nên Vua Đen hết đường.',
    rhyme: 'Mã giữ h7, Tượng chiếu h8',
  },
  {
    id: 'bishop-pair',
    steps: [
      { icon: '🤴', text: 'Vua f7 giữ g7, g8' },
      { icon: '🏹', text: 'Một Tượng giữ h7' },
      { icon: '🏁', text: 'Tượng kia sang b2 chiếu h8' },
    ],
    level: 'advanced',
    title: 'Tượng đôi chiếu bí',
    goal: 'checkmate',
    fen: '7k/5K2/8/8/8/B7/8/1B6 w - - 0 1',
    playerSide: 'white',
    hint: 'Một Tượng đã giữ h7. Đưa Tượng kia vào b2 chiếu dọc đường chéo tới h8.',
    explanation:
      'Tượng đôi phủ kín hai màu ô nên Vua Đen ở góc hết đường chạy. Nhớ đừng đi nước không chiếu kẻo hòa cờ.',
    rhyme: 'Hai Tượng đan lưới kín',
  },
  {
    id: 'passed-pawn',
    steps: [
      { icon: '🤴', text: 'Vua Trắng theo sau Tốt' },
      { icon: '⬆️', text: 'Tốt b5 tiến b6 rồi b7' },
      { icon: '👑', text: 'Tốt b8 thành Hậu' },
    ],
    level: 'basic',
    title: 'Tốt thông hành + Vua theo sau',
    goal: 'promote',
    fen: '7k/8/8/1P6/8/1K6/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Tốt b5 không còn Tốt nào chặn. Vua theo sau che, Tốt thẳng tiến lên b8.',
    explanation:
      'Tốt thông hành là Tốt không còn Tốt địch chặn đường. Vua Đen ở tận h8 không kịp về, bé chỉ cần đẩy Tốt đều tay.',
    rhyme: 'Tốt thông hành cứ tiến',
  },
  {
    id: 'two-pawns',
    steps: [
      { icon: '⬆️', text: 'Đẩy một Tốt lên trước' },
      { icon: '🎯', text: 'Vua Đen chỉ kịp chặn một cột' },
      { icon: '👑', text: 'Tốt còn lại lên hàng 8' },
    ],
    level: 'basic',
    title: 'Hai Tốt sát nhau cùng tiến',
    goal: 'promote',
    fen: '8/8/8/1PP5/8/1K6/8/7k w - - 0 1',
    playerSide: 'white',
    hint: 'Đẩy một Tốt lên trước - Vua Đen chỉ đuổi kịp một con.',
    explanation:
      'Hai Tốt sát nhau là cặp không chặn nổi: Tốt nào bị ăn thì Tốt kia đi tiếp. Vua Đen chỉ kịp chặn một cột.',
    rhyme: 'Hai Tốt cùng tiến lên',
  },
  {
    id: 'pawn-escort',
    steps: [
      { icon: '⬆️', text: 'Tốt d4 tiến từng bước' },
      { icon: '🤴', text: 'Vua d3 theo sau che' },
      { icon: '👑', text: 'Tốt d8 thành Hậu' },
    ],
    level: 'basic',
    title: 'Vua đi sau che Tốt',
    goal: 'promote',
    fen: '8/8/8/8/3P4/3K4/8/6k1 w - - 0 1',
    playerSide: 'white',
    hint: 'Đẩy Tốt d4 lên, Vua Trắng theo sau từng bước.',
    explanation:
      'Tốt thành Hậu phải có Vua che lưng: Tốt tiến một bước, Vua theo một bước. Vua Đen ở g1 không kịp vòng ra.',
    rhyme: 'Vua theo sau che Tốt',
  },
  {
    id: 'queen-mate',
    steps: [
      { icon: '🤴', text: 'Vua g6 giữ g7, h7' },
      { icon: '👑', text: 'Hậu f7 xuống f8 chiếu' },
      { icon: '🏁', text: 'Vua Đen hết ô: chiếu bí' },
    ],
    level: 'basic',
    title: 'Hậu + Vua chiếu bí',
    goal: 'checkmate',
    fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đã đứng g6. Đẩy Hậu xuống f8 là chiếu bí.',
    explanation:
      'Vua tiến sát giữ ô chạy, Hậu chiếu từ xa. Hậu f8 vừa chiếu vừa khóa hàng 8 - Vua Đen hết ô.',
    rhyme: 'Hậu chiếu, Vua đã giữ',
  },

  // ── Bổ sung: chiếu bí bằng Xe, thang Xe, Hậu ở góc (cơ bản) ─────────────────
  // Ba thế chiếu bí ngay một nước nhưng mỗi thế dạy một khuôn khác nhau: Xe + Vua
  // áp sát, hai Xe "thang", và Hậu khóa hàng 8. Bé nhận ra khuôn trước khi bấm.
  {
    id: 'rook-mate',
    steps: [
      { icon: '🤴', text: 'Vua g6 giữ g7, h7' },
      { icon: '🏰', text: 'Xe a1 lên a8 chiếu hàng 8' },
      { icon: '🏁', text: 'Chiếu bí' },
    ],
    level: 'basic',
    title: 'Xe + Vua chiếu bí',
    goal: 'checkmate',
    fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đã giữ các ô quanh Vua Đen. Đưa Xe lên hàng 8 là chiếu bí.',
    explanation:
      'Vua g6 khóa g7, h7, g5; Xe lên hàng 8 chiếu dọc. Vua mình áp sát rồi thì Xe + Vua luôn chiếu bí được.',
    rhyme: 'Vua giữ ô, Xe chiếu',
  },
  {
    id: 'ladder-mate',
    steps: [
      { icon: '🏰', text: 'Xe a7 khóa hàng 7' },
      { icon: '🏰', text: 'Xe b1 lên b8 chiếu' },
      { icon: '🏁', text: 'Chiếu bí “thang”' },
    ],
    level: 'basic',
    title: 'Hai Xe thang chiếu bí',
    goal: 'checkmate',
    fen: '7k/R7/8/8/8/8/8/1R4K1 w - - 0 1',
    playerSide: 'white',
    hint: 'Xe a7 đã khóa hàng 7. Đưa Xe còn lại lên hàng 8 là hết ván.',
    explanation:
      'Xe a7 khóa hàng 7 nên Vua Đen chỉ quanh quẩn hàng 8; Xe b1 lên b8 chiếu là hết ô. Đó là chiếu bí “thang”.',
    rhyme: 'Xe khóa hàng, Xe chiếu',
  },
  {
    id: 'queen-mate-edge',
    steps: [
      { icon: '🤴', text: 'Vua g6 giữ g7, h7' },
      { icon: '👑', text: 'Hậu b1 xuống b8 chiếu hàng 8' },
      { icon: '🏁', text: 'Chiếu bí' },
    ],
    level: 'basic',
    title: 'Hậu + Vua chiếu bí ở góc',
    goal: 'checkmate',
    fen: '7k/8/6K1/8/8/8/8/1Q6 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua g6 giữ g7 và h7. Hậu còn đúng một nước: xuống b8 chiếu hàng 8.',
    explanation:
      'Hậu chiếu hàng 8 từ rất xa: g7 và h7 bị Vua Trắng giữ, g8 bị Hậu khóa - Vua Đen hết ô.',
    rhyme: 'Hậu xuống hàng 8',
  },

  // ── Bổ sung: kỹ thuật thật (nâng cao) ────────────────────────────────────
  {
    id: 'kp-sixth',
    steps: [
      { icon: '🤴', text: 'Vua d6 sang e6 giữ ô đối diện' },
      { icon: '⬆️', text: 'Tốt d5 tiến d6 rồi d7' },
      { icon: '👑', text: 'Tốt d8 thành Hậu' },
    ],
    level: 'advanced',
    title: 'Vua + Tốt: Vua đứng trước Tốt',
    goal: 'promote',
    fen: '3k4/8/3K4/3P4/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua đã đứng trước Tốt trên hàng 6 - đúng thế thắng. Đi Vua sang bên để giành ô đối diện.',
    explanation:
      'Vua phải đi TRƯỚC Tốt: Vua sang e6 giữ ô đối diện, Đen nhường đường, Tốt d5 tiến d6 rồi d7 thành Hậu.',
    rhyme: 'Vua trước, Tốt sau',
  },
  {
    id: 'lucena',
    steps: [
      { icon: '🏗️', text: 'Đưa Xe lên f4 dựng cầu' },
      { icon: '🤴', text: 'Vua b8 nấp sau Xe' },
      { icon: '👑', text: 'Tốt b7 tiến b8 thành Hậu' },
    ],
    level: 'advanced',
    title: 'Lucena: xây cầu cho Tốt',
    goal: 'promote',
    fen: '1K1k4/1P6/8/8/8/8/6r1/5R2 w - - 0 1',
    playerSide: 'white',
    hint: 'Xe Đen chiếu Vua liên tục. Đưa Xe mình lên hàng 4 làm “cây cầu” che Vua.',
    explanation:
      'Vua nấp sau Xe f4 nên vừa tránh chiếu vừa mở đường cho Tốt b7. Đây là kỹ thuật Lucena kinh điển.',
    rhyme: 'Dựng cầu, Vua bước ra',
  },

  // ── Bổ sung: chiếu bí hàng cuối (cơ bản) ────────────────────────────────
  {
    id: 'back-rank-mate',
    steps: [
      { icon: '🧱', text: 'Ba Tốt f7 g7 h7 nhốt Vua Đen' },
      { icon: '🏰', text: 'Xe e1 lên e8 chiếu' },
      { icon: '🏁', text: 'Chiếu bí hàng cuối' },
    ],
    level: 'basic',
    title: 'Chiếu bí hàng cuối bằng Xe',
    goal: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Đen kẹt sau ba Tốt f7 g7 h7. Đưa Xe lên hàng 8 chiếu là hết đường.',
    explanation:
      'Xe e8 chiếu hàng 8; Tốt f7 g7 h7 của Đen tự khóa Vua, ô f8 đã có Xe giữ. Đó là “chiếu bí hàng cuối”.',
    rhyme: 'Hàng cuối là tử huyệt',
  },
  {
    id: 'queen-back-rank-mate',
    steps: [
      { icon: '🧱', text: 'Ba Tốt f7 g7 h7 nhốt Vua Đen' },
      { icon: '👑', text: 'Hậu b1 xuống b8 chiếu hàng 8' },
      { icon: '🏁', text: 'Chiếu bí hàng cuối' },
    ],
    level: 'basic',
    title: 'Chiếu bí hàng cuối bằng Hậu',
    goal: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/1Q5K w - - 0 1',
    playerSide: 'white',
    hint: 'Ba Tốt f7 g7 h7 nhốt Vua Đen. Hậu b1 xuống b8 chiếu là chiếu bí.',
    explanation:
      'Hậu chiếu hàng 8 từ rất xa, không cần áp sát: f8 bị Hậu giữ, g7 và h7 là Tốt của chính Vua Đen.',
    rhyme: 'Hậu xuống hàng 8',
  },

  // ── Bổ sung: kỹ thuật thật (nâng cao) ────────────────────────────────────
  {
    id: 'kp-two-push',
    steps: [
      { icon: '🤴', text: 'Vua c6 giữ ô b7' },
      { icon: '⬆️', text: 'Tốt b6 tiến b7' },
      { icon: '👑', text: 'Tốt b8 thành Hậu' },
    ],
    level: 'advanced',
    title: 'Vua đi trước, Tốt cột b sát biên',
    goal: 'promote',
    fen: '8/8/1KP5/8/8/8/8/7k w - - 0 1',
    playerSide: 'white',
    hint: 'Vua đứng trước Tốt b6, Vua Đen ở tận h1. Đẩy Tốt b7 rồi b8 thành Hậu.',
    explanation:
      'Vua c6 vừa che Tốt vừa giữ b7. Tốt sát biên vẫn thắng khi Vua đi trước.',
    rhyme: 'Tốt sát biên, Vua che',
  },
  {
    id: 'rook-pawn-vs-king',
    steps: [
      { icon: '⬆️', text: 'Tốt b2 tiến từng bước' },
      { icon: '🛡️', text: 'Xe b1 giữ cột b, Vua theo sau' },
      { icon: '👑', text: 'Tốt b8 thành Hậu' },
    ],
    level: 'advanced',
    title: 'Xe + Tốt chọi Vua trơ',
    goal: 'promote',
    fen: '8/8/8/8/8/1K6/1P6/1R4k1 w - - 0 1',
    playerSide: 'white',
    hint: 'Đẩy Tốt b2 lên từng bước, Vua theo sau che, Xe b1 giữ cột b.',
    explanation:
      'Vua Đen một mình không vừa chặn Tốt vừa tránh Xe, nên Tốt cứ tiến tới b8 thành Hậu.',
    rhyme: 'Xe giữ cột, Tốt tiến',
  },
  {
    id: 'two-pawns-tandem',
    steps: [
      { icon: '⬆️', text: 'Đẩy e4 và f4 cùng tiến' },
      { icon: '🤝', text: 'Giữ hai Tốt sát nhau' },
      { icon: '👑', text: 'Một Tốt lên hàng 8 thành Hậu' },
    ],
    level: 'advanced',
    title: 'Cặp Tốt sát nhau cùng tiến',
    goal: 'promote',
    fen: '7k/8/8/3K4/4PP2/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Hai Tốt e4 f4 đứng cạnh nhau. Đẩy cả cặp cùng tiến.',
    explanation:
      'Hai Tốt sát nhau thì không Tốt nào cản được. Vua Đen ở h8 chỉ kịp chặn một con, con kia lên hàng 8 thành Hậu.',
    rhyme: 'Cặp Tốt cùng tiến',
  },
  {
    id: 'queen-and-pawn',
    steps: [
      { icon: '👑', text: 'Hậu c1 canh, đừng chiếu mãi' },
      { icon: '⬆️', text: 'Tốt b6 tiến b7 rồi b8' },
      { icon: '🏁', text: 'Tốt thành Hậu là xong' },
    ],
    level: 'advanced',
    title: 'Hậu + Tốt: Tốt vẫn là nhân vật chính',
    goal: 'promote',
    fen: '7k/8/1KP5/8/8/8/8/2Q5 w - - 0 1',
    playerSide: 'white',
    hint: 'Có Hậu cũng phải đẩy Tốt: b6 lên b7 rồi b8. Đừng chiếu mãi mà quên Tốt.',
    explanation:
      'Việc chính vẫn là TỐT. Hậu c1 canh sẵn nên Vua Đen h8 không dám lại gần.',
    rhyme: 'Tốt lên, Hậu canh',
  },
  {
    id: 'knight-smother-mate',
    steps: [
      { icon: '🤴', text: 'Vua g6 giữ h7' },
      { icon: '🐴', text: 'Mã h6 nhảy f7 chiếu' },
      { icon: '🏁', text: 'Địch tự nhốt: chiếu bí' },
    ],
    level: 'advanced',
    title: 'Chiếu bí “nghẹt” bằng Mã',
    goal: 'checkmate',
    fen: '6rk/6p1/6KN/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Mã h6 nhảy f7 là chiếu bí. Vua Đen h8 bị Xe g8 và Tốt g7 của chính mình chặn.',
    explanation:
      'Đây là “chiếu bí nghẹt”: g8 là Xe Đen, g7 là Tốt Đen, h7 đã bị Vua Trắng giữ - đối thủ tự nhốt mình.',
    rhyme: 'Mã chiếu, địch tự nhốt',
  },
]

export function getEndgame(id: string): EndgameChallenge | undefined {
  return ENDGAMES.find((challenge) => challenge.id === id)
}
