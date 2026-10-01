import type { Side } from '../types'

/**
 * Chiến lược vị trí (§4.3).
 *
 * Khác với câu đố chiến thuật (đòn ăn quân ngay), đây là những khái niệm **vị trí**:
 * nhìn thế cờ để biết *nên làm gì* khi chưa có đòn nào. Mỗi bài là một thế cờ tĩnh
 * + "dấu hiệu nhận biết" + lời giải thích.
 *
 * Mọi bài đều được máy kiểm chứng trong `scripts/validate-chess.ts` (FEN hợp lệ,
 * không đang bị chiếu, và khái niệm được chứng minh đúng bằng quân cờ thật).
 */

export type PositionalConcept = 'outpost' | 'open-file' | 'bishop-pair' | 'seventh-rank'

export interface PositionalMarker {
  square: string
  tone: 'good' | 'bad'
}

export interface PositionalLesson {
  id: string
  concept: PositionalConcept
  title: string
  emoji: string
  fen: string
  playerSide: Side
  /** Ô cần tô để bé thấy mấu chốt của bài. */
  markers: PositionalMarker[]
  /** Dấu hiệu nhận biết - một câu nhìn là thấy. */
  clue: string
  explanation: string
  /** Khẩu quyết vè 4-6 chữ. */
  rhyme: string
}

export const POSITIONAL_META: Record<PositionalConcept, { label: string; emoji: string }> = {
  outpost: { label: 'Tiền đồn', emoji: '🐴' },
  'open-file': { label: 'Cột mở', emoji: '📏' },
  'bishop-pair': { label: 'Cặp Tượng', emoji: '⛪' },
  'seventh-rank': { label: 'Xe hàng 7', emoji: '7️⃣' },
}

export const POSITIONAL: PositionalLesson[] = [
  {
    id: 'outpost',
    concept: 'outpost',
    title: 'Tiền đồn cho Mã',
    emoji: '🐴',
    fen: 'r1bqkb1r/pp3ppp/2n5/3N4/4P3/8/PPP2PPP/R1BQKB1R w KQkq - 0 1',
    playerSide: 'white',
    markers: [{ square: 'd5', tone: 'good' }],
    clue: 'Mã đứng trên ô mà TỐT địch KHÔNG thể đuổi được.',
    explanation:
      'Mã ở d5 được Tốt e4 che chở, mà Đen lại chẳng còn Tốt c6 hay e6 nào để đá nó đi. Một Mã đứng vững như vậy gọi là "tiền đồn" - vừa chắc vừa kiểm soát cả vùng trung tâm.',
    rhyme: 'Tiền đồn Mã chắc',
  },
  {
    id: 'open-file',
    concept: 'open-file',
    title: 'Cột mở cho Xe',
    emoji: '📏',
    fen: 'r1bqk2r/pp2nppp/2n1p3/3pP3/3P4/2N5/PP3PPP/R1BQK2R w KQkq - 0 1',
    playerSide: 'white',
    markers: [
      { square: 'c5', tone: 'good' },
      { square: 'c4', tone: 'good' },
    ],
    clue: 'Cột không còn Tốt nào - Xe chiếm vào là mạnh nhất.',
    explanation:
      'Cột c trống trơn, không một Tốt nào cản. Xe của ai chiếm được cột mở trước thì làm chủ cả cột, tràn xuống hàng 7 phá Tốt và nhốt Vua địch.',
    rhyme: 'Cột mở Xe vào',
  },
  {
    id: 'bishop-pair',
    concept: 'bishop-pair',
    title: 'Sức mạnh của Cặp Tượng',
    emoji: '⛪',
    fen: 'r2qkb1r/pppp1ppp/2n2n2/8/8/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1',
    playerSide: 'white',
    markers: [
      { square: 'c1', tone: 'good' },
      { square: 'f1', tone: 'good' },
    ],
    clue: 'Hai Tượng phủ HAI màu ô khác nhau.',
    explanation:
      'Trắng giữ được cả hai Tượng, phủ kín cả ô sáng lẫn ô tối. Trong thế cờ thoáng, cặp Tượng thường mạnh hơn Tượng + Mã vì chúng canh được gần như cả bàn cờ cùng lúc.',
    rhyme: 'Hai Tượng canh trời',
  },
  {
    id: 'seventh-rank',
    concept: 'seventh-rank',
    title: 'Xe trên hàng 7',
    emoji: '7️⃣',
    fen: '6k1/1p1R1ppp/8/8/8/8/8/4K3 w - - 0 1',
    playerSide: 'white',
    markers: [{ square: 'd7', tone: 'good' }],
    clue: 'Hàng 7 là hàng Tốt của đối thủ - Xe vào đó như cáo vào chuồng gà.',
    explanation:
      'Xe ở d7 đứng ngay trên hàng Tốt Đen, tấn công b7 và f7 cùng lúc. Hàng 7 là nơi Xe "hái" Tốt và trói Vua địch vào việc phòng thủ.',
    rhyme: 'Xe hái Tốt hàng 7',
  },
]

export function positionalByConcept(concept: PositionalConcept): PositionalLesson[] {
  return POSITIONAL.filter((lesson) => lesson.concept === concept)
}
