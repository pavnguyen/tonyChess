/**
 * 10 NGUYÊN TẮC VÀNG - trái tim của tab Chiến lược.
 *
 * Vì sao có file này: mục tiêu của app là giúp bé chơi cờ **GIỎI** (trình độ phong
 * trào, chơi được với bạn bè và người lớn trong gia đình), chứ không phải luyện tới
 * Grand Master. Người chơi giỏi không thắng nhờ thuộc lòng biến khai cuộc, mà nhờ
 * **mười thói quen** dưới đây - áp dụng được ở mọi ván, mọi thế cờ.
 *
 * Mỗi nguyên tắc giờ có thêm **hai thế cờ minh hoạ**: một thế "NÊN" (xanh) và một
 * thế "KHÔNG NÊN" (đỏ). Bé bấm thẻ là soi thế cờ lên bàn cờ lớn để **nhìn thấy**
 * điều vừa đọc, chứ không học chay bằng chữ.
 *
 * Mọi FEN và mọi ô tô màu đều được `scripts/validate-chess.ts` kiểm tra (FEN hợp lệ,
 * không đang bị chiếu, đúng lượt Trắng) - thêm một nguyên tắc mới mà gõ sai thế cờ
 * là bài kiểm báo ngay.
 */
// Ghi rõ đuôi `.ts` vì file này còn được nạp thẳng bằng Node (type-stripping) trong
// `scripts/validate-chess.ts` - Node không tự thêm đuôi như Vite.
import { BOARD_MARKS } from '../lib/notation.ts'
import type { PieceCode } from '../types'

/** Ô tô sáng trên bàn cờ minh hoạ: xanh = điều nên làm, đỏ = điều nên tránh. */
export interface PrincipleMark {
  square: string
  tone: 'good' | 'bad'
  /** Nhãn ngắn hiện khi bé rê chuột - để biết vì sao ô đó được tô. */
  label: string
}

/** Một thế cờ minh hoạ cho một nguyên tắc. */
export interface PrincipleBoard {
  fen: string
  /** Một câu giải thích thế cờ này đang khoe điều gì. */
  note: string
  marks: PrincipleMark[]
}

export interface GoldPrinciple {
  id: string
  /** Số thứ tự hiển thị (1-10). */
  order: number
  title: string
  emoji: string
  /** Câu bé tự hỏi mình trước mỗi nước đi. */
  ask: string
  /** Vì sao nguyên tắc này quan trọng - một câu ngắn. */
  why: string
  /** Khẩu quyết vè 4-6 chữ. */
  rhyme: string
  /** Quân cờ gắn với nguyên tắc (để tô màu/thẻ). */
  piece: PieceCode
  /** Thế cờ "nên làm" - xanh. */
  good: PrincipleBoard
  /** Thế cờ "không nên" - đỏ. */
  bad: PrincipleBoard
  /** Khoá giải thích ⓘ (nếu có) - ví dụ khái niệm chiến lược liên quan. */
  info?: string
  /**
   * 2-3 câu nhắc ngắn, dễ nhớ cho RIÊNG quân của nguyên tắc (hiện khi mở thẻ).
   * Dùng khi một quân cần thêm luật chơi mà bàn cờ minh hoạ không nói hết - ví dụ
   * Tượng chỉ đi một màu ô, Tượng bị Tốt nhà chặn là Tượng xấu.
   */
  tips?: string[]
}

/**
 * Màu tô ô cho bàn cờ minh hoạ nguyên tắc: xanh lá = nên, đỏ đất = nên tránh.
 *
 * Lấy thẳng từ `BOARD_MARKS` trong `src/lib/notation.ts` - nơi khai báo màu của
 * **mọi** vệt tô trên bàn cờ ở cả năm tab. Nhờ vậy bảng chú giải, thẻ nguyên tắc
 * và bàn cờ không thể lệch màu nhau.
 */
export const PRINCIPLE_TONE_STYLES: Record<
  'good' | 'bad',
  { fill: string; ring: string }
> = {
  good: { fill: BOARD_MARKS.goodFill, ring: BOARD_MARKS.goodRing },
  bad: { fill: BOARD_MARKS.badFill, ring: BOARD_MARKS.badRing },
}

export const GOLD_PRINCIPLES: GoldPrinciple[] = [
  {
    id: 'center',
    order: 1,
    title: 'Chiếm trung tâm bằng Tốt',
    emoji: '🎯',
    ask: 'Hai Tốt d và e của mình đã ra giữa bàn chưa?',
    why: 'Bốn ô d4-e4-d5-e5 là chỗ mọi quân đều muốn đi qua. Chiếm trung tâm trước thì quân mình có đường, quân địch bị bó trong nhà.',
    rhyme: 'Hai Tốt ra giữa',
    piece: 'p',
    good: {
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
      note: 'Hai Tốt d4-e4 đứng giữa bàn: mỗi Tốt kiểm soát hai ô trung tâm, mở đường cho cả Hậu lẫn Tượng.',
      marks: [
        { square: 'd4', tone: 'good', label: 'Tốt giữ ô trung tâm' },
        { square: 'e4', tone: 'good', label: 'Tốt giữ ô trung tâm' },
      ],
    },
    bad: {
      fen: 'rnbqkbnr/pppppppp/8/7p/7P/P7/1PPPPPP1/RNBQKBNR w KQkq - 0 3',
      note: 'Tốt chỉ nhích ở hai rìa a4 và h4, còn d2-e2 vẫn nằm nhà: trung tâm trống hoàn toàn, quân nặng không có đường vào.',
      marks: [
        { square: 'd2', tone: 'bad', label: 'Tốt trung tâm còn nhà' },
        { square: 'e2', tone: 'bad', label: 'Tốt trung tâm còn nhà' },
      ],
    },
  },
  {
    id: 'develop',
    order: 2,
    title: 'Phát triển quân nhanh',
    emoji: '🚀',
    ask: 'Còn mấy quân mình vẫn đang nằm ở hàng cuối?',
    why: 'Mỗi nước nên đưa ra một quân MỚI. Quân ở nhà là quân chưa tham chiến.',
    rhyme: 'Mã Tượng ra trước',
    piece: 'n',
    good: {
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 7 5',
      note: 'Cả hai Mã và một Tượng đã ra trận, Tượng c1 còn một nước là ra: phát triển xong rồi mới mở cánh.',
      marks: [
        { square: 'c3', tone: 'good', label: 'Mã đã ra trận' },
        { square: 'c4', tone: 'good', label: 'Tượng đã ra trận' },
        { square: 'f3', tone: 'good', label: 'Mã đã ra trận' },
      ],
    },
    bad: {
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 4 3',
      note: 'Mới một Tượng ra ngoài, cả hai Mã vẫn ở hàng cuối: quân không ra trận thì không có thế tấn công nào.',
      marks: [
        { square: 'b1', tone: 'bad', label: 'Mã chưa ra trận' },
        { square: 'g1', tone: 'bad', label: 'Mã chưa ra trận' },
      ],
    },
  },
  {
    id: 'castle',
    order: 3,
    title: 'Nhập thành sớm, giấu Vua',
    emoji: '🏰',
    ask: 'Vua mình còn đứng giữa bàn không? Nhập thành được chưa?',
    why: 'Vua đứng giữa bàn là mục tiêu to nhất. Nhập thành đưa Vua vào góc sau hàng Tốt, đồng thời đưa Xe ra giữa tham chiến.',
    rhyme: 'Vua vào trong lều',
    piece: 'k',
    good: {
      fen: 'r1bqk2r/ppp1pppp/2np1n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQR1K1 w kq - 2 6',
      note: 'Vua g1 ngồi sau hàng Tốt, Xe f1 đã ra giữa: nhập thành xong là Vua an toàn, Xe nhập cuộc.',
      marks: [
        { square: 'g1', tone: 'good', label: 'Vua trong lều' },
        { square: 'f1', tone: 'good', label: 'Xe ra giữa' },
      ],
    },
    bad: {
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 5 5',
      note: 'Vua e1 vẫn đứng giữa cột e, Xe h1 còn kẹt trong góc: chậm nhập thành là tự trao mục tiêu cho đối thủ.',
      marks: [
        { square: 'e1', tone: 'bad', label: 'Vua còn giữa bàn' },
        { square: 'h1', tone: 'bad', label: 'Xe còn kẹt góc' },
      ],
    },
  },
  {
    id: 'hanging',
    order: 4,
    title: 'Coi chừng quân treo',
    emoji: '🪝',
    ask: 'Quân mình vừa định để đó có ai che không? Có quân địch nào đang chĩa vào nó không?',
    why: 'Đa số ván cờ của người mới chơi thua chỉ vì "cúng" quân miễn phí. Trước khi đi, luôn đếm lại một lượt.',
    rhyme: 'Đếm quân trước đi',
    piece: 'b',
    good: {
      fen: '4k3/8/8/3N4/4P3/8/8/4K3 w - - 0 1',
      note: 'Mã d5 được Tốt e4 đỡ phía sau - quân nào ra trận cũng phải có bạn bảo vệ.',
      marks: [
        { square: 'd5', tone: 'good', label: 'Mã có Tốt đỡ' },
        { square: 'e4', tone: 'good', label: 'Tốt bảo vệ Mã' },
      ],
    },
    bad: {
      fen: '4k3/8/4b3/3N4/8/8/8/4K3 w - - 0 1',
      note: 'Mã d5 bị Tượng e6 chĩa vào mà chẳng quân nào đỡ - kiểu "cúng quân" này chiếm phần lớn ván cờ của người mới.',
      marks: [
        { square: 'd5', tone: 'bad', label: 'Quân đang bị treo' },
        { square: 'e6', tone: 'bad', label: 'Quân địch chĩa vào' },
      ],
    },
  },
  {
    id: 'open-file',
    order: 5,
    title: 'Đưa Xe vào cột mở',
    emoji: '📏',
    ask: 'Có cột nào hết Tốt để Xe mình tràn xuống không?',
    why: 'Xe chỉ mạnh khi có đường dài. Cột mở là con đường cao tốc dành riêng cho Xe.',
    rhyme: 'Xe vào cột mở',
    piece: 'r',
    info: 'positional:open-file',
    good: {
      fen: 'r1bqk2r/pp2nppp/2n1p3/3pP3/3P4/2N5/PP3PPP/R1BQK2R w KQkq - 0 1',
      note: 'Cột c không còn Tốt nào - Xe chiếm vào là nắm con đường cao tốc chạy khắp bàn cờ.',
      marks: [
        { square: 'c5', tone: 'good', label: 'Cột mở, Xe nên vào' },
        { square: 'c4', tone: 'good', label: 'Cột mở, Xe nên vào' },
      ],
    },
    bad: {
      fen: '4k3/8/8/8/8/2P5/2R5/4K3 w - - 0 1',
      note: 'Xe c2 bị chính Tốt c3 chặn ngay trước mặt: cả cột c thành ngõ cụt, Xe mất hết sức mạnh.',
      marks: [
        { square: 'c2', tone: 'bad', label: 'Xe bị nhốt sau Tốt' },
        { square: 'c3', tone: 'bad', label: 'Tốt chặn Xe' },
      ],
    },
  },
  {
    id: 'outpost',
    order: 6,
    title: 'Đặt Mã lên tiền đồn',
    emoji: '🐴',
    ask: 'Có ô nào Tốt địch không đuổi được Mã mình không?',
    why: 'Mã đứng trên ô mà Tốt địch không tới đánh được thì không ai xua nổi nó đi - nó toả sức mạnh suốt ván.',
    rhyme: 'Mã lên tiền đồn',
    piece: 'n',
    info: 'positional:outpost',
    good: {
      fen: 'r1bqkb1r/pp3ppp/2n5/3N4/4P3/8/PPP2PPP/R1BQKB1R w KQkq - 0 1',
      note: 'Mã d5 đứng trên ô mà Tốt Đen không tài nào đuổi được, lại được Tốt e4 che - một tiền đồn vững như bàn thạch.',
      marks: [
        { square: 'd5', tone: 'good', label: 'Mã tiền đồn' },
        { square: 'e4', tone: 'good', label: 'Tốt che Mã' },
      ],
    },
    bad: {
      fen: '4k3/8/8/1p6/N7/8/8/4K3 w - - 0 1',
      note: 'Mã a4 nằm ở rìa bàn lại bị Tốt b5 chĩa vào: vừa ít nước đi, vừa sắp bị đá đi mất.',
      marks: [
        { square: 'a4', tone: 'bad', label: 'Mã ra rìa bàn' },
        { square: 'b5', tone: 'bad', label: 'Tốt sẽ đuổi Mã' },
      ],
    },
  },
  {
    id: 'seventh-rank',
    order: 7,
    title: 'Xe lên hàng 7',
    emoji: '7️⃣',
    ask: 'Xe mình có thể lên hàng Tốt của địch không?',
    why: 'Xe ở hàng 7 vừa hái Tốt chưa tiến, vừa nhốt Vua địch ở hàng cuối - dân cờ gọi là "con lợn trên hàng 7".',
    rhyme: 'Xe hái Tốt hàng bảy',
    piece: 'r',
    info: 'positional:seventh-rank',
    good: {
      fen: '6k1/1p1R1ppp/8/8/8/8/8/4K3 w - - 0 1',
      note: 'Xe d7 vào tận hàng Tốt của Đen: cùng lúc tấn công Tốt b7 lẫn f7 và nhốt Vua Đen ở hàng cuối.',
      marks: [
        { square: 'd7', tone: 'good', label: 'Xe trên hàng 7' },
        { square: 'b7', tone: 'good', label: 'Tốt bị hái' },
      ],
    },
    bad: {
      fen: '6k1/1p3ppp/8/8/8/4P3/4P3/4R1K1 w - - 0 1',
      note: 'Xe e1 bị Tốt nhà chặn ngay trước mặt, chẳng hái được Tốt nào - trong khi hàng 7 của Đen đang rộng mở.',
      marks: [
        { square: 'e1', tone: 'bad', label: 'Xe bị nhốt' },
        { square: 'e2', tone: 'bad', label: 'Tốt chặn Xe' },
      ],
    },
  },
  {
    id: 'passed-pawn',
    order: 8,
    title: 'Tạo và đẩy Tốt thông',
    emoji: '🌱',
    ask: 'Có Tốt nào của mình mà không còn Tốt địch nào cản đường không?',
    why: 'Tốt thông là niềm hy vọng lớn nhất ở tàn cuộc: nó cứ tiến lên, và mỗi bước lại ép địch phải lo.',
    rhyme: 'Tốt thông cứ tiến',
    piece: 'p',
    good: {
      fen: '4k3/pp6/8/3P4/8/8/8/4K3 w - - 0 1',
      note: 'Tốt d5 không còn Tốt Đen nào ở cột d, c hay e cản: cứ đẩy thẳng, Đen phải tung quân to ra chặn.',
      marks: [{ square: 'd5', tone: 'good', label: 'Tốt thông' }],
    },
    bad: {
      fen: '4k3/8/8/8/2P5/2P5/8/4K3 w - - 0 1',
      note: 'Hai Tốt chồng ở cột c vừa vướng chân vừa không bảo vệ nhau: đó là Tốt yếu, đừng tạo.',
      marks: [
        { square: 'c3', tone: 'bad', label: 'Tốt chồng' },
        { square: 'c4', tone: 'bad', label: 'Tốt chồng' },
      ],
    },
  },
  {
    id: 'bishop-pair',
    order: 9,
    title: 'Giữ cặp Tượng',
    emoji: '⛪',
    ask: 'Tượng mình đang nhắm ô nào - và mình có đang giữ được cả hai Tượng không?',
    why: 'Tượng chỉ đi được MỘT màu ô, nên giữ đủ cặp Tượng là phủ kín cả hai màu - càng về tàn cuộc càng mạnh.',
    rhyme: 'Giữ đủ hai Tượng',
    piece: 'b',
    info: 'positional:bishop-pair',
    tips: [
      'Tượng ô đen KHÔNG che được ô trắng - mất một Tượng là mất nửa bàn cờ.',
      'Đừng đổi Tượng lấy Mã khi chưa có lý do: cặp Tượng càng về tàn cuộc càng mạnh.',
      'Đưa Tượng ra TRƯỚC khi khoá Tốt; Tượng bị Tốt nhà chặn là “Tượng xấu”, gần như vô dụng.',
      'Tượng thích đường chéo dài: nhắm f7 hoặc h7 của Vua Đen là con đường tấn công nhanh nhất.',
    ],
    good: {
      fen: 'r2qkb1r/pppp1ppp/2n2n2/8/8/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1',
      note: 'Trắng giữ đủ hai Tượng phủ cả ô sáng lẫn ô tối, còn Đen đã mất một Tượng - lợi thế lâu dài thuộc về Trắng.',
      marks: [
        { square: 'c1', tone: 'good', label: 'Tượng ô đen' },
        { square: 'f1', tone: 'good', label: 'Tượng ô sáng' },
      ],
    },
    bad: {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/8/8/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
      note: 'Tượng f1 đã bị đổi mất, Trắng chỉ còn một Tượng trong khi Đen giữ đủ cặp - lợi thế đã sang tay Đen.',
      marks: [{ square: 'f1', tone: 'bad', label: 'Mất Tượng ngay đây' }],
    },
  },
  {
    id: 'trade',
    order: 10,
    title: 'Đổi quân đúng lúc',
    emoji: '⚖️',
    ask: 'Mình đang hơn quân hay kém quân? Nếu hơn thì có nên đổi bớt cho gọn không?',
    why: 'Hơn quân thì chủ động đổi quân để tiến thẳng tới thắng; kém quân thì giữ quân, tạo thế rối.',
    rhyme: 'Hơn thì đổi gọn',
    piece: 'q',
    good: {
      fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1',
      note: 'Hơn hẳn một Xe: chủ động đổi quân cho gọn để đưa ván cờ về tàn cuộc dễ thắng.',
      marks: [{ square: 'a1', tone: 'good', label: 'Hơn hẳn một Xe' }],
    },
    bad: {
      fen: '6kr/8/8/8/8/8/8/4K3 w - - 0 1',
      note: 'Kém hẳn một Xe: đừng đổi quân vội - phải giữ quân lại và tạo thế rối để tìm đường hòa.',
      marks: [{ square: 'h8', tone: 'bad', label: 'Đen hơn một Xe' }],
    },
  },
]

export function goldPrincipleById(id: string): GoldPrinciple | undefined {
  return GOLD_PRINCIPLES.find((principle) => principle.id === id)
}
