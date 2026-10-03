/**
 * Kho nội dung cho nút **ⓘ** (giải thích tại chỗ) - dùng ở mọi khung trong app.
 *
 * Vì sao có file này: bé (và ba mẹ) nhìn thấy những cái tên rất "kêu" - *Hệ thống London*,
 * *Phòng thủ Sicilian*, *thế Lucena*, *đòn Xiên* - mà không biết chúng từ đâu ra, ai là
 * người nghĩ ra, và tại sao lại gọi như vậy. Mỗi khung có một nút ⓘ mở ra đúng mấy câu đó.
 *
 * Ba loại nội dung, gắn bằng `tag`:
 *  - `📜 Lịch sử`  - cái tên này từ đâu, ra đời khi nào;
 *  - `👤 Tác giả`  - kỳ thủ/kỹ thuật gia gắn với nó là ai;
 *  - `♟️ Thế cờ`   - ý tưởng chính của thế cờ/đòn này là gì.
 *
 * Nguyên tắc viết: **ngắn, đúng, không chép lời bình của ai**. Số liệu lịch sử chỉ ghi khi
 * chắc (ví dụ London System lấy tên từ giải Luân Đôn 1922), chỗ nào chỉ là "thường được
 * cho là" thì ghi đúng như vậy - thà rõ ràng còn hơn nghe chắc chắn mà sai.
 */

export interface InfoEntry {
  /** Tiêu đề hiện đậm ở đầu khung giải thích. */
  title: string
  /** Nhãn loại nội dung (lịch sử / tác giả / thế cờ…). */
  tag: string
  /** Các đoạn ngắn - mỗi phần tử là một đoạn. */
  body: string[]
}

export const INFO: Record<string, InfoEntry> = {
  // ── Về chính app này ───────────────────────────────────────────────────────
  app: {
    title: 'Nam An - Cờ Vua',
    tag: '⚙️ Về app này',
    body: [
      'App này được một người bố viết cho con trai mình là Nam An, để bé 7 tuổi học cờ vua theo đúng cách một kỳ thủ trẻ tiến bộ: khai cuộc → trung cuộc → tàn cuộc.',
      'Mọi lời giảng, khẩu quyết và câu đố trong app đều do app tự viết (không chép lời bình của sách). Các chuỗi nước đi là dữ kiện cờ vua nên ai cũng dùng được.',
      'App chạy hoàn toàn trên máy - không tài khoản, không máy chủ, không gửi dữ liệu của bé đi đâu.',
    ],
  },
  board: {
    title: 'Bàn cờ & cách đi quân',
    tag: '🎮 Cách chơi',
    body: [
      'Bé có thể **kéo quân** bằng chuột/ngón tay, hoặc **bấm quân rồi bấm ô đích** (tiện hơn trên iPad).',
      'Trong tab Khai cuộc còn có phím tắt: ◀ ▼ để lùi, ▶ ▲ để tiến từng nước.',
      'Bàn cờ tự xoay 180° khi bé cầm quân Đen, để hàng 7-8 luôn nằm gần bé.',
    ],
  },
  stars: {
    title: 'Sao ⭐ và danh hiệu',
    tag: '🎮 Cách chơi',
    body: [
      'Mỗi hoạt động hoàn thành cho bé một số sao: bốn ⭐ cho bài giảng, năm ⭐ cho thế tàn cuộc, sáu ⭐ cho Cúp Vàng khai cuộc… Làm lại lần sau được ít hơn.',
      'Đủ sao thì lên danh hiệu: 🌱 Kỳ thủ Nhí → 🐣 Tập sự Cờ vua (8 ⭐) → 🥉 Kiện tướng Nhí (20 ⭐) → 👑 Grand Master Nhí (40 ⭐).',
      'Sao chỉ để động viên tinh thần học - app **không** chấm điểm hơn thua, và làm sai không bao giờ bị trừ sao.',
    ],
  },
  cup: {
    title: 'Cúp Vàng 🏆',
    tag: '🎮 Cách chơi',
    body: [
      'Cúp Vàng là phần thưởng lớn nhất của tab Khai cuộc: bé phải **tự kéo-thả đúng từng nước của mình** trong chế độ *Luyện thuộc lòng* cho tới hết bài.',
      'Nhận Cúp Vàng cũng chính là lúc **mở khoá bài khai cuộc kế tiếp** trong bản đồ leo cấp.',
      'Chế độ *Học từng bước* không mở khoá bài mới - nó để bé hiểu bài trước đã.',
    ],
  },
  eye: {
    title: 'Mắt Thần Cờ Vua 👁️',
    tag: '🧠 Ý tưởng',
    body: [
      'Bật Mắt Thần thì bàn cờ được tô màu theo mức an toàn: ô **xanh nhạt** là ô an toàn, ô **xanh đậm** là bốn ô trung tâm quý giá.',
      'Kèm theo đó app **cảnh báo quân đang bị treo** - quân bị tấn công mà không ai che, hoặc bị quân rẻ hơn ăn.',
      'Mục đích là luyện thói quen *nhìn toàn cảnh bàn cờ* trước khi đi, để bé không "cúng quân miễn phí".',
    ],
  },
  machine: {
    title: 'Chú Máy - đối thủ tập luyện',
    tag: '🧠 Ý tưởng',
    body: [
      'App có hai "chú Máy": một **bộ máy cờ viết bằng JavaScript** (chạy ngay, bốn mức: Dễ - Vừa - Khó - Siêu) và **Stockfish** (bộ máy mã nguồn mở mạnh nhất thế giới) dùng cho phân tích và mức Siêu.',
      'Ở mức Dễ và Vừa, chú Máy **cố tình đi hơi bừa** cho ván cờ vui và vừa sức bé; từ mức Khó trở lên thì chơi hết sức.',
      'Stockfish được tải theo nhu cầu (chỉ khi bé thật sự chọn mức Siêu) nên mở app vẫn nhanh.',
    ],
  },
  notation: {
    title: 'Ký hiệu nước đi',
    tag: '🎮 Cách chơi',
    body: [
      'App có hai cách ghi: **Hình cờ + quốc tế** (`♘Nf3` - hiện cả hình quân lẫn ký hiệu FIDE để bé quen dần) và **Tiếng Việt** (`Mf3` - Mã, Tượng, Xe, Hậu, Vua).',
      'Bảng đối chiếu trong ⚙️ liệt kê đủ 6 quân **và** các ký hiệu đặc biệt: `O-O` nhập thành, `+` chiếu, `#` chiếu bí, `x` ăn quân, `=` phong cấp, `e.p.` bắt Tốt qua đường, `!`/`?` nước hay/dở, `1-0`/`0-1`/`½-½` kết quả ván.',
      'Đọc trọn một biên bản cờ là kỹ năng bé dùng cả đời - kể cả khi chơi với người thật.',
    ],
  },
  principles: {
    title: '10 nguyên tắc vàng 🏅',
    tag: '🧠 Ý tưởng',
    body: [
      'Mười thói quen dưới đây áp dụng được ở **mọi ván, mọi thế cờ** - không phải học thuộc lòng một dòng biến nào.',
      'Người chơi cờ giỏi không thắng vì nhớ nhiều biến khai cuộc, mà vì mỗi nước đều tự hỏi: *trung tâm đã chắc chưa, quân đã ra hết chưa, Vua đã an toàn chưa, quân mình có bị treo không?*',
      'Bé cứ mở từng thẻ đọc câu hỏi tự vấn rồi nhẩm khẩu quyết - chỉ cần nhớ và làm đúng bốn nguyên tắc đầu là đã hơn hẳn bạn cùng tuổi.',
    ],
  },
  plan: {
    title: 'Kế hoạch trung cuộc 🧭',
    tag: '🧠 Ý tưởng',
    body: [
      'Học hết dòng khai cuộc mới chỉ là nửa đầu. Khung kế hoạch cho bé biết **sau khi khai cuộc xong thì nên làm gì** - cột nào cần mở, cánh nào cần đánh, quân nào cần đổi.',
      'Mỗi khai cuộc có ba việc viết riêng, gắn với đúng cấu trúc Tốt của nó.',
      'Khung **🔎 Kế hoạch theo thế cờ hiện tại** thì khác: nó do bộ máy cờ đọc chính thế cờ đang đứng rồi nói ra việc gấp trước mắt (quân đang treo, cột mở, Tốt sắp thành Hậu).',
    ],
  },

  // ── 8 khai cuộc: lịch sử ───────────────────────────────────────────────────
  'opening:london': {
    title: 'Vì sao gọi là “Hệ thống London”?',
    tag: '📜 Lịch sử',
    body: [
      'Cái tên này đến từ **giải đấu quốc tế ở Luân Đôn năm 1922** - một trong những giải mạnh nhất thời đó, do Capablanca vô địch (trên Alekhine, Vidmar, Rubinstein).',
      'Trong giải đó, hệ thống này xuất hiện tới bảy ván nên báo chí cờ bắt đầu gọi nó là "London System".',
      'Điểm đặc biệt: đây là một **hệ thống**, không phải một dòng biến - Trắng cứ đưa Tượng ra f4 rồi dựng "kim tự tháp Tốt" c3-d4-e3, chơi được trước hầu hết cách đáp của Đen.',
    ],
  },
  'opening:italian': {
    title: 'Vì sao gọi là “Ván cờ Ý”?',
    tag: '📜 Lịch sử',
    body: [
      'Tên gọi gắn với các **kỳ thủ Ý thế kỷ 16**, nhất là Gioachino Greco - người đã phân tích và ghi lại rất nhiều ván mẫu của khai cuộc này.',
      'Tiếng Ý nó tên là **Giuoco Piano**, nghĩa là "ván cờ êm ả" - vì Trắng không đánh phủ đầu mà dựng thế vững rồi mới đẩy d4.',
      'Khuôn mẫu là: Tốt e4 - Mã f3 - Tượng c4 nhắm vào ô yếu f7 của Đen.',
    ],
  },
  'opening:kings-indian': {
    title: 'Vì sao gọi là “Ấn Độ của Vua”?',
    tag: '📜 Lịch sử',
    body: [
      'Họ "phòng thủ Ấn Độ" được đặt tên theo các kỳ thủ **Ấn Độ thế kỷ 19** - những người đầu tiên chơi kiểu giấu Tượng vào g7 rồi tấn công trung tâm từ xa. Người ta thường nhắc tới Moheschunder Bonnerjee.',
      'Bản "của Vua" (King\'s Indian) nghĩa là Đen để Tốt ở e7-e5 mà giữ Tốt d6, dồn sức vào cánh Vua.',
      'Thế kỷ 20, các kỳ thủ Liên Xô - nhất là Bronstein và Boleslavsky - biến nó thành vũ khí đỉnh cao, và tới nay vẫn là khai cuộc của những người thích **phản công dữ dội**.',
    ],
  },
  'opening:sicilian': {
    title: 'Vì sao gọi là “Phòng thủ Sicilian”?',
    tag: '📜 Lịch sử',
    body: [
      'Tên gọi bắt nguồn từ **một ván thư tín khoảng năm 1817** giữa các kỳ thủ ở Luân Đôn và Sicily (Ý) - ván đó Đen chơi 1...c5.',
      'Ý tưởng cốt lõi: **không đáp lại bằng Tốt e5 cho cân**, mà đánh vào cánh Hậu để giành thế chủ động lâu dài - đổi lại Trắng được trung tâm mạnh hơn.',
      'Đây là cách đáp 1.e4 phổ biến nhất ở mọi cấp độ, và là khai cuộc ruột của rất nhiều nhà vô địch thế giới.',
    ],
  },
  'opening:ruy-lopez': {
    title: 'Vì sao gọi là “Khai cuộc Tây Ban Nha”?',
    tag: '📜 Lịch sử',
    body: [
      'Tên gọi lấy từ **Ruy López de Segura**, một linh mục người Tây Ban Nha, người đã phân tích khai cuộc này trong cuốn sách cờ xuất bản năm **1561**.',
      'Tên khác của nó chính là **Khai cuộc Tây Ban Nha** (Spanish Opening).',
      'Ý tưởng: Tượng lên b5 **ghim Mã c6** - Mã đó đang giữ Tốt e5, nên Trắng đang gián tiếp tấn công Tốt e5. Đây là bài học kinh điển về "tấn công quân giữ, chứ không tấn công quân bị giữ".',
    ],
  },
  'opening:queens-gambit': {
    title: 'Vì sao gọi là “Gambit Hậu”?',
    tag: '📜 Lịch sử',
    body: [
      'Đây là **một trong những khai cuộc cổ nhất được ghi lại**: Luis Ramírez de Lucena đã mô tả nó trong cuốn sách năm **1497**.',
      'Chữ "gambit" (từ tiếng Ý *gambetto*, nghĩa là "làm vấp chân") chỉ việc **dâng Tốt để giành lợi thế khác** - ở đây Trắng dâng Tốt c4 để Đen phải bận tâm giữ Tốt d5.',
      'Lưu ý thú vị: tên là "Hậu" nhưng Hậu **không** ra ngoài ngay - Trắng chỉ dùng Tốt c4 để mở đường phát triển quân.',
    ],
  },
  'opening:french': {
    title: 'Vì sao gọi là “Phòng thủ Pháp”?',
    tag: '📜 Lịch sử',
    body: [
      'Tên gọi đến từ **trận đấu thư tín năm 1834 giữa các kỳ thủ Paris và Luân Đôn**, nơi nước 1...e6 được dùng nhiều.',
      'Ý tưởng: Đen **chấp nhận Tốt e6 đóng bớt Tượng c8** để đổi lấy một trung tâm vững như bàn thạch, sau đó phá trung tâm bằng ...c5 và ...f6.',
      'Nó nổi tiếng là khai cuộc "chắc nhưng ì": ai thích thế vững, ít rủi ro thường chọn nó.',
    ],
  },
  'opening:caro-kann': {
    title: 'Vì sao gọi là “Phòng thủ Caro-Kann”?',
    tag: '📜 Lịch sử',
    body: [
      'Tên ghép từ hai người **phân tích nó năm 1886**: Horatio Caro (kỳ thủ người Anh) và Marcus Kann (kỳ thủ người Áo).',
      'Điểm khác Phòng thủ Pháp đúng một nước: Đen chơi **1...c6** thay vì 1...e6, nhờ vậy vẫn đẩy được **...d5 mà không nhốt Tượng c8** - giải quyết đúng điểm yếu của Pháp.',
      'Nước 1...c6 nhìn khiêm tốn nhưng chuẩn bị xong từ trước: chiếm trung tâm bằng Tốt, giữ quân cân đối, không tạo điểm yếu.',
    ],
  },

  // ── 2 khai cuộc bổ sung giữ lại (5 Trắng / 5 Đen) ───────────────────────
  'opening:nimzo-indian': {
    title: 'Phòng thủ Nimzo-Indian',
    tag: '👤 Tác giả',
    body: [
      'Mang tên **Aron Nimzowitsch** - người đề ra trường phái "kiểm soát trung tâm bằng quân" thay vì chiếm bằng Tốt.',
      'Nước then chốt **...Bb4 ghim Mã c3**: vừa khoá không cho Trắng đẩy e4, vừa dọa đổi Tượng lấy Mã để làm lệch cấu trúc Tốt.',
      'Đây là một trong những phòng thủ **phổ biến nhất ở mọi trình độ** - chơi được trước gần như mọi thứ Trắng làm.',
    ],
  },
  'opening:english': {
    title: 'Khai cuộc Anh (English Opening)',
    tag: '📜 Lịch sử',
    body: [
      'Một trong những khai cuộc **phổ biến nhất ở mọi cấp độ**, được các kỳ thủ Anh đưa lên bản đồ thế giới - nổi nhất là **Howard Staunton** và sau này **Tony Miles**.',
      'Ý tưởng độc đáo: Trắng **không vội chiếm trung tâm bằng Tốt** mà kiểm soát ô d5 từ xa bằng Tốt cánh, rồi mới chọn hướng.',
      'Vì thế nó rất linh hoạt: có thể chuyển sang hệ thống kiểu London, hoặc dựng "lều Tượng" g2 rồi tấn công cánh Hậu.',
    ],
  },

  // ── 8 tác giả (Đại kiện tướng gắn với từng khai cuộc) ──────────────────────
  'gm:carlsen': {
    title: 'Magnus Carlsen (sinh 1990)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Na Uy, **Nhà vô địch thế giới 2013-2023**. Nổi tiếng với khả năng chơi tàn cuộc cực dai và ép đối thủ trong thế "không thắng cũng không thua".',
      'Carlsen hay dùng **Hệ thống London** khi muốn một ván chắc chắn, ít lý thuyết mà vẫn có thế đẹp - chính vì vậy bài London của app lấy tên ông.',
    ],
  },
  'gm:so': {
    title: 'Wesley So (sinh 1993)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ gốc Philippines, định cư ở Hoa Kỳ; từng là **Nhà vô địch Hoa Kỳ** và là một trong những người chơi chắc tay nhất thế giới.',
      'Lối chơi của anh dựa nhiều vào **thế cờ gọn gàng, ít sơ hở** - đúng tinh thần của Ván cờ Ý mà app dạy.',
    ],
  },
  'gm:nakamura': {
    title: 'Hikaru Nakamura (sinh 1987)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Hoa Kỳ, nhiều lần vô địch quốc gia, đặc biệt mạnh ở **cờ nhanh và cờ chớp**.',
      'Anh nổi tiếng là người chơi **Phòng thủ Ấn Độ của Vua** rất sắc - nơi Đen nhường trung tâm để rồi phản công bằng một cơn bão Tốt.',
    ],
  },
  'gm:kasparov': {
    title: 'Garry Kasparov (sinh 1963)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Nga, **Nhà vô địch thế giới 1985-2000** - thời kỳ thống trị dài nhất trong lịch sử cờ vua hiện đại.',
      'Ông là người biến **Phòng thủ Sicilian** thành vũ khí sát thương, và nổi tiếng với lối chơi tấn công cực mạnh cùng khả năng tính toán sâu.',
    ],
  },
  'gm:fischer': {
    title: 'Bobby Fischer (1943-2008)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Hoa Kỳ, **Nhà vô địch thế giới 1972** sau "Trận đấu của thế kỷ" với Boris Spassky tại Iceland.',
      'Ông chơi **Khai cuộc Tây Ban Nha (Ruy López)** nhiều tới mức người ta gọi cả một hệ biến là "Fischer - Spassky". Ông cũng nổi tiếng nhờ chuẩn bị khai cuộc cực kỹ.',
    ],
  },
  'gm:polgar': {
    title: 'Judit Polgár (sinh 1976)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Hungary, **nữ kỳ thủ mạnh nhất trong lịch sử cờ vua** và từng nằm trong tốp 10 thế giới - điều chưa từng có với một phụ nữ.',
      'Ba chị em Polgár được bố dạy cờ từ nhỏ theo cách đặc biệt: chuyên sâu một chủ đề rồi mở rộng. Cô chơi **Gambit Hậu** với lối tấn công mãnh liệt, không hề e dè.',
    ],
  },
  'gm:botvinnik': {
    title: 'Mikhail Botvinnik (1911-1995)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Nga, **Nhà vô địch thế giới 1948-1963** (ba lần giành lại ngôi), được gọi là "bố già" của trường phái cờ vua Liên Xô.',
      'Ngoài thi đấu, ông còn là **giáo viên** của hàng loạt nhà vô địch (Karpov, Kasparov…) và là người tiên phong dùng máy tính để phân tích cờ.',
      'Bài của app dùng **Phòng thủ Pháp** - khai cuộc ông mài rất kỹ trong nhiều năm.',
    ],
  },
  'gm:petrosian': {
    title: 'Tigran Petrosian (1929-1984)',
    tag: '👤 Tác giả',
    body: [
      'Kỳ thủ Armenia, **Nhà vô địch thế giới 1963-1969**, được gọi là "Vua phòng thủ" vì gần như không bao giờ để đối thủ có đòn hiểm.',
      'Ông hay chơi **Phòng thủ Caro-Kann** - kiểu khai cuộc không vội, giữ thế cân bằng rồi chờ đối thủ sai.',
      'Bài học lớn từ ông: **kiên nhẫn cũng là một vũ khí**, không phải nước nào cũng phải tấn công.',
    ],
  },

  // ── 4 chủ đề "Tìm nước hay nhất" ───────────────────────────────────────────────────
  'theme:attack': {
    title: 'Tấn công Vua 👑',
    tag: '♟️ Thế cờ',
    body: [
      'Khi Vua địch đã **lộ liễu hoặc bị nhốt sau quân của chính nó**, cả ván cờ có thể kết thúc chỉ trong một nước.',
      'Việc của bé là soi xem Vua địch còn **ô nào để chạy** - nếu hết ô, chỉ cần đưa quân tới chiếu theo đúng hàng/cột là xong.',
      'Cách nhớ: **Vua hết cửa, quân giáng đòn**.',
    ],
  },
  'theme:win-material': {
    title: 'Trừng phạt quân treo 🎯',
    tag: '♟️ Thế cờ',
    body: [
      'Quân **không được ai che** là quân dễ mất nhất. Đối thủ để hai quân cùng nằm trong tầm một quân của bé thì chỉ cứu được một.',
      'Nước hay nhất thường là **bắt đôi**: một quân vừa tấn công quân này vừa chĩa vào quân kia.',
      'Cách nhớ: **Quân treo là quân mất**.',
    ],
  },
  'theme:win-queen': {
    title: 'Đòn hiểm ăn Hậu 👸',
    tag: '♟️ Thế cờ',
    body: [
      'Hậu là quân **to nhất bàn cờ**, nên bất kỳ sơ hở nào với Hậu cũng đắt giá nhất.',
      'Hai đòn hay dùng: **ăn Hậu lộ liễu** (Hậu đứng không ai che) và **xiên Hậu sau Vua** (chiếu Vua để nó chạy, rồi ăn Hậu phía sau).',
      'Cách nhớ: **Hậu rời tay, ván đổi chiều**.',
    ],
  },
  'theme:passed-pawn': {
    title: 'Tốt thông tiến ♟️',
    tag: '♟️ Thế cờ',
    body: [
      '**Tốt thông** là Tốt không còn Tốt đối phương nào chặn trên cùng cột - nó có thể tiến thẳng tới phong Hậu.',
      'Nước hay nhất nhiều khi rất đơn giản: **cứ đẩy Tốt thông lên**, càng gần hàng 8 càng buộc địch phải lo.',
      'Cách nhớ: **Tốt thông, cứ tiến**.',
    ],
  },

  // ── 4 khái niệm chiến lược vị trí ─────────────────────────────────────────
  'positional:outpost': {
    title: 'Tiền đồn (Outpost) 🐴',
    tag: '♟️ Thế cờ',
    body: [
      'Một ô mà **Tốt của đối thủ không còn cách nào tấn công được nữa**, lại được Tốt nhà bảo vệ - thường là ô ở hàng 5-6.',
      'Đặt được **Mã lên tiền đồn** là giấc mơ của mọi kỳ thủ: Mã ở đó không ai đuổi được và toả ra rất nhiều ô.',
      'Nhận biết: nhìn Tốt của đối thủ - ô nào chúng **không thể tới đánh** thì đó là miền đất hứa cho Mã.',
    ],
  },
  'positional:open-file': {
    title: 'Cột mở cho Xe 📏',
    tag: '♟️ Thế cờ',
    body: [
      'Cột **không còn Tốt nào** (mở) hoặc chỉ còn Tốt của một bên (nửa mở).',
      'Xe sinh ra để đi trên **những con đường dài** - cột mở chính là con đường đó. Đưa Xe vào cột mở là bước chuẩn bị cho hầu hết kế hoạch tấn công.',
      'Với bé: sau khi nhập thành, câu hỏi tiếp theo luôn là *"Xe mình đã ra được cột mở nào chưa?"*',
    ],
  },
  'positional:bishop-pair': {
    title: 'Sức mạnh của Cặp Tượng ⛪',
    tag: '♟️ Thế cờ',
    body: [
      'Có **cả hai Tượng** trong khi đối thủ mất một Tượng là lợi thế lâu dài - hai Tượng phủ cả bàn cờ, cả ô đen lẫn ô trắng.',
      'Giá trị cặp Tượng tăng **khi bàn cờ thoáng** (ít Tốt): Tượng cần đường chéo rộng.',
      'Vì vậy đổi một Tượng lấy một Mã thường làm suy yếu thế của người đổi - nhưng nếu **phá được cấu trúc Tốt** của đối thủ thì lại đáng.',
    ],
  },
  'positional:seventh-rank': {
    title: 'Xe trên hàng 7 ♟️',
    tag: '♟️ Thế cờ',
    body: [
      'Xe vào **hàng 7** (với Trắng) gây ác mộng: nó **tấn công Tốt chưa tiến** và **nhốt Vua đối phương ở hàng cuối**.',
      'Giới phân tích cờ vẫn gọi vui nó là **"con lợn trên hàng 7"** - cứ vô địch hàng 7 là kèo thắng rất lớn.',
      'Bốn ô ở hàng 7 tạo thành "hàng bất khả xâm phạm": nếu để hai Xe của đối thủ cùng vào đó thì gần như hết cách chống.',
    ],
  },
}

/**
 * Các nhãn `tag` hợp lệ - dùng chung cho UI và bài kiểm tự động, để một tag viết sai
 * chính tả không lặng lẽ lọt vào giao diện.
 */
export const INFO_TAGS = [
  '📜 Lịch sử',
  '👤 Tác giả',
  '♟️ Thế cờ',
  '🧠 Ý tưởng',
  '🎮 Cách chơi',
  '⚙️ Về app',
  '⚙️ Về app này',
] as const

/** Lấy nội dung theo khoá; trả `undefined` nếu chưa có (UI sẽ không hiện nút ⓘ). */
export function infoById(topic: string): InfoEntry | undefined {
  return INFO[topic]
}

/**
 * Danh sách khoá BẮT BUỘC phải có nội dung - dùng cho bài kiểm tự động, để thêm một
 * khai cuộc/đòn/bài giảng mới mà quên viết giải thích thì test báo ngay.
 */
export const REQUIRED_INFO_IDS: readonly string[] = [
  'app',
  'board',
  'stars',
  'cup',
  'eye',
  'machine',
  'notation',
  'principles',
  'plan',
  ...[
    'london',
    'italian',
    'kings-indian',
    'sicilian',
    'ruy-lopez',
    'queens-gambit',
    'french',
    'caro-kann',
    'english',
    'nimzo-indian',
  ].map((id) => `opening:${id}`),
  ...['carlsen', 'so', 'nakamura', 'kasparov', 'fischer', 'polgar', 'botvinnik', 'petrosian'].map(
    (id) => `gm:${id}`,
  ),
  ...['attack', 'win-material', 'win-queen', 'passed-pawn'].map((id) => `theme:${id}`),
  ...['outpost', 'open-file', 'bishop-pair', 'seventh-rank'].map((id) => `positional:${id}`),
]
