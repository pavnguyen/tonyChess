import type { EndgameChallenge } from '../types'

export const ENDGAMES: EndgameChallenge[] = [
  {
    id: 'promote-easy',
    title: 'Tốt đua biến Hậu (dễ)',
    goal: 'promote',
    fen: 'k7/8/3K4/4P3/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng đi trước dọn đường, Tốt cứ thế tiến thẳng lên hàng 8.',
    explanation: 'Vua đi trước che chở cho Tốt, Tốt cứ tiến lên là thành Hậu!',
    rhyme: 'Tốt lên thành Hậu',
  },
  {
    id: 'promote-medium',
    title: 'Vua & Tốt đua biến Hậu',
    goal: 'promote',
    fen: '8/5k2/3K4/4P3/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Đưa Vua lên trước bảo vệ Tốt, đừng để Vua Đen chặn đường.',
    explanation: 'Vua phải đi trước làm lá chắn thì Tốt mới ung dung lên Hậu.',
    rhyme: 'Vua che Tốt tiến',
  },
  {
    id: 'mate-two-rooks',
    title: 'Chiếu bí bằng 2 Xe',
    goal: 'checkmate',
    fen: '7k/R7/8/8/8/4K3/8/2R5 w - - 0 1',
    playerSide: 'white',
    hint: 'Xe a7 đã canh hàng 7, chỉ cần đưa Xe kia lên hàng 8 chiếu bí.',
    explanation: 'Hai Xe phối hợp: một Xe giữ hàng 7, một Xe chiếu bí trên hàng 8.',
    rhyme: 'Thang Xe bí Vua',
  },
  {
    id: 'mate-queen',
    title: 'Chiếu bí bằng Hậu + Vua',
    goal: 'checkmate',
    fen: 'k7/2K1Q3/8/8/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Đưa Hậu xuống cột a để chiếu dọc; Vua Trắng đã canh chặt cửa b8, b7.',
    explanation: 'Hậu chiếu dọc cột a, Vua Trắng khóa cửa b8 - Vua Đen hết đường chạy.',
    rhyme: 'Hậu kề Vua bí',
  },

  // ── Bốn thế chiếu bí kinh điển - kỳ thủ nào cũng phải thuộc lòng ──
  {
    id: 'mate-rook-and-king',
    title: 'Xe + Vua chiếu bí (thế cơ bản)',
    goal: 'checkmate',
    fen: 'k7/8/1K6/8/8/8/8/7R w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Trắng ở b6 đã khóa hai cửa a7, b7. Chỉ cần Xe tràn xuống hàng 8.',
    explanation:
      'Vua Trắng canh a7 và b7, Xe xuống hàng 8 chiếu từ xa - Vua Đen hết đường chạy. Đây là cách kết thúc ván đấu chỉ bằng Xe + Vua.',
    rhyme: 'Vua khóa, Xe chiếu',
  },
  {
    id: 'mate-back-rank',
    title: 'Chiếu bí hàng cuối',
    goal: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    playerSide: 'white',
    hint: 'Ba Tốt f7, g7, h7 của Đen đang tự chặn đường Vua. Đưa Xe lên hàng 8.',
    explanation:
      'Bẫy hàng cuối: Vua Đen tự nhốt mình sau hàng Tốt, chỉ một nước Xe lên hàng 8 là chiếu bí. Phải luôn để mắt tới nó.',
    rhyme: 'Coi chừng hàng cuối',
  },
  {
    id: 'mate-two-bishops',
    title: 'Tượng đôi chiếu bí',
    goal: 'checkmate',
    fen: '7k/5K2/7B/8/8/8/2B5/8 w - - 0 1',
    playerSide: 'white',
    hint: 'Một Tượng canh ô h7, Vua Trắng canh g7 và g8. Còn lại là dùng Tượng ở h6.',
    explanation:
      'Tượng h6 sang g7 chiếu bí: Vua Trắng giữ g8, Tượng còn lại giữ h7. Hai Tượng hợp lại mạnh hơn hẳn một con số cộng.',
    rhyme: 'Hai Tượng đan lưới',
  },
  {
    id: 'mate-smothered-knight',
    title: 'Chiếu bí ngạt bằng Mã',
    goal: 'checkmate',
    fen: '6rk/6pp/3N4/8/8/8/8/4K3 w - - 0 1',
    playerSide: 'white',
    hint: 'Vua Đen bị Xe và hai Tốt của chính mình bưng kín. Mã đang ở d6, nhảy về đâu?',
    explanation:
      'Mã nhảy f7 chiếu bí: Vua Đen ở h8 không còn ô nào vì Xe g8, Tốt g7 và h7 đều là quân nhà. Đây là thế “chiếu bí ngạt” nổi tiếng.',
    rhyme: 'Ngạt vì quân nhà',
  },
]

export function getEndgame(id: string): EndgameChallenge | undefined {
  return ENDGAMES.find((challenge) => challenge.id === id)
}
