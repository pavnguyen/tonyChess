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
    title: 'Hậu + Vua chiếu bí',
    goal: 'checkmate',
    fen: '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đã đứng ngay trước mặt Vua Đen (ô g6). Đẩy Hậu xuống f8 là chiếu bí.',
    explanation:
      'Cách chiếu bí bằng Hậu: Vua mình tiến sát để giữ ô chạy, Hậu chiếu từ xa. Hậu f8 vừa chiếu vừa khóa hàng 8, Vua Đen không còn ô nào — hết ván.',
    rhyme: 'Hậu chiếu, Vua đã giữ',
  },
]

export function getEndgame(id: string): EndgameChallenge | undefined {
  return ENDGAMES.find((challenge) => challenge.id === id)
}
