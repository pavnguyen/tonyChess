/**
 * Dòng chính của từng khai cuộc (§4.4).
 *
 * Mỗi khai cuộc chỉ giữ **MỘT dòng chính** - đúng dòng lý thuyết app dạy. Bỏ hẳn
 * cây phân nhánh: mục tiêu của app là giúp bé chơi cờ GIỎI (phong trào), mà người
 * chơi giỏi cần **nguyên tắc** (trung tâm, phát triển, nhập thành sớm, an toàn
 * Vua), không cần thuộc lòng từng biến. Nhờ vậy dữ liệu gọn và dễ kiểm chứng hơn
 * hẳn - không còn phải soi hợp lệ cho hàng trăm nhánh phụ.
 *
 * Toàn bộ nước đi ở đây là **dữ kiện cờ vua** (không ai giữ bản quyền), và mọi lời
 * bình đều do app tự viết.
 *
 * QUY TẮC BẮT BUỘC (được `scripts/validate-chess.ts` kiểm chứng):
 *  - mọi nước CỦA BÉ (đúng màu quân của bài) đều phải có `annotation`;
 *  - nước của đối thủ thì KHÔNG được có `annotation`;
 *  - dòng chính phải đủ dài (≥ 10 ply) để phần "kế hoạch trung cuộc" có nghĩa.
 */
import type { MoveAnnotation, OpeningMove, OpeningPlan, OpeningSideLine } from '../types'

interface OpeningTreeData {
  main: OpeningMove[]
  plan: OpeningPlan
  /** Biến phụ hay gặp - xem `OpeningSideLine` trong `src/types.ts`. */
  sidelines?: OpeningSideLine[]
}

const ann = (
  san: string,
  piece: MoveAnnotation['piece'],
  reason: string,
  rhyme: string,
): MoveAnnotation => ({ san, piece, reason, rhyme })

// ── Hệ thống London (bé cầm Trắng) ───────────────────────────────────────────
const LONDON: OpeningTreeData = {
  main: [
    { san: 'd4', annotation: ann('d4', 'p', 'Chiếm trung tâm, mở đường Tượng.', 'Dâng Tốt trung tâm') },
    { san: 'd5' },
    { san: 'Bf4', annotation: ann('Bf4', 'b', 'Đưa Tượng ra ngoài trước khi đóng Tốt.', 'Tượng phi ra trước') },
    { san: 'Nf6' },
    { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4, chuẩn bị nhập thành.', 'Mã nhảy giữ nhà') },
    { san: 'e6' },
    { san: 'e3', annotation: ann('e3', 'p', 'Khóa đuôi Tượng f4, làm chân đế giữ Tốt.', 'Chèn Tốt làm đế') },
    { san: 'c5' },
    { san: 'c3', annotation: ann('c3', 'p', 'Hoàn thành Kim tự tháp Tốt c3-d4-e3 siêu cứng.', 'Lô-kốt kiên cố') },
    { san: 'Nc6' },
    { san: 'Nbd2', annotation: ann('Nbd2', 'n', 'Mã lên d2 mở đường cho Tượng f1 và chuẩn bị đẩy e4.', 'Mã ra tiếp sức') },
    { san: 'Bd6' },
    { san: 'Bg3', annotation: ann('Bg3', 'b', 'Đổi Tượng để mở cột h - kế hoạch kinh điển của London.', 'Đổi Tượng mở cột') },
    { san: 'O-O' },
  ],
  plan: {
    title: 'Ba việc: dựng khung - đổi Tượng xấu - đánh cánh Vua',
    points: [
      'Đưa Tượng f1 ra d3 rồi nhập thành: ba nước là xong khung.',
      // Trong London Tượng ô đen của Đen đi ra d6 (không phải g7 như King's Indian),
      // và Tượng của bé đã sang g3 - nên phải đổi ở d6 mới đúng thế cờ.
      'Đổi Tượng g3 lấy Tượng d6: Đen mất Tượng ô đen thì các ô đen quanh Vua Đen thành mục tiêu.',
      'Đen dồn sang cánh Hậu thì đẩy h4-h5, đổi Tốt mở cột h rồi đưa Xe sang đánh Vua.',
    ],
  },
  sidelines: [
    {
      id: 'london-early-c5',
      label: 'Đen đi ...c5 sớm',
      idea: 'Đen đánh ngay vào d4 - bé cứ dựng kim tự tháp e3-c3 rồi mới tính đổi quân, đừng vội đẩy e4.',
      moves: [
        { san: 'd4', annotation: ann('d4', 'p', 'Chiếm trung tâm, mở đường Tượng.', 'Dâng Tốt trung tâm') },
        { san: 'd5' },
        { san: 'Bf4', annotation: ann('Bf4', 'b', 'Đưa Tượng ra trước khi đóng Tốt.', 'Tượng phi ra trước') },
        { san: 'c5' },
        { san: 'e3', annotation: ann('e3', 'p', 'Chèn Tốt e làm chân đế cho d4.', 'Chèn Tốt làm đế') },
        { san: 'Nc6' },
        { san: 'c3', annotation: ann('c3', 'p', 'Dựng nốt kim tự tháp c3-d4-e3.', 'Lô-kốt thật kiên cố') },
        { san: 'Nf6' },
      ],
    },
  ],
}

// ── Ván cờ Ý (bé cầm Trắng) ─────────────────────────────────────────────────
const ITALIAN: OpeningTreeData = {
  main: [
    { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
    { san: 'e5' },
    { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã tấn công Tốt e5 của Đen.', 'Mã ra dọa Tốt') },
    { san: 'Nc6' },
    { san: 'Bc4', annotation: ann('Bc4', 'b', 'Tượng nhắm thẳng vào điểm yếu f7 gần Vua Đen.', 'Tượng nhắm tim Vua') },
    { san: 'Bc5' },
    { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua chui vào lều') },
    { san: 'Nf6' },
    { san: 'd3', annotation: ann('d3', 'p', 'Mở đường cho Tượng c1 ra ngoài.', 'Mở cửa Tượng nhà') },
    { san: 'd6' },
    { san: 'c3', annotation: ann('c3', 'p', 'Chuẩn bị đẩy Tốt d4 mở trung tâm.', 'Chuẩn bị đẩy d4') },
    { san: 'O-O' },
  ],
  plan: {
    title: 'Ba việc: giữ ô f7 trong tầm ngắm',
    points: [
      'Đẩy d4 khi Mã f3 và Tốt c3 đã yểm trợ - mở trung tâm cho Tượng c4 nhắm f7.',
      // `...Xe f1 sang e1 nhường chỗ` BẮT BUỘC phải có: nhập thành xong thì Xe đang
      // đứng ở f1, nên câu “sang f1” mà không dọn Xe là nước không đi được.
      'Đưa Mã b1 lên d2, cho Xe f1 sang e1 nhường chỗ, rồi Mã f1 nhảy g3 đánh cánh Vua.',
      'Giữ Tượng c4, đừng đổi vội: hễ Đen sơ hở ở f7 là có nước chiếu hoặc ăn quân.',
    ],
  },
  sidelines: [
    {
      id: 'italian-two-knights',
      label: 'Đen đi 3...Nf6',
      idea: 'Đen ra Mã trước khi đóng Tốt - bé vẫn d3 rồi nhập thành, chưa vội Ng5 ăn Tốt.',
      moves: [
        { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
        { san: 'e5' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã tấn công Tốt e5 của Đen.', 'Mã ra dọa Tốt') },
        { san: 'Nc6' },
        { san: 'Bc4', annotation: ann('Bc4', 'b', 'Tượng nhắm thẳng vào điểm yếu f7.', 'Tượng nhắm tim Vua') },
        { san: 'Nf6' },
        { san: 'd3', annotation: ann('d3', 'p', 'Chèn Tốt d3 mở đường cho Tượng c1.', 'Mở cửa Tượng nhà') },
        { san: 'Bc5' },
      ],
    },
  ],
}

// ── Phòng thủ King’s Indian (bé cầm Đen) ────────────────────────────────────
const KINGS_INDIAN: OpeningTreeData = {
  main: [
    { san: 'd4' },
    { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã chặn Trắng đẩy Tốt e4.', 'Mã chặn trung tâm') },
    { san: 'c4' },
    { san: 'g6', annotation: ann('g6', 'p', 'Mở ô g7 đưa Tượng vào góc.', 'Mở cửa lều Tượng') },
    { san: 'Nc3' },
    { san: 'Bg7', annotation: ann('Bg7', 'b', 'Đưa Tượng vào Pháo đài càn quét đường chéo.', 'Tượng giấu trong lều') },
    { san: 'e4' },
    { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua an toàn nhất') },
    { san: 'Nf3' },
    { san: 'd6', annotation: ann('d6', 'p', 'Chống đỡ ô e5, chuẩn bị đẩy Tốt e5.', 'Tốt d giữ ô e5') },
    { san: 'Be2' },
    { san: 'e5', annotation: ann('e5', 'p', 'Đẩy Tốt e5 khoá trung tâm rồi đánh sang cánh Vua.', 'Tốt e khoá trung tâm') },
  ],
  plan: {
    title: 'Ba việc: pháo đài g7 - dọn f5 - đập cánh Vua',
    points: [
      'Đưa Mã f6 sang h5 (hoặc d7) dọn đường cho Tốt f5 - cột f mở thì Tượng g7 mới sáng.',
      'Đẩy f5 rồi f4 khi Trắng dồn sang cánh Hậu: cánh Vua là nơi TẤN CÔNG.',
      'Đưa Xe f8 lên e8 giữ ô e5 - mất e5 là Tượng g7 hết đất.',
    ],
  },
  sidelines: [
    {
      id: 'kid-vs-center',
      label: 'Trắng chơi 4.e4',
      idea: 'Trắng chiếm trung tâm - bé giữ pháo đài g7, đẩy d6 rồi e5, về sau mới mở cánh Vua.',
      moves: [
        { san: 'd4' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã chặn Trắng đẩy Tốt e4.', 'Mã chặn trung tâm') },
        { san: 'c4' },
        { san: 'g6', annotation: ann('g6', 'p', 'Mở ô g7 đưa Tượng vào góc.', 'Mở cửa lều Tượng') },
        { san: 'Nc3' },
        { san: 'Bg7', annotation: ann('Bg7', 'b', 'Đưa Tượng vào pháo đài chờ phản công.', 'Tượng giấu trong lều') },
        { san: 'e4' },
        { san: 'd6', annotation: ann('d6', 'p', 'Chống đỡ ô e5, chuẩn bị đẩy e5.', 'Tốt d giữ ô e5') },
      ],
    },
  ],
}

// ── Phòng thủ Sicilian (bé cầm Đen) ─────────────────────────────────────────
const SICILIAN: OpeningTreeData = {
  main: [
    { san: 'e4' },
    { san: 'c5', annotation: ann('c5', 'p', 'Khống chế ô d4 của Trắng từ cánh.', 'Tốt c ngáng đường') },
    { san: 'Nf3' },
    { san: 'd6', annotation: ann('d6', 'p', 'Mở đường cho Tượng và bảo vệ ô e5.', 'Dựng hàng rào Tốt') },
    { san: 'd4' },
    { san: 'cxd4', annotation: ann('cxd4', 'p', 'Ăn Tốt d4 để mở cột c cho Xe.', 'Đổi Tốt mở cột c') },
    { san: 'Nxd4' },
    { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã đe doạ Tốt e4 của Trắng.', 'Mã ra phản công') },
    { san: 'Nc3' },
    { san: 'a6', annotation: ann('a6', 'p', 'Đuổi quân Trắng ra khỏi ô b5, giữ cánh Hậu an toàn.', 'Tốt a giữ ô b5') },
    { san: 'Be3' },
    { san: 'e6', annotation: ann('e6', 'p', 'Dựng hàng rào Tốt e6-d6 vững chắc.', 'Hàng rào Tốt vững') },
  ],
  plan: {
    title: 'Ba việc: đổi Tốt c - mở cột c - đánh cánh Hậu',
    points: [
      'Đánh cánh Hậu bằng ...b5 rồi đưa Tượng c8 lên b7: Tượng b7 nhắm ô g2 trước Vua Trắng.',
      'Đổi quân trên d4 rồi đưa Xe a8 sang cột c vừa mở - đó là đường tấn công chính.',
      'Trắng nhập thành cánh Hậu thì dồn b5-b4, mở đường Tốt đánh thẳng vào Vua.',
    ],
  },
  sidelines: [
    {
      id: 'sicilian-closed',
      label: 'Trắng đi 2.Nc3',
      idea: 'Trắng chơi kín - bé cứ Nc6 rồi Bg7, giữ chặt d4 và chờ đẩy b5-b4 phản công.',
      moves: [
        { san: 'e4' },
        { san: 'c5', annotation: ann('c5', 'p', 'Khống chế ô d4 của Trắng từ cánh.', 'Tốt c ngáng đường') },
        { san: 'Nc3' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ ô d4, tăng sức ép trung tâm.', 'Mã giữ trung tâm') },
        { san: 'g3' },
        { san: 'g6', annotation: ann('g6', 'p', 'Mở đường cho Tượng vào pháo đài g7.', 'Mở cửa lều Tượng') },
        { san: 'Bg2' },
        { san: 'Bg7', annotation: ann('Bg7', 'b', 'Tượng vào g7 canh đường chéo dài.', 'Tượng giấu trong lều') },
      ],
    },
  ],
}

// ── Khai cuộc Tây Ban Nha / Ruy López (bé cầm Trắng) ────────────────────────
const RUY_LOPEZ: OpeningTreeData = {
  main: [
    { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
    { san: 'e5' },
    { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã tấn công Tốt e5 của Đen.', 'Mã ra dọa Tốt') },
    { san: 'Nc6' },
    { san: 'Bb5', annotation: ann('Bb5', 'b', 'Tượng áp sát Mã c6 - quân đang giữ Tốt e5.', 'Tượng ghim Mã Đen') },
    { san: 'a6' },
    { san: 'Ba4', annotation: ann('Ba4', 'b', 'Tượng lùi một bước mà vẫn giữ nguyên mũi ghim.', 'Lùi mà không mất') },
    { san: 'Nf6' },
    { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua chui vào lều') },
    { san: 'Be7' },
    { san: 'Re1', annotation: ann('Re1', 'r', 'Xe vào cột e, chuẩn bị đẩy Tốt d4.', 'Xe vào cột e') },
    { san: 'b5' },
    { san: 'Bb3', annotation: ann('Bb3', 'b', 'Tượng lùi về b3, vẫn nhắm ô f7 của Đen.', 'Lùi về nhắm f7') },
    { san: 'O-O' },
  ],
  plan: {
    title: 'Ba việc: ghim Mã c6 - giữ e5 yếu - chờ đẩy d4',
    points: [
      'Đẩy d3 rồi c3 trước, chỉ đẩy d4 khi Xe và Tượng đã sẵn - mở sớm là tự phá ghim.',
      'Giữ Tượng ở b3 nhắm f7, đừng để Đen đuổi về rồi khoá cánh Vua.',
      // Ở dòng này Tốt d2 còn nguyên nên Mã b1 CHƯA sang d2 được - phải đẩy d3 trước.
      'Giữ Xe e1 ở cột e; sau khi đẩy d3 thì Mã b1 sang d2 - cả hai nhắm cánh Vua Đen.',
    ],
  },
  sidelines: [
    {
      id: 'ruy-berlin',
      label: 'Đen đi 3...Nf6',
      idea: 'Đen ra Mã thay vì đóng Tốt - bé nhập thành trước, rồi đuổi Mã đang ăn Tốt e4 bằng Re1.',
      moves: [
        { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
        { san: 'e5' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã tấn công Tốt e5 của Đen.', 'Mã ra dọa Tốt') },
        { san: 'Nc6' },
        { san: 'Bb5', annotation: ann('Bb5', 'b', 'Tượng ghim Mã c6 - quân đang giữ Tốt e5.', 'Tượng ghim Mã Đen') },
        { san: 'Nf6' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua chui vào lều') },
        { san: 'Nxe4' },
        { san: 'Re1', annotation: ann('Re1', 'r', 'Xe vào cột e đuổi Mã đang ăn Tốt e4.', 'Xe vào cột e') },
        { san: 'Nd6' },
      ],
    },
  ],
}

// ── Gambit Hậu (bé cầm Trắng) ───────────────────────────────────────────────
const QUEENS_GAMBIT: OpeningTreeData = {
  main: [
    { san: 'd4', annotation: ann('d4', 'p', 'Chiếm trung tâm bằng Tốt Hậu, mở đường Tượng c1.', 'Dâng Tốt Hậu') },
    { san: 'd5' },
    { san: 'c4', annotation: ann('c4', 'p', 'Gambit: dâng Tốt c ngay để giành thế chủ động.', 'Dâng Tốt c mời') },
    { san: 'e6' },
    { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã ra giữ chặt hai ô trung tâm d5 và e4.', 'Mã giữ trung tâm') },
    { san: 'Nf6' },
    { san: 'Bg5', annotation: ann('Bg5', 'b', 'Tượng ra ghim Mã f6 vào đúng Hậu Đen.', 'Tượng ghim Mã Đen') },
    { san: 'Be7' },
    { san: 'e3', annotation: ann('e3', 'p', 'Chèn Tốt e mở đường cho Tượng f1 ra ngoài.', 'Mở cửa Tượng nhà') },
    { san: 'O-O' },
    { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4, chuẩn bị đổi Tốt ở d5.', 'Mã nhảy giữ nhà') },
    { san: 'h6' },
    { san: 'Bh4', annotation: ann('Bh4', 'b', 'Tượng lùi về h4 mà vẫn giữ nguyên mũi ghim.', 'Lùi mà không mất') },
    { san: 'b6' },
  ],
  plan: {
    title: 'Ba việc: đổi d5 - cột c - trung tâm',
    points: [
      'Đổi Tốt trên d5 hoặc đẩy e4 khi Mã và Tượng đã yểm trợ - giữ d4 làm bàn đạp.',
      'Đưa Tượng f1 ra d3 nhắm Vua Đen, nhưng chỉ khi Tốt e đã đứng vững.',
      // Ở dòng này Mã b1 ĐÃ đi (Nc3), b1 và c1 đều trống nên Xe sang c1 được ngay.
      'Nhập thành rồi đưa Xe a1 sang c1: cột c là đường tấn công chính.',
    ],
  },
  sidelines: [
    {
      id: 'qg-accepted',
      label: 'Đen ăn Tốt c4',
      idea: 'Đen giữ Tốt c4 - bé đòi lại bằng e3 rồi Bxc4, chưa đẩy e4 khi Tượng chưa ra.',
      moves: [
        { san: 'd4', annotation: ann('d4', 'p', 'Chiếm trung tâm bằng Tốt Hậu.', 'Dâng Tốt Hậu trước') },
        { san: 'd5' },
        { san: 'c4', annotation: ann('c4', 'p', 'Gambit: dâng Tốt c để giành thế chủ động.', 'Dâng Tốt c mời') },
        { san: 'dxc4' },
        { san: 'e3', annotation: ann('e3', 'p', 'Chèn Tốt e mở đường Tượng f1 đòi lại c4.', 'Mở cửa Tượng nhà') },
        { san: 'Nf6' },
        { san: 'Bxc4', annotation: ann('Bxc4', 'b', 'Tượng ăn lại Tốt c4, nhắm thẳng f7.', 'Đòi lại quân ngay') },
        { san: 'e6' },
      ],
    },
  ],
}

// ── Phòng thủ Pháp (bé cầm Đen) ─────────────────────────────────────────────
const FRENCH: OpeningTreeData = {
  main: [
    { san: 'e4' },
    { san: 'e6', annotation: ann('e6', 'p', 'Mở đường Tượng c8, chuẩn bị dựng hàng rào.', 'Tốt e dựng rào') },
    { san: 'd4' },
    { san: 'd5', annotation: ann('d5', 'p', 'Dựng trung tâm Tốt vững chắc, thách Trắng tiến e5.', 'Tốt d đáp trả') },
    { san: 'Nc3' },
    { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã ra tấn công Tốt e4 của Trắng.', 'Mã ra dọa Tốt') },
    { san: 'e5' },
    { san: 'Nfd7', annotation: ann('Nfd7', 'n', 'Mã né sang d7 để chuẩn bị phản công vào ô e5.', 'Mã né rồi công') },
    { san: 'f4' },
    { san: 'c5', annotation: ann('c5', 'p', 'Tấn công chân đế Tốt d4 từ cánh Hậu.', 'Tốt c phản công') },
    { san: 'Nf3' },
    { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ ô d4, tăng sức ép lên trung tâm.', 'Mã giữ trung tâm') },
    { san: 'Be3' },
    { san: 'Qb6', annotation: ann('Qb6', 'q', 'Hậu ra b6 tấn công Tốt d4 và b2.', 'Hậu ra tấn công') },
  ],
  plan: {
    title: 'Ba việc: hàng rào e6-d5 - đánh d4 - giữ Tượng',
    points: [
      // Tốt c4 KHÔNG tấn công d4 (nó chỉ đánh b3/d3) - phải là c5 đánh thẳng d4.
      'Đẩy c5 đánh thẳng vào chân đế d4; đổi cxd4 khi có lợi là trung tâm Trắng sụp.',
      'Đẩy f6 tấn công Tốt e5 ngay khi Trắng đẩy e5 - đừng để Trắng yên xây thế.',
      'Đưa Tượng f8 ra e7 rồi nhập thành; giữ Tượng c8, đừng để bị nhốt sau hàng rào.',
    ],
  },
  sidelines: [
    {
      id: 'french-advance',
      label: 'Trắng đẩy 3.e5',
      idea: 'Trắng tiến e5 - bé đánh ngay vào chân đế bằng c5, rồi Nc6 và Qb6 ép Tốt d4.',
      moves: [
        { san: 'e4' },
        { san: 'e6', annotation: ann('e6', 'p', 'Mở đường Tượng c8, chuẩn bị dựng hàng rào.', 'Tốt e dựng rào') },
        { san: 'd4' },
        { san: 'd5', annotation: ann('d5', 'p', 'Dựng trung tâm Tốt vững chắc.', 'Tốt d đáp trả') },
        { san: 'e5' },
        { san: 'c5', annotation: ann('c5', 'p', 'Đánh thẳng vào chân đế Tốt d4.', 'Tốt c phản công') },
        { san: 'c3' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra tăng sức ép lên ô d4.', 'Mã giữ trung tâm') },
      ],
    },
  ],
}

// ── Phòng thủ Caro-Kann (bé cầm Đen) ───────────────────────────────────────
const CARO_KANN: OpeningTreeData = {
  main: [
    { san: 'e4' },
    { san: 'c6', annotation: ann('c6', 'p', 'Chuẩn bị đẩy d5 mà không sợ bị đuổi bằng e5.', 'Tốt c mở đường') },
    { san: 'd4' },
    { san: 'd5', annotation: ann('d5', 'p', 'Chiếm trung tâm, thách Trắng ăn Tốt.', 'Tốt d tiến lên') },
    { san: 'Nc3' },
    { san: 'dxe4', annotation: ann('dxe4', 'p', 'Đổi Tốt để mở đường cho Tượng c8.', 'Đổi Tốt mở đường') },
    { san: 'Nxe4' },
    { san: 'Bf5', annotation: ann('Bf5', 'b', 'Tượng ra ngoài trước khi đóng Tốt e6 - tuyệt chiêu Caro-Kann!', 'Tượng ra trước Tốt') },
    { san: 'Ng3' },
    { san: 'Bg6', annotation: ann('Bg6', 'b', 'Tượng né sang g6, vừa an toàn vừa giữ đường chéo.', 'Tượng né sang g6') },
    { san: 'h4' },
    { san: 'h6', annotation: ann('h6', 'p', 'Chặn Tốt h4 lại, không cho Trắng mở cột h.', 'Tốt h chặn lại') },
  ],
  plan: {
    title: 'Ba việc: Tượng ra trước - nhập thành - c5',
    points: [
      'Đẩy e6 giữ trung tâm và giữ Tượng g6 trên đường chéo an toàn - quân quan trọng nhất.',
      'Đưa Mã g8 lên f6, Tượng f8 ra e7 rồi nhập thành TRƯỚC khi đẩy c5.',
      'Giữ Tốt c6 làm chân đế, Mã b8 ra d7, Xe a8 sang cột d - cột d để phản công.',
    ],
  },
  sidelines: [
    {
      id: 'caro-advance',
      label: 'Trắng đẩy 3.e5',
      idea: 'Trắng khoá trung tâm bằng e5 - bé đưa Tượng ra f5 ngay rồi mới đóng e6.',
      moves: [
        { san: 'e4' },
        { san: 'c6', annotation: ann('c6', 'p', 'Chuẩn bị đẩy d5 mà không sợ bị đuổi.', 'Tốt c mở đường') },
        { san: 'd4' },
        { san: 'd5', annotation: ann('d5', 'p', 'Chiếm trung tâm, thách Trắng ăn Tốt.', 'Tốt d tiến lên') },
        { san: 'e5' },
        { san: 'Bf5', annotation: ann('Bf5', 'b', 'Tượng ra ngoài TRƯỚC khi đóng Tốt e6.', 'Tượng ra trước Tốt') },
        { san: 'Nf3' },
        { san: 'e6', annotation: ann('e6', 'p', 'Đóng Tốt e6 giữ vững trung tâm.', 'Tốt e dựng rào') },
      ],
    },
  ],
}

// ── Khai cuộc Anh (bé cầm Trắng) ─────────────────────────────────────────────
const ENGLISH: OpeningTreeData = {
  main: [
    { san: 'c4', annotation: ann('c4', 'p', 'Kiểm soát ô d5 từ xa bằng Tốt cánh, chưa vội đẩy Tốt trung tâm.', 'Tốt c nhích lên') },
    { san: 'e5' },
    { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 giữ ô d5 và e4, chuẩn bị mở quân cánh Vua.', 'Mã giữ trung tâm') },
    { san: 'Nf6' },
    { san: 'Nf3', annotation: ann('Nf3', 'n', 'Mã f3 ra tiếp sức, chuẩn bị nhập thành cánh Vua.', 'Mã ra tiếp sức') },
    { san: 'Nc6' },
    { san: 'g3', annotation: ann('g3', 'p', 'Đẩy Tốt g3 mở đường cho Tượng f1 vào lều g2.', 'Mở cửa lều Tượng') },
    { san: 'Bb4' },
    { san: 'Bg2', annotation: ann('Bg2', 'b', 'Tượng vào g2 canh đường chéo dài, chuẩn bị nhập thành.', 'Tượng giấu trong lều') },
    { san: 'O-O' },
    { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành đưa Vua vào góc an toàn.', 'Vua chui vào lều') },
    { san: 'Re8' },
    { san: 'd3', annotation: ann('d3', 'p', 'Chèn Tốt d3 mở đường cho Tượng c1 ra ngoài.', 'Mở cửa Tượng nhà') },
  ],
  plan: {
    title: 'Ba việc: giữ d5 - rồi mới mở trung tâm',
    points: [
      'Đẩy b4-b5 đánh cánh Hậu và mở đường Tượng c1 ra b2 - English đánh bằng CÁNH.',
      // Mã b1 đã đi Nc3 từ nước 2 nên b1 trống: Xe a1 vào b1 được ngay.
      'Đưa Xe a1 sang b1, dồn sức ép lên cánh Hậu.',
      'Giữ Tượng g2 quét đường chéo dài, đổi quân ở trung tâm khi có lợi.',
    ],
  },
  sidelines: [
    {
      id: 'english-reversed-sicilian',
      label: 'Đen đi ...c5',
      idea: 'Đen chơi ngược Sicilian - bé giữ Tượng g2, đẩy b4-b5 đánh cánh Hậu, chưa mở trung tâm sớm.',
      moves: [
        { san: 'c4', annotation: ann('c4', 'p', 'Kiểm soát ô d5 từ xa bằng Tốt cánh.', 'Tốt c nhích lên') },
        { san: 'c5' },
        { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 giữ ô d5 và e4.', 'Mã giữ trung tâm') },
        { san: 'Nc6' },
        { san: 'g3', annotation: ann('g3', 'p', 'Đẩy Tốt g3 mở đường Tượng vào lều g2.', 'Mở cửa lều Tượng') },
        { san: 'g6' },
        { san: 'Bg2', annotation: ann('Bg2', 'b', 'Tượng vào g2 canh đường chéo dài.', 'Tượng giấu trong lều') },
        { san: 'Bg7' },
      ],
    },
  ],
}

// ── Phòng thủ Nimzo-Indian (bé cầm Đen) ──────────────────────────────────────
const NIMZO_INDIAN: OpeningTreeData = {
  main: [
    { san: 'd4' },
    { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã f6 kiểm soát trung tâm mà không chiếm ô nào.', 'Mã ra giữ nhà') },
    { san: 'c4' },
    { san: 'e6', annotation: ann('e6', 'p', 'Đóng Tốt e6 mở đường cho Tượng f8 ra ghim Mã.', 'Tốt e mở đường') },
    { san: 'Nc3' },
    { san: 'Bb4', annotation: ann('Bb4', 'b', 'Tượng ra b4 ghim Mã c3, khoá chặt không cho Trắng đẩy e4.', 'Tượng ra ghim Mã') },
    { san: 'e3' },
    { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành sớm đưa Vua vào góc an toàn.', 'Vua an toàn nhất') },
    { san: 'Bd3' },
    { san: 'd5', annotation: ann('d5', 'p', 'Đẩy Tốt d5 chiếm trung tâm, mở đường cho Tượng c8.', 'Tốt d chiếm giữa') },
    { san: 'Nf3' },
    { san: 'c5', annotation: ann('c5', 'p', 'Tốt c5 tấn công chân đế Tốt d4 từ cánh Hậu.', 'Tốt c phản công') },
    { san: 'O-O' },
    { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã c6 ra tăng sức ép lên ô d4 đang bị vây.', 'Mã ra tăng sức ép') },
  ],
  plan: {
    title: 'Ba việc: ghim c3 - Tượng b7 - cột c',
    points: [
      'Đổi Tượng b4 lấy Mã c3 làm lệch cấu trúc Tốt Trắng - Tốt c nhân đôi thì khó đẩy e4.',
      'Đẩy b6 rồi đưa Tượng c8 ra b7 tăng sức ép lên d4.',
      'Đưa Xe a8 sang cột c rồi đổi Tốt c5 lấy Tốt d4 để mở cột.',
    ],
  },
  sidelines: [
    {
      id: 'nimzo-qc2',
      label: 'Trắng chơi 4.Qc2',
      idea: 'Trắng né ghim bằng Qc2 - bé nhập thành ngay rồi đánh d5, đừng vội đổi Tượng lấy Mã.',
      moves: [
        { san: 'd4' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã f6 kiểm soát trung tâm từ xa.', 'Mã ra giữ nhà') },
        { san: 'c4' },
        { san: 'e6', annotation: ann('e6', 'p', 'Đóng Tốt e6 mở đường Tượng f8 ghim Mã.', 'Tốt e mở đường') },
        { san: 'Nc3' },
        { san: 'Bb4', annotation: ann('Bb4', 'b', 'Tượng b4 ghim Mã c3, khoá ô e4.', 'Tượng ra ghim Mã') },
        { san: 'Qc2' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành sớm đưa Vua vào góc an toàn.', 'Vua an toàn nhất') },
      ],
    },
  ],
}

/**
 * Bảng tra khai cuộc theo id: mỗi bài chỉ còn **dòng chính** và **kế hoạch trung
 * cuộc**. Không còn cây phân nhánh - xem ghi chú đầu file để hiểu vì sao.
 */
const TREES: Record<string, OpeningTreeData> = {
  london: LONDON,
  italian: ITALIAN,
  'kings-indian': KINGS_INDIAN,
  sicilian: SICILIAN,
  'ruy-lopez': RUY_LOPEZ,
  'queens-gambit': QUEENS_GAMBIT,
  french: FRENCH,
  'caro-kann': CARO_KANN,
  english: ENGLISH,
  'nimzo-indian': NIMZO_INDIAN,
}

export interface OpeningTreeEntry {
  main: OpeningMove[]
  plan: OpeningPlan
  sidelines?: OpeningSideLine[]
}

export const OPENING_TREES: Record<string, OpeningTreeEntry> = Object.fromEntries(
  Object.entries(TREES).map(([id, data]) => [
    id,
    { main: data.main, plan: data.plan, sidelines: data.sidelines },
  ]),
)
