/**
 * Cây khai cuộc phân nhánh (§4.4).
 *
 * Mỗi khai cuộc viết theo dạng **dòng chính + danh sách nhánh**, rồi
 * `buildOpeningTree` ghép thành cây thật:
 *
 *  - `main`   - dòng lý thuyết app dạy (chính là `moves` của bài).
 *  - `branches` - vài cách đáp khác ở một ply nào đó. `moves[0]` của nhánh là
 *                 nước thay thế; các nước sau là dòng tiếp theo của nhánh đó.
 *
 * Nhờ có cây, bé học **phản ứng** ("Đen có thể đáp thế này hoặc thế kia") thay vì
 * học vẹt đúng một dòng. Toàn bộ nước đi ở đây là **dữ kiện cờ vua** (không ai giữ
 * bản quyền), và mọi lời bình đều do app tự viết.
 *
 * QUY TẮC BẮT BUỘC (được `scripts/validate-chess.ts` kiểm chứng):
 *  - mọi nước CỦA BÉ (đúng màu quân của bài) đều phải có `annotation`;
 *  - nước của đối thủ thì KHÔNG được có `annotation`;
 *  - mỗi nhánh phụ phải có một câu `note` giải thích vì sao.
 *
 * Lời giảng dùng lại nhiều lần (ví dụ `O-O` xuất hiện ở cả dòng chính lẫn nhiều
 * nhánh) nên khai báo thành hằng số ở đầu mỗi khối - sửa một chỗ là sửa hết.
 */
import type { MoveAnnotation, OpeningPlan } from '../types'
// Đuôi `.ts` là bắt buộc: file này được `node scripts/validate-chess.ts` nạp thẳng
// (Node tự bỏ kiểu), mà Node không tự thêm đuôi cho import lúc chạy.
import { buildOpeningTree } from '../lib/openingTree.ts'
import type { RawBranch, RawOpeningMove } from '../lib/openingTree.ts'

interface OpeningTreeData {
  main: RawOpeningMove[]
  branches: RawBranch[]
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
  branches: [
    {
      at: 4,
      note: 'Bé cũng có thể chèn Tốt e3 trước, rồi mới đưa Mã ra.',
      moves: [
        { san: 'e3', annotation: ann('e3', 'p', 'Khóa đuôi Tượng f4, làm chân đế giữ Tốt.', 'Chèn Tốt làm đế') },
        { san: 'e6' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4.', 'Mã nhảy giữ nhà') },
        { san: 'c5' },
        { san: 'c3', annotation: ann('c3', 'p', 'Hoàn thành Kim tự tháp Tốt.', 'Lô-kốt kiên cố') },
      ],
    },
    {
      at: 5,
      note: 'Đen đánh Tốt c5 vào trung tâm trước khi ra Tượng.',
      moves: [
        { san: 'c5' },
        { san: 'e3', annotation: ann('e3', 'p', 'Giữ trung tâm vững rồi mới phát triển quân.', 'Chèn Tốt làm đế') },
        { san: 'Nc6' },
        { san: 'c3', annotation: ann('c3', 'p', 'Hoàn thành Kim tự tháp Tốt.', 'Lô-kốt kiên cố') },
      ],
    },
    {
      at: 5,
      note: 'Đen ghim Mã f3 bằng Tượng trước khi đóng Tốt.',
      moves: [
        { san: 'Bg4' },
        { san: 'h3', annotation: ann('h3', 'p', 'Đuổi Tượng Đen đi để Mã f3 được tự do.', 'Đuổi Tượng Đen đi') },
        { san: 'Bh5' },
        { san: 'Nbd2', annotation: ann('Nbd2', 'n', 'Mã lên d2 giữ trung tâm, chuẩn bị đẩy e4.', 'Mã ra tiếp sức') },
      ],
    },
    {
      at: 7,
      note: 'Đen ra Tượng lên d6 trước, để Mã g8 còn ở nhà.',
      moves: [
        { san: 'Bd6' },
        { san: 'Nbd2', annotation: ann('Nbd2', 'n', 'Mã lên d2 mở đường cho Tượng f1 và chuẩn bị đẩy e4.', 'Mã ra tiếp sức') },
        { san: 'O-O' },
        { san: 'Bd3', annotation: ann('Bd3', 'b', 'Đưa Tượng f1 ra d3 nhắm thẳng vào cánh Vua Đen.', 'Tượng nhắm cánh Vua') },
        { san: 'c5' },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đưa Mã b1 lên d2 rồi đẩy Tốt e4 để mở trung tâm.',
      'Nếu Đen đẩy c5-c4 thì khoá cánh Hậu lại và đánh sang cánh Vua.',
      'Đổi Tượng g3 lấy Tượng d6 để mở cột h cho Xe.',
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
  branches: [
    {
      at: 5,
      note: 'Đen ra Mã f6 trước, tấn công ngay Tốt e4.',
      moves: [
        { san: 'Nf6' },
        { san: 'd3', annotation: ann('d3', 'p', 'Giữ trung tâm rồi mới phát triển quân.', 'Mở cửa Tượng nhà') },
        { san: 'Bc5' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua chui vào lều') },
        { san: 'd6' },
      ],
    },
    {
      at: 5,
      note: 'Đen giấu Tượng vào e7 rồi nhập thành cho an toàn.',
      moves: [
        { san: 'Be7' },
        { san: 'd3', annotation: ann('d3', 'p', 'Mở đường cho Tượng c1 ra ngoài.', 'Mở cửa Tượng nhà') },
        { san: 'Nf6' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua chui vào lều') },
        { san: 'O-O' },
      ],
    },
    {
      at: 8,
      note: 'Bé cũng có thể đưa Xe vào cột e, chuẩn bị đẩy Tốt d4.',
      moves: [
        { san: 'Re1', annotation: ann('Re1', 'r', 'Đưa Xe vào cột e chuẩn bị đẩy Tốt d4.', 'Xe vào cột e') },
        { san: 'd6' },
        { san: 'd4', annotation: ann('d4', 'p', 'Đẩy Tốt d4 mở trung tâm, có Xe đỡ phía sau.', 'Đẩy d4 mở trung tâm') },
        { san: 'exd4' },
        { san: 'Nxd4', annotation: ann('Nxd4', 'n', 'Mã ăn lại Tốt d4, chiếm ô đẹp ở trung tâm.', 'Mã ăn lại trung tâm') },
      ],
    },
    {
      at: 7,
      note: 'Đen đẩy Tốt d6 ngay, giữ Mã g8 ở nhà chờ.',
      moves: [
        { san: 'd6' },
        { san: 'd3', annotation: ann('d3', 'p', 'Mở đường cho Tượng c1 ra ngoài.', 'Mở cửa Tượng nhà') },
        { san: 'Nf6' },
        { san: 'c3', annotation: ann('c3', 'p', 'Chuẩn bị đẩy Tốt d4 mở trung tâm.', 'Chuẩn bị đẩy d4') },
        { san: 'O-O' },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy d3 rồi d4 để mở đường cho Tượng c1.',
      'Đưa Mã b1 lên d2 hoặc a3, chuẩn bị đánh vào ô f7.',
      'Xếp Xe vào cột e trước khi mở trung tâm.',
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
  branches: [
    {
      at: 2,
      note: 'Trắng ra Mã f3 trước khi đẩy Tốt c4.',
      moves: [
        { san: 'Nf3' },
        { san: 'g6', annotation: ann('g6', 'p', 'Mở ô g7 đưa Tượng vào góc.', 'Mở cửa lều Tượng') },
        { san: 'c4' },
        { san: 'Bg7', annotation: ann('Bg7', 'b', 'Đưa Tượng vào Pháo đài càn quét đường chéo.', 'Tượng giấu trong lều') },
        { san: 'Nc3' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua an toàn nhất') },
        { san: 'e4' },
        { san: 'd6', annotation: ann('d6', 'p', 'Chống đỡ ô e5, chuẩn bị đẩy Tốt e5.', 'Tốt d giữ ô e5') },
      ],
    },
    {
      at: 2,
      note: 'Trắng lên Tốt g3, giấu Tượng vào g2.',
      moves: [
        { san: 'g3' },
        { san: 'g6', annotation: ann('g6', 'p', 'Mở ô g7 đưa Tượng vào góc.', 'Mở cửa lều Tượng') },
        { san: 'Bg2' },
        { san: 'Bg7', annotation: ann('Bg7', 'b', 'Đưa Tượng vào Pháo đài càn quét đường chéo.', 'Tượng giấu trong lều') },
        { san: 'Nf3' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua an toàn nhất') },
        { san: 'O-O' },
        { san: 'd6', annotation: ann('d6', 'p', 'Chống đỡ ô e5, chuẩn bị đẩy Tốt e5.', 'Tốt d giữ ô e5') },
      ],
    },
    {
      at: 5,
      note: 'Đen đẩy Tốt d6 trước, để Tượng ở f8 chờ thời cơ.',
      moves: [
        { san: 'd6', annotation: ann('d6', 'p', 'Đẩy Tốt d6 trước, giữ Tượng ở nhà chờ thời cơ.', 'Tốt d chờ thời') },
        { san: 'Nf3' },
        { san: 'Bg7', annotation: ann('Bg7', 'b', 'Giờ mới đưa Tượng vào Pháo đài.', 'Tượng giấu trong lều') },
        { san: 'e4' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua an toàn nhất') },
      ],
    },
    {
      at: 7,
      note: 'Đen đẩy Tốt d6 trước rồi mới nhập thành.',
      moves: [
        { san: 'd6', annotation: ann('d6', 'p', 'Đẩy Tốt d6 trước, chống đỡ ô e5 cho chắc.', 'Tốt d giữ ô e5') },
        { san: 'Nf3' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua an toàn nhất') },
        { san: 'Be2' },
        { san: 'e5', annotation: ann('e5', 'p', 'Đẩy Tốt e5 khoá trung tâm rồi đánh sang cánh Vua.', 'Tốt e khoá trung tâm') },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đẩy Tốt e5 để khoá trung tâm rồi đánh sang cánh Vua.',
      'Đưa Mã f6 vào e8 hoặc h5, chuẩn bị đẩy Tốt f5 mở đường.',
      'Đưa Xe lên e8, giữ Tượng g7 quét đường chéo dài.',
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
  branches: [
    {
      at: 4,
      note: 'Trắng ra Tượng lên b5 (biến Rossolimo) thay vì đẩy Tốt d4.',
      moves: [
        { san: 'Bb5' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Ra Mã b8 chặn Tượng b5 và giữ ô d4.', 'Mã ra chặn Tượng') },
        { san: 'd4' },
        { san: 'cxd4', annotation: ann('cxd4', 'p', 'Ăn Tốt d4 để mở cột c cho Xe.', 'Đổi Tốt mở cột c') },
        { san: 'Nxd4' },
      ],
    },
    {
      at: 4,
      note: 'Trắng chèn Tốt c3 chắc chắn trước, chưa đẩy Tốt d4.',
      moves: [
        { san: 'c3' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã đe doạ Tốt e4 của Trắng.', 'Mã ra phản công') },
        { san: 'e5' },
        { san: 'Nd5', annotation: ann('Nd5', 'n', 'Mã nhảy vào d5, chiếm ô trung tâm rất đẹp.', 'Mã vào ô trung tâm') },
        { san: 'd4' },
      ],
    },
    {
      at: 3,
      note: 'Đen ra Mã b8 trước, chưa đẩy Tốt d6.',
      moves: [
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Ra Mã b8 trước để chống đỡ trung tâm.', 'Mã ra chống đỡ') },
        { san: 'd4' },
        { san: 'cxd4', annotation: ann('cxd4', 'p', 'Ăn Tốt d4 để mở cột c cho Xe.', 'Đổi Tốt mở cột c') },
        { san: 'Nxd4' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã đe doạ Tốt e4 của Trắng.', 'Mã ra phản công') },
      ],
    },
    {
      at: 3,
      note: 'Đen đẩy Tốt e6 theo kiểu Kan, chuẩn bị d5 đánh vào trung tâm.',
      moves: [
        { san: 'e6', annotation: ann('e6', 'p', 'Đẩy Tốt e6, chuẩn bị d5 đánh vào trung tâm.', 'Tốt e chặn đường') },
        { san: 'd4' },
        { san: 'cxd4', annotation: ann('cxd4', 'p', 'Ăn Tốt d4 để mở cột c cho Xe.', 'Đổi Tốt mở cột c') },
        { san: 'Nxd4' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã đe doạ Tốt e4 của Trắng.', 'Mã ra phản công') },
      ],
    },
    {
      at: 7,
      note: 'Đen đẩy Tốt a6 trước, giữ ô b5 rồi mới ra Mã.',
      moves: [
        { san: 'a6', annotation: ann('a6', 'p', 'Đuổi quân Trắng ra khỏi ô b5, giữ cánh Hậu an toàn.', 'Tốt a giữ ô b5') },
        { san: 'Nc3' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Nhảy Mã đe doạ Tốt e4 của Trắng.', 'Mã ra phản công') },
        { san: 'Be3' },
        { san: 'e6', annotation: ann('e6', 'p', 'Dựng hàng rào Tốt e6-d6 vững chắc.', 'Hàng rào Tốt vững') },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đánh sang cánh Hậu bằng ...b5 rồi đưa Tượng lên b7.',
      'Đổi quân trên ô d4 để mở cột c cho Xe.',
      'Nếu Trắng nhập thành dài thì mở cột c rồi tấn công ngay.',
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
  branches: [
    {
      at: 5,
      note: 'Đen ra Mã f6 (phòng thủ Berlin) thay vì đuổi Tượng bằng Tốt a6.',
      moves: [
        { san: 'Nf6' },
        { san: 'O-O', annotation: ann('O-O', 'k', 'Giấu Vua vào góc an toàn.', 'Vua chui vào lều') },
        { san: 'Nxe4' },
        { san: 'd4', annotation: ann('d4', 'p', 'Đẩy Tốt d4 mở trung tâm khi Mã Đen đã lạc đường.', 'Đẩy d4 mở trung tâm') },
        { san: 'Nd6' },
        { san: 'Bxc6', annotation: ann('Bxc6', 'b', 'Đổi Tượng lấy Mã để làm yếu cấu trúc Tốt của Đen.', 'Đổi Tượng lấy Mã') },
        { san: 'dxc6' },
      ],
    },
    {
      at: 5,
      note: 'Đen ra Tượng lên c5 rồi mới ra Mã.',
      moves: [
        { san: 'Bc5' },
        { san: 'c3', annotation: ann('c3', 'p', 'Chèn Tốt c3 chuẩn bị đẩy Tốt d4.', 'Chèn Tốt chuẩn bị') },
        { san: 'Nf6' },
        { san: 'd3', annotation: ann('d3', 'p', 'Mở đường cho Tượng c1 ra ngoài.', 'Mở cửa Tượng nhà') },
      ],
    },
    {
      at: 10,
      note: 'Bé cũng có thể đổi Tượng lấy Mã c6 ngay bây giờ.',
      moves: [
        { san: 'Bxc6', annotation: ann('Bxc6', 'b', 'Đổi Tượng lấy Mã c6 để làm yếu cấu trúc Tốt Đen.', 'Đổi Tượng lấy Mã') },
        { san: 'dxc6' },
        { san: 'd3', annotation: ann('d3', 'p', 'Mở đường cho Tượng c1, giữ trung tâm vững.', 'Mở cửa Tượng nhà') },
        { san: 'O-O' },
      ],
    },
    {
      at: 9,
      note: 'Đen đẩy Tốt b5 trước, đuổi Tượng rồi mới ra Tượng.',
      moves: [
        { san: 'b5' },
        { san: 'Bb3', annotation: ann('Bb3', 'b', 'Tượng lùi về b3, vẫn nhắm ô f7 của Đen.', 'Lùi về nhắm f7') },
        { san: 'Be7' },
        { san: 'Re1', annotation: ann('Re1', 'r', 'Xe vào cột e, chuẩn bị đẩy Tốt d4.', 'Xe vào cột e') },
        { san: 'O-O' },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy d3 rồi d4 để mở đường, giữ Tượng ở b3 nhắm ô f7.',
      'Đưa Mã b1 lên d2 rồi chuyển dần sang cánh Vua.',
      'Giữ cột e cho Xe; đừng vội đổi Tượng lấy Mã khi chưa cần.',
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
  branches: [
    {
      at: 3,
      note: 'Đen chơi Tốt c6 (phòng thủ Slav) để giữ chặt ô d5.',
      moves: [
        { san: 'c6' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4 trước khi tính chuyện lấy lại Tốt c4.', 'Mã nhảy giữ nhà') },
        { san: 'Nf6' },
        { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã ra giữ chặt hai ô trung tâm d5 và e4.', 'Mã giữ trung tâm') },
        { san: 'dxc4' },
        { san: 'a4', annotation: ann('a4', 'p', 'Đẩy Tốt a4 để lấy lại Tốt c4 đã mất.', 'Tốt a đòi lại') },
        { san: 'Bf5' },
      ],
    },
    {
      at: 3,
      note: 'Đen ăn Tốt c4 ngay (Gambit Hậu chấp nhận).',
      moves: [
        { san: 'dxc4' },
        { san: 'e3', annotation: ann('e3', 'p', 'Chèn Tốt e3 mở đường cho Tượng f1 lấy lại Tốt c4.', 'Mở cửa Tượng nhà') },
        { san: 'Nf6' },
        { san: 'Bxc4', annotation: ann('Bxc4', 'b', 'Tượng ăn lại Tốt c4, thế cờ trở lại cân bằng.', 'Tượng đòi lại Tốt') },
        { san: 'e6' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4, chuẩn bị nhập thành.', 'Mã nhảy giữ nhà') },
      ],
    },
    {
      at: 5,
      note: 'Đen đẩy Tốt c6 trước, giữ chặt ô d5 theo kiểu Slav.',
      moves: [
        { san: 'c6' },
        { san: 'e3', annotation: ann('e3', 'p', 'Chèn Tốt e mở đường cho Tượng f1 ra ngoài.', 'Mở cửa Tượng nhà') },
        { san: 'Nf6' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4, chuẩn bị nhập thành.', 'Mã nhảy giữ nhà') },
      ],
    },
    {
      at: 7,
      note: 'Đen đẩy Tốt c5 vào trung tâm trước khi ra Tượng.',
      moves: [
        { san: 'c5' },
        { san: 'e3', annotation: ann('e3', 'p', 'Chèn Tốt e mở đường cho Tượng f1 ra ngoài.', 'Mở cửa Tượng nhà') },
        { san: 'Nc6' },
        { san: 'Nf3', annotation: ann('Nf3', 'n', 'Nhảy Mã bảo vệ Tốt d4, chuẩn bị nhập thành.', 'Mã nhảy giữ nhà') },
        { san: 'Be7' },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Trắng',
    points: [
      'Đẩy e3 rồi e4 (hoặc chồng Tốt) để mở trung tâm.',
      'Đưa Tượng f1 ra d3 nhắm thẳng vào Vua Đen.',
      'Đưa Xe vào cột c hoặc cột e sau khi đã đổi quân.',
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
  branches: [
    {
      at: 4,
      note: 'Trắng đẩy Tốt e5 ngay (biến Thế Tiến).',
      moves: [
        { san: 'e5' },
        { san: 'c5', annotation: ann('c5', 'p', 'Tấn công chân đế Tốt d4 từ cánh Hậu.', 'Tốt c phản công') },
        { san: 'c3' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ ô d4, tăng sức ép lên trung tâm.', 'Mã giữ trung tâm') },
        { san: 'Nf3' },
        { san: 'Qb6', annotation: ann('Qb6', 'q', 'Hậu ra b6 tấn công Tốt d4 và b2.', 'Hậu ra tấn công') },
      ],
    },
    {
      at: 4,
      note: 'Trắng nhảy Mã d2 (biến Tarrasch).',
      moves: [
        { san: 'Nd2' },
        { san: 'c5', annotation: ann('c5', 'p', 'Tấn công chân đế Tốt d4 từ cánh Hậu.', 'Tốt c phản công') },
        { san: 'exd5' },
        { san: 'exd5', annotation: ann('exd5', 'p', 'Ăn lại Tốt d5 để giữ thế cân bằng ở trung tâm.', 'Tốt ăn lại d5') },
        { san: 'Ngf3' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ ô d4, tăng sức ép lên trung tâm.', 'Mã giữ trung tâm') },
      ],
    },
    {
      at: 9,
      note: 'Đen đẩy Tốt a6, chuẩn bị ...b5 tấn công cánh Hậu thay vì đẩy c5.',
      moves: [
        { san: 'a6', annotation: ann('a6', 'p', 'Đẩy Tốt a6, chuẩn bị ...b5 tấn công cánh Hậu.', 'Tốt a mở đường') },
        { san: 'Nf3' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ ô d4, tăng sức ép lên trung tâm.', 'Mã giữ trung tâm') },
      ],
    },
    {
      at: 11,
      note: 'Đen ra Hậu b6 ngay, tấn công Tốt d4 và b2.',
      moves: [
        { san: 'Qb6', annotation: ann('Qb6', 'q', 'Hậu ra b6 ngay, tấn công Tốt d4 và b2.', 'Hậu ra tấn công') },
        { san: 'Be3' },
        { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ ô d4, tăng sức ép lên trung tâm.', 'Mã giữ trung tâm') },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đẩy c5 tấn công chân đế Tốt d4 của Trắng.',
      'Đưa Mã b8 lên c6 rồi đẩy Tốt f6 để phá trung tâm.',
      'Đổi Tượng c8 lấy Mã f3 rồi nhập thành cánh Vua.',
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
  branches: [
    {
      at: 2,
      note: 'Trắng ra Mã c3 trước, chưa đẩy Tốt d4.',
      moves: [
        { san: 'Nc3' },
        { san: 'd5', annotation: ann('d5', 'p', 'Chiếm trung tâm, thách Trắng ăn Tốt.', 'Tốt d tiến lên') },
        { san: 'Nf3' },
        { san: 'Bg4', annotation: ann('Bg4', 'b', 'Đưa Tượng ra ghim Mã f3 của Trắng.', 'Tượng ra ghim Mã') },
        { san: 'h3' },
        { san: 'Bxf3', annotation: ann('Bxf3', 'b', 'Đổi Tượng lấy Mã để làm lệch cấu trúc Tốt Trắng.', 'Đổi Tượng lấy Mã') },
        { san: 'Qxf3' },
        { san: 'e6', annotation: ann('e6', 'p', 'Đóng Tốt e6, mở đường cho Tượng f8 ra ngoài.', 'Tốt e mở đường') },
      ],
    },
    {
      at: 3,
      note: 'Đen đẩy Tốt e6, chuyển sang hàng rào Tốt kiểu Pháp.',
      moves: [
        { san: 'e6', annotation: ann('e6', 'p', 'Dựng hàng rào Tốt e6-d5 vững chắc.', 'Hàng rào Tốt vững') },
        { san: 'Nc3' },
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã ra tấn công Tốt e4 của Trắng.', 'Mã ra dọa Tốt') },
        { san: 'e5' },
        { san: 'Nd5', annotation: ann('Nd5', 'n', 'Mã lùi vào d5 chiếm ô trung tâm rất vững.', 'Mã vào ô trung tâm') },
      ],
    },
    {
      at: 7,
      note: 'Đen ra Mã f6, sẵn sàng đổi quân để mở cột g.',
      moves: [
        { san: 'Nf6', annotation: ann('Nf6', 'n', 'Ra Mã f6 tấn công Tốt e4, sẵn sàng đổi quân.', 'Mã ra tranh trung tâm') },
        { san: 'Nxf6+' },
        { san: 'gxf6', annotation: ann('gxf6', 'p', 'Ăn lại quân bằng Tốt g, mở cột g cho Xe.', 'Tốt g ăn lại') },
        { san: 'c3' },
        { san: 'e6', annotation: ann('e6', 'p', 'Đóng Tốt e6, mở đường cho Tượng f8 ra ngoài.', 'Tốt e mở đường') },
      ],
    },
  ],
  plan: {
    title: 'Kế hoạch trung cuộc của Đen',
    points: [
      'Đưa Tượng g6 ra ngoài rồi đẩy Tốt e6 giữ trung tâm.',
      'Đưa Mã g8 lên f6, đe doạ Tốt e4 của Trắng.',
      'Nhập thành cánh Vua, giữ Tốt c6 làm chân đế.',
    ],
  },
}

const TREES: Record<string, OpeningTreeData> = {
  london: LONDON,
  italian: ITALIAN,
  'kings-indian': KINGS_INDIAN,
  sicilian: SICILIAN,
  'ruy-lopez': RUY_LOPEZ,
  'queens-gambit': QUEENS_GAMBIT,
  french: FRENCH,
  'caro-kann': CARO_KANN,
}

export interface OpeningTreeEntry {
  tree: ReturnType<typeof buildOpeningTree>
  plan: OpeningPlan
}

export const OPENING_TREES: Record<string, OpeningTreeEntry> = Object.fromEntries(
  Object.entries(TREES).map(([id, data]) => [
    id,
    { tree: buildOpeningTree(data.main, data.branches), plan: data.plan },
  ]),
)
