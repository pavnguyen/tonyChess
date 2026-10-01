# ♟️ Học Viện Cờ Vua Nhí

Web App tương tác (SPA) giúp **bé 7 tuổi** học thuộc **Khai cuộc Đại Kiện Tướng (GM)**, kỹ năng
**Trung cuộc**, **Tàn cuộc**, và **đấu tập cả ván cờ với chú Máy** - giao diện hoạt hình tươi sáng,
responsive 100% cho điện thoại, iPad/tablet và máy tính.

## 🚀 Chạy ngay

```bash
npm install
npm run dev           # mở http://localhost:5173
npm run build         # build production
npm run preview       # xem thử bản production
npm run lint          # kiểm tra code (oxlint)
npm run check         # kiểm tra dữ liệu cờ vua + bộ máy cờ (không cần trình duyệt)
```

Kiểm tra thêm trong trình duyệt thật (cần Chrome + `vite preview` đang chạy):

```bash
npm run preview &
npm run check:browser   # Web Worker trả nước đi thật + mũi tên vàng + kéo-thả ở chế độ Học từng bước + bố cục không phải cuộn
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

`browser-layout-test.mjs` đo lại trên 8 khung nhìn và bắt buộc: **không tràn ngang**, **trang không cuộn dọc**
(ở bố cục 2 cột), **thấy trọn khối bàn cờ** (bàn cờ + băng giải thích / nút), và **bàn cờ đủ to**
(≥ 600px ở 1440×900, ≥ 480px ở 1366×768, ≥ 440px ở 1024×768, ≥ 480px ở 1200×1200,
≥ 360px ở 980×720, ≥ 600px ở khổ dọc, ≥ 330px trên điện thoại).

## 🧠 Nguyên tắc sư phạm

Mỗi nước đi của bé (hoặc khi bấm “xem nước tiếp theo”) đều bật **Banner Giải Thích Siêu Ngắn**
gồm đúng 3 phần:

1. **Nước đi + Tên quân** - hình quân cờ chuẩn cho bé nhận ra ngay (♚♛♜♝♞♟), kèm ký hiệu nước đi
   linh hoạt theo tuỳ chọn (`♘f3` / `Nf3` / `Mf3`).
2. **Lý do** - 1 câu logic, dễ hiểu.
3. **Khẩu quyết vè** - 4–6 chữ để bé nhẩm thuộc lòng.

## 🗂️ Bốn tab học tập

| Tab | Nội dung |
| --- | --- |
| 🛡️ **Khai cuộc Đại Kiện Tướng** | **8 khai cuộc**: London System (Carlsen), Ván cờ Ý (Wesley So), King's Indian (Nakamura), Sicilian (Kasparov), Ruy López (Fischer), Gambit Hậu (Judit Polgár), Phòng thủ Pháp (Botvinnik), Caro-Kann (Petrosian). Có chế độ **Học từng bước** (bé **kéo-thả quân viền vàng** sang **ô viền xanh**, hoặc bấm nút / **phím ◀ ▶ ▲ ▼**), **Luyện thuộc lòng** (nhận Cúp Vàng 🏆) và **Đua tốc độ 30s**. |
| ⚔️ **Trung cuộc - Mẹo săn quân** | **12 thế cờ** cho các đòn **Bắt đôi (Fork)**, **Ghim quân (Pin)**, **Xiên quân (Skewer)**. Bé **kéo-thả quân** để giải; bấm **💡 Gợi ý** thì quân cần đi hiện **viền vàng** và ô đích hiện **viền xanh**. Giải đúng → pháo hoa 🎆 + âm thanh “Ting!” reo hò. |
| 👑 **Tàn cuộc - Trạm năng lượng Hậu** | “Vua + Tốt đua biến Hậu” và “Chiếu bí bằng 2 Xe / Hậu + Vua”, đấu với Vua Đen đi ngẫu nhiên như một bạn nhỏ đang tập chơi. Bé kéo-thả như đang chơi thật; **💡 Gợi ý** sẽ khoanh **quân cần đi** theo đúng thế cờ hiện tại. |
| 🎮 **Đấu tập với Máy** | Chơi **trọn một ván cờ thật** với bộ máy mini (negamax + bảng điểm vị trí). 3 mức 🐣 Dễ / 🐰 Vừa / 🦊 Khó, chọn quân Trắng/Đen, nút **Đi lại nước vừa rồi**, “Sách ghi ván cờ” và túi chiến lợi phẩm. |

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

- **Đổi ký hiệu nước đi**: Hình con cờ (mặc định) · Chuẩn quốc tế FIDE · Tiếng Việt (M, T, X, H, V).
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
  *Đại Kiện tướng Nhí*. Tiến độ lưu trong `localStorage` (kèm nút 🧹 chơi lại từ đầu).

## 🧱 Công nghệ

- **React 19 + Vite + TypeScript**
- **TanStack Router** (4 tab) + **TanStack Query** (lớp dữ liệu bài học, có cache)
- **chess.js** (luật cờ, `attackers`/`isAttacked` cho bản đồ nguy hiểm)
- **react-chessboard v5** (bàn cờ, mũi tên vàng đồng, kéo-thả & bấm-chọn-đi)
- **Tailwind CSS v4** (theme hoạt hình, animation tự viết)
- **Web Worker** cho bộ máy cờ (negamax + alpha-beta + piece-square table), có 3 lớp bảo hiểm
  chống “đứng hình”: worker lỗi → tự tính; worker im lâu → tự tính; trình duyệt chặn Worker → dùng
  luồng chính.

## 🧩 Chia nhỏ bundle (lazy-load từng tab)

Mỗi tab là **một file JS riêng**, bé chỉ tải đúng tab đang mở. Ở `src/router.tsx`, bốn trang được
nạp bằng `lazyRouteComponent(() => import('./pages/X'), 'X')` của TanStack Router, kèm
`defaultPreload: 'intent'` để **rê chuột / chạm vào tab là tải trước** - bấm vào mở ngay, gần như
không thấy màn hình chờ. Trong lúc chờ chunk tải về, router hiện `PageFallback`
(`src/components/PageFallback.tsx`) - một thẻ nhỏ “Đang mở bàn cờ cho bé…” chỉ vài thẻ `div`, không
kéo thêm thư viện nào.

Kết quả build (`npm run build`):

| File | Trước | Sau |
| --- | --- | --- |
| `index-*.js` (khung app + router) | 516.30 kB (gzip 162.28) | **334.80 kB (gzip 107.64)** |

Các chunk tách ra: `BoardStage` 119.79 kB (dùng chung: bàn cờ + chess.js) · `OpeningsPage`
12.50 kB · `FreePlayPage` 13.13 kB · `EndgamesPage` 7.94 kB · `TacticsPage` 6.24 kB. Lần đầu mở một
tab mới gần như chỉ tải thêm 6-13 kB, vì các chunk dùng chung đã nằm trong cache trình duyệt.

## 📁 Cấu trúc

```
src/
├── components/     # Bàn cờ, BoardStage (khối bàn cờ tự co), banner giải thích, Mắt Thần, bản đồ leo cấp, modal, UI
├── data/           # openings · tactics · endgames · ranks · queries (TanStack Query)
├── engine/         # minimax.ts · engine.worker.ts · useChessEngine.ts
├── hooks/          # useChessGame (ván cờ SAN) · useCurriculum (mở khoá theo cấp)
├── layout/         # RootLayout: header, 4 tab, thanh tuỳ chọn của bé
├── lib/            # notation · threats (heatmap + quân bị treo) · hints · sound (Web Audio)
├── pages/          # Openings · Tactics · Endgames · FreePlay
└── store/          # KidProgressProvider (⭐, huy chương, tuỳ chọn - localStorage)
scripts/            # validate-chess · smoke-logic · smoke-engine
                    # browser-engine-test · browser-arrow-test
                    # browser-learn-drag-test · browser-hint-drag-test
                    # browser-theme-test · browser-layout-test
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
| `validate-chess.ts` | Mọi FEN hợp lệ, mọi dòng khai cuộc đi đúng luật, và **chứng minh bản chất từng đòn**: Fork phải tấn công ≥ 2 quân, Pin ≥ 1 quân, Skewer phải chiếu Vua. Thế tàn cờ phải thật sự có nước chiếu bí. |
| `smoke-logic.ts` | Ký hiệu nước đi, heatmap 64 ô, **cảnh báo quân bị treo**, gợi ý tàn cuộc. |
| `smoke-engine.ts` | Bộ máy tự đấu hết ván, tìm được chiếu bí, biết ăn Hậu bị treo, không bao giờ trả nước sai luật. |
| `browser-engine-test.mjs` | Mở Chrome thật qua DevTools Protocol, bấm “Bé cầm quân Đen” và xác nhận **Web Worker trả về một nước đi hợp lệ** cho bé (kiểm tra độc lập với tuýp ký hiệu đang chọn). |
| `browser-arrow-test.mjs` | Đo hình học thật của **mũi tên vàng đồng**: đuôi phải nằm trong ô xuất phát, đầu phải nằm trong ô đích, dài ~2 ô, và đúng cả khi bàn cờ đã **xoay 180°** cho bé cầm quân Đen. Bài này còn **quét 6 nước liên tiếp** và đọc toạ độ thật trong thẻ `<path>` của mũi tên để xác nhận **đuôi luôn nằm trên quân của bên đang đi** (Trắng/Đen xen kẽ), kể cả nước chéo và nước Mã. Cuối cùng, bài này **bấm thử cả 4 phím mũi tên** và kiểm tra bàn cờ có nhảy đúng nước không. |
| `browser-hint-drag-test.mjs` | Chứng minh hai tab đố cũng có trợ giúp như tab Khai cuộc: **chưa bấm Gợi ý thì không lộ đáp án**, bấm rồi thì đúng **1 quân viền vàng** + **1 ô viền xanh** + 1 mũi tên (đối chiếu cặp ô trong id mũi tên), sau đó **kéo-thả thật bằng chuột** và kiểm tra bài được tính là đã giải / bàn cờ tiến lên. Bài này còn **đo lại viền ô gợi ý sau nửa chu kỳ** để chứng minh nhịp thở chạy thật, và bật `prefers-reduced-motion` để chắc rằng nhịp tắt nhưng viền tĩnh vẫn còn. |
| `browser-theme-test.mjs` | Ghim **bảng màu thật** trong trình duyệt: nền giấy ngà, thanh trên cùng xanh rừng, bàn cờ trắng + xanh lá đậm, mũi tên vàng đồng - và **không còn chỗ nào sót màu tím** ở nền, nút hay ô cờ. |
| `generate-assets.mjs` | Sinh `og-image.png` (1200×630) và `apple-touch-icon.png` (180×180) bằng Chrome headless, rồi tự giải mã lại ảnh để kiểm tra kích thước và màu. |
| `browser-layout-test.mjs` | Duyệt cả 4 tab trên 8 khung nhìn (1440×900 → cửa sổ vuông 1200×1200 → điện thoại 390×844): **không tràn ngang**, **trang không cuộn dọc**, **thấy trọn khối bàn cờ** và **bàn cờ đủ to**. |
| `browser-learn-drag-test.mjs` | Mở Chrome thật và **kéo quân bằng chuỗi sự kiện chuột thật** (không phải click bằng JS) trong chế độ *Học từng bước*: kiểm tra quân cần đi được khoanh **vàng đồng** và ô đích khoanh **xanh thép**, nước kéo-thả được chấp nhận, đối thủ tự đáp trả rồi quân kế tiếp lại sáng, kéo sai thì bàn cờ **không tiến**, và nút ◀ ▶ vẫn hoạt động. |
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
