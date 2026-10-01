import type { Side } from '../types'

/**
 * Tàn cuộc Xe + Tốt (§4.5).
 *
 * Đây là bộ **kỹ thuật tàn cuộc** quan trọng nhất của cờ vua thực chiến: ở trình độ
 * 1200-1400, phần lớn điểm số thắng/thua nằm ở đây.
 *
 * Mỗi thế đều được **máy chứng minh kết quả** (thắng hay hòa) bằng Stockfish trong
 * `scripts/verify-endgames.mjs` - không chỉ kiểm "có nước hợp lệ".
 */

export type RookEndgameResult = 'win' | 'draw'

export interface RookEndgame {
  id: string
  title: string
  /** Kết quả đúng của thế cờ khi cả hai bên chơi tối ưu. */
  result: RookEndgameResult
  emoji: string
  fen: string
  /** Bên đi trước. */
  playerSide: Side
  /** Điểm mấu chốt của kỹ thuật, một câu. */
  idea: string
  /** Khẩu quyết vè 4-6 chữ. */
  rhyme: string
}

export const ROOK_ENDGAMES: RookEndgame[] = [
  {
    id: 'lucena',
    title: 'Bắc cầu Lucena',
    result: 'win',
    emoji: '🌉',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    playerSide: 'white',
    idea: 'Dùng Xe làm "mái che" cho Vua tránh các nước chiếu từ xa, rồi đưa Vua ra rồi đẩy Tốt lên thành Hậu. Đây là thế thắng chuẩn của Xe + Tốt chống Xe.',
    rhyme: 'Xe che Vua tiến',
  },
  {
    id: 'philidor',
    title: 'Bức tường hàng 6 Philidor',
    result: 'draw',
    emoji: '🧱',
    fen: '8/3k4/8/3P4/2K5/8/r7/7R b - - 0 1',
    playerSide: 'black',
    idea: 'Bên phòng thủ giữ Vua trước mặt Tốt, Xe đứng hàng 6 ngăn Vua đối phương bước ra. Đúng thế này thì hòa, dù kém một Tốt.',
    rhyme: 'Tường hàng sáu hòa',
  },
  {
    id: 'vancura',
    title: 'Phòng thủ Vancura',
    result: 'draw',
    emoji: '🛡️',
    fen: '8/5k2/P5r1/K7/8/8/8/8 w - - 0 1',
    playerSide: 'white',
    idea: 'Với Tốt biên (cột a/h), bên phòng thủ để Xe quấy Tốt từ bên hông (hàng 6) và Vua tiến tới - Tốt biên không thể phong Hậu. Hòa cờ.',
    rhyme: 'Tốt biên khó thắng',
  },
  {
    id: 'stop-pawn',
    title: 'Chặn Tốt sắp thành Hậu',
    result: 'win',
    emoji: '⛔',
    fen: '8/8/8/8/8/2k5/1p6/1K1R4 w - - 0 1',
    playerSide: 'white',
    idea: 'Tốt Đen chỉ còn một bước là phong Hậu. Xe phải chặn ngay từ phía sau rồi dùng Vua bắt gọn Tốt - chặn được là thắng.',
    rhyme: 'Xe chặn Tốt lại',
  },
]

export function rookEndgameById(id: string): RookEndgame | undefined {
  return ROOK_ENDGAMES.find((lesson) => lesson.id === id)
}
