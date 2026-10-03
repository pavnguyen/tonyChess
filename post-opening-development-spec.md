# Đặc tả: Phần LUYỆN **“Triển khai quân sau khai cuộc”**

> Người yêu cầu: chủ dự án (bố của bé Nam An) · Ngày viết spec: 2026-10-01
> Trạng thái: **ĐÃ CHỐT qua 6 vòng hỏi–đáp**, chưa viết mã
> Liên quan: `gm-deep-dive-spec.md` §4.4 (cây khai cuộc + kế hoạch trung cuộc), §5 (sư phạm tương tác),
> §2.1 (M3 — khai cuộc thực chiến)
> Tên việc ngắn: **post-opening-development**

> ### ⚠️ TÀI LIỆU LỊCH SỬ — TÍNH NĂNG NÀY **CHƯA ĐƯỢC TRIỂN KHAI**
>
> Đây là **kế hoạch** cho một buổi luyện "Triển khai quân sau khai cuộc" (chế độ `develop`). App
> hiện tại **không có** tính năng này: tab Khai cuộc chỉ có `learn` và `memorize`, và tab Đấu với
> Robot vẫn bắt đầu từ thế cờ ban đầu. Mô tả **đúng** app hiện tại nằm ở [`README.md`](./README.md).
>
> **Các số liệu trong §1 là bản chụp ngày 2026-10-01 và đã lạc hậu**: khi đó app còn **8 khai cuộc**
> và **cây khai cuộc phân nhánh (271 nút / 24 ngã ba)** - cả hai nay đã thay bằng **10 khai cuộc,
> mỗi bài một dòng chính** (không còn nhánh). Các mục nhắc tới mini-Elo, tab Ôn tập, kho câu đố
> Lichess và ván kỳ thủ `/gm-games` cũng **không còn đúng** với app hiện tại.

---

## 0. Tóm tắt một đoạn

App đang dạy khai cuộc rất kỹ nhưng **dừng đúng lúc khó nhất**: hết dòng sách (khoảng nước 5–7) là trao
Cúp Vàng và hết bài, trong khi thực chiến phải đi tiếp **6–8 nước nữa mới hoàn tất triển khai quân** —
đúng đoạn mà trẻ con hay lạc. Đặc tả này thêm một **buổi LUYỆN** (không phải bài giảng mới, **không
thêm dữ liệu nước đi viết tay**): từ **đúng thế cờ bé vừa kết thúc bài** (kể cả khi bé đã rẽ sang nhánh
phụ), bé **đấu với máy**, và app chấm bằng **BẢNG KIỂM TRIỂN KHAI** (nhập thành ✓, ra hết quân nhỏ ✓,
Xe kết nối ✓, quân đứng ô tốt ✓, không thua quân ✓) — **quy trình là chính, thắng thua là phụ**. Xong
bảng kiểm là xong buổi luyện. Toàn bộ phần “HLV” dùng lại những thứ **đã có trong repo**
(`findHangingPieces`, `pickMove`, và khung kế hoạch sinh từ engine của §4.4 mức 3).

---

## 1. Vì sao (đo thật trên mã nguồn hiện tại)

| # | Sự thật đo được | Hệ quả |
| --- | --- | --- |
| 1 | Mỗi khai cuộc kết thúc ở **cuối dòng sách**: London = **14 ply (7 nước)**; validator yêu cầu mọi dòng chính **≥ 10 ply**. | Bé học xong ở nước 7 rồi… hết. |
| 2 | Tại `atLeaf` (hết cây), chế độ *Luyện thuộc lòng* trao **Cúp Vàng** + `recordRating('opening', true)` + `completeActivity('openings:<id>:memorize', 6)`. | Phần thưởng lớn nhất đến **trước** giai đoạn khó nhất. |
| 3 | Sau đó chỉ còn 2 khung **đọc**: 🧭 “Kế hoạch trung cuộc” (3 câu viết tay, cố định mọi ván) và 🔎 “Kế hoạch theo thế cờ hiện tại” (`buildLivePlan`, hiện khi `ply >= PLAN_PLY = 10`). | Bé **đọc** kế hoạch chứ **không được luyện** thực hiện kế hoạch đó. |
| 4 | Tab *Đấu với Robot* **luôn** bắt đầu từ `START_FEN` (thế ban đầu). | Không có cách nào luyện lại đúng thế vừa học. |
| 5 | 8 khai cuộc: **4 bài bé cầm Trắng** (london, italian, ruy-lopez, queens-gambit) · **4 bài bé cầm Đen** (kings-indian, sicilian, french, caro-kann). | Mọi logic phải **soi gương** được cho cả hai màu. |
| 6 | Cây khai cuộc hiện có **271 nút · 24 ngã ba · 167 nước nhánh phụ**; bé được chấp nhận **mọi nước lý thuyết** ở nút của mình. | Buổi luyện phải bắt đầu từ **đúng thế bé đang đứng**, không phải luôn từ dòng chính. |

**Kết luận:** lỗ hổng không phải “thiếu dữ liệu nước đi” mà **thiếu một chặng LUYỆN** giữa *hết khai
cuộc* và *trung cuộc thật*.

---

## 2. Các quyết định đã chốt (nguyên văn lựa chọn của chủ dự án)

| Vòng | Câu hỏi | ✅ Quyết định |
| --- | --- | --- |
| 1 | Hình dạng của phần còn thiếu | **Biến thành phần LUYỆN**: từ thế cuối dòng sách, bé **đấu với máy**, kế hoạch/engine đóng vai HLV, **không có kịch bản viết tay**. |
| 1 | Mốc “đã hết khai cuộc” | **Hết dòng sách của từng bài** (mỗi khai cuộc tự quyết định theo dữ liệu cây). |
| 1 | Kỹ năng ưu tiên | **Cả 7**: ra hết quân nhỏ · nhập thành đúng lúc · kết nối Xe · đặt quân vào ô tốt · cột mở/tiền đồn · chuẩn bị đột phá Tốt · phá ý đồ đối thủ. |
| 2 | Đo “thành công” bằng gì | **Bảng kiểm triển khai** (quy trình là chính; thắng/thua chỉ là phụ). |
| 2 | Khi nào kết thúc buổi luyện | **Xong bảng kiểm là xong** (dù ván chưa ngã ngũ). |
| 2 | HLV được phép làm gì | **Tất cả 6**: cảnh báo trước khi mất quân · tự hiện gợi ý khi “bí 2 lần” · cho lùi lại 1 nước · bảng kiểm cập nhật liên tục · khung kế hoạch theo thế cờ · nút xem nước máy gợi ý. |
| 2 | Sức mạnh máy | **Mạnh để phạt nước dở** (không phải máy nhẹ). |
| 3 | Mạnh từ lúc nào | **Mạnh nhưng chỉ “phạt” khi bé ẩu** — chơi bình thường, hễ bé để quân bị ăn thì máy đánh thẳng vào đó. |
| 3 | Mục “không thua quân” chấm sao | **Theo giá trị quân**: đổi quân ngang giá thì không sao; **thua nhiều hơn đối thủ** thì bị đánh dấu đỏ. |
| 3 | Nếu bị chiếu bí trước khi xong bảng kiểm | **Giữ tiến độ đã đạt**, cho bé **xem lại nước làm mất ván**, rồi mới làm lại. |
| 3 | Chỗ đứng trong app | **Hai cửa**: (a) **chế độ thứ 3** trong tab Khai cuộc; (b) **mục trong tab Đấu với Robot** — “bắt đầu từ thế cuối bài khai cuộc”. |
| 4 | Bé đã rẽ nhánh phụ thì luyện từ đâu | **Đúng thế bé vừa tới** (branch-aware), không ép về dòng chính. |
| 4 | Bảng kiểm có theo tuổi không | **Giống nhau cho mọi tuổi** (một bộ mục duy nhất). |
| 4 | Phần thưởng | **Sao ⭐ như bài học** + **điểm mini-Elo khai cuộc**. **KHÔNG** chuyển Cúp Vàng, **không** đổi thứ tự mở khoá, **không** huy hiệu mới. |
| 4 | Trợ giúp có theo lộ trình 7→18 không | **Không** — buổi luyện **luôn có trợ giúp** (ngoại lệ có chủ ý so với `stage.hintPolicy`). |
| 5 | “Ra hết quân nhỏ” nghĩa là | **Cả 4 quân nhỏ rời ô gốc** (2 Mã + 2 Tượng). |
| 5 | “Kết nối Xe” nghĩa là | **Một trong hai là đủ**: hai Xe nhìn thấy nhau **HOẶC** một Xe đứng trên cột mở. |
| 5 | Mục trở nên bất khả thi | **Chuyển thành “không áp dụng”** (mờ đi, không tính vào tổng); buổi luyện vẫn kết thúc bình thường. |
| 5 | Cách chọn thế trong Đấu với Robot | **Danh sách 8 khai cuộc** kèm trạng thái đã học/đã triển khai, bấm là vào. |
| 6 | “Bí 2 lần” để tự hiện gợi ý | **Bé bấm nút 💡 Gợi ý 2 lần trong cùng một thế** → lần sau gợi ý tự hiện. |
| 6 | Mục “ô tốt” chấm máy móc bằng gì | **Quân nhỏ không bị Tốt của máy tấn công** (định nghĩa chặt, máy kiểm được 100%). |
| 6 | Xong bảng kiểm thì làm gì ngay | **Chốt luôn + cho bé bấm “chơi tiếp ván này”** nếu muốn. |

---

## 3. Thiết kế chi tiết

### 3.1. Hai cửa vào

**(a) Chế độ thứ 3 trong tab Khai cuộc** — `Segmented` hiện có 2 chế độ, thêm chế độ thứ ba:

| value | label | icon | Ý nghĩa |
| --- | --- | --- | --- |
| `learn` | Học từng bước | 📖 | (đang có) |
| `memorize` | Luyện N bước | 🧠 | (đang có) — vẫn là nơi trao **Cúp Vàng** |
| `develop` | **Triển khai quân** | 🚀 | **MỚI** — buổi luyện của đặc tả này |

- Vào chế độ `develop` thì **bắt đầu ngay** từ thế cuối bài (không cần bấm gì thêm), nút Segmented hiện
  huy hiệu nhỏ `✓` khi bài đó đã hoàn tất bảng kiểm ít nhất một lần.
- Nhãn nút nên kèm số mục còn thiếu, ví dụ `Triển khai quân · còn 3` (giống cách nút *Luyện thuộc lòng*
  hiện `Luyện 6 bước`).

**(b) Mục trong tab Đấu với Robot** — thêm một panel **“🚀 Tập từ thế cuối bài khai cuộc”**:

- Liệt kê **cả 8 khai cuộc** (tên + emoji + GM + bên bé cầm), kèm nhãn trạng thái:
  `chưa học` · `đã học dòng sách` · `đã triển khai gọn gàng ✓`.
- Bấm một bài → mở bàn cờ **từ đúng thế cuối dòng chính của bài đó**, dùng chung buổi luyện + bảng kiểm.
- Vì `FreePlayPage` hiện **cứng** `START_FEN`, cần cho trang nhận **thế bắt đầu** (xem §4.2).
- Danh sách **không khoá** bài chưa học (bố mẹ/bé vẫn thử được), nhưng bài chưa học được xếp sau.

### 3.2. Thế bắt đầu buổi luyện (branch-aware)

- Từ tab Khai cuộc: dùng **đúng `path` bé đang đứng** trong cây (`OpeningNode[]`) — nếu bé đã rẽ sang
  nhánh phụ như `4…Bg4` thì luyện từ thế đó, **không** kéo bé về dòng chính.
  - Lưu ý kỹ thuật: `path` đã dựng sẵn `fens[ply]`, nên chỉ cần truyền FEN hiện tại + `opening.side`.
  - Nếu bé đang ở **giữa** dòng sách (chưa tới `atLeaf`) mà bấm vào chế độ `develop`: hiện một dòng
    nhắc *“Bé còn N nước lý thuyết nữa — vẫn luyện từ thế này nhé?”* và **cho phép luyện ngay**
    (không chặn), vì luyện từ thế bất kỳ là hợp lệ.
- Từ Đấu với Robot: thế cuối dòng chính = FEN của **nút lá cuối dòng chính** (`mainNodes(tree)` phần tử
  cuối) — dùng lại `mainNodes` trong `src/lib/openingTree.ts`.
- **Bé cầm bên nào theo `opening.side`**; mọi phép soi bảng kiểm phải **soi gương** tự động cho Đen
  (4/8 bài), đúng cách `BoardStage`/`ChessBoardPanel` đã xoay bàn.

### 3.3. Bảng kiểm triển khai (trái tim của tính năng)

**5 mục, giống nhau cho mọi tuổi**, mỗi mục có 3 trạng thái: `chưa đạt` (xám) · `đạt` (xanh ✓) ·
`không áp dụng` (mờ, gạch ngang, không tính vào tổng).

| # | Nhãn cho bé | Điều kiện MÁY kiểm (chính xác) | Khi nào thành “không áp dụng” |
| --- | --- | --- | --- |
| 1 | 🏰 **Nhập thành xong** | Lịch sử ván có nước nhập thành (`O-O` / `O-O-O`) **hoặc** Vua đang ở `g1/c1` (Trắng) · `g8/c8` (Đen). | Vua **đã mất quyền nhập thành** (`fen` không còn `KQ`/`kq`) mà chưa nhập thành. |
| 2 | 🐴 **Ra hết quân nhỏ** | **Không còn quân nhỏ nào của bé** đứng ở 4 ô gốc (`b1,g1,c1,f1` · `b8,g8,c8,f8`). | Không bao giờ (quân bị ăn tại ô gốc thì ô đó **trống** → vẫn tính là đạt). |
| 3 | 🛣️ **Xe kết nối / ra cột mở** | Hai Xe của bé **nhìn thấy nhau** (không quân nào chen giữa, cùng cột hoặc cùng hàng) **HOẶC** ít nhất một Xe đứng trên **cột không còn Tốt nào** (cột mở). | **Cả hai Xe đã bị ăn.** |
| 4 | 🎯 **Quân nhỏ đứng ô tốt** | **Mọi** quân nhỏ còn sống của bé **không bị Tốt của máy tấn công** (dùng `game.attackers(square, foe)` lọc lấy Tốt, hoặc kiểm bằng `isAttacked`). | Bé **không còn quân nhỏ nào**. |
| 5 | ⚖️ **Không thua quân** | Tổng giá trị quân của bé **≥** của máy (thang giá trị quân dùng chung với Mắt Thần: `PIECE_VALUES` trong `src/lib/threats.ts`). | Không bao giờ (mục này **động**: đang đỏ mà đổi lại được thì xanh lại). |

**Luật thi hành:**

- Bảng kiểm **tính lại sau mỗi nửa nước** (cả nước của bé và nước của máy) — cập nhật liên tục.
- Buổi luyện **hoàn tất** khi **tất cả mục còn áp dụng đều xanh** (mục “không áp dụng” bị bỏ khỏi mẫu số).
- Mục nào đã đạt **sẵn** ngay từ thế xuất phát (ví dụ khai cuộc kết thúc khi Vua đã nhập thành) thì
  **tick sẵn** ngay khi vào.
- Nếu **mọi** mục đã đạt sẵn từ thế xuất phát → hiện tổng kết ngay *“Thế này đã triển khai gọn gàng
  rồi!”* và **vẫn cho bé luyện tiếp** nếu muốn (xem câu hỏi mở Q4).
- Bảng kiểm **không** dùng để dạy khai cuộc: nó chỉ sống trong buổi luyện.

### 3.4. Máy đấu & luật “phạt nước dở”

- **Mức nền**: `botLevel` suy từ mini-Elo như tab Đấu với Máy (bé vẫn đổi được mức). *[suy ra từ câu trả
  lời “mạnh nhưng chỉ phạt khi ẩu” — xem Q1]*
- **Chế độ phạt (override)**: ngay sau nước của bé, nếu `findHangingPieces(game, <phía bé>)` trả về
  **ít nhất một quân bị treo** thì nước đáp của máy được tính bằng `pickMove(fen, 'hard')` — mức `hard`
  có `blunderChance = 0` nên **sẽ ăn** quân treo đó thay vì đi nước dở.
- Nước máy vẫn đi qua `useChessEngine().think(fen, difficulty)` (đã có sẵn ở `FreePlayPage`), **không**
  thêm engine mới; ở mức `master` vẫn là đường Stockfish lazy như hiện nay.
- **Không** có giới hạn thời gian, không đồng hồ (đúng §13 của spec gốc).

### 3.5. HLV: 6 trợ giúp (LUÔN bật trong buổi luyện, không theo giai đoạn tuổi)

| Trợ giúp | Cách làm (tái dùng mã có sẵn) |
| --- | --- |
| ⚠️ **Cảnh báo trước khi mất quân** | Trước khi chốt nước đi, nếu nước đó để mất quân (giá trị quân đi > giá trị thu về) → hiện hộp xác nhận *“Bé chắc chưa? Nước này mất quân đó!”*, bé phải xác nhận mới đi. **Dùng đúng cơ chế đã đặc tả ở mục “nghĩ rồi mới chạm”** (nhưng ở đây bật cho **mọi** tuổi). |
| 💡 **Tự hiện gợi ý khi “bí 2 lần”** | Đếm số lần bé bấm nút **Gợi ý** trong **cùng một thế**; lần bấm thứ 2 → gợi ý **tự hiện** và không cần bấm nữa cho tới khi thế đổi. |
| ↩️ **Lùi lại 1 nước** | Nút “Lùi lại”: hoàn tác **nước của bé + nước đáp của máy** để về đúng lượt bé (dùng `useChessGame` sẵn có). Mỗi thế chỉ lùi được **1 lần** (xem Q6). |
| ✅ **Bảng kiểm cập nhật liên tục** | Khung `#kid-develop-checklist` ngay dưới bàn cờ (hoặc cột phải), tính lại sau mỗi nửa nước. |
| 🔎 **Khung kế hoạch theo thế cờ** | **Đã có** (`#kid-live-plan`, `buildLivePlan`) — trong buổi luyện hiện ở **mọi ply** (không chờ `ply >= 10` như ở chế độ học). |
| 🤖 **Nút xem nước máy gợi ý** | Nút “Máy gợi ý gì?” → chạy `pickMove(fen, 'medium')` và hiện nước đó kèm một câu vì sao (lấy từ chính khung kế hoạch). |

- Mọi trợ giúp ở trên là **ngoại lệ có chủ ý** so với `stage.hintPolicy` (bé 16–18 tuổi vẫn được nhắc
  trong buổi luyện) → **phải ghi rõ trong README + spec gốc** để không bị “sửa lại cho nhất quán” sau này.

### 3.6. Vòng đời buổi luyện

```
[Tab Khai cuộc: chế độ 🚀 Triển khai quân]  ──┐
                                              ├──► Thế bắt đầu = FEN bé đang đứng (branch-aware)
[Đấu với Robot: chọn 1 trong 8 khai cuộc]  ──┘
        │
        ▼
  Bé đi ↔ máy đáp (máy "phạt" khi bé ẩu)
  Bảng kiểm + khung kế hoạch cập nhật liên tục
        │
        ├─ Bé xong bảng kiểm ─────────────► 🎉 TỔNG KẾT: “Đã triển khai gọn gàng!” + ⭐ + mini-Elo
        │                                     └─ nút “Chơi tiếp ván này” (bàn cờ đi tiếp bình thường)
        │                                     └─ nút “Luyện lại từ đầu” · “Về bài học”
        ├─ Máy chiếu bí bé trước ─────────► giữ tiến độ các mục đã đạt
        │                                     + “Xem nước làm mất ván” (lùi tới nước sai, tô đỏ)
        │                                     + “Làm lại từ thế đầu”
        └─ Hòa / hết nước đi ──────────────► cùng luồng như “bị chiếu bí”
```

### 3.7. Thưởng & ghi nhận

- **Sao ⭐**: hoàn tất bảng kiểm lần đầu = **4 ⭐**; luyện lại một bài đã xong = **2 ⭐** (theo đúng cách
  `addStars`/`completeActivity` đang xử lý “lần đầu / lần sau”).
- **Mini-Elo**: `recordRating('opening', true)` — **chỉ ở lần hoàn tất đầu tiên** cho mỗi khai cuộc
  (tránh cày điểm; xem Q5).
- **Hoàn thành**: `completeActivity('openings:<id>:develop', 4)` — **id mới**, tách hẳn khỏi
  `openings:<id>:memorize` (Cúp Vàng vẫn thuộc về buổi *Luyện thuộc lòng*).
- **KHÔNG** đổi: Cúp Vàng ở cuối dòng sách, thứ tự mở khoá (`useCurriculum` với suffix `:memorize`),
  huy hiệu danh hiệu.

### 3.8. Những thứ KHÔNG được đụng tới

- Dòng sách + cây §4.4 (271 nút / 24 ngã ba): **không thêm nước nào**.
- Cúp Vàng và điều kiện nhận Cúp Vàng.
- Số tab (**5 tab**) — buổi luyện là **chế độ**, không phải tab mới; LAYOUT test phải còn xanh.
- Bố cục “bàn làm việc” không-cuộn; bảng màu “Sồi & Ngọc”.
- Không thêm kho dữ liệu lớn (bài học từ vụ kho câu đố 300 MB).

---

## 4. Ràng buộc kỹ thuật & tái dùng mã

### 4.1. Mã tái dùng (không viết lại)

| Việc | Dùng lại |
| --- | --- |
| Đọc thế cờ, nước hợp lệ | `chess.js` (đã là dependency) |
| Quân bị treo | `findHangingPieces(game, side)` + `PIECE_VALUES` (`src/lib/threats.ts`) |
| Nước máy | `useChessEngine().think(fen, difficulty)` · `pickMove` · `evaluateWhite` (`src/engine/minimax.ts`) |
| Khung kế hoạch | `buildLivePlan(fen, side)` (`src/lib/livePlan.ts`) — **đã có, đừng viết bản thứ hai** |
| Ván cờ SAN + lịch sử | `useChessGame(startFen, kidSide)` (`src/hooks/useChessGame.ts`) |
| Bàn cờ + bố cục | `BoardStage({ reserve })` + `ChessBoardPanel` (chú ý chỉnh `reserve` cho chế độ mới, xem §4.4) |
| Điểm trình độ | `useRating().record/ratingOf/botLevel` |
| Sao/hoàn thành | `useKidProgress().completeActivity/addStars` |
| Cây khai cuộc | `mainNodes`, `pathToMoves`, `treeDepth`, `repliesOf` (`src/lib/openingTree.ts`) |

### 4.2. Thế bắt đầu cho `FreePlayPage`

`FreePlayPage` hiện cứng `START_FEN`. Cần một trong hai (chốt khi viết mã, ưu tiên cách 1):

1. **Route + state**: mở `/free-play` kèm `?tu=<openingId>` (hoặc state của router TanStack) → trang tự
   dựng FEN từ cây; không nhét FEN dài vào URL cho gọn đường dẫn.
2. **Nhận FEN trực tiếp**: `?fen=<fen url-encoded>` — linh hoạt hơn nhưng URL xấu và khó đọc với bố mẹ.

Trong cả hai cách: mặc định **`kidSide = opening.side`** (không phải luôn `'white'` như hiện nay) và
`difficulty` vẫn mặc định `botLevel`.

### 4.3. Nơi lưu trạng thái

- **Tiến độ/hoàn thành**: ở `useKidProgress` (`openings:<id>:develop`) — **không** tạo sổ mới.
- **Buổi luyện đang dở** (để “chơi tiếp ván này” ở cửa (b)): một khoá `localStorage` mới, đề xuất
  `hoc-vien-co-vua-nhi.develop.v1`, chứa:
  ```json
  { "openingId": "london", "startFen": "…", "moves": ["d4","d5"],
    "ticked": ["castle","minor-pieces"], "completedAt": 1759… }
  ```
  Ghi lúc kết thúc buổi luyện (thành công hoặc thất bại), đọc khi vào mục (b) để hiện nút *“luyện tiếp
  ván vừa rồi”*.

### 4.4. Bố cục (không được làm vỡ “không cuộn”)

- Chế độ `develop` nằm **trong trang Khai cuộc** → phải giữ `BoardStage reserve` hiện tại (268) hoặc
  chỉnh **có đo đạc**: bảng kiểm + nút luyện là phần tử **mới** dưới/chồng lên bàn cờ.
- Ưu tiên đặt **bảng kiểm ở cột phải** (cùng cột với khung kế hoạch) để không ăn chiều cao của bàn cờ.
- Bắt buộc: LAYOUT test phải xanh ở **cả 10 khung nhìn** với bảng kiểm đang hiện; nếu buộc phải thêm
  bố cục mới thì **thêm một lượt đo riêng cho chế độ `develop`**.

### 4.5. Định danh cho bài kiểm trình duyệt

```
#kid-develop-panel        khung bao ngoài của buổi luyện
#kid-develop-checklist    danh sách mục
#kid-develop-item-<key>   từng mục (key: castle | minor-pieces | rooks | good-squares | material)
   data-state="todo|done|na"
#kid-develop-warn         hộp cảnh báo “Bé chắc chưa? Nước này mất quân đó!”
#kid-develop-hint         gợi ý tự hiện sau 2 lần bấm
#kid-develop-summary      phiếu tổng kết khi xong bảng kiểm
#kid-develop-entry-<id>   nút chọn khai cuộc ở tab Đấu với Robot (đủ 8 nút)
```

---

## 5. Kế hoạch kiểm thử

### 5.1. Kiểm thuần (không cần trình duyệt) — `scripts/smoke-develop.ts`

`npm run check:develop`, thêm vào chuỗi `npm run check`. Các nhóm kiểm:

| Nhóm | Nội dung |
| --- | --- |
| Định nghĩa 5 mục | Mỗi mục có **thế cờ dựng tay** để chứng minh đúng/sai: chưa nhập thành → `todo`; đã nhập thành → `done`; Vua mất quyền nhập thành → `na`; 4 quân nhỏ rời ô gốc → `done`; một Tượng còn ở `c1` → `todo`; hai Xe nhìn thấy nhau → `done`; một Xe trên cột mở → `done`; Xe bị ăn cả hai → `na`; quân nhỏ bị Tốt địch tấn công → `todo`. |
| Mục “không áp dụng” | Tổng mẫu số **giảm** khi có mục `na`; hoàn tất khi mọi mục còn lại `done`. |
| Giá trị quân | Đổi quân ngang giá (Xe lấy Xe) → vẫn `done`; mất Hậu không đổi được gì → `todo`. |
| Soi gương cho Đen | Cùng một thế nhìn từ Đen phải ra kết quả tương ứng (4/8 khai cuộc bé cầm Đen). |
| Thế xuất phát từ cây | Với **cả 8 khai cuộc**: FEN của mọi nút lá (dòng chính **và** mọi nhánh) phải `load` được bằng chess.js và `evaluateDevelopment` chạy không lỗi. |
| Không-hồi-quy | `buildLivePlan` trên thế xuất phát vẫn trả kế hoạch hợp lệ (dùng lại phần đã có). |

### 5.2. Kiểm trong trình duyệt — `scripts/browser-develop-test.mjs` (cổng **9366**)

`npm run check:develop-ui`, thêm vào `check:browser` (**11 → 12 bộ**). Kịch bản:

1. Tab Khai cuộc: Segmented có **3 chế độ**; chọn 🚀 → bảng kiểm hiện với 5 mục, mục nào đã đạt thì tick sẵn.
2. Đi đúng vài nước để **tick một mục mới** (ví dụ nhập thành) và quan sát `data-state` đổi từ `todo` → `done`.
3. Cố tình để quân bị ăn → **hộp cảnh báo** `#kid-develop-warn` hiện ra; xác nhận thì nước đi được thực hiện.
4. Bấm 💡 Gợi ý **2 lần trong cùng một thế** → lần thứ hai gợi ý **tự hiện** (`#kid-develop-hint`).
5. Nút 🔊 Lùi lại: nước của bé + nước máy **cùng lùi**, về đúng lượt bé.
6. Đi tới lúc **đủ bảng kiểm** → `#kid-develop-summary` hiện + có nút “Chơi tiếp ván này”.
7. Tab Đấu với Robot: có **đủ 8 nút** `#kid-develop-entry-*`; bấm một bài → bàn cờ bắt đầu từ **thế cuối
   dòng chính của bài đó** (so FEN thật), **không** phải thế ban đầu; bé cầm đúng bên của bài.
8. Không phá cam kết cũ: thanh tab vẫn **đúng 5 tab**; Cúp Vàng vẫn chỉ xuất hiện ở chế độ *Luyện thuộc lòng*.

### 5.3. Bố cục

- Chạy `check:layout` **có** bảng kiểm đang hiện (thêm một lượt đo cho chế độ `develop`) — 10 khung nhìn
  phải còn “không tràn ngang / trang không cuộn / thấy trọn bàn cờ”.

### 5.4. Dữ liệu

- `validate-chess.ts`: **không** cần luật mới cho nước đi (không thêm dữ liệu), chỉ nên thêm một kiểm
  rẻ: **mọi nút lá của 8 cây tạo được thế cờ hợp lệ** (đã nằm trong smoke-develop §5.1).

---

## 6. Việc cần chốt thêm (câu hỏi mở — không chặn việc viết mã)

| # | Câu hỏi | Đề xuất mặc định |
| --- | --- | --- |
| Q1 | Mức nền của máy trong buổi luyện | Lấy `botLevel` (mini-Elo) như Đấu với Máy, và **override `hard` khi bé vừa để quân treo** |
| Q2 | Mục “không thua quân” cho phép kém bao nhiêu | Kém **≥ 1 điểm quân** là đỏ; bằng hoặc hơn là xanh |
| Q3 | “Quân nhỏ đứng ô tốt” có áp cho cả Hậu không | Chỉ **Mã + Tượng** (bé mới hay bỏ quên Mã/Tượng; Hậu đi đâu cũng là chuyện khác) |
| Q4 | Thế xuất phát đã đạt **hết** mục thì sao | Hiện tổng kết ngay *“đã triển khai gọn gàng”* nhưng **vẫn mở bàn cờ** cho bé chơi tiếp |
| Q5 | Luyện lại bài đã xong có cộng mini-Elo nữa không | **Không** — chỉ sao (2 ⭐), tránh cày điểm |
| Q6 | Giới hạn nút “Lùi lại” | Mỗi thế lùi được **1 lần**; tổng cộng không giới hạn |
| Q7 | Bé cầm Đen | Bảng kiểm **soi gương tự động**, không cần nội dung riêng |
| Q8 | Có thêm câu gợi ý cho ba mẹ (§10) về buổi luyện không | Thêm 1 câu: *“Đố con: vì sao Xe phải kết nối trước khi mở cột?”* |
| Q9 | Buổi luyện có hiện trong “Bản đồ chinh phục khai cuộc” không | Hiện thêm hàng trạng thái nhỏ `🚀 đã triển khai` trên bài đã xong |

---

## 7. Tiêu chí nghiệm thu

1. `npx tsc -b --force` 0 lỗi · `npx oxlint` **0 warning**.
2. `npm run check` xanh (đã thêm `check:develop`).
3. `npm run check:browser` xanh **12/12** (đã thêm `check:develop-ui`).
4. LAYOUT xanh ở **10 khung nhìn** với bảng kiểm đang hiện.
5. Vào được buổi luyện từ **cả hai cửa**; thế bắt đầu **đúng thế bé đang đứng** (kể cả nhánh phụ).
6. 5 mục bảng kiểm đúng định nghĩa §3.3, có trạng thái **“không áp dụng”**, tick sẵn mục đã đạt.
7. 6 trợ giúp của HLV hoạt động, **không** phụ thuộc giai đoạn tuổi.
8. Máy **phạt** đúng lúc bé để quân treo.
9. Xong bảng kiểm → tổng kết + ⭐ + mini-Elo (lần đầu), **không** đụng Cúp Vàng / thứ tự mở khoá.
10. Bị chiếu bí trước → **giữ tiến độ** + xem lại nước sai + làm lại.
11. Đúng **5 tab**, không tràn ngang, không cuộn dọc ở máy tính.

## 8. Ảnh hưởng tài liệu

- `README.md`: mô tả chế độ 🚀 (bảng kiểm, hai cửa vào, ngoại lệ “luôn có trợ giúp”), thêm dòng
  `check:develop` / `check:develop-ui`, cập nhật số bộ test trình duyệt.
- `gm-deep-dive-spec.md`: thêm mục **§4.7 “Luyện triển khai quân sau khai cuộc — ✅ ĐÃ LÀM”** và ghi vào
  khối **“Ràng buộc không được phá”**: *buổi luyện luôn có trợ giúp bất kể giai đoạn tuổi*.

## 9. Trạng thái repo lúc viết spec (để người làm biết điểm xuất phát)

- ✅ **§10 khung “Gợi ý cho ba mẹ”**: đã làm (`src/components/ParentTips.tsx`, `src/lib/parentTips.ts`,
  `src/store/lesson.tsx`, test `check:tips`).
- ✅ **§4.4 mức 3 — kế hoạch sinh từ engine**: đã làm (`src/lib/livePlan.ts` + khung `#kid-live-plan`,
  `scripts/smoke-plan.ts`, phần tương ứng trong `browser-arrow-test.mjs`). Nay đã xác nhận xanh -
  `browser-opening-tree-test.mjs` và `check:tree` đã bị xoá cùng cây khai cuộc phân nhánh.
- ✅ Đã bỏ tính năng: kho câu đố Lichess · ván kỳ thủ hiện đại (`/gm-games`) · tab Ôn tập (`/review`),
  cùng mini-Elo, cây khai cuộc phân nhánh và bài giảng GM → **README và `gm-deep-dive-spec.md` đã
  được cập nhật theo (2026-10-03)**.
- ➡️ Vì vậy buổi luyện mới sẽ là **nội dung trung cuộc đầu tiên** của app sau khi dọn bớt.
