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
import type { MoveAnnotation, OpeningMove, OpeningPlan } from '../types'

interface OpeningTreeData {
  main: OpeningMove[]
  plan: OpeningPlan
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
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đưa Tượng f1 ra d3 (hoặc e2) rồi nhập thành cho Vua vào góc an toàn.',
      'Đẩy Tốt e4 (Mã d2 yểm trợ) để mở trung tâm; nếu Đen đẩy c5-c4 thì khoá cánh Hậu.',
      'Đẩy h4-h5 mở cột h, rồi đưa Xe vào cột h hỗ trợ đánh cánh Vua.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy Tốt d4 để mở trung tâm; Tốt c3 và Mã f3 đã yểm trợ sẵn.',
      'Đưa Mã b1 lên d2 rồi chuyển sang f1 hoặc c4 để tăng sức ép.',
      'Xếp Xe f1 vào cột e trước khi mở trung tâm, giữ Tượng c4 nhắm ô f7.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đưa Mã f6 sang h5 (hoặc xuống d7) để dọn đường cho Tốt f5 tiến lên.',
      'Đẩy Tốt f5 rồi f4 để mở cánh Vua cho quân tấn công.',
      'Đưa Xe f8 lên e8 giữ ô e5, giữ Tượng g7 quét đường chéo dài.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đánh sang cánh Hậu bằng ...b5 rồi đưa Tượng c8 lên b7.',
      'Đổi quân trên ô d4 rồi đưa Xe a8 sang cột c vừa mở.',
      'Nếu Trắng nhập thành dài thì dồn Tốt b5-b4 tấn công vào Vua.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy Tốt d4 để mở trung tâm, giữ Tượng b3 nhắm vào ô f7.',
      'Đẩy Tốt d3 rồi đưa Mã b1 lên d2 để chuyển dần sang cánh Vua.',
      'Giữ Xe e1 ở cột e; đừng vội đổi Tượng lấy Mã c6 khi chưa cần.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy Tốt e4 để mở trung tâm, hoặc đổi Tốt trên ô d5.',
      'Đưa Tượng f1 ra d3 nhắm thẳng vào Vua Đen.',
      'Nhập thành cho Vua vào góc an toàn, rồi đưa Xe a1 sang cột c.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Dồn Tốt c5-c4 để tấn công chân đế Tốt d4 của Trắng.',
      'Đẩy Tốt f6 tấn công Tốt e5, mở đường cho quân phản công.',
      'Đưa Tượng f8 ra e7 rồi nhập thành cánh Vua cho Vua an toàn.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đẩy Tốt e6 giữ trung tâm, giữ Tượng g6 trên đường chéo an toàn.',
      'Đưa Mã g8 lên f6, rồi đưa Tượng f8 ra e7 và nhập thành cánh Vua.',
      'Giữ Tốt c6 làm chân đế, đưa Mã b8 ra d7 rồi Xe a8 sang cột d.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy Tốt b4-b5 tấn công cánh Hậu, mở đường cho Tượng c1 ra b2.',
      'Đưa Xe a1 vào cột b hoặc cột c để dồn sức ép lên cánh Hậu.',
      'Giữ Tượng g2 quét đường chéo dài, sẵn sàng đổi quân ở trung tâm.',
    ],
  },
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
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đổi Tượng b4 lấy Mã c3 để làm lệch cấu trúc Tốt của Trắng.',
      'Đẩy Tốt b6 rồi đưa Tượng c8 ra b7 để tăng sức ép lên ô d4.',
      'Đưa Xe a8 sang cột c rồi đổi Tốt c5 lấy Tốt d4 để mở cột.',
    ],
  },
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
}

export const OPENING_TREES: Record<string, OpeningTreeEntry> = Object.fromEntries(
  Object.entries(TREES).map(([id, data]) => [id, { main: data.main, plan: data.plan }]),
)
