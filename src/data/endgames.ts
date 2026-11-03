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
    level: 'basic',
    title: 'Vua–Tốt: ô đối diện',
    goal: 'promote',
    fen: '5k2/8/4KP2/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đứng ngay sau Tốt để che. Đẩy Tốt lên f7, Vua Đen buộc phải nhường ô f8.',
    explanation:
      'Luật ô đối diện: hai Vua nhìn nhau cách một ô thì bên phải đi là bên phải nhường. Vua Trắng đứng đối diện Vua Đen nên Vua Đen không thể chui vào trước mặt Tốt — Tốt cứ tiến là thành Hậu.',
    rhyme: 'Đối diện thì Vua kia phải nhường',
  },
  {
    id: 'rook-pawn',
    level: 'advanced',
    title: 'Xe + Tốt chọi Xe',
    goal: 'promote',
    fen: 'r3k3/1P6/8/8/8/8/8/R3K3 w - - 0 1',
    playerSide: 'white',
    hint: 'Đừng phong Hậu ngay (Xe Đen đang canh b8). Đẩy Xe lên a8 trước để buộc Xe Đen đổi.',
    explanation:
      'Xe Đen canh đúng ô phong cấp b8 nên Tốt không lên được. Đưa Xe lên a8: nếu Xe Đen ăn, Tốt bắt chéo lên a8 thành Hậu; nếu Xe Đen tránh, bé ăn luôn Xe rồi ung dung phong Hậu.',
    rhyme: 'Đổi Xe mở đường cho Tốt',
  },
  {
    id: 'bishop-knight',
    level: 'advanced',
    title: 'Mã + Tượng chiếu bí',
    goal: 'checkmate',
    fen: '7k/5K2/8/6N1/8/8/8/2B5 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng giữ g7 và g8, Mã g5 đã canh ô h7. Còn thiếu một nước Tượng chiếu vào h8.',
    explanation:
      'Mã và Tượng chia nhau hai màu ô: Mã giữ ô h7 (ô Vua Đen muốn chạy), Tượng chiếu vào h8 theo đường chéo. Vua Đen hết cả ba ô — đây là cách Mã + Tượng phối hợp chiếu bí.',
    rhyme: 'Mã giữ h7, Tượng chiếu h8',
  },
  {
    id: 'bishop-pair',
    level: 'advanced',
    title: 'Tượng đôi chiếu bí',
    goal: 'checkmate',
    fen: '7k/5K2/8/8/8/B7/8/1B6 w - - 0 1',
    playerSide: 'white',
    hint: 'Một Tượng đang canh h7. Đưa Tượng còn lại vào b2 để chiếu dọc đường chéo dài tới h8.',
    explanation:
      'Tượng đôi phủ kín hai màu ô: một con giữ ô h7, một con chiếu vào h8, Vua Trắng giữ g7 và g8. Vua Đen ở góc hết đường chạy — nhớ đừng đi nước không chiếu kẻo hòa cờ.',
    rhyme: 'Hai Tượng đan lưới kín',
  },
  {
    id: 'passed-pawn',
    level: 'basic',
    title: 'Tốt thông hành + Vua theo sau',
    goal: 'promote',
    fen: '7k/8/8/1P6/8/1K6/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Tốt b5 không còn Tốt nào chặn. Vua Trắng đi theo sau che, Tốt cứ tiến thẳng lên b8.',
    explanation:
      'Tốt thông hành là Tốt không còn Tốt địch chặn trên đường. Vua Đen ở tận h8 không kịp chạy về, nên việc của bé chỉ là đẩy Tốt tiến đều — càng nhanh càng tốt.',
    rhyme: 'Tốt thông hành cứ tiến',
  },
  {
    id: 'two-pawns',
    level: 'basic',
    title: 'Hai Tốt sát nhau cùng tiến',
    goal: 'promote',
    fen: '8/8/8/1PP5/8/1K6/8/7k w - - 0 1',
    playerSide: 'white',
    hint: 'Hai Tốt đứng cạnh nhau không Tốt nào cản được. Đẩy một Tốt lên trước, Vua Đen chỉ đuổi được một con.',
    explanation:
      'Hai Tốt sát nhau là cặp không thể chặn: Tốt nào bị ăn thì Tốt kia đi tiếp. Vua Đen ở tận h1 nên chỉ kịp chặn một cột — bé đẩy Tốt bên kia lên thành Hậu.',
    rhyme: 'Hai Tốt cùng tiến lên',
  },
  {
    id: 'pawn-escort',
    level: 'basic',
    title: 'Vua đi sau che Tốt',
    goal: 'promote',
    fen: '8/8/8/8/3P4/3K4/8/6k1 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đứng ngay sau Tốt d4. Đẩy Tốt lên, Vua theo sau từng bước để không mất Tốt.',
    explanation:
      'Tốt muốn lên Hậu thì phải có Vua đi sau che lưng: Tốt tiến một bước, Vua tiến theo một bước. Vua Đen từ g1 không kịp vòng ra trước mặt Tốt.',
    rhyme: 'Vua theo sau che Tốt',
  },
  {
    id: 'queen-mate',
    level: 'basic',
    title: 'Hậu + Vua chiếu bí',
    goal: 'checkmate',
    fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đã đứng ngay trước mặt Vua Đen (ô g6). Đẩy Hậu xuống f8 là chiếu bí.',
    explanation:
      'Cách chiếu bí bằng Hậu: Vua mình tiến sát để giữ ô chạy, Hậu chiếu từ xa. Hậu f8 vừa chiếu vừa khóa hàng 8, Vua Đen không còn ô nào — hết ván.',
    rhyme: 'Hậu chiếu, Vua đã giữ',
  },

  // ── Bổ sung: chiếu bí bằng Xe, thang Xe, Hậu ở góc (cơ bản) ─────────────────
  // Ba thế chiếu bí ngay một nước nhưng mỗi thế dạy một khuôn khác nhau: Xe + Vua
  // áp sát, hai Xe "thang", và Hậu khóa hàng 8. Bé nhận ra khuôn trước khi bấm.
  {
    id: 'rook-mate',
    level: 'basic',
    title: 'Xe + Vua chiếu bí',
    goal: 'checkmate',
    fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đã giữ sẵn các ô quanh Vua Đen. Đưa Xe lên hàng 8 là chiếu bí.',
    explanation:
      'Vua Trắng ở g6 khóa g7, h7 và g5; Xe a1 lên a8 chiếu dọc hàng 8, Vua Đen ở h8 hết ô chạy. Xe + Vua luôn chiếu bí được khi Vua mình đã áp sát.',
    rhyme: 'Vua giữ ô, Xe chiếu',
  },
  {
    id: 'ladder-mate',
    level: 'basic',
    title: 'Hai Xe thang chiếu bí',
    goal: 'checkmate',
    fen: '7k/R7/8/8/8/8/8/1R4K1 w - - 0 1',
    playerSide: 'white',
    hint: 'Một Xe đã khóa hàng 7, không cho Vua Đen xuống. Đưa Xe còn lại lên hàng 8 là hết ván.',
    explanation:
      'Xe a7 khóa hàng 7 nên Vua Đen chỉ quanh quẩn hàng 8; Xe b1 lên b8 chiếu - Vua không còn ô nào. Hai Xe “thang” là cách chiếu bí dễ nhất bằng Xe.',
    rhyme: 'Xe khóa hàng, Xe chiếu',
  },
  {
    id: 'queen-mate-edge',
    level: 'basic',
    title: 'Hậu + Vua chiếu bí ở góc',
    goal: 'checkmate',
    fen: '7k/8/6K1/8/8/8/8/1Q6 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đứng g6 khóa g7 và h7. Hậu còn đúng một nước: xuống b8 chiếu dọc hàng 8.',
    explanation:
      'Hậu b1 xuống b8 chiếu dọc hàng 8; Vua Đen h8 không dám ăn Hậu vì quá xa, lại không còn ô chạy: g7 và h7 đã bị Vua Trắng giữ, g8 thì Hậu khóa.',
    rhyme: 'Hậu xuống hàng 8',
  },

  // ── Bổ sung: kỹ thuật thật (nâng cao) ────────────────────────────────────
  {
    id: 'kp-sixth',
    level: 'advanced',
    title: 'Vua + Tốt: Vua đứng trước Tốt',
    goal: 'promote',
    fen: '3k4/8/3K4/3P4/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đã đứng trước Tốt trên hàng 6 - đúng thế thắng. Đi Vua sang bên để giành ô đối diện, đừng để Vua Đen chui vào trước mặt Tốt.',
    explanation:
      'Vua phải đi TRƯỚC Tốt: Vua sang e6 giữ ô đối diện, Đen buộc nhường đường, Tốt d5 tiến d6 rồi d7, Vua Trắng theo sau che và Tốt thành Hậu.',
    rhyme: 'Vua trước, Tốt sau',
  },
  {
    id: 'lucena',
    level: 'advanced',
    title: 'Lucena: xây cầu cho Tốt',
    goal: 'promote',
    fen: '1K1k4/1P6/8/8/8/8/6r1/5R2 w - - 0 1',
    playerSide: 'white',
    hint: 'Tốt b7 sắp thành Hậu nhưng Vua Trắng bị Xe Đen chiếu liên tục. Đưa Xe mình lên hàng 4 làm “cây cầu” che Vua.',
    explanation:
      'Xe f1 lên f4 dựng cầu; khi Xe Đen chiếu, Vua Trắng bước xuống hàng 6 rồi hàng 5 nấp sau Xe f4. Xe vừa che chiếu vừa mở đường cho Tốt b7 thành Hậu - đây là kỹ thuật Lucena kinh điển.',
    rhyme: 'Dựng cầu, Vua bước ra',
  },

  // ── Bổ sung: chiếu bí hàng cuối (cơ bản) ────────────────────────────────
  {
    id: 'back-rank-mate',
    level: 'basic',
    title: 'Chiếu bí hàng cuối bằng Xe',
    goal: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Đen kẹt sau ba Tốt f7 g7 h7. Đưa Xe lên hàng 8 chiếu là hết đường.',
    explanation:
      'Xe e1 lên e8 chiếu dọc hàng 8; Vua Đen g8 không xuống được vì ba Tốt của mình đã khóa, ô f8 thì Xe giữ. Đây là “chiếu bí hàng cuối” - đòn gặp nhiều nhất trong ván thật.',
    rhyme: 'Hàng cuối là tử huyệt',
  },
  {
    id: 'queen-back-rank-mate',
    level: 'basic',
    title: 'Chiếu bí hàng cuối bằng Hậu',
    goal: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/1Q5K w - - 0 1',
    playerSide: 'white',
    hint: 'Ba Tốt f7 g7 h7 nhốt Vua Đen. Hậu b1 xuống b8 chiếu là chiếu bí.',
    explanation:
      'Hậu b1 xuống b8 chiếu dọc hàng 8; Vua Đen g8 hết ô: f8 bị Hậu giữ, g7 và h7 là Tốt của mình. Hậu làm được việc này từ rất xa, không cần áp sát.',
    rhyme: 'Hậu xuống hàng 8',
  },

  // ── Bổ sung: kỹ thuật thật (nâng cao) ────────────────────────────────────
  {
    id: 'kp-two-push',
    level: 'advanced',
    title: 'Vua đi trước, Tốt cột b sát biên',
    goal: 'promote',
    fen: '8/8/1KP5/8/8/8/8/7k w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đứng ngay trước Tốt b6, Vua Đen ở tận h1. Đẩy Tốt lên b7 rồi b8 thành Hậu.',
    explanation:
      'Vua Trắng ở c6 vừa che Tốt b6 vừa giữ ô b7; Tốt tiến b7 rồi b8 thành Hậu. Tốt sát biên vẫn thắng khi Vua mình đi trước - chỉ cần đừng để Vua Đen kịp chạy về chặn.',
    rhyme: 'Tốt sát biên, Vua che',
  },
  {
    id: 'rook-pawn-vs-king',
    level: 'advanced',
    title: 'Xe + Tốt chọi Vua trơ',
    goal: 'promote',
    fen: '8/8/8/8/8/1K6/1P6/1R4k1 w - - 0 1',
    playerSide: 'white',
    hint: 'Đẩy Tốt b2 lên từng bước, Vua đi sau che, Xe b1 giữ cột. Đừng để Vua Đen ăn Tốt.',
    explanation:
      'Tốt b2 tiến dần, Vua Trắng theo sau che, Xe b1 khóa cột b. Vua Đen một mình không thể vừa chặn Tốt vừa tránh đường Xe, nên Tốt lên tới b8 thành Hậu.',
    rhyme: 'Xe giữ cột, Tốt tiến',
  },
  {
    id: 'two-pawns-tandem',
    level: 'advanced',
    title: 'Cặp Tốt sát nhau cùng tiến',
    goal: 'promote',
    fen: '7k/8/8/3K4/4PP2/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Hai Tốt e4 f4 đứng cạnh nhau. Đẩy cả cặp cùng tiến, Vua Đen chỉ chặn được một cột.',
    explanation:
      'Hai Tốt sát nhau thì không Tốt nào cản được: đẩy e5 rồi f5, giữ chúng luôn cạnh nhau. Vua Đen ở h8 chỉ kịp chặn một con, con kia lên hàng 8 thành Hậu.',
    rhyme: 'Cặp Tốt cùng tiến',
  },
  {
    id: 'queen-and-pawn',
    level: 'advanced',
    title: 'Hậu + Tốt: Tốt vẫn là nhân vật chính',
    goal: 'promote',
    fen: '7k/8/1KP5/8/8/8/8/2Q5 w - - 0 1',
    playerSide: 'white',
    hint: 'Có Hậu cũng đứng đẩy Tốt: b6 lên b7 rồi b8 thành Hậu. Đừng chiếu mãi mà quên Tốt.',
    explanation:
      'Việc chính vẫn là TỐT: b7 rồi b8 thành Hậu. Hậu c1 canh sẵn cột c và hàng 1 nên Vua Đen ở h8 không dám lại gần - đây là cách tránh hòa vô cớ.',
    rhyme: 'Tốt lên, Hậu canh',
  },
  {
    id: 'knight-smother-mate',
    level: 'advanced',
    title: 'Chiếu bí “nghẹt” bằng Mã',
    goal: 'checkmate',
    fen: '6rk/6p1/6KN/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Mã h6 nhảy f7 là chiếu bí: Vua Đen h8 bị Xe g8 và Tốt g7 của chính mình chặn, còn Vua Trắng g6 giữ ô h7.',
    explanation:
      'Mã h6 lên f7 chiếu Vua h8; ô g8 là Xe Đen, ô g7 là Tốt Đen, ô h7 đã bị Vua Trắng g6 giữ. Đây là kiểu “chiếu bí nghẹt” - đối thủ tự nhốt mình, Mã chỉ việc đứng chiếu.',
    rhyme: 'Mã chiếu, địch tự nhốt',
  },
]

export function getEndgame(id: string): EndgameChallenge | undefined {
  return ENDGAMES.find((challenge) => challenge.id === id)
}
