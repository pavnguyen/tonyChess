# ♟️ Nam An - Cờ Vua

Web App tương tác (SPA) giúp **bé 7 tuổi** học thuộc **Khai cuộc Grand Master (GM)**, kỹ năng
**Trung cuộc**, **Tàn cuộc**, và **đấu tập cả ván cờ với chú Máy** - giao diện hoạt hình tươi sáng,
responsive 100% cho điện thoại, iPad/tablet và máy tính.

## 🚀 Chạy ngay

```bash
npm install
npm run setup:engine  # chép Stockfish WASM vào public/stockfish (tự chạy ở dev/build)
npm run dev           # mở http://localhost:5173
npm run build         # build production
npm run preview       # xem thử bản production
npm run lint          # kiểm tra code (oxlint)
npm run check         # kiểm tra dữ liệu cờ vua + bộ máy cờ (không cần trình duyệt)
npm run build:puzzles # MỘT LẦN, cần mạng: sinh kho câu đố luyện thêm (~304 MB tải vào .cache/)
```

Kiểm tra thêm trong trình duyệt thật (cần Chrome + `vite preview` đang chạy):

```bash
npm run preview &
npm run check:browser   # 11 bộ: Web Worker trả nước đi thật · mũi tên vàng · kéo-thả ở chế độ Học từng bước · kéo-thả ở tab Chiến lược · Stockfish WASM chạy thật · ván kỳ thủ · cây khai cuộc phân nhánh · khung gợi ý cho ba mẹ · màu · bố cục không phải cuộn
npm run check:tree      # chỉ riêng bài kiểm tra cây khai cuộc phân nhánh (§4.4)
npm run check:tips      # chỉ riêng bài kiểm tra khung “Gợi ý cho ba mẹ” (§10)
npm run check:layout    # chỉ riêng bài kiểm tra bố cục
```

## 🖥️ Bố cục “bàn làm việc”

Ưu tiên số một: **bé luôn thấy trọn bàn cờ cùng nước đi và lý do ngay trên màn hình, không phải cuộn.**

Mỗi trang gồm hai phần:

- **Khối bàn cờ** (`BoardStage`) - chỉ có bàn cờ, kèm một hàng trạng thái mỏng ở trên và băng giải thích /
  hàng nút ngay dưới. Cả khối này luôn nằm gọn trong màn hình.
- **Cột thông tin** - tab chế độ, bản đồ leo cấp, danh sách nước đi, mẹo, mục tiêu - và chỉ tự cuộn
  bên trong chính nó khi cần.

Bàn cờ tự chọn **cạnh nhỏ nhất** trong ba giới hạn: bề rộng cột, bề cao còn lại của cột (khi cửa sổ đủ rộng),
hoặc `100dvh − reserve` (khi cửa sổ hẹp) - nên không bao giờ bị cắt cụt hay phải cuộn để thấy phần còn lại.

Biến thể Tailwind **`stage`** (`min-width: 60rem` **và** `min-aspect-ratio: 1/1`, khai báo trong
`index.css`) quyết định khi nào dùng hai cột:

| Cửa sổ | Bố cục |
| --- | --- |
| Nằm ngang **hoặc vuông**, đủ rộng (≥ 960px) | **2 cột** - bàn cờ và cột thông tin nằm cạnh nhau, **cả trang không cuộn** |
| Dạng đứng (iPad dọc, điện thoại) | **1 cột** - bàn cờ rộng hết cỡ, phần phụ ở dưới |
| Hẹp mà vẫn thấp (`< 60rem`) | **1 cột** - bàn cờ thu vừa tầm mắt, có sàn tối thiểu 17rem |
| **Thấp mà rộng** (`shallow`: 640-959px **và** cao ≤ 544px) | **2 cột ngay trong thẻ bàn cờ** - bàn cờ chiếm trọn cột trái cao hết cỡ, hàng trạng thái + băng giải thích / nút dồn sang cột phải tự cuộn. Đây là khổ **điện thoại nằm ngang** (iPhone 15 Pro Max ngang = 932×430) |

Trên điện thoại, lề ngoài được thu còn 6px (`px-1.5 py-1.5`) và thẻ bàn cờ `p-1.5` để bé thấy
bàn cờ rộng gần hết màn hình. Biến thể `shallow` sinh ra đúng vì **iPhone 15 Pro Max nằm ngang rộng
932px** - chỉ thiếu 28px nữa mới tới ngưỡng `stage` 960px, nên trước đây rơi vào nhánh 1 cột và bàn
cờ chỉ còn 260px giữa một thẻ rộng 908px; giờ bàn cờ được **316px** và không phải cuộn.

`browser-layout-test.mjs` đo lại trên **10 khung nhìn** (1440×900 → cửa sổ vuông 1200×1200 →
iPhone 15 Pro Max dọc 430×932 **và** ngang 932×430) với cả 6 tab + trang Ván kỳ thủ, và bắt buộc:
**không tràn ngang**, **trang không cuộn dọc** (ở bố cục 2 cột), **thấy trọn khối bàn cờ** (bàn cờ +
băng giải thích / nút), và **bàn cờ đủ to** (≥ 600px ở 1440×900, ≥ 480px ở 1366×768, ≥ 440px ở
1024×768, ≥ 480px ở 1200×1200, ≥ 360px ở 980×720, ≥ 600px ở khổ dọc, ≥ 330px ở điện thoại 390×844,
≥ 370px ở iPhone 15 Pro Max dọc, ≥ 290px ở iPhone 15 Pro Max **ngang**).

## 🧠 Nguyên tắc sư phạm

Mỗi nước đi của bé (hoặc khi bấm “xem nước tiếp theo”) đều bật **Banner Giải Thích Siêu Ngắn**
gồm đúng 3 phần:

1. **Nước đi + Tên quân** - hình quân cờ chuẩn cho bé nhận ra ngay (♚♛♜♝♞♟), kèm ký hiệu nước đi
   linh hoạt theo tuỳ chọn (`♘f3` / `Nf3` / `Mf3`).
2. **Lý do** - 1 câu logic, dễ hiểu.
3. **Khẩu quyết vè** - 4–6 chữ để bé nhẩm thuộc lòng.

> Lưu ý nhỏ: ở tuýp **“Hình cờ + quốc tế”**, banner vẽ hình quân **TO riêng bên trái** nên phần
> chữ chỉ hiện **ký hiệu chữ cái** (`♗` + `Bf4`). Trước đây chỗ này in cả `♗Bf4` nên bé thấy hình
> quân lặp hai lần; nhãn nhỏ phía trên vẫn giữ đúng tuýp bé chọn (`1. ♗Bf4`).

## 🗂️ Sáu tab học tập

| Tab | Nội dung |
| --- | --- |
| 🎬 **Ván kỳ thủ hiện đại** (mở từ tab Khai cuộc) | Đường dẫn riêng `/gm-games` để **không phá đúng 6 tab** trên điện thoại: xem lại **ván thật của Carlsen, Kasparov, Ding Liren** rồi **đoán nước tiếp theo** (nước kỳ thủ = 1 điểm, nước máy mạnh hơn = 2 điểm). Có nút **⏩ Tới câu hỏi tiếp**, **💡 Gợi ý**, **👀 Xem nước của kỳ thủ**, phiếu điểm và danh sách câu hỏi kèm lời giải thích tự viết. |
| 🛡️ **Khai cuộc Grand Master** | **8 khai cuộc** dạng **cây phân nhánh**: London System (Carlsen), Ván cờ Ý (Wesley So), King's Indian (Nakamura), Sicilian (Kasparov), Ruy López (Fischer), Gambit Hậu (Judit Polgár), Phòng thủ Pháp (Botvinnik), Caro-Kann (Petrosian). Có chế độ **Học từng bước** (bé **kéo-thả quân viền vàng** sang **ô viền xanh**, hoặc bấm nút / **phím ◀ ▶ ▲ ▼**; tới **ngã ba** thì bé chọn nhánh muốn tập) và **Luyện thuộc lòng** (nhận Cúp Vàng 🏆). |
| ⚔️ **Trung cuộc - Mẹo săn quân** | **20 thế cờ** cho **7 họ đòn**: 🍴 Bắt đôi (Fork) · 📌 Ghim quân (Pin) · 🍢 Xiên quân (Skewer) · 🔓 **Đòn mở (Discovered check)** · ⚡ **Chiếu đôi (Double check)** · 🧱 **Chiếu bí hàng cuối (Back rank)** · 🕸️ **Chiếu bí ngạt (Smothered mate)**. Bé **kéo-thả quân** để giải; bấm **💡 Gợi ý** thì quân cần đi hiện **viền vàng** và ô đích hiện **viền xanh**. Giải đúng → pháo hoa 🎆 + âm thanh “Ting!” reo hò. Kèm panel **🏋️ Bài luyện thêm** nạp câu từ **kho câu đố Lichess (CC0)** - câu luyện thêm không cộng sao nhưng vẫn tính vào điểm trình độ và sổ ôn tập. |
| 👑 **Tàn cuộc - Trạm năng lượng Hậu** | **8 thế cờ**: “Vua + Tốt đua biến Hậu” và **bốn thế chiếu bí kinh điển** mà kỳ thủ nào cũng phải thuộc - **Xe + Vua**, **chiếu bí hàng cuối**, **Tượng đôi**, **chiếu bí ngạt bằng Mã** - bên cạnh “chiếu bí bằng 2 Xe / Hậu + Vua”. Bé đấu với Vua Đen đi theo **máy mini mức Dễ** (nước đáp trả có ý nghĩa nhưng thỉnh thoảng mắc lỗi để bé tận dụng), kéo-thả như đang chơi thật; **💡 Gợi ý** sẽ khoanh **quân cần đi** theo đúng thế cờ hiện tại. Danh sách bài nay là **dải chip gọn** nên cột phải hết phải cuộn - trước đây 8 thế xếp thành lưới thẻ to 4 hàng nên trang bị cuộn mất một đoạn. |
| 🎓 **Chiến lược Grand Master** | **4 bài giảng có kịch bản** (cả hai bên đi theo đúng dòng của Grand Master): ⚖️ **Đòn bẩy cấu trúc Tốt** (Carlsbad, 5 nước), 🛡️ **Phòng thủ dự phòng** (Karpov - đi `h3` bịt ô `g4`), 🌉 **Bắc cầu Lucena**, 🧱 **Bức tường hàng 6 Philidor** (bài cờ **Đen đi trước**, bàn cờ tự xoay). Kèm module **🧬 Cấu trúc Tốt** dạy bé nhận diện **Tốt Thông / Tốt Chồng / Tốt Cô Lập** bằng màu (🟢 khoẻ, 🔴 yếu). Bé kéo-thả, mũi tên vàng chỉ nước kế tiếp, ◀ ▶ tua từng bước, danh sách bước đánh dấu ✓ / 👉. |
| 🔁 **Ôn tập ngắt quãng** | **Tab thứ 6**: gặp lại đúng câu bé **sắp quên** theo lịch Leitner (đúng thì hẹn xa dần 1 → 3 → 7 → 21 ngày, sai thì gặp lại sau 10 phút). Huy hiệu đỏ trên tab cho biết còn bao nhiêu câu tới hạn. Nguồn thẻ: câu đố Trung cuộc, thế Tàn cuộc, khai cuộc luyện thuộc lòng, bài giảng GM và cấu trúc Tốt. Tiến độ lưu trong `localStorage` (khoá `hoc-vien-co-vua-nhi.review.v1`). |
| 🎮 **Đấu tập với Máy** | Chơi **trọn một ván cờ thật** với bộ máy mini (negamax + bảng điểm vị trí). 4 mức 🐣 Dễ / 🐰 Vừa / 🦊 Khó / 🦁 Siêu, chọn quân Trắng/Đen, nút **Đi lại nước vừa rồi**, “Sách ghi ván cờ” và túi chiến lợi phẩm. |

## 🗺️ Bản đồ leo cấp

Khai cuộc và thế cờ được xếp thành **các cấp mở dần**: cấp 1 mở sẵn, hoàn thành một trạm thì trạm
kế tiếp mới mở khoá (🔒). Bản đồ hiện tiến độ `Đã xong X/Y`, thanh tiến trình và trạm đích 🏁.
Bố mẹ có thể bấm **“🔓 Mở khoá tất cả bài học”** trong *Tùy chọn của bé* nếu muốn học tự do.

## 👁️ Mắt Thần Cờ Vua

Nút công tắc ở góc khu bàn cờ, kèm nút **?** để xem chú giải màu:

- Quân của bé **đang bị treo** (bị tấn công mà không ai đỡ, hoặc bị quân rẻ hơn đe dọa)
  → ô **đỏ đậm + huy hiệu ⚠️** ở góc ô, kèm **danh sách cảnh báo** ngay dưới bàn cờ:
  *“Hậu ở ô d5 - không ai đỡ!”*.
- Ô bị quân đối phương kiểm soát → nền **đỏ nhẹ**.
- Ô an toàn → **xanh nhạt**; ô trung tâm quý `d4, e4, d5, e5` → **xanh đậm**.

Mục tiêu: dạy bé thói quen nhìn toàn cảnh bàn cờ để không “cúng quân miễn phí”.

## ⚙️ Tuỳ chọn cho bé

- **Đổi ký hiệu nước đi**: **Hình cờ + quốc tế** (mặc định, ví dụ `♘Nf3` - hiện *cả* hình quân cờ *lẫn* ký hiệu FIDE để bé quen dần) · Tiếng Việt (`Mf3`, M/T/X/H/V).
  Tuýp "chuẩn quốc tế thuần" (`Nf3`, không có hình quân) đã bỏ vì `♘Nf3` đã chứa sẵn ký hiệu đó;
  bé nào cũng đọc được ký hiệu thi đấu từ khi bắt đầu.
- **Phím mũi tên**: trong chế độ *Học từng bước*, bé bấm **◀ / ▼** để Lùi và **▶ / ▲** để Tiến -
  không phải rời tay khỏi bàn phím. Phím mũi tên cũng không làm trang tự cuộn.
- **Tô sáng nước cần đi**: **quân cần đi được khoanh vàng đồng** 🟨 còn **ô đích khoanh xanh thép** 🟦
  kèm mũi tên vàng chỉ đường - bé nhìn là biết ngay phải làm gì, không cần đọc chữ.

  Hai ô này **“thở” nhịp nhàng** (chu kỳ 1,5 giây: viền dày lên rồi trả về) để mắt bé 7 tuổi bắt
  được ngay — chuyển động mượt, không nhấp nháy gắt. Ô của **quân cần đi** thở mạnh hơn một chút,
  ô đích thở dịu hơn để mắt bé tập trung vào quân. Bé nào bật “giảm chuyển động” trong hệ điều
  hành thì nhịp thở tự tắt, chỉ còn viền tĩnh rất rõ.
  - Tab *Khai cuộc* chế độ **Học từng bước**: sáng sẵn ở mọi nước của bé.
  - Tab *Trung cuộc* và *Tàn cuộc*: hiện khi bé bấm **💡 Gợi ý** - cố ý **không lộ đáp án** trước,
    để bài đố vẫn còn là bài đố. Ở *Trung cuộc* bé đi sai một lần thì gợi ý tự hiện.
    Ở *Tàn cuộc*, thế cờ đổi sau mỗi nước nên gợi ý **được tính lại theo thế mới**.
- **Kéo-thả hoặc bấm-chọn-đi**: **cả ba tab có bàn cờ** đều cho bé **kéo quân bằng chuột/ngón tay**,
  hoặc **bấm quân rồi bấm ô đích** (tiện cho iPad). Ở tab Khai cuộc: đi đúng → đối thủ tự đáp trả rồi
  quân kế tiếp của bé lại sáng lên; đi sai → quân tự về chỗ cũ kèm lời nhắc “bé thử lại nhé”.
  Ở tab Trung cuộc / Tàn cuộc: bé thoải mái thử nước của mình, kéo đúng là bàn cờ tiến lên.
- **Xoay bàn cờ tự động**: chọn bài cờ Đen là bàn cờ tự lật 180° để hàng 7–8 nằm sát bé.
- **Âm thanh**: tiếng đặt quân, “Ting!” khi đúng, nhạc thắng - tổng hợp bằng Web Audio, không cần file mp3.
- **Gamification**: tích luỹ ⭐ để thăng cấp từ *Kỳ thủ Nhí* → *Tập sự Cờ vua* → *Kiện tướng Nhí* →
  *Grand Master Nhí*. Tiến độ lưu trong `localStorage` (kèm nút 🧹 chơi lại từ đầu).

## 🎚️ Lộ trình 7 → 18 tuổi

Một app không thể dùng cùng một giao diện từ 7 tuổi tới 18 tuổi. Toàn bộ thiết kế nằm trong
`src/lib/stages.ts` (logic thuần, test bằng `npm run check:stages`).

**Nguyên tắc gốc: tuổi chỉ là gợi ý, trình độ mới là quyết định.** Một bé 13 tuổi mới chơi cờ lần
đầu cần giao diện của “Thiếu nhi”, không phải của “Thiếu niên”. Vì vậy mô hình tách làm hai thứ:

- **`stage`** - giai đoạn *đang học*, quyết định nội dung, độ mạnh của máy, lịch ôn tập, tính năng
  đã mở khoá. Mặc định suy ra từ **năm sinh** (nên app tự “lớn lên” theo bé) nhưng bố mẹ chọn lại được.
- **`density`** - độ lớn của *giao diện* (Nhí = to, hoạt hình, ít chữ; Chuyên nghiệp = dày, nhiều
  số liệu, không emoji). Kéo riêng được, để bé 9 tuổi thích “người lớn” vẫn dùng được.

| Giai đoạn | Tuổi | Độ mạnh máy | Buổi ôn | Vè 4-6 chữ | Ký hiệu | Mở khoá thêm |
| --- | --- | --- | --- | --- | --- | --- |
| 🐣 **Nhí Tò Mò** | 7-9 | dễ | 6 câu | có (3 nấc ôn) | hình cờ + quốc tế | Mắt Thần, cảnh báo quân treo, mũi tên vàng |
| 🛡️ **Thiếu Nhi Tập Sự** | 10-12 | trung bình | 8 câu | có (đủ 5 nấc) | hình cờ + quốc tế | Đọc trọn biên bản cờ (nhập thành, chiếu, phong cấp), chọn câu đố theo chủ đề |
| ⚔️ **Thiếu Niên Chiến Lược** | 13-15 | khó | 12 câu | không | hình cờ + quốc tế | Xem lại ván, máy tự chỉnh độ khó, đồng hồ 5\|0 |
| 👑 **Kỳ Thủ Trưởng Thành** | 16-18 | siêu cấp | 20 câu | không | hình cờ + quốc tế | Bàn phân tích nhiều biến, tàn cuộc lý thuyết, nhập PGN |

Bố mẹ mở **⚙️ Tùy chọn của bé** để chọn giai đoạn hoặc nhập **năm sinh**; tên giai đoạn hiện ngay
trên thanh tiêu đề (màn hình rộng). Mọi giai đoạn đều mặc định ghi nước đi kiểu **hình cờ + quốc tế**
(`♘Nf3`) và **không ghi đè** lựa chọn của bé; ai muốn ký hiệu Việt (`Mf3`) thì tự đổi trong ⚙️.

Ba cơ chế được suy ra từ giai đoạn, không cần cấu hình thêm:

- **Lịch ôn ngắn dần theo tuổi** (`reviewStepsFor`): bé Nhí chỉ đi 3 nấc (ngay → 1 → 3 ngày) để
  câu nào cũng được gặp lại sớm; kỳ thủ lớn đi đủ 5 nấc mới nhớ dai.
- **Chính sách gợi ý** (`shouldAutoHint`): bé Nhí sai một lần là gợi ý **tự hiện** (không để bé bí rồi
  nản); từ 10 tuổi gợi ý chỉ hiện khi bé **bấm xin**; bản trưởng thành **không gợi ý**, phải tự tính.
- **Tắt dần hoạt hình**: hiệu ứng ăn mừng tắt từ 13 tuổi, emoji + banner dạy học tắt ở bản trưởng thành.

Mỗi giai đoạn còn có `focus` (trọng tâm cần tập) và `promotion` (mốc để lên nấc tiếp theo) - ví dụ
Nhí Tò Mò lên Thiếu Nhi khi *đi hết 4 khai cuộc không cần gợi ý và giải 30 đòn đôi/ghim*.

## 🏅 Điểm trình độ (mini-Elo)

Độ khó cố định khiến bé giỏi thấy chán, bé yếu thấy nản. Vì vậy app tự chấm **điểm trình độ** trong
`src/lib/rating.ts` (logic thuần, test bằng `npm run check:rating`) và lưu vào `localStorage`
(`hoc-vien-co-vua-nhi.rating.v1`) qua `src/store/rating.tsx`.

Ba nguyên tắc đã chốt với chủ dự án:

- **Điểm khởi đầu 500** để bé thấy tiến bộ nhanh.
- **Bé thấy tên cấp độ**, không thấy con số. Năm nấc:
  🌱 **Mầm cờ** (0) → ♟️ **Biết đi cờ** (550) → 💪 **Chơi chắc tay** (700) → ⚡ **Đánh sắc bén** (850)
  → 👑 **Cao thủ nhí** (1000).
- **Sai KHÔNG bao giờ bị trừ điểm** - sai chỉ làm chậm tiến bộ (`điểm = max(điểm, điểm_mới)`).

Công thức Elo rút gọn: `expected = 1/(1+10^((độ khó câu - điểm)/400))`, `điểm += K·(kết quả - expected)`,
với hệ số **K = 24** cho bé nhỏ và **K = 32** từ 13 tuổi. Độ khó câu quy đổi cố định
(*dễ* 450, *vừa* 600, *khó* 750); điểm được ghi theo **từng dạng bài** và theo điểm tổng.

Điểm được dùng để **chọn bài vừa sức**: tab Trung cuộc hiện **thanh điểm từng dạng đòn** kèm gợi ý
luyện dạng yếu nhất, còn tab Đấu với Máy tự chọn **mức máy mặc định** theo điểm (bé vẫn đổi được).

## 💬 Gợi ý cho ba mẹ

Ba mẹ ngồi cạnh bé thường không biết hỏi gì. Khung **“Gợi ý cho ba mẹ”** nằm ở **góc dưới bên phải,
hiện ở MỌI tab**, mặc định mở, và **thu gọn được** (nút ▸/▾; trạng thái nhớ trong
`localStorage` khoá `hoc-vien-co-vua-nhi.parent-tips.v1`). Khi thu gọn chỉ còn **một nút nhỏ**.

- **Câu hỏi “đố con”** do app tự viết (`src/lib/parentTips.ts`): có **câu riêng cho từng bài**
  (8 khai cuộc + 4 bài giảng GM) và **mẫu chung cho từng tab**. Không có câu chung chung kiểu
  “con học gì hôm nay” - mỗi câu hỏi gắn đúng việc bé vừa làm.
- **Trang tự báo bài đang mở** qua `useReportLesson('opening:london')` (`src/store/lesson.tsx`) -
  nhờ vậy khung đổi câu hỏi **ngay khi bé đổi bài**, không cần tải lại trang.
- **Khối 🔒 của ba mẹ** (bé không cần để ý): **số Elo**, **điểm từng dạng đòn**, và **nút chọn giai
  đoạn tuổi** + ô năm sinh - cùng nguồn dữ liệu với bảng tuỳ chọn ⚙️.
- **Không phá bố cục “không cuộn”**: khung là khối `position: fixed` nên không tham gia luồng bố cục;
  bề rộng/chiều cao đều bị chặn theo màn hình và phần thân tự cuộn bên trong. `npm run check:tips`
  đo lại ở 1440×900 và 390×844 để chắc chắn **không tràn ngang, không làm trang cao thêm**.
- **Không có báo cáo tuần, không có giới hạn thời gian** (§10 - chủ dự án đã chọn bỏ).

## ♟️ Bộ máy cờ (engine)

Có **hai** engine, phục vụ hai mục đích khác nhau:

1. **Engine JS tự viết** (`src/engine/minimax.ts`) - negamax + alpha-beta + bảng điểm vị trí,
   chạy trong Web Worker. Dùng cho các mức Dễ/Vừa/Khó, tab Tàn cuộc và làm phương án dự phòng.
2. **Stockfish WASM** (bản `lite-single`, ~1.8 MB) - dùng riêng cho mức **Siêu** ở tab Đấu tập tự do.

### Bốn mức của engine JS

| Mức | Độ sâu | Ngân sách | Đi bừa | Quiescence |
| --- | --- | --- | --- | --- |
| 🐣 Dễ | 1 | 200 ms | 35% | tắt (cố ý yếu) |
| 🐰 Vừa | 2 | 900 ms | 8% | tắt (cố ý yếu) |
| 🦊 Khó | 3 | 1800 ms | 0 | **bật** |
| 🦁 Siêu | → Stockfish | ~1.6 s | 0 | - |

**Quiescence (mức Khó)** là bước tăng sức rõ nhất mà không thêm thư viện: khi hết độ sâu, máy chỉ
xét tiếp các nước ăn quân/ phong cấp cho tới khi thế cờ yên, nên **không còn hớ vì tính không hết
chuỗi ăn-quân-lại**. Mức Dễ/Vừa cố tình tắt để bé vẫn có cơ hội thắng.

### Stockfish WASM & giấy phép ⚠️

- Chép tệp bằng `npm run setup:engine` (tự chạy trước `dev`/`build`) vào `public/stockfish/`.
- **Nạp lười**: Worker chỉ được tạo khi bé chọn mức Siêu; tham chiếu chỉ nằm trong chunk
  `FreePlayPage`, không có trong bundle chính. Tải không được thì tự rơi về engine JS.
- **Giấy phép: Stockfish là GPL-3.0.** App hiện là riêng tư nên dùng bình thường, **nhưng nếu sau
  này mở mã nguồn hoặc phát hành thì toàn bộ app phải theo GPL-3.0**. Phần ghi nguồn nằm ở
  `public/stockfish/NOTICE.txt` và `LICENSE.txt` (phải giữ nguyên khi phân phối).

## 📚 Nội dung học (Giai đoạn 4)

- **🌱 Câu "Khởi động"**: mỗi họ đòn giữ lại **1 câu dễ nhất** cho bé mới học, gắn huy hiệu và
  **không tính vào điểm trình độ** (vẫn ghi vào lịch ôn tập).
- **📚 Thư viện chiếu bí** (`src/data/mates.ts`): 7 thẻ mẫu bí kinh điển (Hậu+Vua, Xe+Vua, thang
  Xe, hàng cuối, bí ngạt, bí kiểu Ả Rập) kèm **chuỗi nước đã được máy kiểm chứng** - hiện ở tab
  Tàn cuộc.
- **🧭 Chiến lược vị trí** (`src/data/positional.ts`): tiền đồn, cột mở, cặp Tượng, Xe hàng 7 -
  dạy bé biết làm gì khi *chưa* có đòn ăn quân - hiện ở tab Chiến lược.
- **🏰 Tàn cuộc Xe + Tốt** (`src/data/rookEndgames.ts`): Lucena, Philidor, Vancura, chặn Tốt sắp
  phong Hậu. Kết quả **thắng/hòa được Stockfish chứng minh** (`npm run verify:endgames`) - hiện ở
  tab Tàn cuộc.
- **🔤 Bảng đối chiếu ký hiệu** trong ⚙️ Tùy chọn của bé: `♘ = N = Mã`, `♗ = B = Tượng`… để bé
  học thuộc ánh xạ hình cờ ↔ ký hiệu FIDE ↔ ký hiệu Việt. Bảng có **hai phần**: tên quân cờ, và
  **✍️ ký hiệu đặc biệt trên biên bản** (`O-O`/`O-O-O` nhập thành, `+` chiếu, `#` chiếu bí, `x` ăn
  quân, `=` phong cấp, `e.p.` bắt Tốt qua đường, `!`/`?` nước hay/dở, `1-0`/`0-1`/`½-½` kết quả) -
  mỗi dòng kèm một nước ví dụ thật để bé thấy ký hiệu nằm ở đâu trong nước đi.
- **🌳 Cây khai cuộc phân nhánh** (`src/data/openingTrees.ts` + `src/lib/openingTree.ts`): 8 khai cuộc
  giờ là **cây thật** - mỗi nhánh là một cách đáp khác của đối thủ (hoặc một nước lý thuyết khác
  của bé). Tổng **229 nút, 15 ngã ba, 125 nước ở nhánh phụ**; dòng chính vẫn là `opening.moves`
  (rút thẳng từ cây nên không thể lệch). Khi đi tới ngã ba của đối thủ, app **dừng lại** để bé chọn
  muốn tập nhánh nào (**học phản ứng, không học vẹt**), đồng thời hiện khung **🌳 Cây khai cuộc**
  (xem trước mọi ngã ba, bấm để nhảy sang nhánh khác) và khung **🧭 Kế hoạch trung cuộc** (3 việc cụ
  thể cho bé sau khi hết phần khai cuộc đã học). Mọi nước ở **mọi nhánh** đều được chess.js chứng
  minh hợp lệ trong `npm run check`.
- **🎬 Học ván của kỳ thủ hiện đại** (`src/data/gmGames.ts` + trang `/gm-games`): 3 ván thật -
  Carlsen - Tomashevsky (Wijk aan Zee 2016, hệ thống London), Kasparov - Topalov (Wijk aan Zee 1999,
  ván “bất hủ”), Ding Liren - Nepomniachtchi (chung kết Thế giới 2023, ván 6) - cắt thành **22 câu
  hỏi “đoán nước tiếp theo”**. Chuỗi nước đi là **dữ kiện** (không ai giữ bản quyền), còn **mọi lời
  bình đều do app tự viết**. Điểm: **nước kỳ thủ đã đi = 1 điểm**, **nước máy (Stockfish) mạnh hơn
  = 2 điểm**, nước khác = 0 điểm nhưng vẫn hiện lời giải thích. Ba câu có cơ hội 2 điểm đã được
  `npm run verify:gm` chứng minh (máy hơn nước kỳ thủ 44-54 centipawn).
- **🏋️ Bài luyện thêm từ kho câu đố Lichess (CC0)** (`scripts/build-puzzles.mjs` →
  `src/data/puzzlePacks/<theme>.json`): lọc theo điểm 600-1800, lời giải 2-4 nửa nước, độ nổi tiếng
  ≥ 70, đủ 7 họ đòn của app; mỗi câu được **kiểm bằng chess.js** trước khi ghi gói. Lời giải thích
  tiếng Việt do app **sinh theo mẫu** cho từng loại đòn và luôn gắn nhãn **“bài luyện thêm”** (khác
  “bài giảng” viết tay có vè riêng). Hiện ở tab Trung cuộc dạng panel **“🏋️ Bài luyện thêm”**.
  Nạp theo nhu cầu bằng `import()` động nên **không làm nặng trang**.

> ⚠️ **Một bước cần mạng (làm một lần trên máy bố/mẹ):** `npm run build:puzzles` tải
> `lichess_db_puzzle.csv.zst` (~304 MB, vào `.cache/` - đã gitignore) rồi sinh 7 file JSON trong
> `src/data/puzzlePacks/`. **Các file JSON đó phải được commit** để app chạy 100% offline và build
> không cần mạng. Khi các gói còn trống, panel luyện thêm sẽ báo đúng câu lệnh cần chạy.

## 🧱 Công nghệ

- **React 19 + Vite + TypeScript**
- **TanStack Router** (6 tab) + **TanStack Query** (lớp dữ liệu bài học, có cache)
- **chess.js** (luật cờ, `attackers`/`isAttacked` cho bản đồ nguy hiểm)
- **react-chessboard v5** (bàn cờ, mũi tên vàng đồng, kéo-thả & bấm-chọn-đi)
- **Tailwind CSS v4** (theme hoạt hình, animation tự viết)
- **Web Worker** cho bộ máy cờ (negamax + alpha-beta + piece-square table + **quiescence**), có 3
  lớp bảo hiểm chống “đứng hình”: worker lỗi → tự tính; worker im lâu → tự tính; trình duyệt chặn
  Worker → dùng luồng chính.
- **Stockfish WASM** (bản `lite-single` ~1.8 MB) cho mức **Siêu**: nạp lười, không nằm trong bundle
  chính, có nhánh tự rơi về engine JS nếu tải không được (xem mục bên dưới).

## 🧩 Chia nhỏ bundle (lazy-load từng tab)

Mỗi tab là **một file JS riêng**, bé chỉ tải đúng tab đang mở. Ở `src/router.tsx`, bốn trang được
nạp bằng `lazyRouteComponent(() => import('./pages/X'), 'X')` của TanStack Router, kèm
`defaultPreload: 'intent'` để **rê chuột / chạm vào tab là tải trước** - bấm vào mở ngay, gần như
không thấy màn hình chờ.

Trong lúc chờ chunk tải về, router hiện `PageFallback` (`src/components/PageFallback.tsx`): một
**bàn cờ xương 8×8** dựng bằng `div` thuần, dùng đúng 2 màu ô của bàn cờ thật
(`#2f6b4f` / `#ffffff`) + hai hàng quân mờ trên hàng 8 và hàng 2. Vì đúng tỉ lệ và đúng màu nên khi
bàn cờ thật hiện ra bé gần như không thấy “nhảy” bố cục. File này **không import thư viện nào**.

Thư viện ít khi đổi được tách thành chunk riêng trong `vite.config.ts` (`build.rollupOptions.output.
manualChunks`), để trình duyệt giữ trong cache dài hạn - bé nhận code mới mà không phải tải lại
React / TanStack / thư viện cờ:

| File | Trước | Sau |
| --- | --- | --- |
| `index-*.js` (mã app + router) | **516.30 kB** (gzip 162.28) | **16.55 kB** (gzip 6.43) |

Các chunk còn lại: `vendor-react` 206.83 · `vendor-tanstack` 107.88 · `vendor-chess` 119.51
(chess.js + react-chessboard + dnd-kit) · `BoardStage` 12.39 · `OpeningsPage` 12.58 ·
`FreePlayPage` 13.21 · `EndgamesPage` 8.03 · `TacticsPage` 6.33 · `queries` 15.07 kB. Không chunk
nào vượt 500 kB, và lần đầu mở một tab mới chỉ tải thêm **6-13 kB**.


## 📁 Cấu trúc

```
src/
├── components/     # Bàn cờ, BoardStage (khối bàn cờ tự co), banner giải thích, Mắt Thần, bản đồ leo cấp, modal, UI, PageFallback (bàn cờ xương lúc chờ tab)
│                   # ParentTips (§10 - khung “Gợi ý cho ba mẹ” ở góc dưới bên phải)
├── data/           # openings (metadata + cây) · openingTrees (cây phân nhánh §4.4) · tactics (7 họ đòn)
│                   # endgames · mates · positional · rookEndgames · gmGames · puzzlePacks · ranks · queries
├── engine/         # minimax.ts · engine.worker.ts · useChessEngine.ts
├── hooks/          # useChessGame (ván cờ SAN) · useCurriculum (mở khoá theo cấp)
├── layout/         # RootLayout: header, 6 tab, huy hiệu ôn tập, thanh tuỳ chọn của bé + khung gợi ý cho ba mẹ
├── lib/            # notation · openingTree (dựng cây + rút nhánh chính) · parentTips (câu hỏi cho ba mẹ) · threats (heatmap) · hints
│                   # sound (Web Audio) · review (lịch ôn tập) · stages (lộ trình 7 → 18 tuổi)
├── pages/          # Openings · Tactics · Endgames · Strategy · Review · FreePlay · GmGames
└── store/          # KidProgressProvider (⭐, huy chương, giai đoạn, tuỳ chọn - localStorage)
                    # ReviewProvider (lịch ôn tập - localStorage) · RatingProvider (mini-Elo)
                    # LessonProvider (trang tự báo bài đang mở cho khung gợi ý cho ba mẹ)
scripts/            # validate-chess · smoke-logic · smoke-review · smoke-stages · smoke-engine
                    # browser-engine-test · browser-arrow-test
                    # browser-learn-drag-test · browser-hint-drag-test
                    # browser-theme-test · browser-layout-test
                    # browser-opening-tree-test · browser-parent-tips-test
                    # browser-gm-test · browser-stockfish-test
                    # verify-endgames · verify-gm · smoke-puzzles · build-puzzles
                    # generate-assets (sinh favicon/OG)
                    # browser-overflow · browser-shot (công cụ gỡ lỗi bố cục)
public/             # favicon.svg · apple-touch-icon.png · og-image.png
ecosystem.config.cjs  # cấu hình PM2 cho production (pm2 serve + SPA fallback)
vercel.json           # cấu hình Vercel (SPA rewrite cho /tactics, /free-play)
```

## 🎨 Bảng màu “Sồi & Ngọc”

Gam màu đã được thay từ **tím** sang **xanh rừng + giấy ngà + vàng đồng** cho trang nhã mà vẫn nổi
bật. Toàn bộ token khai báo ở `src/index.css` (`@theme`) đặt tên theo **vai trò**, không theo tên
màu - sau này muốn đổi gam chỉ cần sửa một chỗ:

| Token | Vai trò | Màu |
| --- | --- | --- |
| `brand-*` | Màu chủ đạo: thanh trên cùng, nút chính, tiêu đề | xanh rừng `#356c4f` → `#163125` |
| `sand-*` | Nền trang, viền thẻ, vùng chờ | giấy ngà `#fbf9f4` → `#dcd4c1` |
| `leaf-*` | Trạng thái đúng, vùng an toàn | xanh non `#4a9159` |
| `gold-*` | Sao ⭐, cúp 🏆, nút “mặt trời”, mũi tên gợi ý | vàng đồng `#d9a93f` |
| `coral-*` | Nước sai, cảnh báo quân bị treo ⚠️ | đất nung `#bc5f4e` |
| `info-*` | Nước của đối thủ, túi chiến lợi phẩm | xanh thép `#417f91` |
| `ink-*` | Chữ phụ, đường kẻ | xám ngả xanh `#6e7872` |

**Bàn cờ kiểu giải đấu**: ô trắng `#ffffff` + ô xanh lá đậm `#2f6b4f`, viền ngoài xanh rừng `#1f4132`.

**Ngôn ngữ màu trên bàn cờ** - khai báo một chỗ ở `BOARD_MARKS` trong `src/lib/notation.ts`:

| Dấu trên bàn cờ | Ý nghĩa |
| --- | --- |
| Viền xám nhạt | Nước vừa đi (chỉ để biết, không tranh sự chú ý) |
| Viền **vàng đồng** + nền vàng nhạt (nhịp thở 1,5s) | Quân bé cần đi |
| Viền **xanh thép** + nền xanh nhạt (nhịp thở dịu hơn) | Ô đích |
| Mũi tên vàng đồng | Đường đi của nước gợi ý |

Vàng đồng và xanh thép được chọn vì nổi rõ trên **cả** ô trắng **lẫn** ô xanh lá đậm - điều mà màu
xanh lá không làm được (quân Tốt ở `d2` nằm trên ô xanh đậm).

## 🖼️ Nhận diện & ảnh chia sẻ

| Tệp | Kích thước | Dùng ở đâu |
| --- | --- | --- |
| `public/favicon.svg` | 64×64 | Icon trên tab trình duyệt - quân Tốt trắng trên nền xanh rừng |
| `public/apple-touch-icon.png` | 180×180 | Icon khi bé “Thêm vào màn hình chính” trên iPhone / iPad |
| `public/og-image.png` | 1200×630 | Ảnh xem trước khi chia sẻ link lên Facebook / Zalo / X |

Sinh lại ảnh bằng **chính Chrome headless** mà các bài kiểm tra đang dùng (không thêm thư viện vẽ ảnh):

```bash
npm run check:assets   # sinh lại og-image.png + apple-touch-icon.png rồi tự kiểm tra lại ảnh
```

`scripts/generate-assets.mjs` thiết kế bằng HTML/CSS rồi chụp ảnh, sau đó **tự giải mã lại file PNG
vừa ghi** (đọc IHDR + inflate + unfilter bằng `node:zlib`) để kiểm tra kích thước và màu ở vài điểm
chốt - nền giấy ngà, khung bàn cờ xanh rừng, quân Tốt trắng trên icon. Thiết kế hỏng là báo lỗi ngay.

> Khi đã có tên miền, nhớ đổi `og:url` và `og:image` trong `index.html` thành **địa chỉ tuyệt đối**
> (ví dụ `https://co-vua-nhi.vn/og-image.png`) - nhiều nền tảng không chấp nhận đường dẫn tương đối.

## ✅ Kiểm tra tự động

| Script | Nội dung |
| --- | --- |
| `validate-chess.ts` | Mọi FEN hợp lệ, mọi dòng khai cuộc đi đúng luật, và **chứng minh bản chất từng đòn**: Fork phải tấn công ≥ 2 quân, Pin ≥ 1 quân, Skewer phải chiếu Vua, Đòn mở phải chiếu bằng quân phía sau (chứ không phải quân vừa đi), Chiếu đôi phải có ≥ 2 quân cùng chiếu, Hàng cuối phải là chiếu bí đúng ở hàng 1/8, Bí ngạt phải là chiếu bí do Mã. Thế tàn cờ phải thật sự có nước chiếu bí. Còn kiểm: mỗi họ đòn đúng **1 câu "Khởi động"**, thư viện chiếu bí (**chuỗi nước kết thúc đúng bằng chiếu bí**), và chiến lược vị trí (**khái niệm chứng minh bằng quân cờ thật**). |
| `smoke-logic.ts` | Ký hiệu nước đi, heatmap 64 ô, **cảnh báo quân bị treo**, gợi ý tàn cuộc. |
| `smoke-review.ts` | Bộ lịch **ôn tập ngắt quãng**: đúng thì lên hộp và hẹn xa dần (1 → 3 → 7 → 21 ngày), sai thì rơi về hộp đầu và hẹn lại sau 10 phút, tới hạn thì quá hạn lâu nhất lên trước. |
| `smoke-stages.ts` | **Lộ trình 7 → 18 tuổi**: bốn giai đoạn phủ kín từng tuổi không hở cũng không chồng, suy từ năm sinh, máy mạnh dần và buổi ôn dài dần theo tuổi, chính sách gợi ý chặt dần. |
| `smoke-engine.ts` | Bộ máy tự đấu hết ván, tìm được chiếu bí, biết ăn Hậu bị treo, không bao giờ trả nước sai luật, và **quiescence** giúp máy Khó/Siêu từ chối bẫy “Tốt độc”. |
| `smoke-uci.ts` | Phân tích giao thức UCI của Stockfish: đọc `bestmove`/`depth`/`uciok`, đổi nước UCI (`e2e4`, `e7e8q`) sang ký hiệu SAN hợp lệ. |
| `verify-endgames.mjs` | Dùng **Stockfish** chứng minh kết quả các thế **Tàn cuộc Xe + Tốt**: `win` phải ≥ +1.5 (hoặc có mate), `draw` phải |cp| ≤ 0.6. Chạy bằng `npm run verify:endgames`. |
| `verify-gm.mjs` | Dùng **Stockfish (MultiPV)** chứng minh dữ liệu **ván kỳ thủ hiện đại**: mọi nửa nước của cả 3 ván phải hợp lệ, nước ghi là “nước máy mạnh hơn” phải **đúng là nước máy chọn** và **hơn nước kỳ thủ ≥ 40 centipawn**, còn câu nào để trống thì máy thật sự không tìm ra nước mạnh hơn. Chạy bằng `npm run verify:gm` (thêm `--scan` để liệt kê máy muốn đi gì ở từng nước). |
| `smoke-puzzles.mjs` | **Kho câu đố luyện thêm**: chạy `build-puzzles.mjs` trên một CSV nhỏ tự soạn (đúng định dạng Lichess) để chứng minh bộ lọc loại đúng câu FEN hỏng / nước sai / điểm ngoài khoảng / câu 1 nước, đọc đúng nhãn `mateInN`, và **soi lại toàn bộ các gói đã commit** (FEN hợp lệ, cả chuỗi nước đi được, id không trùng). |
| `smoke-rating.ts` | **Điểm trình độ mini-Elo**: khởi đầu đúng 500, làm đúng thì lên điểm, **sai KHÔNG bao giờ bị trừ** (thử cả 40 lần sai liên tiếp), câu khó được cộng nhiều hơn, nhật ký kẹp ở 200 lần, ngưỡng 5 tên cấp độ Mầm cờ → Cao thủ nhí, gợi ý câu và gợi ý mức máy. |
| `browser-engine-test.mjs` | Mở Chrome thật qua DevTools Protocol, bấm “Bé cầm quân Đen” và xác nhận **Web Worker trả về một nước đi hợp lệ** cho bé (kiểm tra độc lập với tuýp ký hiệu đang chọn). |
| `browser-arrow-test.mjs` | Đo hình học thật của **mũi tên vàng đồng**: đuôi phải nằm trong ô xuất phát, đầu phải nằm trong ô đích, dài ~2 ô, và đúng cả khi bàn cờ đã **xoay 180°** cho bé cầm quân Đen. Bài này còn **quét 6 nước liên tiếp** và đọc toạ độ thật trong thẻ `<path>` của mũi tên để xác nhận **đuôi luôn nằm trên quân của bên đang đi** (Trắng/Đen xen kẽ), kể cả nước chéo và nước Mã. Cuối cùng, bài này **bấm thử cả 4 phím mũi tên** và kiểm tra bàn cờ có nhảy đúng nước không. |
| `browser-hint-drag-test.mjs` | Chứng minh hai tab đố cũng có trợ giúp như tab Khai cuộc: **chưa bấm Gợi ý thì không lộ đáp án**, bấm rồi thì đúng **1 quân viền vàng** + **1 ô viền xanh** + 1 mũi tên (đối chiếu cặp ô trong id mũi tên), sau đó **kéo-thả thật bằng chuột** và kiểm tra bài được tính là đã giải / bàn cờ tiến lên. Bài này còn **đo lại viền ô gợi ý sau nửa chu kỳ** để chứng minh nhịp thở chạy thật, và bật `prefers-reduced-motion` để chắc rằng nhịp tắt nhưng viền tĩnh vẫn còn. |
| `browser-theme-test.mjs` | Ghim **bảng màu thật** trong trình duyệt: nền giấy ngà, thanh trên cùng xanh rừng, bàn cờ trắng + xanh lá đậm, mũi tên vàng đồng - và **không còn chỗ nào sót màu tím** ở nền, nút hay ô cờ. |
| `generate-assets.mjs` | Sinh `og-image.png` (1200×630) và `apple-touch-icon.png` (180×180) bằng Chrome headless, rồi tự giải mã lại ảnh để kiểm tra kích thước và màu. |
| `browser-layout-test.mjs` | Duyệt cả 6 tab + trang Ván kỳ thủ trên **10 khung nhìn** (1440×900 → cửa sổ vuông 1200×1200 → iPhone 15 Pro Max dọc 430×932 **và ngang 932×430**): **không tràn ngang**, **trang không cuộn dọc**, **thấy trọn khối bàn cờ** và **bàn cờ đủ to**. |
| `browser-learn-drag-test.mjs` | Mở Chrome thật và **kéo quân bằng chuỗi sự kiện chuột thật** (không phải click bằng JS) trong chế độ *Học từng bước*: kiểm tra quân cần đi được khoanh **vàng đồng** và ô đích khoanh **xanh thép**, nước kéo-thả được chấp nhận, đối thủ tự đáp trả rồi quân kế tiếp lại sáng, kéo sai thì bàn cờ **không tiến**, và nút ◀ ▶ vẫn hoạt động. |
| `browser-strategy-drag-test.mjs` | Chứng minh tab **Chiến lược** dùng đúng thế cờ sống: kéo-thả thật cả một chuỗi nước (gồm một nước **ăn quân** thật `b5×c6`) và xác nhận quân cờ đứng đúng ô, đối thủ đáp trả, bàn cờ **không tự bật về như cũ**. |
| `browser-stockfish-test.mjs` | Mở một Worker Stockfish thật trong Chrome, chạy `uci → position → go depth 12`, xác nhận engine trả `bestmove` hợp lệ kèm dòng `info` - đúng con đường app dùng ở mức Siêu. |
| `browser-gm-test.mjs` | Trang **Ván kỳ thủ hiện đại**: nhảy tới câu hỏi đầu, **bấm-chọn-đi thật** để đoán đúng nước của kỳ thủ (được **1 điểm**, quân đi thật trên bàn cờ), rồi ở câu cuối tìm ra **nước máy mạnh hơn** (được **2 điểm**) và phiếu điểm phải cộng đúng 3/8. |
| `browser-opening-tree-test.mjs` | **Cây khai cuộc phân nhánh**: khung “🌳 Cây khai cuộc” liệt kê đủ ngã ba (nhánh chính gắn ⭐), khung “🧭 Kế hoạch trung cuộc” đủ 3 việc; đi tới ngã ba của ĐỐI THỦ thì app **dừng lại**, hiện khung chọn nhánh và **khoá nút “Tiến”**; bấm một nhánh khác nhánh chính thì **bàn cờ đi đúng theo nhánh đó**; và bấm thẳng một nhánh trong khung Cây khai cuộc thì app **nhảy tới nhánh ấy**. |
| `browser-parent-tips-test.mjs` | Khung **“Gợi ý cho ba mẹ”** (§10): hiện ở **cả 7 đường dẫn**, mặc định mở, câu hỏi **đổi theo bài bé đang học** (bài giảng/ván đang mở thắng câu chung của tab); **thu gọn** thì chỉ còn một nút nhỏ và trạng thái **sống qua lần tải lại trang**; khối 🔒 có số Elo, đủ 10 dòng điểm dạng đòn và 4 nút chọn giai đoạn tuổi; và khung mở **không tràn ngang ở 390px** cũng **không làm trang cao thêm ở 1440×900**. |
| `browser-overflow.mjs` | Công cụ gỡ lỗi: chỉ đích danh phần tử nào đang làm tràn ngang. Chạy `node scripts/browser-overflow.mjs /free-play`. |
| `browser-shot.mjs` | Chụp ảnh màn hình một tab để xem bố cục thật: `node scripts/browser-shot.mjs / 1440 900 /tmp/shot.png`. |

### 🐞 Ghi chú: bug mũi tên chỉ sai phía

Bản đầu tiên truyền `arrowOptions.arrowStartOffset = 6` cho `react-chessboard`. Giá trị này **không
phải số ô cờ** mà là *tỉ lệ của một ô* (`0` = tâm ô, `0.5` = mép ô), nên đuôi mũi tên bị đẩy lùi
**6 ô** - mũi tên `d2→d4` hiện thành `d8→d4` (trông như đang chỉ vào phía quân Đen).

Cách sửa: trải `...defaultArrowOptions` của thư viện rồi chỉ chỉnh `arrowStartOffset: 0.35` và
`opacity`, để **toàn bộ thông số hình học luôn theo mặc định của thư viện**.

`browser-arrow-test.mjs` giờ kiểm tra hai lớp để lỗi này không thể tái phát:

1. **Hình học**: đuôi mũi tên nằm trong ô xuất phát, đầu nằm trong ô đích, dài ~2 ô.
2. **Bên đi**: quét 6 nước liên tiếp, đọc toạ độ hai đầu từ chính thẻ `<path>` của mũi tên
   (đúng cho cả nước chéo và nước Mã vì mũi tên Mã là đường gấp khúc), rồi xác nhận
   **đuôi luôn nằm trên quân của bên đang đi** - đối chiếu chéo với cặp ô mà thư viện ghi
   trong id `kid-board-arrowhead-…-d2-d4`.

> Nếu bạn thấy mũi tên còn chỉ ngược, gần như chắc chắn là trình duyệt đang chạy **bản build cũ**.
> Hãy tải lại trang (Cmd/Ctrl + Shift + R) hoặc khởi động lại `npm run dev` / `npm run preview`.

## ☁️ Chạy production bằng PM2

Ứng dụng là **SPA tĩnh**: `npm run build` sinh ra thư mục `dist/` gồm HTML, JS, CSS và Web Worker
của bộ máy cờ. Vì vậy **không cần web server riêng** - PM2 có sẵn chế độ `serve` để phục vụ thư mục
đó, kèm luôn **SPA fallback** để bé F5 ở `/tactics` hay `/free-play` không bị 404.
Toàn bộ cấu hình nằm trong **`ecosystem.config.cjs`** ở gốc dự án.

> ⚠️ **Đừng đổi tên thành `ecosystem.config.js`.** `package.json` đã đặt `"type": "module"`,
> nên Node sẽ nạp file `.js` theo kiểu ES module: dòng `module.exports` không xuất ra gì
> (thử trên Node 23 → config rỗng `{}`; Node cũ hơn → lỗi `module is not defined`) và PM2
> sẽ không thấy mảng `apps` nào để chạy. Đuôi `.cjs` giữ file ở dạng CommonJS.

### 1. Chuẩn bị trên máy chủ

```bash
git clone <repo> && cd tonyChess
npm ci                 # cài đúng phiên bản trong package-lock.json
npm run build          # tạo dist/ - PM2 chỉ phục vụ file tĩnh nên bước này là bắt buộc
sudo npm i -g pm2      # cài PM2 (bỏ sudo nếu npm của bạn không cần)
pm2 -v
```

### 2. Chạy app

```bash
pm2 start ecosystem.config.cjs    # chạy nền theo đúng file cấu hình
pm2 status                        # xem trạng thái, số lần restart, RAM
pm2 logs hoc-vien-co-vua-nhi      # xem log trực tiếp (Ctrl+C để thoát)
pm2 logs hoc-vien-co-vua-nhi --lines 100
```

Mở `http://<ip-máy-chủ>:4173` - cổng 4173 khai báo ở `env.PM2_SERVE_PORT`. Mở thử một đường dẫn con
như `http://<ip-máy-chủ>:4173/tactics` rồi **F5** để chắc chắn SPA fallback đang chạy.

### 3. Cập nhật phiên bản mới

```bash
git pull
npm ci
npm run build
pm2 reload ecosystem.config.cjs
```

PM2 đọc file bằng `fs.readFile` cho **từng request** (không cache trong RAM), nên `npm run build` xong là
bản mới có hiệu lực ngay, không cần khởi động lại. `pm2 reload` mượt hơn `pm2 restart` (tiến trình mới
lên trước rồi mới tắt tiến trình cũ; chỉ ở chế độ cluster mới đạt đúng 0 giây downtime). Lưu ý duy nhất:
lúc build, Vite xoá rồi tạo lại `dist/` trong vài giây, nếu muốn tuyệt đối không gián đoạn thì build vào
thư mục tạm rồi mới đổi tên: `npm run build -- --outDir dist-new && mv dist dist-old && mv dist-new dist`.

### 4. Tự chạy lại khi máy chủ khởi động

```bash
pm2 save         # lưu danh sách app đang chạy
pm2 startup      # in ra một lệnh sudo - copy và chạy lệnh đó
```

### 5. Dừng / gỡ app

```bash
pm2 stop hoc-vien-co-vua-nhi
pm2 delete hoc-vien-co-vua-nhi
pm2 save         # cập nhật lại danh sách đã lưu
```

### Ghi chú khi lên production

- **Bản tĩnh nên không cần cluster**: `instances: 1` là đủ vì việc trả file rất nhẹ. Nếu muốn
  nhiều tiến trình hoặc HTTPS, hãy đặt **Nginx** phía trước làm cổng công khai (proxy về
  `127.0.0.1:4173`) và đổi `PM2_SERVE_HOST` trong `ecosystem.config.cjs` thành `'127.0.0.1'`.
- **PM2 mặc định nghe mọi card mạng**: `PM2_SERVE_HOST` mặc định là `0.0.0.0`, nên nếu máy chủ có
  IP công khai thì hãy **chặn cổng 4173 từ internet** bằng firewall (`sudo ufw deny 4173`) để mọi
  truy cập đều phải đi qua Nginx (hoặc qua TLS của bạn).
- **Không dùng `npm run preview` cho production**: đó là server xem thử của Vite, không tối ưu và
  có thể thay đổi giữa các phiên bản; `pm2 serve` mới là cách chạy ổn định trong `ecosystem.config.cjs`.
- **Node ≥ 22**: `package.json` đã ghim `"engines": { "node": ">=22" }` vì Vite 8 yêu cầu Node
  20.19+ / 22.12+. Kiểm tra bằng `node -v` trước khi build.
- **Deploy kiểu Vercel** vẫn dùng `vercel.json` (SPA rewrite) như cũ - hai cách chạy này độc lập nhau,
  cùng phục vụ chung một thư mục `dist/`.
