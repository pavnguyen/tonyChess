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
  stages: {
    title: 'Giai đoạn của bé (7 → 18 tuổi)',
    tag: '⚙️ Về app',
    body: [
      'App có bốn lứa tuổi: **Nhí Tò Mò (7-9)**, **Thiếu Nhi Tập Sự (10-12)**, **Thiếu Niên Chiến Lược (13-15)**, **Kỳ Thủ Trưởng Thành (16-18)**.',
      'Tuổi **chỉ là gợi ý** - trình độ mới là quyết định. Một bé 13 tuổi mới chơi cờ lần đầu vẫn nên dùng giao diện của "Thiếu nhi".',
      'Đổi lứa tuổi sẽ đổi: có hiện khẩu quyết vè hay không, mức mạnh của máy, và có tự nhắc gợi ý khi bé đi sai hay không.',
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
  tree: {
    title: 'Cây khai cuộc 🌳',
    tag: '🧠 Ý tưởng',
    body: [
      'Một khai cuộc **không phải một dòng duy nhất**. Ở vài nước, đối thủ có nhiều cách đáp hợp lý - chỗ rẽ đó gọi là **ngã ba**.',
      'Khung cây liệt kê mọi ngã ba, ghi rõ `3.` (nước của Trắng) hay `3...` (nước đáp của Đen), và **ngã ba này là lượt ai**.',
      'Nút có ⭐ là **dòng chính** - nước mà bài giảng đang dạy. Bấm một nút khác thì app nhảy thẳng bàn cờ tới nhánh đó để bé thử.',
      'Mục đích: học **phản ứng** ("Đen có thể đáp thế này hoặc thế kia") thay vì học vẹt một dòng.',
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

  // ── 7 họ đòn chiến thuật ───────────────────────────────────────────────────
  'tactic:fork': {
    title: 'Bắt đôi (Fork) 🍴',
    tag: '♟️ Thế cờ',
    body: [
      'Một quân **tấn công hai quân cùng lúc**. Đối thủ chỉ cứu được một - thế là mất quân kia.',
      'Bắt đôi bằng **Mã** là đáng sợ nhất, vì Mã không bị quân nào cản đường và nước tấn công có thể tới từ ô rất bất ngờ.',
      'Mẹo nghĩ: trước khi nhảy Mã, bé nhìn xem quân này **đang đồng thời nhắm những ô nào**.',
    ],
  },
  'tactic:pin': {
    title: 'Ghim quân (Pin) 📌',
    tag: '♟️ Thế cờ',
    body: [
      'Một quân bị **giữ chân** vì phía sau nó là quân giá trị hơn hoặc là Vua. Nó không dám đi, hoặc đi là mất quân sau lưng.',
      'Ghim vào **Vua** gọi là ghim tuyệt đối - quân bị ghim **không được phép đi** vì nước đó là bỏ Vua bị chiếu.',
      'Vì sao quan trọng: quân bị ghim coi như **đã bị vô hiệu hoá** - ta có thể tấn công chỗ khác trong khi nó không làm gì được.',
    ],
  },
  'tactic:skewer': {
    title: 'Xiên quân (Skewer) 🪝',
    tag: '♟️ Thế cờ',
    body: [
      'Ngược lại với ghim: quân **giá trị cao đứng trước**, quân nhỏ hơn đứng sau. Ta tấn công quân to, nó buộc phải chạy, và ta ăn quân phía sau.',
      'Cách dễ dùng nhất là **chiếu Vua rồi ăn quân sau lưng Vua** - Vua buộc phải tránh, và quân đứng sau mất.',
      'Nhớ cặp bài trùng: **Ghim = nhỏ trước, to sau. Xiên = to trước, nhỏ sau.**',
    ],
  },
  'tactic:discovered': {
    title: 'Đòn mở (Discovered Attack) 🎭',
    tag: '♟️ Thế cờ',
    body: [
      'Một quân **bước ra khỏi đường tấn công** để mở đường cho quân phía sau. Quân vừa đi thì "vô can", nhưng quân sau lưng mới là kẻ ra đòn.',
      'Nếu quân phía sau chiếu Vua thì gọi là **chiếu mở** - đối thủ buộc phải chống đỡ, còn quân vừa đi thì được tự do làm việc gì cũng được.',
      'Đây là mẹo **tạo đòn mà không cần quân tấn công phải di chuyển tới sát**.',
    ],
  },
  'tactic:double-check': {
    title: 'Chiếu đôi (Double Check) ⚡',
    tag: '♟️ Thế cờ',
    body: [
      '**Hai quân cùng chiếu Vua một lúc.** Đối thủ không thể vừa chặn vừa bắt - chỉ còn đúng một cách: **di chuyển Vua**.',
      'Vì không thể cản nổi, chiếu đôi thường là bước mở màn cho **chiếu bí liên tiếp** (chiếu bí nối tiếp bằng Mã và Hậu là ví dụ kinh điển).',
      'Cách tạo: dùng **đòn mở** - quân vừa đi vừa chiếu, quân phía sau cũng chiếu.',
    ],
  },
  'tactic:back-rank': {
    title: 'Chiếu bí hàng cuối (Back-rank) 🚧',
    tag: '♟️ Thế cờ',
    body: [
      'Vua đã **nhập thành nhưng hàng cuối chỉ còn Tốt che**, và Tốt ấy bị quân khác chắn - thế là Xe/Hậu Đối phương vào hàng cuối là hết đường.',
      'Đây là lý do vì sao người ta hay nhắc: **nhập thành rồi phải mở một "cửa thoát" cho Vua** bằng cách đẩy một Tốt.',
      'Với bé mới học, đây là đòn chiếu bí dễ thấy và dễ nhớ nhất.',
    ],
  },
  'tactic:smothered': {
    title: 'Chiếu bí ngạt (Smothered Mate) 🕸️',
    tag: '♟️ Thế cờ',
    body: [
      'Vua bị **chính quân của mình vây kín** tới mức không còn ô nào để đi; chỉ còn **Mã** mới chiếu được vào cái khe đó.',
      'Vẻ đẹp của nó: Vua đang được bảo vệ rất nhiều quân, mà càng đông quân thì càng bí.',
      'Vì Mã nhảy không theo hàng/cột, nó là quân duy nhất có thể chui vào khe hẹp đó để chiếu.',
    ],
  },

  // ── 4 thế tàn cuộc Xe + Tốt ────────────────────────────────────────────────
  'endgame:lucena': {
    title: 'Thế Lucena (thắng)',
    tag: '📜 Lịch sử',
    body: [
      'Đây là thế tàn cuộc **Xe + Tốt chống Xe** nổi tiếng nhất: một bên có Tốt ở hàng 7 và Vua đã tới cạnh, bên kia có Xe quấy phá.',
      'Tên gọi lấy từ cuốn sách cờ **xuất bản năm 1497** của Luis Ramírez de Lucena - một trong những cuốn sách cờ in sớm nhất còn lại.',
      'Kỹ thuật quyết định gọi là **"bắc cầu"**: dùng Xe của mình chắn các nước chiếu của Xe đối phương, rồi đưa Vua lên và phong Hậu.',
    ],
  },
  'endgame:philidor': {
    title: 'Thế Philidor (hòa)',
    tag: '📜 Lịch sử',
    body: [
      'Cách **cầm hòa** khi bị kém một Tốt ở hàng 6 và Xe đối phương tấn công Tốt của mình.',
      'Tên gọi lấy từ **François-André Danican Philidor** - kỳ thủ Pháp thế kỷ 18, tác giả cuốn *L\'Analyse des échecs* (1749) và là người đầu tiên nói câu bất hủ: *"Tốt là linh hồn của cờ vua"*.',
      'Ý tưởng: Xe lùi về **hàng 3** để vừa che các nước chiếu, vừa giữ Tốt. Khi Vua đối phương tiến lên thì Xe chiếu liên tục từ phía sau.',
    ],
  },
  'endgame:vancura': {
    title: 'Thế Vancura (hòa)',
    tag: '📜 Lịch sử',
    body: [
      'Một thế hòa tinh tế khác của tàn cuộc **Xe + Tốt cánh** (Tốt ở cột a/b/g/h) chống Xe.',
      'Tên gọi mang tên một **danh thủ Tiệp Khắc** đã phân tích nó: Václav Vancura.',
      'Ý tưởng: Xe yếu **tấn công Tốt từ hông** (chứ không đứng trước Tốt), kết hợp dọa chiếu Vua liên tục - Trắng không có cách nào tiến Tốt mà vẫn che được Vua.',
    ],
  },
  'endgame:stop-pawn': {
    title: 'Chặn Tốt sắp thành Hậu',
    tag: '♟️ Thế cờ',
    body: [
      'Thế "khẩn cấp": Tốt của đối thủ sắp chạy tới hàng cuối, ta phải **dùng Xe chặn từ phía sau** rồi đưa Vua tới giúp.',
      'Nguyên tắc vàng: **Xe luôn đứng sau Tốt** - vừa chặn, vừa có thể chiếu Vua khi cần.',
      'Đây là bài học "cứu một nước đã": khi đếm thấy Tốt đối phương chạy nhanh hơn, ta biết ngay phải kéo Xe về chặn chứ không phải đuổi theo ăn.',
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

  // ── 4 bài giảng Đại kiện tướng ────────────────────────────────────────────
  'lecture:minority-attack': {
    title: 'Đòn bẩy cấu trúc Tốt (Minority Attack)',
    tag: '🧠 Ý tưởng',
    body: [
      'Khi Đen có ba Tốt cánh Hậu (a7-b7-c7... kiểu này) và Trắng chỉ có hai, Trắng **dùng chính hai Tốt ít hơn** để tấn công.',
      'Đẩy b4-b5 (hoặc tương tự) buộc Đen phải đổi Tốt, từ đó Trắng **tạo ra một Tốt yếu** cho đối thủ - rồi Xe sẽ nhắm vào Tốt yếu đó suốt ván.',
      'Đây là ví dụ đẹp nhất của tư duy chiến lược: **không cần đòn ngay, chỉ cần tạo một điểm yếu vĩnh viễn**.',
    ],
  },
  'lecture:prophylaxis': {
    title: 'Phòng thủ dự phòng (Prophylaxis)',
    tag: '🧠 Ý tưởng',
    body: [
      'Trước khi làm việc của mình, hãy **đoán việc đối thủ muốn làm** và chặn trước một nước - gọi là "nước rào đón".',
      'Nghe thì tốn một nước, nhưng nó **vô hiệu hoá cả kế hoạch** của đối phương. Các nhà vô địch thế giới - nhất là Petrosian - chơi kiểu này cực giỏi.',
      'Luyện tập lại rất cụ thể: mỗi nước, tự hỏi *"Đối thủ vừa đi để làm gì?"* trước khi nghĩ tới nước của mình.',
    ],
  },
  'lecture:lucena': {
    title: 'Kỹ thuật bắc cầu Lucena',
    tag: '📜 Lịch sử',
    body: [
      'Kết thúc của thế Lucena (xem nút ⓘ ở khung "Tàn cuộc Xe + Tốt"): Trắng phải **đưa Vua ra khỏi các nước chiếu** của Xe Đen để phong Hậu.',
      'Cách giải: đặt Xe của mình lên **hàng 4**, rồi khi Xe Đen chiếu thì Xe Trắng **làm cầu** - bước sang chắn nước chiếu, buộc Xe Đen phải đi chỗ khác.',
      'Sau "cây cầu" đó, Vua Trắng tiến lên tự do và Tốt thành Hậu. Đây là kỹ thuật mà bất cứ bé nào học tàn cuộc cũng phải thuộc.',
    ],
  },
  'lecture:philidor': {
    title: 'Bức tường hàng 6 Philidor',
    tag: '📜 Lịch sử',
    body: [
      'Khi đối phương đã có **Tốt ở hàng 6** và Xe của họ đang tấn công Tốt của ta, ta cầm hòa bằng cách giữ **Xe ở hàng 3**.',
      'Ba việc cùng lúc của Xe hàng 3: **che các nước chiếu**, **giữ Tốt** của mình, và **dọa chiếu** Vua đối phương khi họ tiến lên.',
      'Đó là lý do thế này mang tên Philidor - người đã hệ thống hoá nó trong sách năm 1749, và tới nay vẫn là kiến thức bắt buộc.',
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
  'stages',
  'stars',
  'cup',
  'eye',
  'machine',
  'notation',
  'tree',
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
  ].map((id) => `opening:${id}`),
  ...['carlsen', 'so', 'nakamura', 'kasparov', 'fischer', 'polgar', 'botvinnik', 'petrosian'].map(
    (id) => `gm:${id}`,
  ),
  ...['fork', 'pin', 'skewer', 'discovered', 'double-check', 'back-rank', 'smothered'].map(
    (id) => `tactic:${id}`,
  ),
  ...['lucena', 'philidor', 'vancura', 'stop-pawn'].map((id) => `endgame:${id}`),
  ...['outpost', 'open-file', 'bishop-pair', 'seventh-rank'].map((id) => `positional:${id}`),
  ...['minority-attack', 'prophylaxis', 'lucena', 'philidor'].map((id) => `lecture:${id}`),
]
