/**
 * Dữ liệu tab **Đối phó**: nếu đối thủ chơi khai cuộc X thì bé đáp lại thế nào.
 *
 * Vì sao có file này: bé học khai cuộc cho MÌNH chưa đủ - ra bàn cờ gặp bạn chơi
 * khác, bé cần biết *"bạn ấy đang làm gì, mình phá lại ra sao"*. Mỗi bài ở đây là
 * một dòng nước bắt đầu từ nước 1, chỉ rõ nước nào của ĐỐI THỦ và nước nào bé đáp.
 *
 * QUY TẮC (được `scripts/validate-chess.ts` kiểm chứng):
 *  - mọi nước đều phải hợp lệ trên bàn cờ thật;
 *  - CHỈ nước CỦA BÉ (ngược màu `opponentSide`) mới có `annotation`;
 *  - khẩu quyết vè 4-6 chữ;
 *  - dòng nước đủ dài để thấy rõ ý đồ đối phó (≥ 8 ply);
 *  - SONG SONG với tab Khai cuộc: mỗi khai cuộc trong `openings.ts` có ĐÚNG một bài
 *    ở đây (`id = vs-<openingId>`), và ngược lại - không dạy đối phó một khai cuộc
 *    mà bé chưa học.
 */
import type { CounterLesson, MoveAnnotation } from '../types'

const ann = (
  san: string,
  piece: MoveAnnotation['piece'],
  reason: string,
  rhyme: string,
): MoveAnnotation => ({ san, piece, reason, rhyme })

export const COUNTERS: CounterLesson[] = [
  // ── Đối thủ cầm TRẮNG → bé cầm ĐEN ─────────────────────────────────────────
  {
    id: 'vs-london',
    openingId: 'london',
    englishName: 'London System',
    opponentOpening: 'Hệ thống London',
    opponentSide: 'white',
    emoji: '🇬🇧',
    counterName: 'Giữ d5, đánh vào chân đế d4',
    idea: 'Trắng cần vài nước mới dựng xong khung c3-d4-e3; đánh d4 sớm thì khung đó không đứng vững.',
    opponentPlan: 'Trắng dựng khung c3-d4-e3, ra Tượng f4, nhập thành rồi mở cột h bằng h4-h5.',
    points: [
      'Giữ Tốt d5 đối đầu Tốt d4 của Trắng.',
      'Đẩy c5 đánh vào chân đế d4 - chỗ dễ lung lay nhất.',
      'Đưa Tượng f8 ra d6 đuổi Tượng f4, rồi nhập thành sớm.',
    ],
    moves: [
      { san: 'd4' },
      { san: 'd5', annotation: ann('d5', 'p', 'Chiếm d5 đối đầu Tốt d4, mở đường Tượng c8.', 'Tốt d ra chặn') },
      { san: 'Bf4' },
      { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã ra kiểm soát ô e4 và d5.', 'Mã giữ hai ô') },
      // Thứ tự Nf3-e3 giống đúng dòng chính ở tab Khai cuộc: bé học một dòng,
      // sang đây không thấy hai thứ tự khác nhau cho cùng một khai cuộc.
      { san: 'Nf3' },
      { san: 'e6', annotation: ann('e6', 'p', 'Chèn Tốt e mở đường Tượng f8 ra d6.', 'Mở cửa Tượng nhà') },
      { san: 'e3' },
      { san: 'c5', annotation: ann('c5', 'p', 'Tấn công Tốt d4 - chân đế trung tâm Trắng.', 'Đánh vào chân đế') },
      { san: 'c3' },
      { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra tăng thêm sức ép lên ô d4.', 'Mã thêm sức ép') },
      { san: 'Nbd2' },
      // Tượng Trắng đang ở f4; Bd6 TẤN CÔNG nó chứ không đổi được (Trắng lùi g3).
      { san: 'Bd6', annotation: ann('Bd6', 'b', 'Tượng ra d6 tấn công Tượng f4, buộc nó lùi về g3.', 'Đuổi Tượng ra biên') },
      { san: 'Bg3' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành đưa Vua vào lều an toàn.', 'Vua chui vào lều') },
    ],
  },
  {
    id: 'vs-italian',
    openingId: 'italian',
    englishName: 'Italian Game',
    opponentOpening: 'Ván cờ Ý',
    opponentSide: 'white',
    emoji: '🇮🇹',
    // `f2` mới là ô yếu của Trắng (f7 là ô yếu của chính Đen) - đừng viết lẫn.
    counterName: 'Đáp đối xứng, nhắm ô f2',
    idea: 'Đáp đối xứng giữ thế cân bằng, còn Tượng c5 thì luôn nhắm f2 - ô chỉ có Vua Trắng che.',
    // Nhập thành TRƯỚC rồi mới đẩy d3-c3 và d4 - đúng thứ tự dòng chính ở tab
    // Khai cuộc (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.O-O ... 5.d3 6.c3 7.d4).
    opponentPlan: 'Trắng nhắm f7 bằng Tượng c4, nhập thành rồi đẩy d3-c3-d4 đánh cánh Vua.',
    points: [
      'Đáp e5 rồi ra Mã c6 giữ Tốt e5, không cho Trắng đẩy d4.',
      'Đưa Tượng f8 ra c5 nhắm ô f2 gần Vua Trắng.',
      'Nhập thành cánh Vua, giữ thế vững chờ sơ hở.',
    ],
    moves: [
      { san: 'e4' },
      { san: 'e5', annotation: ann('e5', 'p', 'Đáp đối xứng, khoá Tốt e4 của Trắng.', 'Tốt e chặn lại') },
      { san: 'Nf3' },
      { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã ra giữ Tốt e5 và kiểm soát d4.', 'Mã ra giữ nhà') },
      { san: 'Bc4' },
      { san: 'Bc5', annotation: ann('Bc5', 'b', 'Tượng ra c5 nhắm ô f2 yếu của Trắng.', 'Tượng nhắm tim Vua') },
      // Nhập thành TRƯỚC d3, đúng như dòng chính ở tab Khai cuộc.
      { san: 'O-O' },
      { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã ra tấn công Tốt e4.', 'Mã ra dọa Tốt') },
      { san: 'd3' },
      { san: 'd6', annotation: ann('d6', 'p', 'Chèn Tốt d mở đường Tượng c8.', 'Mở cửa Tượng nhà') },
      { san: 'c3' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành cho Vua an toàn.', 'Vua chui vào lều') },
    ],
  },
  {
    id: 'vs-queens-gambit',
    openingId: 'queens-gambit',
    englishName: "Queen's Gambit",
    opponentOpening: 'Gambit Hậu',
    opponentSide: 'white',
    emoji: '🇭🇺',
    counterName: 'Giữ d5, phá ghim bằng h6',
    idea: 'Tốt d5 và e6 khoá trung tâm, nên Trắng không mở được cột c cho Xe - đó là cả ý đồ phòng thủ.',
    opponentPlan: 'Trắng dâng c4, ra Tượng g5 ghim Mã f6, nhập thành rồi đưa Xe sang cột c.',
    points: [
      'Giữ Tốt d5, đáp e6 bảo vệ trung tâm.',
      'Đuổi Tượng ghim Bg5 bằng h6, buộc nó lùi về h4.',
      'Nhập thành sớm, rồi đánh d4 bằng ...c5 hoặc Bb7.',
    ],
    moves: [
      { san: 'd4' },
      { san: 'd5', annotation: ann('d5', 'p', 'Giữ Tốt d5 đối đầu trực diện với Tốt d4.', 'Tốt d ra chặn') },
      { san: 'c4' },
      { san: 'e6', annotation: ann('e6', 'p', 'Chèn e6 bảo vệ d5, mở đường Tượng f8.', 'Tốt e giữ nhà') },
      { san: 'Nc3' },
      { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã ra giữ trung tâm và ô d5.', 'Mã giữ trung tâm') },
      { san: 'Bg5' },
      { san: 'Be7', annotation: ann('Be7', 'b', 'Tượng về e7 chuẩn bị nhập thành.', 'Tượng về góc an toàn') },
      { san: 'e3' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành đưa Vua vào lều an toàn.', 'Vua chui vào lều') },
      { san: 'Nf3' },
      { san: 'h6', annotation: ann('h6', 'p', 'Tốt h6 đuổi Tượng ghim Bg5 đi.', 'Đuổi Tượng ghim đi') },
      { san: 'Bh4' },
      { san: 'b6', annotation: ann('b6', 'p', 'Mở đường Tượng c8 ra b7 tăng sức ép.', 'Tượng ra cánh rộng') },
    ],
  },
  {
    id: 'vs-english',
    openingId: 'english',
    englishName: 'English Opening',
    opponentOpening: 'Khai cuộc Anh',
    opponentSide: 'white',
    emoji: '🏝️',
    counterName: 'Chiếm e5, ghim Mã c3',
    idea: 'Trắng chơi chậm ở cánh Hậu, nên bé chiếm e5 và ghim Mã c3 trước khi Trắng kịp mở trung tâm.',
    opponentPlan: 'Trắng giữ c4 kiểm soát d5, dựng Tượng g2 rồi đánh cánh Hậu bằng b4-b5.',
    points: [
      'Đáp e5 chiếm trung tâm, không cho Trắng dựng thế.',
      'Tượng ra b4 ghim Mã c3, chặn Trắng mở trung tâm.',
      'Đẩy d5 giải phóng thế, Xe e8 giữ chắc ô e5.',
    ],
    moves: [
      { san: 'c4' },
      { san: 'e5', annotation: ann('e5', 'p', 'Chiếm e5, đối trọng với Tốt c4 của Trắng.', 'Tốt e ra trước') },
      { san: 'Nc3' },
      { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã f6 kiểm soát trung tâm từ xa.', 'Mã ra giữ nhà') },
      { san: 'Nf3' },
      { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã c6 thêm sức ép lên ô d4.', 'Mã thêm sức ép') },
      { san: 'g3' },
      { san: 'Bb4', annotation: ann('Bb4', 'b', 'Tượng ra b4 ghim Mã c3 của Trắng.', 'Tượng ra ghim Mã') },
      { san: 'Bg2' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành đưa Vua an toàn.', 'Vua chui vào lều') },
      { san: 'O-O' },
      { san: 'Re8', annotation: ann('Re8', 'r', 'Xe vào cột e giữ chắc ô e5.', 'Xe vào giữ ô') },
      { san: 'd3' },
      { san: 'd5', annotation: ann('d5', 'p', 'Đẩy d5 giải phóng thế cờ.', 'Tốt d tiến lên') },
    ],
  },
  {
    id: 'vs-ruy-lopez',
    openingId: 'ruy-lopez',
    englishName: 'Ruy Lopez',
    opponentOpening: 'Khai cuộc Tây Ban Nha',
    opponentSide: 'white',
    emoji: '🇪🇸',
    counterName: 'Phòng thủ Morphy: đuổi Tượng',
    idea: 'Tượng b5 chỉ đáng sợ khi còn ghim; đuổi nó bằng a6 rồi b5 là gỡ đòn ngay từ đầu.',
    opponentPlan: 'Trắng ghim Mã c6 bằng Tượng b5, giữ Xe e1 rồi đẩy d3-c3-d4 ép Tốt e5.',
    points: [
      'Đáp e5, ra Mã c6 giữ Tốt e5 trước Tượng b5.',
      'Đuổi Tượng bằng a6, đừng để nó ghim Mã c6 mãi.',
      'Dựng ...Nf6, ...Be7, ...b5 rồi nhập thành.',
    ],
    moves: [
      { san: 'e4' },
      { san: 'e5', annotation: ann('e5', 'p', 'Đáp đối xứng, chặn Tốt e4 của Trắng.', 'Tốt e chặn lại') },
      { san: 'Nf3' },
      { san: 'Nc6', annotation: ann('Nc6', 'n', 'Mã c6 ra giữ Tốt e5.', 'Mã ra giữ nhà') },
      { san: 'Bb5' },
      { san: 'a6', annotation: ann('a6', 'p', 'Tốt a6 đuổi Tượng b5 ra khỏi thế ghim.', 'Đuổi Tượng đi xa') },
      { san: 'Ba4' },
      { san: 'Nf6', annotation: ann('Nf6', 'n', 'Mã ra tấn công Tốt e4.', 'Mã ra dọa Tốt') },
      { san: 'O-O' },
      { san: 'Be7', annotation: ann('Be7', 'b', 'Tượng về e7 chuẩn bị nhập thành.', 'Tượng về góc an toàn') },
      { san: 'Re1' },
      { san: 'b5', annotation: ann('b5', 'p', 'Tốt b5 đuổi Tượng lùi về b3.', 'Tốt b đuổi Tượng') },
      { san: 'Bb3' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành cho Vua an toàn.', 'Vua chui vào lều') },
    ],
  },

  // ── Đối thủ cầm ĐEN → bé cầm TRẮNG ─────────────────────────────────────────
  {
    id: 'vs-sicilian',
    openingId: 'sicilian',
    englishName: 'Sicilian Defense',
    opponentOpening: 'Phòng thủ Sicilian',
    opponentSide: 'black',
    emoji: '🌋',
    // Cột c KHÔNG mở cho Trắng (Tốt c2 còn nguyên, Tốt c Đen đã bị ăn ở d4):
    // cái mở ra là trung tâm + ô d4 cho Mã. Đừng viết "mở cột c" ở phía Trắng.
    counterName: 'Sicilian Mở: đổi Tốt, Mã vào d4',
    idea: 'Đổi Tốt ở d4 cho bé trung tâm trước khi Đen kịp ...b5 và ...Bb7 - phải đi nhanh.',
    opponentPlan: 'Đen đánh cánh Hậu bằng ...b5, ...Bb7 và đổi Tốt ở d4.',
    points: [
      'Đẩy d4 đổi Tốt, lấy ô d4 làm bàn đạp cho Mã.',
      'Dựng Mã d4, Nc3 khống chế trung tâm trước khi mở cánh.',
      'Đẩy f4, đưa Be3 rồi chuẩn bị e5 dồn Đen vào thế bị động.',
    ],
    moves: [
      { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
      { san: 'c5' },
      { san: 'Nf3', annotation: ann('Nf3', 'n', 'Mã ra chuẩn bị đẩy d4 mở trung tâm.', 'Mã ra sẵn sàng') },
      { san: 'd6' },
      { san: 'd4', annotation: ann('d4', 'p', 'Đẩy d4 tấn công Tốt c5 của Đen.', 'Đẩy Tốt mở trung tâm') },
      { san: 'cxd4' },
      { san: 'Nxd4', annotation: ann('Nxd4', 'n', 'Mã về d4 chiếm ô trung tâm quý.', 'Mã chiếm trung tâm') },
      { san: 'Nf6' },
      { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 thêm sức ép lên trung tâm.', 'Mã thêm sức ép') },
      { san: 'a6' },
      { san: 'Be3', annotation: ann('Be3', 'b', 'Tượng ra e3 củng cố trung tâm.', 'Tượng ra giữ ô') },
      { san: 'e6' },
      { san: 'f4', annotation: ann('f4', 'p', 'Đẩy f4 mở đường tấn công cánh Vua.', 'Tốt f tiến công') },
      { san: 'Be7' },
    ],
  },
  {
    id: 'vs-french',
    openingId: 'french',
    englishName: 'French Defense',
    opponentOpening: 'Phòng thủ Pháp',
    opponentSide: 'black',
    emoji: '🇫🇷',
    counterName: 'Đẩy e5 giam quân, dựng f4',
    idea: 'Pháp chật vì Tượng c8 bị nhốt; bé đóng e5 rồi đánh cánh Vua, nơi Đen thiếu quân phòng thủ.',
    // Không hứa "mở đường Tượng c8": trong Pháp Tượng đó thường nằm nhà, tab
    // Khai cuộc cũng dạy đúng như vậy ("giữ Tượng c8, đừng để bị nhốt").
    opponentPlan: 'Đen dựng hàng rào e6-d5 rồi phá trung tâm bằng ...c5 và ...f6.',
    points: [
      'Đẩy d4 rồi e5 đóng cứng trung tâm, giam quân Đen.',
      'Dựng f4, Nf3-Be3 rồi đánh cánh Vua bằng f5.',
      'Đen đẩy ...c5 thì giữ d4 bằng Nf3, Be3.',
    ],
    moves: [
      { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
      { san: 'e6' },
      { san: 'd4', annotation: ann('d4', 'p', 'Dựng trung tâm kép, sẵn sàng đẩy e5.', 'Dựng trung tâm vững') },
      { san: 'd5' },
      { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 bảo vệ Tốt d4 và e4.', 'Mã giữ trung tâm') },
      { san: 'Nf6' },
      { san: 'e5', annotation: ann('e5', 'p', 'Đẩy e5 giam Mã f6, khoá trung tâm.', 'Tốt e khoá rồi') },
      { san: 'Nfd7' },
      { san: 'f4', annotation: ann('f4', 'p', 'Đẩy f4 chuẩn bị tấn công cánh Vua.', 'Tốt f tiến công') },
      { san: 'c5' },
      { san: 'Nf3', annotation: ann('Nf3', 'n', 'Mã f3 ra giữ ô d4 và e5.', 'Mã ra tiếp sức') },
      { san: 'Nc6' },
      { san: 'Be3', annotation: ann('Be3', 'b', 'Tượng ra e3 củng cố trung tâm.', 'Tượng ra giữ ô') },
      { san: 'Qb6' },
    ],
  },
  {
    id: 'vs-caro-kann',
    openingId: 'caro-kann',
    englishName: 'Caro-Kann Defense',
    opponentOpening: 'Phòng thủ Caro-Kann',
    opponentSide: 'black',
    emoji: '🛡️',
    counterName: 'Chiếm trung tâm, đuổi Tượng g6',
    idea: 'Đen mất hai nước đưa Tượng ra f5, nên bé có thời gian chiếm trung tâm và đuổi Tượng về g6.',
    opponentPlan: 'Đen đưa Tượng ra f5 trước khi đóng e6, giữ trung tâm cân bằng.',
    points: [
      'Chiếm trung tâm bằng d4 rồi đổi Tốt mở đường cho quân.',
      'Nhảy Mã vào e4 rồi Ng3 đuổi Tượng g6.',
      'Đẩy h4 tấn công Tượng g6; Đen chặn h6 là cột h mở cho Xe.',
    ],
    moves: [
      { san: 'e4', annotation: ann('e4', 'p', 'Chiếm trung tâm, mở đường Hậu & Tượng.', 'Tốt e nhảy vọt') },
      { san: 'c6' },
      { san: 'd4', annotation: ann('d4', 'p', 'Dựng trung tâm kép, thách Đen ăn Tốt.', 'Dựng trung tâm vững') },
      { san: 'd5' },
      { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 bảo vệ Tốt e4 và d5.', 'Mã giữ trung tâm') },
      { san: 'dxe4' },
      { san: 'Nxe4', annotation: ann('Nxe4', 'n', 'Mã ăn lại Tốt e4, đứng giữa bàn cờ.', 'Mã vào trung tâm') },
      { san: 'Bf5' },
      { san: 'Ng3', annotation: ann('Ng3', 'n', 'Mã né sang g3, đuổi Tượng f5 đi.', 'Đuổi Tượng ra ngoài') },
      { san: 'Bg6' },
      { san: 'h4', annotation: ann('h4', 'p', 'Đẩy h4 tấn công Tượng g6 đang trú.', 'Tốt h tiến công') },
      { san: 'h6' },
      { san: 'Nf3', annotation: ann('Nf3', 'n', 'Mã f3 ra giữ trung tâm, chuẩn bị nhập thành.', 'Mã ra tiếp sức') },
      { san: 'Nd7' },
    ],
  },
  {
    id: 'vs-kings-indian',
    openingId: 'kings-indian',
    englishName: "King's Indian Defense",
    opponentOpening: "Phòng thủ King's Indian",
    opponentSide: 'black',
    emoji: '🏰',
    counterName: 'Trung tâm lớn d4-c4-e4',
    idea: 'Đen nhường trung tâm để đánh cánh Vua sau; bé chiếm kín trước thì cơn bão Tốt không có chỗ bung.',
    opponentPlan: 'Đen nhường trung tâm, dựng Tượng g7 rồi phản công bằng ...e5 và ...f5.',
    points: [
      'Chiếm trung tâm bằng bộ ba Tốt d4-c4-e4.',
      'Phát triển Nc3, Nf3, Be2 rồi nhập thành trước khi Đen đánh.',
      'Giữ chắc trung tâm rồi mở cánh Hậu bằng c5 và b4.',
    ],
    moves: [
      { san: 'd4', annotation: ann('d4', 'p', 'Chiếm trung tâm, mở đường Tượng c1.', 'Dâng Tốt trung tâm') },
      { san: 'Nf6' },
      { san: 'c4', annotation: ann('c4', 'p', 'Tốt c4 tăng sức ép, sẵn sàng đẩy e4.', 'Tốt c tiến lên') },
      { san: 'g6' },
      { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 bảo vệ ô e4 và d5.', 'Mã giữ trung tâm') },
      { san: 'Bg7' },
      { san: 'e4', annotation: ann('e4', 'p', 'Đẩy e4 dựng trung tâm lớn.', 'Trung tâm thật lớn') },
      // Đen nhập thành trước rồi mới ...d6, đúng thứ tự dòng chính ở tab Khai cuộc.
      { san: 'O-O' },
      { san: 'Nf3', annotation: ann('Nf3', 'n', 'Mã f3 ra bảo vệ Tốt e4.', 'Mã ra giữ nhà') },
      { san: 'd6' },
      { san: 'Be2', annotation: ann('Be2', 'b', 'Tượng ra e2 chuẩn bị nhập thành.', 'Tượng về góc an toàn') },
      { san: 'e5' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành cho Vua an toàn.', 'Vua chui vào lều') },
      { san: 'Nc6' },
    ],
  },
  {
    id: 'vs-nimzo-indian',
    openingId: 'nimzo-indian',
    englishName: 'Nimzo-Indian Defense',
    opponentOpening: 'Phòng thủ Nimzo-Indian',
    opponentSide: 'black',
    emoji: '⛓️',
    // e3 KHÔNG gỡ được ghim (ghim còn cho tới khi Đen đổi Tượng hoặc bé đẩy a3);
    // cái e3 đánh đổi là nhường ô e4 để giữ cặp Tượng - nói đúng như vậy.
    counterName: 'Nhường e4: e3-Bd3 giữ cặp Tượng',
    idea: 'Ghim Mã c3 khiến Trắng không đẩy được e4; bé đổi lại bằng cặp Tượng và cột c sau ...c5.',
    opponentPlan: 'Đen ghim Mã c3 bằng Tượng b4, dọa đổi quân rồi đẩy ...c5 phá trung tâm.',
    points: [
      'Chọn e3 thay vì e4: chịu ghim Mã c3, đổi lại giữ cặp Tượng.',
      'Đưa Tượng ra d3 nhắm cánh Vua Đen rồi nhập thành.',
      'Đen đẩy ...c5 thì đổi Tốt c lấy d5, mở cột c cho Xe a1.',
    ],
    moves: [
      { san: 'd4', annotation: ann('d4', 'p', 'Chiếm trung tâm, mở đường Tượng c1.', 'Dâng Tốt trung tâm') },
      { san: 'Nf6' },
      { san: 'c4', annotation: ann('c4', 'p', 'Tốt c4 giành thêm không gian trung tâm.', 'Tốt c tiến lên') },
      { san: 'e6' },
      { san: 'Nc3', annotation: ann('Nc3', 'n', 'Mã c3 giữ ô e4, dù sắp bị ghim.', 'Mã giữ trung tâm') },
      { san: 'Bb4' },
      { san: 'e3', annotation: ann('e3', 'p', 'Chèn e3 mở đường Tượng f1, giữ cặp Tượng.', 'Tượng nhà mở ra') },
      { san: 'O-O' },
      { san: 'Bd3', annotation: ann('Bd3', 'b', 'Tượng ra d3 nhắm cánh Vua Đen.', 'Tượng nhắm tim Vua') },
      { san: 'd5' },
      { san: 'Nf3', annotation: ann('Nf3', 'n', 'Mã f3 bảo vệ trung tâm, chuẩn bị nhập thành.', 'Mã ra giữ nhà') },
      { san: 'c5' },
      { san: 'O-O', annotation: ann('O-O', 'k', 'Nhập thành cho Vua an toàn.', 'Vua chui vào lều') },
      { san: 'Nc6' },
    ],
  },

  // MỖI BÀI GẮN ĐÚNG MỘT khai cuộc trong tab Khai cuộc (`openingId` = id khai
  // cuộc đó): bé học khai cuộc nào thì có đúng một bài đối phó cho khai cuộc ấy.
  // Trước đây còn 6 bài cho những nước mở đầu KHÔNG dạy ở tab Khai cuộc (Réti,
  // Scandinavian, Grünfeld, Queen's Indian, Ván mở, Caro tiến Tốt) - hai tab lệch
  // nhau nên bé tra cứu bị rối; đã bỏ để hai tab song song đúng một-một.
]

export function getCounter(id: string): CounterLesson | undefined {
  return COUNTERS.find((lesson) => lesson.id === id)
}
