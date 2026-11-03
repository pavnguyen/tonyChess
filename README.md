# ♟️ Nam An - Cờ Vua

Web App tương tác (SPA) giúp **bé 7 tuổi** học thuộc **Khai cuộc Grand Master (GM)**, luyện
**Trung cuộc** (tìm nước hay nhất), **Tàn cuộc** (kể cả chơi thật với máy), **Chiến lược** vị trí,
**Đối phó khai cuộc** và **đấu trọn một ván với chú Máy**. Giao diện hoạt hình tươi sáng, responsive 100% cho điện thoại,
iPad/tablet và máy tính. Mục tiêu trình độ hướng tới **1600–1800 Elo**, nội dung **tinh gọn**.

## 🚀 Chạy ngay

```bash
npm install
npm run setup:engine  # chép Stockfish WASM vào public/stockfish (tự chạy ở dev/build)
npm run dev           # mở http://localhost:5173
npm run build         # build production (có tsc -b)
npm run preview       # xem thử bản production
npm run lint          # oxlint
npm run check         # dữ liệu cờ vua + engine + lời giải nước hay nhất (không cần trình duyệt)
```

Kiểm tra trong trình duyệt thật (cần Chrome + `vite preview` đang chạy):

```bash
npm run preview &
npm run check:browser   # 18 bộ: Web Worker · mũi tên · kéo-thả · gợi ý · Chiến lược · Stockfish ·
                        # gợi ý cho ba mẹ · nút ⓘ · toạ độ · giọng đọc · Trung cuộc · đánh tiếp ·
                        # Tàn cuộc · mẫu hình · Đối phó · Đấu tập · màu · bố cục (10 khung nhìn)
```

> `npm run check:browser` chạy khá lâu (vài phút). Khi phát triển, chạy lẻ từng bộ bên dưới cho nhanh.
> Nhớ `npm run build` trước vì `vite preview` phục vụ thư mục `dist/`.

## 🖥️ Bố cục “bàn làm việc”

Ưu tiên số một: **bé luôn thấy trọn bàn cờ cùng nước đi và lý do ngay trên màn hình, không phải cuộn.**

Mỗi trang gồm hai phần:

- **Khối bàn cờ** (`BoardStage`) - chỉ có bàn cờ, kèm một hàng trạng thái mỏng ở trên và băng giải thích /
  hàng nút ngay dưới. Cả khối này luôn nằm gọn trong màn hình.
- **Cột thông tin** - tab chế độ, bản đồ bài học, danh sách nước đi, mẹo, mục tiêu - và chỉ tự cuộn
  bên trong chính nó khi cần. Mỗi trang chỉ bày đúng việc của nó nên cột phải gọn gàng, hết cuộn lê thê.

Biến thể Tailwind **`stage`** (`min-width: 60rem` **và** `min-aspect-ratio: 1/1`, khai báo trong
`index.css`) quyết định khi nào dùng hai cột:

| Cửa sổ | Bố cục |
| --- | --- |
| Nằm ngang **hoặc vuông**, đủ rộng (≥ 960px) | **2 cột** - bàn cờ và cột thông tin nằm cạnh nhau, **cả trang không cuộn** |
| Dạng đứng (iPad dọc, điện thoại) | **1 cột** - bàn cờ rộng hết cỡ, phần phụ ở dưới |
| Hẹp mà vẫn thấp (`< 60rem`) | **1 cột** - bàn cờ thu vừa tầm mắt, có sàn tối thiểu 17rem |
| **Thấp mà rộng** (`shallow`: 640-959px **và** cao ≤ 544px) | **2 cột ngay trong thẻ bàn cờ** - đây là khổ điện thoại nằm ngang (iPhone 15 Pro Max ngang = 932×430) |

`browser-layout-test.mjs` đo lại trên **10 khung nhìn** (1440×900 → cửa sổ vuông 1200×1200 → iPhone 15
Pro Max dọc 430×932 **và** ngang 932×430) với cả 7 trang, và bắt buộc: **không tràn ngang**, **trang không
cuộn dọc** (ở bố cục 2 cột), **thấy trọn khối bàn cờ**, và **bàn cờ đủ to**.

## 🗂️ Ba nhóm, bảy trang

| Tab | Nội dung |
| --- | --- |
| 🛡️ **Khai cuộc Grand Master** (`/`) | Bấm một khai cuộc trên bản đồ → bàn cờ hiện **thế cờ mẫu hình cuối dòng chính** để xem trước, rồi **▶ Bắt đầu học từ đầu**. **10 khai cuộc** chia hai cột bé cầm Trắng / bé cầm Đen, xếp theo nước đáp bé thật sự gặp rồi mới tới độ dễ: Ván cờ Ý (Wesley So), Ruy Lopez (Fischer), Hệ thống London (Carlsen), Gambit Hậu (Polgár), Khai cuộc Anh (Tony Miles) · Sicilian (Kasparov), Caro-Kann (Petrosian), Pháp (Botvinnik), Phòng thủ King's Indian (Nakamura), Nimzo-Indian (Nimzowitsch). Có **Học từng bước** (bé **kéo-thả quân viền vàng** sang **ô viền xanh**, hoặc bấm nút / **phím ◀ ▶ ▲ ▼**). Kèm **kế hoạch trung cuộc** (bấm từng câu để soi ô cờ), **bộ lọc theo nước mở đầu** (1.e4, 1.d4, 1...c5…) gom các bài cùng nước mở đầu, và nút **🧭 Đối thủ chơi khai cuộc này thì sao?** nhảy sang bài Đối phó tương ứng. |
| 🧭 **Đối phó khai cuộc** (`/counters`) | **16 bài “đối thủ chơi X → bé đáp Y”** (8 bài đối thủ cầm Trắng + 8 bài đối thủ cầm Đen, bé cầm màu ngược lại) - gồm 10 khai cuộc của app **và**6 nước mở đầu phổ biến (1.e4, 1.d4, 1.Nf3, ...d5, ...Nf6, ...c6). Mỗi bài là một dòng nước từ nước đầu, ghi rõ nước nào của đối thủ, nước nào bé đáp, kèm **"đối thủ đang định làm gì"**, **ý tưởng đối phó** và **3 việc bé cần làm**; **bộ lọc theo nước mở đầu** gom các bài cùng nước mở đầu để **phá thế khai cuộc** và **chặn triển khai quân** của bạn. Đi từng nước bằng nút hoặc **phím ◀ ▶ ▲ ▼**; nút **📖 Mở bài khai cuộc gốc** nhảy về đúng bài ở tab Khai cuộc (mở sẵn qua `/?opening=…` - và ngược lại qua `/counters?vs=…`). |
| ⚔️ **Trung cuộc - Tìm nước hay nhất** (`/tactics`) | **9 thế cờ thật / 5 chủ đề**: 🎯 Trừng phạt quân treo · 👸 Đòn hiểm ăn Hậu · 📌 Đòn ghim · 🏁 Chiếu bí 3 nước · 💥 Hy sinh mở đường. Bé tự tìm **nước mạnh nhất** trên thế cờ thật (không học thuộc tên đòn); mỗi lời giải đã được máy chấm điểm và **kiểm chứng** (`verify:bestmove`). Thế nào có **chuỗi “đánh tiếp”** thì sau nước hay nhất, **máy tự đáp trả** rồi bé đi nốt để kết liễu. Có 💡 Gợi ý, thẻ **“Khi nào dùng?”** và nút **🔁 Xem lại lời giải** phát lại đúng chuỗi nước kèm mũi tên. |
| 👑 **Tàn cuộc cơ bản** (`/endgames`) | **5 thế kỹ thuật thật**: Vua–Tốt ô đối diện · Tốt thông · Xe + Tốt chọi Xe · Mã + Tượng chiếu bí · cặp Tượng chiếu bí. Đấu với máy mức Khó; kèm gợi ý, mục tiêu và nút đi lại. |
| 🏅 **Chiến lược - 10 nguyên tắc vàng** (`/strategy`) | **10 nguyên tắc vàng** (chiếm trung tâm, phát triển quân, nhập thành, tránh quân treo, cột mở, tiền đồn, hàng 7, Tốt thông, cặp Tượng, trao đổi đúng). Mỗi nguyên tắc có **hai thế cờ đối chiếu tốt / chưa tốt** kèm ô cờ và nhãn soi. |
| 🎮 **Đấu tập tự do với chú Máy** (`/free-play`) | Chơi trọn một ván cờ thật với engine (negamax + bảng điểm vị trí). **2 mức 🐰 Dễ / 🦁 Khá** (nhãn thân thiện, bên dưới vẫn là engine mức Khó và Stockfish), nút **💡 Gợi ý** (máy tìm nước mạnh nhất cho chính bé rồi vẽ mũi tên, **giới hạn 3 lần mỗi ván** - nút đếm ngược rồi tự khoá, ván mới cấp lại), chọn quân Trắng/Đen, nút đi lại nước vừa rồi, “Sách ghi ván cờ” và túi chiến lợi phẩm. HLV **nói tiếng Việt** chỉ ra lỗi vừa đi. |
| 🔍 **Soi quân treo** (`/hazards`) | Bé nhìn bàn cờ rồi **chỉ ra quân mình đang bị treo** trước khi đi; đúng/sai báo ngay, có mức thường và mức khó (nhiều quân hơn, có quân bị quân rẻ hơn tấn công, tính điểm theo chuỗi). |

## 🗺️ Bản đồ bài học

Khai cuộc và thế cờ được xếp thành các ô trên một bản đồ gọn gàng. App **không khoá theo thứ tự** và
**không theo dõi tiến độ** - bé (hoặc ba mẹ) muốn học bài nào lúc nào cũng được, cứ bấm vào ô đó.

Ở tab Khai cuộc, **bấm một khai cuộc trên bản đồ là bàn cờ hiện ngay thế cờ mẫu hình (cuối dòng chính)**
của khai cuộc đó - xem trước mà chưa tính là đã học - kèm nút **▶ Bắt đầu học từ đầu**.

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
- **Bảng đối chiếu ký hiệu**: `♘ = N = Mã`, `♗ = B = Tượng`… cùng các ký hiệu đặc biệt trên biên bản
  (`O-O`/`O-O-O`, `+`, `#`, `x`, `=`, `e.p.`, `!`/`?`, `1-0`/`0-1`/`½-½`) - mỗi dòng kèm một nước ví dụ.
- **Phím mũi tên**: ở tab *Khai cuộc* (chế độ Học từng bước) và tab *Đối phó*, bé bấm **◀ / ▼** để
  Lùi và **▶ / ▲** để Tiến từng nước; ở tab *Trung cuộc*, **◀ / ▼** về thế cờ trước và **▶ / ▲** sang
  thế kế tiếp - không phải rời tay khỏi bàn phím. Phím mũi tên cũng không làm trang tự cuộn.
- **Tô sáng nước cần đi**: **quân cần đi được khoanh vàng đồng** 🟨 còn **ô đích khoanh xanh thép** 🟦
  kèm mũi tên vàng chỉ đường - bé nhìn là biết ngay phải làm gì, không cần đọc chữ.

  Hai ô này **“thở” nhịp nhàng** (chu kỳ 1,5 giây) để mắt bé 7 tuổi bắt được ngay. Bé nào bật
  “giảm chuyển động” trong hệ điều hành thì nhịp thở tự tắt, chỉ còn viền tĩnh rất rõ.
  - Tab *Khai cuộc* chế độ **Học từng bước**: sáng sẵn ở mọi nước của bé.
  - Tab *Trung cuộc* và *Tàn cuộc*: hiện khi bé bấm **💡 Gợi ý** - cố ý **không lộ đáp án** trước,
    để bài đố vẫn còn là bài đố. Ở *Tàn cuộc*, thế cờ đổi sau mỗi nước nên gợi ý **được tính lại
    theo thế mới**.
- **Kéo-thả hoặc bấm-chọn-đi**: mọi tab có bàn cờ đều cho bé **kéo quân bằng chuột/ngón tay**, hoặc
  **bấm quân rồi bấm ô đích** (tiện cho iPad). Ở tab Khai cuộc: đi đúng → đối thủ tự đáp trả rồi quân
  kế tiếp của bé lại sáng lên; đi sai → quân tự về chỗ cũ kèm lời nhắc “bé thử lại nhé”.
- **Xoay bàn cờ tự động**: chọn bài cờ Đen là bàn cờ tự lật 180° để hàng 7–8 nằm sát bé.
- **Âm thanh**: tiếng đặt quân, “Ting!” khi đúng, nhạc thắng - tổng hợp bằng Web Audio, không cần file mp3.
- **Bàn cờ biết nói**: chạm ô/quân hay kéo quân thì bé nghe tên ô + tên quân tiếng Anh ("Knight C 3")
  qua Web Speech API. App **tự chọn giọng Mỹ nghe tự nhiên nhất** máy có (Google US, Microsoft Aria /
  Jenny, Samantha…; bỏ qua giọng “đồ chơi” như Albert/Bells). ⚙️ **không có bảng chọn giọng**: bé không
  phải chọn gì, và danh sách giọng dài hai chục dòng đã được gỡ khỏi bảng tuỳ chọn cho gọn.
- **Không điểm số, không theo dõi**: app cố ý không chấm điểm, không đếm sao và không bắt bé học theo
  thứ tự - bé tự nhớ mình đã học tới đâu. Chỉ tuỳ chọn ghi nước đi + âm thanh được lưu trong `localStorage`.

## 📅 Buổi luyện hôm nay

Tab Học có dải **“Hôm nay · 2/5”**: mỗi ngày app sinh một buổi 5 bài (khai cuộc → đối phó → trung
cuộc → soi quân → tàn cuộc), bé bấm **▶ Bắt đầu** là đi liền mạch, bỏ dở mai mở lại vẫn đứng đúng
bài đang dở. Buổi luyện sinh theo ngày và lưu trong `localStorage` (`src/lib/session.ts`); bé muốn
học bài khác thì cứ bấm trên bản đồ, không bị khoá thứ tự.

## ♟️ Bộ máy cờ (engine)

Có **hai** engine, phục vụ hai mục đích khác nhau:

1. **Engine JS tự viết** (`src/engine/minimax.ts`) - negamax + alpha-beta + bảng điểm vị trí,
   chạy trong Web Worker. Dùng cho mức Khó, tab Tàn cuộc, tab Trung cuộc (`rankMoves`)
   và làm phương án dự phòng.
2. **Stockfish WASM** (bản `lite-single`, ~1.8 MB) - dùng cho mức **Khá** ở tab Đấu tập tự do.

### Các mức của engine JS

| Mức | Độ sâu | Ngân sách | Đi bừa | Quiescence |
| --- | --- | --- | --- | --- |
| 🐰 **Dễ** (nhãn cho bé) | 3 | 1800 ms | 0 | **bật** |
| 🦁 **Khá** (nhãn cho bé) | → Stockfish | ~1.6 s | 0 | - |

App **không còn mức nào dưới 1200 Elo**: hai nhãn Dễ / Khá chỉ để bé khỏi nản, sức máy thật vẫn
là mức Khó và mức Stockfish.

**Quiescence (mức Khó)** là bước tăng sức rõ nhất mà không thêm thư viện: khi hết độ sâu, máy chỉ
xét tiếp các nước ăn quân / phong cấp cho tới khi thế cờ yên - nhờ vậy máy không còn “thí quân
ngay trước mặt bé” như các mức yếu trước đây.

**`rankMoves(fen, difficulty)`** chấm điểm **mọi nước hợp lệ** của một thế cờ rồi xếp hạng - dùng cho
tab Trung cuộc (tìm nước hay nhất) và cho `verify:bestmove`. Mỗi nước gốc được chấm trên **một bàn cờ
mới** để việc tìm kiếm hết thời gian không làm hỏng bàn cờ dùng chung.

### Stockfish WASM & giấy phép ⚠️

- Chép tệp bằng `npm run setup:engine` (tự chạy trước `dev`/`build`) vào `public/stockfish/`.
- **Nạp lười**: Worker chỉ được tạo khi bé chọn mức Khá; tải không được thì tự rơi về engine JS.
- **Giấy phép: Stockfish là GPL-3.0.** App hiện là riêng tư nên dùng bình thường, **nhưng nếu sau
  này mở mã nguồn hoặc phát hành thì toàn bộ app phải theo GPL-3.0**. Phần ghi nguồn nằm ở
  `public/stockfish/NOTICE.txt` và `LICENSE.txt` (phải giữ nguyên khi phân phối).

## 📚 Nội dung học

- **🛡️ 10 khai cuộc GM** (`src/data/openings.ts` giữ metadata; `src/data/openingTrees.ts` giữ
  **dòng chính**): 5 bài bé cầm Trắng + 5 bài bé cầm Đen, mỗi bài một dòng chính kèm lời giải thích
  từng nước (lý do + vè) và **kế hoạch trung cuộc** (3 việc viết tay, có ô cờ + mũi tên để soi).
  Bấm một khai cuộc trên bản đồ là bàn cờ hiện **thế cờ mẫu hình cuối dòng chính** để xem trước; nút
  **🧩 Ôn mẫu hình cuối khai cuộc** mở modal xem thế cờ cuối của mọi khai cuộc.
- **⚔️ 9 thế cờ Trung cuộc** (`src/data/bestMoves.ts`): 5 chủ đề, trong đó 3 thế là **chiếu bí
  3 nước** và 3 thế là **hy sinh mở đường** - mỗi thế đều đã được kiểm là chiếu bí
  cưỡng bức và **không có nước bí sẵn** ở nước đầu. Mỗi thế có nước hay nhất
  (`bestSan`) đã được **Stockfish kiểm chứng**; nhiều nước cùng tốt trong biên độ cho phép vẫn tính đúng.
- **👑 5 thế luyện Tàn cuộc** (`src/data/endgames.ts`): Vua–Tốt ô đối diện, Tốt thông, Xe + Tốt
  chọi Xe, Mã + Tượng chiếu bí, cặp Tượng chiếu bí. Đối thủ đi mức Khó.
- **🧭 16 bài Đối phó khai cuộc** (`src/data/counters.ts`): 8 bài cho đối thủ cầm Trắng + 8 bài cho
  đối thủ cầm Đen, mỗi bài một dòng nước kèm **đối thủ đang định làm gì**, ý tưởng đối phó và 3 việc
  bé cần làm. 10 bài gắn `openingId` trỏ tới bài khai cuộc gốc (quy ước `id = vs-<openingId>`) để
  nhảy qua lại giữa hai tab; 6 bài còn lại chỉ bàn về **nước mở đầu phổ biến** (1.e4, 1.d4, 1.Nf3,
  ...d5, ...Nf6, ...c6). Danh sách có **bộ lọc theo nước mở đầu** để gom những bài cùng nước mở đầu
  (ví dụ cùng 1.d4: London / Gambit Hậu / Ấn Độ).
- **🏅 10 nguyên tắc vàng** (`src/data/goldPrinciples.ts`, mỗi nguyên tắc có hai bàn cờ đối chiếu
  tốt/chưa tốt).

## 🧱 Công nghệ

- **React 19 + Vite + TypeScript**
- **TanStack Router** (3 nhóm tab, 7 trang) + **TanStack Query** (lớp dữ liệu bài học, có cache)
- **chess.js** (luật cờ, `attackers`/`isAttacked` cho bản đồ nguy hiểm)
- **react-chessboard v5** (bàn cờ, mũi tên vàng đồng, kéo-thả & bấm-chọn-đi)
- **Tailwind CSS v4** (theme hoạt hình, animation tự viết)
- **Web Worker** cho bộ máy cờ (negamax + alpha-beta + piece-square table + **quiescence**), có 3
  lớp bảo hiểm chống “đứng hình”: worker lỗi → tự tính; worker im lâu → tự tính; trình duyệt chặn
  Worker → dùng luồng chính.
- **Stockfish WASM** (bản `lite-single` ~1.8 MB) cho mức **Khá**: nạp lười, có nhánh tự rơi về engine JS.
- **PWA** (`vite-plugin-pwa`): cài app ra màn hình chính và **luyện được khi mất mạng** - Workbox
  precache cả `stockfish/*.wasm`, kiểm bằng `npm run check:pwa` sau `npm run build`.

## 🧩 Chia nhỏ bundle (lazy-load từng tab)

Mỗi tab là **một file JS riêng**, bé chỉ tải đúng tab đang mở. Ở `src/router.tsx`, các trang được
nạp bằng `lazyRouteComponent(() => import('./pages/X'), 'X')` của TanStack Router, kèm
`defaultPreload: 'intent'` để **rê chuột / chạm vào tab là tải trước** - bấm vào mở ngay.

Trong lúc chờ chunk tải về, router hiện `PageFallback` (`src/components/PageFallback.tsx`): một
**bàn cờ xương 8×8** dựng bằng `div` thuần, dùng đúng 2 màu ô của bàn cờ thật
(`#2f6b4f` / `#ffffff`). File này **không import thư viện nào**.

Thư viện ít khi đổi được tách thành chunk riêng trong `vite.config.ts`
(`build.rollupOptions.output.manualChunks`): `vendor-react`, `vendor-tanstack`, `vendor-chess`
(chess.js + react-chessboard + dnd-kit). Nhờ vậy trình duyệt giữ chúng trong cache dài hạn.

## 📁 Cấu trúc

```
src/
├── components/     # Bàn cờ (ChessBoardPanel) · BoardStage (khối bàn cờ tự co) · banner giải thích ·
│                   # Mắt Thần · bản đồ bài học · modal · UI (KidButton/Panel/SectionTitle/Segmented) ·
│                   # PageFallback · ParentTips · HeaderOptions
├── data/           # openings (metadata) · openingTrees (dòng chính) · counters (đối phó) · bestMoves ·
│                   # endgames · goldPrinciples · queries
├── engine/         # minimax.ts (pickMove, rankMoves) · engine.worker.ts · useChessEngine.ts ·
│                   # stockfishLoader.ts · uci.ts
├── hooks/          # useChessGame (ván cờ SAN) · useArrowKeys · useEyeCheck
├── layout/         # RootLayout: header, 3 nhóm tab, dải bài trong nhóm, thanh tuỳ chọn của bé
├── lib/            # notation · speech (đọc to giọng Mỹ + chọn giọng) · coordinates · threats · hints ·
│                   # planFocus · livePlan · parentTips · sound · info
├── pages/          # Openings · Counters · Tactics · Endgames · Strategy · FreePlay
└── store/          # KidProgressProvider (tuỳ chọn ghi nước đi + âm thanh - localStorage)
                    # LessonProvider (trang tự báo bài đang mở cho khung gợi ý cho ba mẹ)
scripts/            # validate-chess · smoke-logic · smoke-plan · smoke-info ·
                    # smoke-engine · smoke-uci · verify-bestmove
                    # browser-{engine,arrow,learn-drag,hint-drag,strategy-drag,stockfish,parent-tips,
                    #   info,coords,voice,tactics,tactics-continuation,endgame,openings-patterns,
                    #   counters,freeplay-hint,theme,layout}-test
                    # generate-assets (sinh favicon/OG) · browser-overflow · browser-shot (gỡ lỗi)
                    # setup-stockfish
public/             # favicon.svg · apple-touch-icon.png · og-image.png · stockfish/
ecosystem.config.cjs  # cấu hình PM2 cho production (pm2 serve + SPA fallback)
vercel.json           # cấu hình Vercel (SPA rewrite)
```

## 🎨 Bảng màu “Navy – Gỗ sáng – Đỏ son”

Gam màu hiện tại: **navy** (xanh biển đậm) làm màu chủ đạo, **gỗ sáng** làm nền giấy, **đỏ son** cho
lỗi/nguy hiểm, cộng hai màu chức năng vàng đồng và xanh ngọc. Không còn tím ở bất kỳ đâu.
Toàn bộ token khai báo ở `src/index.css` (`@theme`), đặt tên theo **vai trò**, không theo tên màu -
sau này muốn đổi gam chỉ cần sửa một chỗ (bộ alias `navy-*` / `wood-*` / `son-*` trỏ cùng giá trị):

| Token | Vai trò | Màu |
| --- | --- | --- |
| `brand-*` (`navy-*`) | Màu chủ đạo: thanh trên cùng, nút chính, chữ chính | navy `#3c5480` → `#1b2639` |
| `sand-*` (`wood-*`) | Nền trang, viền thẻ, vùng chờ, ô sáng của bàn cờ | gỗ sáng `#fbf8f1` → `#e3cda3` |
| `leaf-*` | Trạng thái đúng, vùng an toàn | xanh ngọc `#2f7d5f` |
| `gold-*` | Cúp Vàng 🏆, nút “mặt trời”, mũi tên gợi ý | vàng đồng `#d9a83f` |
| `coral-*` (`son-*`) | Nước sai, cảnh báo quân bị treo ⚠️ | đỏ son `#cc5847` |
| `info-*` | Nước của đối thủ, ô đích gợi ý, ô kế hoạch | xanh thép `#3f748f` |
| `ink-*` | Chữ phụ, đường kẻ | xám ngả navy `#5b6675` |

Quy ước bắt buộc: **vàng** chỉ dùng cho “quân cần đi / phần thưởng”, **đỏ son** chỉ cho “sai / nguy
hiểm” - hai màu này không bao giờ dùng lẫn ý. Mọi cặp chữ/nền được ghim bằng
`npm run check:contrast` (ngưỡng WCAG AA 4.5:1).

**Bàn cờ**: ô gỗ sáng `#efe1c7` + ô navy sáng `#475a7f`, viền ngoài navy đậm `#1b2639`.
Hai màu ô là token riêng `--color-board-light` / `--color-board-dark`. Ô đậm cố ý **sáng hơn**
navy-800: quân Đen là hình bóng đen tuyền, trên navy `#24334f` chỉ đạt 1.7:1 nên bé không nhìn ra
quân; `#475a7f` đưa quân Đen lên 3:1 và quân Trắng lên 6.9:1. Đổi theo, mũi tên / vòng “quân cần
đi” trên bàn cờ dùng vàng đồng sáng `#e8c471` (`ARROW_COLOR`) - vàng đậm cũ chỉ còn 2.3:1 trên ô
này, còn vàng sáng đạt 4.6:1.

## 🔤 Font chữ (tự host)

| Họ font | Dùng cho | Cấp độ đạm |
| --- | --- | --- |
| **Be Vietnam Pro** | Phần ĐỌC: câu hướng dẫn, giải thích, ghi chú | 400 · 600 · 700 |
| **Baloo 2** | TIÊU ĐỀ, nút, nhãn (đậm, tròn, thân thiện) | 700 · 800 |

Cả hai được tải về `public/fonts/` (10 tệp `woff2`, ~168 kB, có `unicode-range` riêng cho tiếng Việt)
và khai báo `@font-face` trong `src/index.css` - **không** dùng Google Fonts, vì app phải chơi được
khi mất mạng (mất mạng mà rơi về font hệ thống thì dấu tiếng Việt đổi dáng). Ba tệp nặng nhất được
`preload` trong `index.html`; Workbox precache luôn nhờ `globPatterns` có `woff2`.

Cỡ chữ: câu hướng dẫn **16px**, nhãn phụ **14px** (12px chỉ cho huy hiệu đánh số trong vòng tròn
16px), không có chữ nào nhỏ hơn.

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
chốt. Thiết kế hỏng là báo lỗi ngay.

> Khi đã có tên miền, nhớ đổi `og:url` và `og:image` trong `index.html` thành **địa chỉ tuyệt đối**
> (ví dụ `https://co-vua-nhi.vn/og-image.png`) - nhiều nền tảng không chấp nhận đường dẫn tương đối.

## ✅ Kiểm tra tự động

### Không cần trình duyệt (`npm run check`)

| Script | Nội dung |
| --- | --- |
| `validate-chess.ts` | Mọi FEN hợp lệ, mọi dòng khai cuộc đi đúng luật, thế tàn cờ thật sự chiếu bí được, các chủ đề Trung cuộc đủ 2 thế/chủ đề, **chuỗi “đánh tiếp” hợp lệ và có độ dài chẵn**, và **vè 4–6 chữ** ở mọi dữ liệu viết tay. |
| `smoke-logic.ts` | Ký hiệu nước đi, heatmap 64 ô, **cảnh báo quân bị treo**, gợi ý tàn cuộc. |
| `smoke-plan.ts` | Khung “kế hoạch theo thế cờ hiện tại” (`buildLivePlan`) sinh đủ loại việc. |
| `smoke-info.ts` | Mọi khoá nội dung trong `src/lib/info.ts` đều có chủ đề hợp lệ (nút ⓘ). |
| `smoke-engine.ts` | Bộ máy tự đấu hết ván, tìm được chiếu bí, biết ăn Hậu bị treo, không bao giờ trả nước sai luật. |
| `smoke-uci.ts` | Phân tích giao thức UCI của Stockfish: đọc `bestmove`/`depth`/`uciok`, đổi nước UCI sang SAN hợp lệ. |
| `verify-bestmove.ts` | Chạy engine chấm điểm **mọi nước** của từng thế Trung cuộc và xác nhận `bestSan` là nước tốt nhất (hoặc đồng hạng trong biên độ cho phép). Với thế có chuỗi “đánh tiếp”: kiểm từng nước của bé cũng là nước hay nhất, và cuối chuỗi phải là **chiếu bí hoặc thế thắng rõ**. |

### Trong trình duyệt thật (cần Chrome)

| Script | Nội dung |
| --- | --- |
| `browser-engine-test.mjs` | Mở Chrome qua DevTools Protocol, xác nhận **Web Worker trả về một nước đi hợp lệ** cho bé. |
| `browser-arrow-test.mjs` | Đo hình học thật của **mũi tên vàng đồng**: đuôi nằm trong ô xuất phát, đầu nằm trong ô đích, dài ~2 ô, và đúng cả khi bàn cờ **xoay 180°** cho bé cầm Đen. Còn quét 6 nước liên tiếp và bấm thử 4 phím mũi tên. |
| `browser-learn-drag-test.mjs` | **Kéo quân bằng chuỗi sự kiện chuột thật** ở chế độ *Học từng bước*: quân cần đi khoanh vàng, ô đích khoanh xanh thép, đối thủ tự đáp trả, kéo sai thì bàn cờ không tiến. |
| `browser-hint-drag-test.mjs` | Chưa bấm Gợi ý thì **không lộ đáp án**; bấm rồi thì đúng 1 quân vàng + 1 ô xanh + 1 mũi tên; sau đó **kéo-thả thật** và kiểm tra bài được tính là đã giải. Đo lại viền gợi ý để chứng minh **nhịp thở** chạy thật và tắt khi bật `prefers-reduced-motion`. |
| `browser-strategy-drag-test.mjs` | Tab **Chiến lược**: kéo-thả thật một thế cờ tốt và xác nhận quân đứng đúng ô, không tự bật về như cũ. |
| `browser-stockfish-test.mjs` | Mở một Worker Stockfish thật, chạy `uci → position → go depth 12`, xác nhận engine trả `bestmove` hợp lệ kèm dòng `info`. |
| `browser-coach-test.mjs` | HLV tiếng Việt ở tab Đấu Máy: đi một nước **thí quân** thì HLV chỉ ra quân bị treo bằng lời Việt, và câu nhận xét có số điểm, kèm nút “◀ Đi lại”. |
| `check-pwa.mjs` | Bản dựng PWA: có manifest, service worker precache **cả engine Stockfish (JS + WASM)** và trang chủ để mở offline. |
| `browser-pwa-offline-test.mjs` | Khung điện thoại 390×844: manifest + service worker cài xong, **tắt mạng bằng DevTools** rồi tải lại và mở tab Đấu ván - bàn cờ, hai mức máy và **engine vẫn chạy** từ cache. |
| `browser-info-test.mjs` | Nút **ⓘ** có mặt ở đúng chỗ và bấm ra bảng giải thích đúng chủ đề, đóng được, bảng nằm gọn màn hình. |
| `browser-coords-test.mjs` | Toạ độ bàn cờ (cột a-h, hàng 1-8) ở cả 4 mép, đọc tên ô + tên quân tiếng Anh, và xoay đúng khi bé cầm quân Đen. |
| `browser-voice-test.mjs` | Mục **🔈 Giọng đọc** trong ⚙️: liệt kê giọng tiếng Anh máy có, **mỗi dòng có nút 🔊 nghe thử riêng**, chọn giọng thì lưu lại và còn nguyên sau khi tải lại. |
| `browser-tactics-test.mjs` | Tab **Trung cuộc**: mở đúng chủ đề qua `/tactics?theme=…`, giải đúng một thế rồi phát lại **“Xem lại lời giải”** (quân đi lại đúng, có mũi tên, đọc to nước). |
| `browser-tactics-continuation-test.mjs` | Tab **Trung cuộc**: chế độ **đánh tiếp** - máy tự đáp trả rồi bé đi nốt nước chiếu bí. |
| `browser-endgame-test.mjs` | Tab **Tàn cuộc**: tiêu đề “Tàn cuộc cơ bản”, đủ 5 thẻ luyện, các khung tham khảo cũ **đã được gỡ**; bấm thẻ thì bàn cờ đổi đúng thế cờ; bấm Gợi ý thì hiện mũi tên + bong bóng đọc nước. |
| `browser-openings-patterns-test.mjs` | **Bấm một khai cuộc trên bản đồ → bàn cờ hiện ngay thế cờ mẫu hình cuối** (cả 10 bài), nút **▶ Bắt đầu học từ đầu** đưa về thế cờ gốc, và **bộ lọc theo nước mở đầu** gom đúng nhóm bài. |
| `check-contrast.ts` | Tính **tương phản WCAG AA** trực tiếp từ token đọc trong `src/index.css`: 25 cặp chữ/nền và vòng gợi ý trên bàn cờ - chữ dưới 4.5:1 là fail. Chạy trong `npm run check`. |
| `browser-theme-test.mjs` | Ghim **bảng màu thật**: nền gỗ sáng, thanh trên cùng navy, bàn cờ ô gỗ + ô navy, mũi tên vàng đồng - và **không còn màu tím** sót lại. |
| `browser-freeplay-hint-test.mjs` | Tab **Đấu tập tự do**: đủ **2 mức** Dễ / Khá, bấm **💡 Gợi ý** thì máy tìm nước cho bé và vẽ **mũi tên vàng**; **giới hạn 3 lần mỗi ván** (nút đếm ngược rồi tự khoá, ♟️ Ván mới cấp lại đủ 3). |
| `browser-counters-test.mjs` | Tab **Đối phó khai cuộc**: đủ 8 bài cho đối thủ cầm Trắng và 8 bài cho đối thủ cầm Đen, hiện **“đối thủ đang định làm gì”** + ý tưởng + 3 việc, **bộ lọc theo nước mở đầu** (lọc 1.d4 gom đúng 3 bài), **phím ◀ ▶ tiến/lùi từng nước**, đổi màu đối thủ thì danh sách đổi theo, và **liên kết hai chiều**: `?vs=` mở sẵn đúng bài, **📖 Mở bài khai cuộc gốc** nhảy về đúng bài Khai cuộc, **🧭** nhảy ngược lại Đối phó. |
| `browser-layout-test.mjs` | Duyệt cả 7 trang trên **10 khung nhìn**: **không tràn ngang**, **trang không cuộn dọc**, **thấy trọn khối bàn cờ** và **bàn cờ đủ to**. |
| `generate-assets.mjs` | Sinh `og-image.png` (1200×630) và `apple-touch-icon.png` (180×180) bằng Chrome headless, rồi tự giải mã lại ảnh để kiểm tra kích thước và màu. |

> Để chạy lẻ một bộ: `npm run check:layout`, `npm run check:tactics`, `npm run check:patterns`…
> (danh sách đầy đủ nằm trong `package.json`).
