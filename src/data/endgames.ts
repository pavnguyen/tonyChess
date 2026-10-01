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
    explanation: 'Hậu chiếu dọc cột a, Vua Trắng khóa cửa b8 — Vua Đen hết đường chạy.',
    rhyme: 'Hậu kề Vua bí',
  },
]

export function getEndgame(id: string): EndgameChallenge | undefined {
  return ENDGAMES.find((challenge) => challenge.id === id)
}
