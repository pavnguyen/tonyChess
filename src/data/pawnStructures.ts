import type { PawnStructureLesson } from '../types'

/**
 * Màu cho bé nhận diện Tốt: 🟢 xanh lá = Tốt khoẻ, 🔴 đỏ đất = Tốt yếu.
 * Khai báo một chỗ để bàn cờ và bảng chú giải luôn khớp nhau.
 */
export const PAWN_TONE_STYLES: Record<'good' | 'bad', { fill: string; ring: string; legend: string }> = {
  good: {
    fill: 'rgba(104, 174, 119, 0.55)',
    ring: 'inset 0 0 0 4px #3a7547',
    legend: '#3a7547',
  },
  bad: {
    fill: 'rgba(160, 74, 59, 0.5)',
    ring: 'inset 0 0 0 4px #a04a3b',
    legend: '#a04a3b',
  },
}

/**
 * Module “Chiến thuật Cấu trúc Tốt”.
 *
 * Tốt là xương sống của cờ vua: nó không đi lùi được, nên mỗi nước đẩy Tốt là một
 * quyết định vĩnh viễn. Ba thế dưới đây dạy bé nhận diện bằng MÀU:
 * 🟢 xanh = Tốt khoẻ, 🔴 đỏ = Tốt yếu.
 *
 * Mọi FEN và mọi ô được tô màu đều được `scripts/validate-chess.ts` kiểm tra:
 * ô được tô phải thật sự có Tốt, và thế Tốt phải đúng bản chất (Tốt thông không bị
 * Tốt địch nào cản; Tốt chồng phải có từ 2 Tốt cùng cột; Tốt cô lập không có Tốt
 * bạn ở hai cột bên cạnh).
 */
export const PAWN_STRUCTURES: PawnStructureLesson[] = [
  {
    id: 'passed-pawn',
    name: 'Tốt Thông',
    englishName: 'Passed Pawn',
    verdict: 'good',
    emoji: '🚀',
    fen: '4k3/pp6/8/3P4/8/8/8/4K3 w - - 0 1',
    markers: [{ square: 'd5', tone: 'good' }],
    reason:
      'Không còn Tốt Đen nào ở cột d hay hai cột c, e cản đường. Bé cứ đẩy thẳng, Đen phải dùng quân to ra chặn - quân đó lại thành mục tiêu.',
    rhyme: 'Tốt thông thẳng tiến',
  },
  {
    id: 'doubled-pawns',
    name: 'Tốt Chồng',
    englishName: 'Doubled Pawns',
    verdict: 'bad',
    emoji: '🪜',
    fen: '4k3/8/8/8/2P5/2P5/8/4K3 w - - 0 1',
    markers: [
      { square: 'c3', tone: 'bad' },
      { square: 'c4', tone: 'bad' },
    ],
    reason:
      'Hai Tốt Trắng đứng chung cột c nên không bảo vệ được nhau, lại còn vướng chân nhau: Tốt trên chắn đường Tốt dưới.',
    rhyme: 'Tốt chồng vướng chân',
  },
  {
    id: 'isolated-pawn',
    name: 'Tốt Cô Lập',
    englishName: 'Isolated Pawn',
    verdict: 'bad',
    emoji: '🫥',
    fen: '4k3/pp2p1pp/8/8/3P4/8/PP4PP/4K3 w - - 0 1',
    markers: [{ square: 'd4', tone: 'bad' }],
    reason:
      'Tốt Trắng ở d4 không có bạn nào ở cột c hay cột e để bảo vệ. Đến tàn cuộc nó là mục tiêu bị vây hãm cả ván.',
    rhyme: 'Tốt đơn mồ côi',
  },
]

export function getPawnStructure(id: string): PawnStructureLesson | undefined {
  return PAWN_STRUCTURES.find((structure) => structure.id === id)
}
