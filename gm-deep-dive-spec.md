# Đặc tả: Deep dive GM — còn thiếu gì, cần bỏ gì, cần thêm gì

> **Trạng thái**: ĐẶC TẢ ĐÃ CHỐT (chưa viết mã). Soạn sau 8 vòng phỏng vấn với chủ dự án;
> **toàn bộ câu hỏi mở ở §11 đã được chốt** — không còn điểm mở nào.
> **Ngày**: 2026-10-01 (chốt câu hỏi mở lần cuối cùng ngày 2026-10-01)
> **Dự án**: Chơi cờ Vua cùng Nam An (`/Users/pavnguyen/Downloads/tonyChess`)
> **Đối tượng**: bé trai 7 tuổi (chơi ở nhà, chưa thi đấu giải), app do bố làm.

---

## 0. Nguyên tắc gốc (đã chốt)

1. **Cả hai mục tiêu, nhưng phải tự chuyển theo tuổi**: bé nhỏ thì vui là chính, lớn dần tự
   chuyển sang chế độ luyện nghiêm túc. Cơ chế chuyển đã có sẵn trong `src/lib/stages.ts`.
2. **Được phép cắt thẳng**, kể cả thứ đã làm kỹ. Ưu tiên dọn dẹp **trước khi** thêm mới.
3. **100% offline, không tài khoản, không server.** Mọi tiến độ nằm trong `localStorage`.
4. **Chống nghiện**: không streak, không phần thưởng ngẫu nhiên, không thông báo giục học.
   Chỉ thưởng cho thành tích thật và đo được.
5. **Làm theo nhiều giai đoạn nhỏ**, mỗi giai đoạn dùng được ngay, có test trình duyệt trước khi
   sang giai đoạn sau.
6. Không thêm cơ chế giữ chân kiểu mạng xã hội. Không có "năng lượng", không có "vé chơi".

---

## 1. Kiểm kê hiện trạng (số liệu đo thật, 2026-10-01)

### Nội dung đang có

| Loại | Số lượng | Ghi chú |
| --- | --- | --- |
| Khai cuộc | 8 dòng | London (Carlsen), Ý (Wesley So), King's Indian (Nakamura), Sicilian (Kasparov), Ruy López (Fischer), Gambit Hậu (Polgár), Pháp (Botvinnik), Caro-Kann (Petrosian) |
| Trung cuộc | 20 câu đố / 7 họ đòn | fork 4, pin 4, skewer 4, discovered 2, double-check 2, back-rank 2, smothered 2 |
| Tàn cuộc | 8 thế | 2 phong Hậu + 6 chiếu bí cơ bản |
| Bài giảng GM | 4 | Đòn bẩy Carlsbad, Phòng thủ dự phòng, Lucena, Philidor |
| Cấu trúc Tốt | 3 | Tốt Thông, Tốt Chồng, Tốt Cô lập |
| Cấp bậc ⭐ | 4 mức | Kỳ thủ Nhí @0 → Tập sự Cờ vua @8 → Kiện tướng Nhí @20 → Grand Master Nhí @40 |

### Tab hiện có (5)

`/` Khai cuộc · `/tactics` Trung cuộc · `/endgames` Tàn cuộc · `/strategy` Chiến lược GM · `/free-play` Đấu với Máy

### Mã đã viết nhưng **CHƯA nối vào giao diện**

| File | Dòng | Test | Tình trạng |
| --- | --- | --- | --- |
| `src/lib/review.ts` | 125 | `smoke-review.ts` (17 kiểm tra ✓) | **Chết**: chỉ được import bởi chính test của nó |
| `src/lib/stages.ts` | 221 | `smoke-stages.ts` (43 kiểm tra ✓) | **Chết**: chỉ được import bởi chính test của nó |

### Hạ tầng engine & kỹ thuật

- `src/engine/minimax.ts`: negamax + alpha-beta + piece-square table. **Có `evaluateWhite(game)`**
  (chấm điểm thế cờ) nhưng mới dùng nội bộ. 3 mức cố định: `easy | medium | hard`.
- **Mâu thuẫn cần sửa**: `stages.ts` có `botLevel: 'master'` cho giai đoạn 16-18, nhưng
  `Difficulty` của engine **không có** `'master'`.
- **Không có**: PGN, đồng hồ (ngoài "đua 30 giây"), điểm trình độ, xem lại ván, phân tích.
- Bundle hiện tại: `index` 16.55 kB · `vendor-react` 206.83 · `vendor-chess` 119.51 ·
  `vendor-tanstack` 107.88 · các trang 6-19 kB (lazy-load theo tab).

### Kiểm tra tự động đang có

- `npm run check`: dữ liệu cờ (validate-chess, có chứng minh bản chất từng đòn) + logic +
  review + stages + engine → **195 ✓**.
- `npm run check:browser`: **11 bộ** (ENGINE · ARROW · LEARN-DRAG · HINT-DRAG · STRATEGY-DRAG ·
  STOCKFISH · GM-GAMES · OPENING-TREE · PARENT-TIPS · THEME · LAYOUT).
- LAYOUT quét **5 route × 8 khung nhìn** (1440×900 → 390×844), kiểm tra: không tràn ngang,
  không cuộn dọc, thấy trọn khối bàn cờ, bàn cờ đủ lớn.

### Ràng buộc đã thiết lập, KHÔNG được phá

- Banner **3 phần bắt buộc** dưới bàn cờ ở mọi nước: `[tên nước + tên quân] + [lý do 1 câu] + [vè]`.
- Bố cục "bàn làm việc": bàn cờ luôn lớn, không phải cuộn; biến thể `stage` cho màn hình rộng.
- Bảng màu "Sồi & Ngọc" (xanh rừng + ngà + vàng đồng), bàn cờ `#2f6b4f` / `#ffffff`.
- Đổi ký hiệu **2 kiểu** (hình cờ + quốc tế `♘Nf3` / Việt `Mf3`, M,T,X,H,V); tự xoay bàn cờ cho
  bài Đen. Tuýp "chuẩn quốc tế thuần" (`Nf3`) đã bỏ - `♘Nf3` đã chứa sẵn ký hiệu đó.
- Bảng đối chiếu ký hiệu trong ⚙️ phải đủ để đọc trọn biên bản: tên 6 quân **và** ký hiệu đặc biệt
  (`O-O`, `O-O-O`, `+`, `#`, `x`, `=`, `e.p.`, `!`, `?`, `1-0`, `0-1`, `½-½`).
- Khung **“Gợi ý cho ba mẹ”** phải có mặt ở **mọi tab**, thu gọn được (nhớ trạng thái), và **không
  được** phá bố cục không-cuộn (`npm run check:tips` + LAYOUT).
- Mọi thay đổi phải giữ `tsc` 0 lỗi, `oxlint` **0 warning**, `npm run check` xanh (dữ liệu/logic),
  **11/11** bộ test trình duyệt xanh.

---

## 2. PHÂN TÍCH: còn thiếu gì (góc nhìn GM hiện đại + nhà giáo dục + kỹ sư)

Xếp theo mức thiếu hụt, đối chiếu với cách một kỳ thủ trẻ thật sự tiến bộ.

### 2.1. Thiếu nặng nhất

| # | Thiếu gì | Vì sao đây là lỗ hổng thật |
| --- | --- | --- |
| M1 | **Tính toán & tưởng tượng (nhìn trước nhiều nước)** | Toàn bộ app là "1 nước là xong". Cờ vua thật quyết định ở chuỗi 3-5 nước. Không có gì luyện "nhìn xa" thì bé mãi chỉ giỏi đố mẹo. |
| M2 | **Chiến lược vị trí** | 20/20 câu đố là chiến thuật. Không dạy ô yếu, tiền đồn, cột mở, cặp Tượng → bé không biết *làm gì* khi không có đòn ăn quân. |
| M3 | **Khai cuộc thực chiến (cây nước + kế hoạch)** | 8 dòng hiện tại là học thuộc một chiều. Đối thủ thật không đi theo sách → bé sụp đổ ở nước thứ 5. |
| M4 | **Tàn cuộc lý thuyết Xe+Tốt** | Lucena/Philidor chỉ có dạng kịch bản; thiếu pháo đài, hòa cờ chủ động, "đếm nước". Tàn cuộc là chỗ bé 1200 ăn được bé 1400. |
| M5 | **Xem lại ván của chính mình** | Đấu xong là hết. Không biết mình sai ở đâu thì không sửa được gì. |
| M6 | **Điểm trình độ & chọn bài vừa sức** | Độ khó cố định → bé giỏi thấy chán, bé yếu thấy nản. |

### 2.2. Thiếu về mặt "thói quen suy nghĩ"

- Không dạy **thứ tự suy nghĩ chuẩn**: *nước đối thủ định làm gì → nước mình làm được gì*.
- Không dạy **kiểm tra trước khi đi**: quân mình có bị treo không, đối thủ có nước hiểm không.
- Hiện app đang **quá rộng rãi**: bấm thử liên tục, kéo sai thì trả quân về, không có gì tạo thói quen
  "nghĩ rồi mới chạm quân".

### 2.3. Thiếu về mặt "có gì để học tới 18 tuổi"

- Nội dung viết tay chỉ ~43 thế cờ → vài tháng là hết.
- Không có **kho luyện tập lớn** để luyện hàng năm.
- Không có **học từ ván của kỳ thủ thật** — cách học kinh điển mà mọi HLV dùng.

### 2.4. Những thứ đang có mà **đi ngược** với việc học

| # | Thứ đang có | Vì sao có hại về lâu dài |
| --- | --- | --- |
| H1 | **Đua tốc độ 30 giây** (tab Khai cuộc + Chiến lược) | Dạy bé *đi nhanh*, đúng thứ phải tránh. Trẻ con học cờ hay hỏng vì đi ẩu. |
| H2 | Sau khi giải đúng cho **đối thủ đi ngẫu nhiên** (tab Trung cuộc) | Đi tiếp với máy ngẫu nhiên không dạy được gì, còn tạo cảm giác "thắng dễ". |
| H3 | **Vè 4-6 chữ ở giai đoạn lớn** | 15 tuổi mà còn đọc vè thì app tự hạ thấp bé. |
| H4 | **Mắt Thần + cảnh báo quân treo bật sẵn mọi lúc** | Thành cái nạng: bé lớn vẫn cần tô màu mới thấy quân treo. |
| H5 | **Câu đố 1 nước quá dễ** | Sau vài tuần là vô dụng, còn chiếm chỗ nội dung thật. |
| H6 | **Pháo hoa/huy chương mỗi lần đúng** | Nhàm dần; phần thưởng mất giá trị. |

### 2.5. Thứ **không** cần làm (đã cân nhắc và loại)

- Đấu online / tài khoản / server.
- Đồng hồ thi đấu, ghi biên bản, luật chạm quân: **bé chưa thi đấu giải** → chưa cần.
- Chế độ 2 người chung máy (pass-and-play): không được chọn.
- Luyện "tầm nhìn bàn cờ" (màu ô, nhắm mắt): không được chọn.
- Báo cáo tuần cho bố mẹ, giới hạn thời gian mỗi ngày: không được chọn.
- Streak / nhắc học hằng ngày: **cố tình loại bỏ**.
- Giữ nguyên **bài giảng Lucena 7 bước** (không nằm trong danh sách cắt).

---

## 3. CÁC QUYẾT ĐỊNH ĐÃ CHỐT (nguyên văn lựa chọn của chủ dự án)

| Chủ đề | Quyết định |
| --- | --- |
| Mục tiêu | Cả hai, tự chuyển theo tuổi, dùng `stages.ts` |
| Cắt bớt | Được phép cắt thẳng, kể cả thứ đã làm kỹ |
| Kiến trúc | 100% offline, không tài khoản |
| Ưu tiên | Cả ba: nối mảnh còn dở + thêm chiều sâu cờ vua + dọn dẹp |
| Kỹ năng thiếu cần bù | Tính toán · Chiến lược vị trí · Khai cuộc thực chiến · Tàn cuộc lý thuyết |
| Máy đấu | **Cả hai**: thang Elo + chế độ "đối thủ biết mắc lỗi" |
| Nguồn câu đố | **Trộn**: tay viết cho bài giảng, Lichess CC0 cho phần luyện |
| Xem lại ván | Có; chỉ cho bé thấy sai ở đâu bằng lời đơn giản; **hiện ngay sau ván, tối đa 3 lỗi** |
| Thói quen nghĩ | ① "Nước đối thủ định làm gì → nước mình làm gì" ② "Kiểm tra quân treo / nước hiểm trước khi đi" |
| Cách cắt | **Xoá hẳn khỏi mã** (kể cả mã đua tốc độ 30 giây) |
| Mắt Thần theo tuổi | Tắt sẵn từ 10 · Từ 13 chỉ hiện khi bấm "Kiểm tra" rồi tự mất sau vài giây · **Bỏ hẳn cảnh báo quân treo ở giai đoạn lớn** (chỉ giữ 7-9) |
| Kho câu đố | **~1.000 câu** theo chủ đề + độ khó, tải theo gói chủ đề |
| Điểm trình độ | **Cả điểm tổng và điểm từng dạng đòn** |
| Giải sai | **Không trừ điểm** — sai chỉ là chưa tính là đúng |
| Khung bố mẹ | **Góc dưới bên phải, hiện ở MỌI tab, thu gọn được** |
| Đáp án "đoán nước" | **Nước kỳ thủ = 1 điểm, nước máy mạnh hơn = 2 điểm** |
| Pháo hoa | Giữ cho bé 7-9, **tắt hẳn từ 10 tuổi** |
| Thang ⭐ | **Giữ như huy chương sưu tầm**; điểm trình độ lo việc chọn bài |
| Hiện điểm cho bé | **Tên cấp độ** cho bé, **số Elo ẩn trong phần bố mẹ** |
| Engine | **Cả hai**: engine JS cho luyện nhanh, **Stockfish WASM chỉ tải khi cần phân tích** |
| Ván kỳ thủ | **Ván hiện đại** (Carlsen, Kasparov, Nakamura), hợp với khai cuộc đang có |
| Thi đấu thật | Chưa — mới chơi ở nhà và trên app |
| Phân giai đoạn | Nhiều giai đoạn nhỏ, mỗi giai đoạn dùng được ngay |
| Chống nghiện | Tránh hết: không streak, không phần thưởng ngẫu nhiên |
| Giai đoạn làm trước | **Dọn dẹp & cắt bớt trước** |
| Câu đố 1 nước dễ | **Không xoá hẳn**: giữ **1 câu/họ đòn** cho bé mới, gọi là **"Khởi động"** và **không tính điểm**; phần còn lại chuyển vào kho luyện tập (§0.5) |
| Kho câu đố đóng gói | **Sinh lúc build + commit bản đã lọc** (app 100% offline, build không cần mạng; §4.1) |
| Giải thích câu luyện thêm | **Mẫu tự sinh + nước đi** (không vè riêng); nhãn rõ "bài luyện thêm" |
| Stockfish WASM | **Chấp nhận GPL-3**, ghi chú hệ quả trong README (§3.2) |
| `autoReply` | **Xoá hẳn khỏi mã** (thay bằng `pickMove`) |
| Điểm khởi đầu | **500** (để bé thấy tiến bộ nhanh); **không cần nút đặt lại** (§2.1) |
| Tên cấp độ bé thấy | **Mầm cờ → Biết đi cờ → Chơi chắc tay → Đánh sắc bén → Cao thủ nhí** (§2.1) |
| Thanh tab | **6 tab**: thêm **"Ôn tập"** (`/review`); **xem lại ván nhúng trong "Đấu với Máy"** (§1.1, §9.3) |

---

## 4. GIAI ĐOẠN 0 — DỌN DẸP (làm trước tiên)

Mục tiêu: bỏ hết thứ đi ngược với việc học **trước khi** xây thêm. Mỗi mục đều phải xoá mã và
xoá cả test liên quan (không để mã chết).

### 0.1. Xoá "Đua tốc độ 30 giây"

- `src/pages/OpeningsPage.tsx`: xoá chế độ `speed` khỏi `MODES`, xoá `startSpeedRun`, `running`,
  `secondsLeft`, `speedScore`, `awardedRef`, `countdownRatio`, khối HUD đếm ngược, và nhánh
  `mode === 'speed'` trong `interactive`.
- `src/pages/StrategyPage.tsx`: xoá `SPEED_RUN_SECONDS`, `TROPHY_MS`, `run` state, đồng hồ
  `setInterval`, `startRun`, `afterMove` (phần tính giờ), panel "🚀 Đua tốc độ 30 giây", và nút
  "🚀 Đua 30 giây".
- Gỡ **toàn bộ** mã `Confetti` gắn với đua tốc độ (không gỡ `Confetti` chung — xem 0.5).
- Cập nhật README: bỏ mọi đoạn nói về đua tốc độ.

### 0.2. Xoá "đối thủ đi ngẫu nhiên sau khi giải đúng"

- `src/pages/TacticsPage.tsx`: xoá effect `phase === 'solved'` → `board.autoReply()`. Giải xong
  thì **dừng ván**, chỉ hiện lời khen + nút "Câu tiếp theo".
- `src/pages/EndgamesPage.tsx`: hiện đang cho Vua Đen đi ngẫu nhiên (`board.autoReply()`) — thay
  bằng **đi theo engine mức thấp** (dùng `pickMove(fen, 'easy')`) để nước đáp trả vẫn có ý nghĩa.
  *(Đây là thay đổi hành vi, cần cập nhật `browser-hint-drag-test.mjs`: test đang chờ bộ đếm
  nước 0 → 2 sau khi bé kéo, mà trước đó cần bé đi 2 nước.)*
- `src/hooks/useChessGame.ts`: **xoá hẳn `autoReply`** (đã chốt) sau khi mọi tab đã chuyển sang
  engine. Đảm bảo không còn import/định nghĩa `autoReply` trong `src/`.

### 0.3. Mắt Thần & cảnh báo quân treo theo tuổi

Dùng `stages.ts` (sau khi đã nối — hoặc dùng mặc định `nhi` nếu 0.3 làm trước giai đoạn 2):

| Giai đoạn | Mắt Thần | Cảnh báo quân treo |
| --- | --- | --- |
| 7-9 (Nhí) | Bật sẵn | Bật sẵn |
| 10-12 (Thiếu nhi) | **Tắt sẵn**, bé tự bật | Tắt sẵn, bé tự bật |
| 13-15 (Thiếu niên) | Nút đổi thành **"🔍 Kiểm tra"**: bấm thì mới hiện, **tự mất sau ~3 giây** | **Không còn** |
| 16-18 (Trưởng thành) | Như trên | Không còn |

- Đổi nút trong `src/components/EyeToggle.tsx` thành hai biến thể: bật/tắt vĩnh viễn (Nhí) và
  "Kiểm tra" (tự tắt sau vài giây).
- `src/components/HangingWarnings.tsx`: tự ẩn ở giai đoạn ≥ Thiếu niên.

### 0.4. Vè 4-6 chữ & pháo hoa theo tuổi

- Vè: đã có `showRhyme` trong `stages.ts`; nối vào `ExplanationBanner` — từ 13 tuổi thay ô vè
  bằng ô **"Nguyên tắc"** (một câu nguyên tắc cờ vua cùng chỗ). Cần thêm trường `principle` vào
  dữ liệu (xem 3.2).
- Pháo hoa: `Confetti` chỉ render khi `stage.id === 'nhi' || stage.id === 'thieu-nhi'`.

### 0.5. Câu đố 1 nước quá dễ — CHỐT: phân tầng, KHÔNG xoá hẳn — ✅ ĐÃ LÀM

**Quyết định đã chốt** (thay cho đề xuất cũ):

- **Giữ lại mỗi họ đòn 1 câu dễ**, gắn nhãn **"Khởi động"** và **không tính điểm** vào mini-Elo
  (§6). Đây là bài đầu tiên cho bé 7 tuổi mới học — vẫn cần có.
- **Chuyển phần còn lại của 20 câu vào kho luyện tập** (thêm nhãn chủ đề để gom nhóm), KHÔNG
  xoá khỏi `src/data/tactics.ts` — vẫn dùng được cho bé nhỏ và cho huy hiệu ⭐.
- Trong UI: câu "Khởi động" hiện ở đầu mỗi họ đòn, có huy hiệu nhỏ; các câu khác xếp sau theo
  độ khó. Không có huy hiệu "tính điểm" cho câu Khởi động.
- ✅ **Đã làm**: thêm cờ `warmup?: boolean` vào `TacticPuzzle` (`src/types.ts`), gắn cho
  `fork-1, pin-1, skewer-1, discovered-1, double-check-1, back-rank-1, smothered-1`. Tab Trung cuộc
  hiện huy hiệu **🌱 Khởi động** và **bỏ qua `recordRating`** cho câu này (vẫn ghi lịch ôn tập).
  `validate-chess.ts` kiểm "mỗi họ đòn đúng 1 câu Khởi động".

### 0.6. Dọn mã chết & sửa mâu thuẫn

- **`autoReply`: XOÁ HẲN khỏi `src/hooks/useChessGame.ts`** (đã chốt). Mọi chỗ từng gọi
  `autoReply()` đều đổi sang đi theo engine mức thấp (`pickMove(fen, 'easy')`) ở 0.2. Không giữ
  lại cho Free Play — tab "Đấu với Máy" dùng thẳng `pickMove` với thang khó.
- Xoá biến/hằng không còn dùng sau khi cắt.
- Sửa mâu thuẫn `botLevel: 'master'`: **bổ sung mức `master` cho engine** (§3.1). Giữ nguyên
  `stages.ts` với `'master'` thay vì hạ xuống `hard`.

### Tiêu chí nghiệm thu giai đoạn 0

- `oxlint` 0 warning, `tsc` 0 lỗi, `npm run build` OK.
- Không còn chuỗi `Đua tốc độ`, `speed`, `secondsLeft` trong `src/`.
- `npm run check` và `npm run check:browser` **vẫn xanh** (đã cập nhật các test bị ảnh hưởng).
- Trang Khai cuộc & Chiến lược **không cuộn nội bộ** ở cả 8 khung nhìn (đã đạt: 0px và 7px → mục
  tiêu 0px).

---

## 5. GIAI ĐOẠN 1 — NỐI HAI MẢNH ĐÃ CÓ

### 1.1. Ôn tập ngắt quãng (`review.ts` → UI)

- Tạo `src/store/review.tsx`: provider đọc/ghi `localStorage` khoá `hoc-vien-co-vua-nhi.review.v1`,
  dùng đúng API đã có trong `src/lib/review.ts` (`recordAttempt`, `dueItems`, `summarizeDeck`).
- Thêm **tab thứ 6: "Ôn tập"** (`/review`) — hiển thị `dueItems` (tối đa `REVIEW_SESSION_SIZE` = 6
  câu/buổi), huy hiệu đỏ trên tab khi có câu tới hạn.
- Nguồn thẻ: câu đố Trung cuộc, thế Tàn cuộc, bài giảng GM (khoá `reviewKey('tactic', id)` v.v.).
- Ghi kết quả: mọi lần giải đúng/sai ở các tab hiện có gọi `recordAttempt`.
- Lưu ý kiến trúc: `reviewStepsFor(stage)` cắt lịch còn 3 nấc cho bé Nhí (đã có sẵn hàm).

### 1.2. Lộ trình 7→18 (`stages.ts` → UI)

- `src/store/progress.tsx`: thêm `stageId` + `birthYear` vào `Persisted`; mặc định suy ra bằng
  `suggestedStage({ birthYear })` (app tự "lớn" theo thời gian).
- Bố mẹ chọn trong phần tuỳ chọn (`HeaderOptions`): nhập **năm sinh** hoặc chọn tay giai đoạn, kèm
  công tắc `unlockAll` đã có.
- Nối `notation` mặc định theo giai đoạn (`stages.ts` → `notation`): Nhí = hình quân cờ, ≥10 tuổi =
  chuẩn quốc tế. **Chỉ áp làm mặc định lần đầu**, không ghi đè lựa chọn của bé.
- Hiển thị tên giai đoạn + `focus` + `promotion` ở đâu đó dễ thấy (đề xuất: panel đầu cột phải
  trang Khai cuộc).

### Tiêu chí nghiệm thu giai đoạn 1

- Tab Ôn tập hoạt động: giải đúng 1 câu → câu đó biến khỏi danh sách tới hạn, hẹn lại sau 1 ngày.
- Đổi năm sinh → giao diện đổi theo (vè tắt ở 13+, Mắt Thần tắt sẵn ở 10+).
- Test trình duyệt mới: `browser-review-test.mjs` (ôn tập) + `browser-stage-test.mjs` (đổi giai đoạn
  làm đổi UI, kiểm tra bằng DOM).

---

## 6. GIAI ĐOẠN 2 — ĐIỂM TRÌNH ĐỘ (mini-Elo) — ✅ ĐÃ LÀM

### 2.1. Mô hình

- `src/lib/rating.ts` (logic thuần, `scripts/smoke-rating.ts` 55 kiểm tra):
  - `RatingBook = { overall: number; byTheme: Record<string, number>; history: {t:number; theme:string; delta:number}[] }`
  - Điểm khởi đầu cho bé mới: **500** (đã chốt — để bé thấy tiến bộ nhanh; không hiện số cho bé).
  - **Không có nút "Đặt lại điểm"** trên giao diện bé: điểm chỉ tăng, không bao giờ giảm khi sai.
  - Công thức: Elo rút gọn, K = 24 cho bé nhỏ (`K_YOUNG`), 32 từ 13 tuổi (`K_TEEN`).
    `expected = 1 / (1 + 10^((độ khó câu - điểm)/400))`, cập nhật `điểm += K * (kết quả - expected)`.
  - **Không trừ điểm khi sai**: kết quả sai tính là 0 nhưng điểm bị chặn không cho giảm
    (`điểm = max(điểm, round(điểm_mới))`). Sai chỉ làm **chậm** tiến bộ.
  - Độ khó câu đố quy đổi cố định: `DIFFICULTY_RATINGS = { easy: 450, medium: 600, hard: 750 }`
    (`suggestedDifficulty(rating)` chọn mức gần `rating + 60` nhất để luôn hơi trên sức).
  - Nhật ký điểm giữ tối đa `HISTORY_LIMIT = 200` lần gần nhất.
- Hiển thị:
  - **Bé thấy tên cấp độ** suy từ `overall` (5 mức, đã chốt, ngưỡng trong `LEVELS`):
    **Mầm cờ 🌱@0 → Biết đi cờ ♟️@550 → Chơi chắc tay 💪@700 → Đánh sắc bén ⚡@850 → Cao thủ nhí 👑@1000**.
  - **Bố mẹ thấy số Elo** trong khung bố mẹ (§9).
  - **Điểm từng dạng đòn** hiển thị dạng thanh nhỏ trong tab Trung cuộc, kèm gợi ý dạng yếu nhất
    (`weakestTheme`) - đã làm trong `TacticsPage`.
  - Lưu bền trong `localStorage` (`hoc-vien-co-vua-nhi.rating.v1`) qua `src/store/rating.tsx`,
    nằm trong `RatingProvider` (đọc tuổi từ `KidProgressProvider` để chọn hệ số K).
  - Ghi điểm ở: Trung cuộc (theme = loại đòn), Tàn cuộc (`endgame`), Khai cuộc (`opening`),
    Chiến lược (`strategy`).

### 2.2. Dùng điểm để chọn bài

- Tab Trung cuộc: hiện thanh điểm từng họ đòn + gợi ý dạng yếu nhất (`weakestTheme`);
  độ khó câu tự suy từ điểm (`suggestedDifficulty`).
- Tab Đấu với Máy: `suggestedBotLevel(rating)` chọn mặc định mức máy phù hợp
  (<550 Dễ, <750 Vừa, <950 Khó, còn lại Siêu) - bé vẫn đổi được.
- **Giữ thang ⭐ như huy chương sưu tầm** (Không đổi ngưỡng 0/8/20/40 nếu không cần).

### Tiêu chí nghiệm thu

- Smoke test thuần: điểm tăng khi giải đúng, **không bao giờ giảm khi giải sai**, hội tụ quanh độ
  khó thật sau N câu.
- Chrome: sau khi giải 5 câu, thanh điểm dạng đòn đổi; đổi điểm ảo (fake clock) để kiểm tra chọn bài.

---

## 7. GIAI ĐOẠN 3 — ENGINE — ✅ MỘT PHẦN ĐÃ LÀM

### 3.1. Engine JS hiện có — mức & chọn nước (✅ ĐÃ LÀM)

- Đã bổ sung mức `master` (depth cao hơn `hard`) để hết mâu thuẫn với `stages.ts`.
- Chọn nước có "đi bừa" thay vì `humanBlunderRate` tường minh: `blunderChance` (Dễ 0.35, Vừa 0.08)
  cộng `epsilon` (chọn ngẫu nhiên trong nhóm nước gần bằng điểm nhất) - cùng mục đích: bé có cơ hội
  thắng và học cách trừng phạt lỗi.
- ✅ **Tìm kiếm "yên tĩnh" (quiescence)** cho mức Khó/Siêu (`EngineConfig.quiescence`): sau khi hết
  độ sâu, chỉ xét tiếp các nước ăn quân/ phong cấp cho tới khi thế cờ yên. Nhờ vậy máy **không còn
  treo quân vì "chân trời"** (horizon effect). Dễ/Vừa cố tình TẮT để vẫn mắc lỗi.
  Kiểm bằng `scripts/smoke-engine.ts` (bẫy "Tốt độc": máy Khó/Siêu từ chối `Qxd5`).

### 3.2. Stockfish WASM — tải theo nhu cầu (lazy) — ✅ ĐÃ LÀM

- **Đã nối vào mức "Siêu" của tab Đấu tập tự do** (không chỉ phân tích/xem lại).
- Bản dùng: **`stockfish-19-lite-single`** (~1.8 MB). Vì sao: bản đầy đủ 99 MB tải quá lâu, bản
  lite-single **không cần header COOP/COEP** (chạy được trên hosting tĩnh như Vercel), và vẫn mạnh
  hơn người chơi rất nhiều.
- Tệp tĩnh ở `public/stockfish/`, chép bằng `npm run setup:engine` (tự chạy ở `predev`/`prebuild`).
- Nạp động trong `src/engine/stockfishLoader.ts`: `new Worker(...)` chỉ tạo ở lần dùng đầu, giữ lại
  sau đó (cache), và **nối tiếp** các yêu cầu để hai lệnh `go` không chồng nhau.
- Có nhánh dự phòng: Stockfish không tải được / quá hạn / worker chết → tự động dùng engine JS
  (`pickMove`) - app không bao giờ vỡ.
- ⚠️ **Giấy phép — ĐÃ CHỐT: chấp nhận GPL-3.0**. App hiện là riêng tư nên dùng bình thường;
  **nếu sau này mở mã nguồn hoặc phát hành**, toàn bộ app phải theo GPL-3 → **ghi chú rõ hệ quả
  này trong README** và giữ đúng phần ghi nguồn/giấy phép của Stockfish.
- Có nhánh dự phòng: Stockfish không tải được → tự động dùng `evaluateWhite` của engine JS
  (phân tích thô hơn nhưng app không vỡ).

### Tiêu chí nghiệm thu

- Bundle chính **không tăng quá 5 kB**; tham chiếu Stockfish chỉ nằm trong chunk lười
  `FreePlayPage` và tệp `dist/stockfish/*` (kiểm bằng `grep` + `scripts/browser-stockfish-test.mjs`).
- ✅ `scripts/browser-stockfish-test.mjs` mở Worker thật trong Chrome, chạy `uci → go depth 12`,
  xác nhận trả `bestmove` hợp lệ kèm dòng `info`.
- Chơi được khi chặn mạng hoàn toàn (fallback về engine JS).

---

## 8. GIAI ĐOẠN 4 — NỘI DUNG MỚI

### 4.1. Kho câu đố ~1.000 câu từ Lichess CC0 — ✅ ĐÃ LÀM (pipeline + UI; dữ liệu chờ chạy 1 lần có mạng)

- **Dữ kiện đã kiểm chứng**: kho câu đố Lichess phát hành theo **CC0 (public domain)** — hơn 6 triệu
  câu, có sẵn **điểm số và nhãn chủ đề**, tải dạng CSV. Nguồn: `database.lichess.org` và bản CSV
  trên Kaggle (`lichess/chess-puzzles`, ~55 MB, cập nhật hằng tháng).
- Pipeline: `scripts/build-puzzles.mjs`
  1. Tải CSV Lichess (ngoài repo, không commit).
  2. Lọc theo: số nước 2-4 (không phải 1 nước — xem 0.5), điểm trong khoảng 600-1800, có nhãn
     chủ đề mà app đang dạy (`fork`, `pin`, `skewer`, `discovered attack`, `double check`,
     `back rank mate`, `smothered mate`) + một số nhãn mới (mate in 2/3, deflection, overloading).
  3. Chuẩn hoá về type của app, **bỏ câu không có FEN hợp lệ** (kiểm bằng chess.js ngay trong script).
  4. Ghi ra `src/data/puzzlePacks/<theme>.json`, mỗi gói vài KB-100 kB.
- **Đóng gói — ĐÃ CHỐT: sinh lúc build + commit bản đã lọc**. Script `build-puzzles.mjs` chạy tay,
  kết quả `src/data/puzzlePacks/<theme>.json` **commit vào repo** (repo nặng thêm ~1-2 MB). Lý do:
  app phải chạy **100% offline** và build/CI **không được phụ thuộc mạng**; CSV Lichess ~55 MB chỉ
  tải ngoài repo khi chạy script lọc.
- **Lời giải thích tiếng Việt — ĐÃ CHỐT: mẫu tự sinh + nước đi** (không vè riêng). Lichess không có
  nhãn tiếng Việt, không khả thi viết tay 1.000 câu → bài tập luyện thêm dùng **lời giải thích ngắn
  theo MẪU** (ví dụ: *"Đòn đôi: Mã vừa ăn quân, lại tấn công Vua."*) + chuỗi nước đi, luôn gắn nhãn
  **"bài luyện thêm"** để phân biệt với **"bài giảng"** viết tay có vè riêng.
- ✅ **Đã làm**:
  - `scripts/build-puzzles.mjs`: tải `.cache/` (đã gitignore) → giải nén **theo luồng** bằng
    `node:zlib` `createZstdDecompress` → lọc điểm 600-1800, lời giải 2-4 nửa nước, Popularity ≥ 70,
    NbPlays ≥ 200, đủ 7 họ đòn (ánh xạ nhãn Lichess → loại đòn của app, có thứ tự ưu tiên) → **kiểm
    từng câu bằng chess.js** → chọn **cách quãng theo từng khung 100 điểm** (không dồn vào mấy câu
    đầu) → ghi `src/data/puzzlePacks/<theme>.json` (chỉ dữ kiện: FEN, chuỗi nước SAN, điểm,
    `mateIn`). Có tuỳ chọn `--from` / `--out` / `--limit` / `--no-download` để chạy offline.
  - `src/data/puzzlePacks/index.ts`: nạp gói bằng **`import()` động** (Vite tách chunk riêng, không
    làm nặng trang Trung cuộc), **sinh lời giải thích + khẩu quyết theo MẪU** cho từng loại đòn,
    `randomPuzzleFromPack` ưu tiên câu quanh mức điểm của bé và tránh lặp câu vừa làm.
  - Panel **"🏋️ Bài luyện thêm"** trong tab Trung cuộc: nhãn "bài luyện thêm", câu luyện **không
    cộng sao** nhưng vẫn ghi vào **điểm trình độ** và **sổ ôn tập**; gói trống thì báo đúng câu lệnh
    cần chạy.
  - `scripts/smoke-puzzles.mjs` (`npm run check:puzzles`): chạy pipeline trên một CSV nhỏ tự soạn để
    chứng minh bộ lọc loại đúng câu hỏng (FEN sai, nước sai, điểm ngoài khoảng, câu 1 nước) và đọc
    đúng `mateInN`; đồng thời **soi lại toàn bộ gói đã commit**.
  - `npm run verify:gm` độc lập với phần này.
- ⏳ **Việc còn lại (cần mạng, chạy một lần trên máy bố/mẹ)**: `npm run build:puzzles` rồi **commit**
  `src/data/puzzlePacks/*.json`. Môi trường soạn code này **không có kết nối trực tiếp tới
  database.lichess.org** (chỉ có lớp tìm kiếm/đọc web), nên 7 gói hiện là **file rỗng có sẵn khung**
  để build vẫn xanh; khi bố/mẹ chạy script, panel luyện thêm sẽ tự có ~1.000 câu.

### 4.2. Thư viện thế chiếu bí — ✅ ĐÃ LÀM

- `src/data/mates.ts`: các mẫu chiếu bí cơ bản theo bậc khó: `Q+K`, `R+K`, `2 R` (thang Xe),
  bí hàng cuối, bí ngạt, bí đôi Tượng, Mã+Tượng, Hậu hi sinh rồi Mã bí ngạt (mẫu kinh điển).
- Mỗi mẫu: FEN + chuỗi nước tối ưu ngắn + lời giải thích + vè (vè tắt ở giai đoạn lớn).
- Có thể kết hợp Stockfish để **kiểm tra chuỗi nước đúng là bí nhanh nhất** (test tự động).
- ✅ **Đã làm**: `src/data/mates.ts` gồm **7 thẻ** (Q+K, R+K, thang Xe, hàng cuối ×2, bí ngạt,
  bí kiểu Ả Rập). Mỗi chuỗi nước được kiểm trong `validate-chess.ts` (hợp lệ, kết thúc đúng bằng
  chiếu bí, độ dài khớp `mateIn`, và nước đầu không được đã là bí nếu `mateIn > 1`). Hiển thị ở
  tab Tàn cuộc dưới dạng panel **"📚 Thư viện chiếu bí"**.
- ⏳ **Tạm hoãn**: Tượng đôi & Mã+Tượng là kỹ thuật **dài hơi** (bí sau hàng chục nước), không kiểm
  chứng tự động rẻ tiền được nên chưa đưa vào; sẽ bổ sung khi có bước kiểm riêng.
  Các thế bí đôi Tượng/bí ngạt *dễ* vẫn có sẵn dưới dạng bài chơi được trong `ENDGAMES`.

### 4.3. Chiến lược vị trí — ✅ ĐÃ LÀM

- `src/data/positional.ts`: mỗi bài một khái niệm, dạy bằng **cùng một thế cờ nhưng hai bên đi khác
  nhau** để bé thấy khác biệt:
  - Ô yếu / lỗ hổng, tiền đồn (outpost), cột mở, đường chéo mạnh, cặp Tượng, Tốt yếu (mở rộng 3 thế
    trong `pawnStructures.ts`), đổi quân đúng lúc (simplification), hàng 7.
- Mỗi bài: FEN + nhiệm vụ + "dấu hiệu nhận biết" + lời giải thích.
- ✅ **Đã làm**: `src/data/positional.ts` gồm **4 bài**: **tiền đồn** (Mã d5), **cột mở** (cột c),
  **cặp Tượng**, **Xe hàng 7**. Mỗi khái niệm được **chứng minh bằng quân cờ thật** trong
  `validate-chess.ts` (ví dụ tiền đồn: ô đó phải có Mã của bé, được Tốt che, và **không** Tốt địch
  nào đá được). Hiển thị ở tab Chiến lược dưới dạng panel **"🧭 Chiến lược vị trí"**.
- ⏳ Các khái niệm còn lại (đường chéo mạnh, đổi quân đúng lúc) sẽ bổ sung sau; dạy "hai bên đi khác
  nhau" cần thêm dạng bài có biến, chưa làm ở vòng này.

### 4.4. Cây khai cuộc phân nhánh + kế hoạch trung cuộc — ✅ ĐÃ LÀM

- Mở rộng `src/data/openings.ts` thành **cây**: mỗi nút là một nước, có nhiều nhánh phản ứng của đối
  thủ; bé chọn nước → app trả nước lý thuyết của đối thủ.
- Sau ~8-10 nước: hiện **"Kế hoạch tiếp theo"** (ví dụ Sicilian: tấn công cánh Hậu; Pháp: chọc e5).
- Dữ liệu tham khảo có thể đối chiếu với kho khai cuộc mở (Lichess/`chess-openings`), nhưng **nước đi
  là dữ kiện** nên viết tay được.
- ✅ **Đã làm**:
  - `src/lib/openingTree.ts`: mô hình cây + `buildOpeningTree(main, branches)` - viết dữ liệu dạng
    **dòng chính + danh sách nhánh** cho dễ đọc/soi lỗi, rồi ghép thành cây thật. Quy ước: **phần tử
    đầu tiên của `replies` là nhánh chính**, nên dòng chính rút ra chỉ bằng cách đi theo `replies[0]`.
  - `src/data/openingTrees.ts`: cây cho **cả 8 khai cuộc** - **229 nút, 15 ngã ba, 125 nước ở nhánh
    phụ**. `src/data/openings.ts` giờ chỉ còn phần giới thiệu, `moves` được **rút thẳng từ cây** nên
    không thể lệch với cây.
  - Bé đi tới **ngã ba của đối thủ** thì app **dừng lại** (không tự đoán thay bé): hiện khung chọn
    nhánh ngay dưới bàn cờ, nhánh chính gắn ⭐, mỗi nhánh kèm một câu giải thích; nút “Tiến” bị khoá
    cho tới khi bé chọn. Ở nút của bé, **mọi nước lý thuyết đều được chấp nhận** (không chỉ nhánh chính).
  - Khung **🌳 Cây khai cuộc** liệt kê mọi ngã ba để bé xem trước và **bấm nhảy thẳng** sang nhánh khác.
  - Khung **🧭 Kế hoạch trung cuộc**: 3 việc cụ thể cho bé, hiện đầy đủ từ nước thứ 6 trở đi.
  - `validate-chess.ts` duyệt **mọi đường đi** của cả 8 cây: từng nước phải hợp lệ bằng chess.js ở
    đúng thế cờ đó, lời giảng **chỉ** được nằm ở nước của bé, mỗi nhánh phụ phải có câu giải thích,
    dòng chính phải ≥ 10 ply, kế hoạch phải ≥ 3 việc.
  - `scripts/browser-opening-tree-test.mjs` (`npm run check:tree`): 25 phép kiểm trong Chrome thật -
    có khung cây + kế hoạch, tới ngã ba thì app dừng và khoá nút “Tiến”, chọn nhánh khác thì **bàn cờ
    đi đúng nhánh đó**, bấm trong khung cây thì **nhảy tới nhánh ấy**.
  - Lưu ý kỹ thuật: `openings.ts`/`openingTrees.ts` phải ghi rõ đuôi `.ts` khi import, vì Node (chạy
    `scripts/validate-chess.ts`) **không tự thêm đuôi** cho import lúc chạy; Vite vẫn hiểu bình thường.

### 4.5. Tàn cuộc lý thuyết Xe+Tốt — ✅ ĐÃ LÀM (một phần)

- Bổ sung: Lucena (đã có), Philidor (đã có), **pháo đài (fortress)**, **hòa bằng chiếu liên tục**,
  **Vancura**, **tàn cuộc hai Tốt chống một**, và bài **"đếm nước tối ưu"** (bí trong N nước).
- Mỗi thế cần chứng minh bằng máy: thắng/hòa thật sự, không chỉ "có nước đi hợp lệ".
- ✅ **Đã làm**: `src/data/rookEndgames.ts` gồm **4 thế**: **Lucena** (thắng), **Philidor** (hòa),
  **Vancura** (hòa), **Chặn Tốt sắp thành Hậu** (thắng). Kết quả được **Stockfish chứng minh** trong
  `scripts/verify-endgames.mjs` (`npm run verify:endgames`): `win` phải ≥ +1.5 hoặc có mate,
  `draw` phải |cp| ≤ 0.6. Hiển thị ở tab Tàn cuộc dạng panel **"🏰 Tàn cuộc Xe + Tốt"**.
- ⏳ **Tạm hoãn**: **pháo đài (fortress)**, **hòa bằng chiếu liên tục**, **hai Tốt chống một**,
  và bài **"đếm nước tối ưu (bí trong N nước)"** — cần thế cờ đã được kiểm chứng kỹ (tránh gán sai
  tên kỹ thuật); sẽ bổ sung sau.

### 4.6. Học ván của kỳ thủ hiện đại ("đoán nước tiếp theo") — ✅ ĐÃ LÀM

- `src/data/gmGames.ts`: một số ván **hiện đại** (Carlsen, Kasparov, Nakamura) gắn với các khai cuộc
  app đang dạy.
- Mỗi ván cắt thành 5-10 câu hỏi "nước này bé chọn gì?"; bé kéo-thả, app so với:
  - **nước kỳ thủ đã đi = 1 điểm**
  - **nước máy (Stockfish) mạnh hơn = 2 điểm**
  - nước khác: không điểm, nhưng hiện lời giải thích ngắn.
- ⚠️ **Bản quyền**: chuỗi nước đi là dữ kiện, **không** bảo hộ; nhưng lời bình của người khác thì có →
  toàn bộ lời bình phải **tự viết**.
- ✅ **Đã làm**:
  - `src/data/gmGames.ts`: **3 ván thật** - Carlsen - Tomashevsky (Wijk aan Zee 2016, hệ thống
    London, khớp bài khai cuộc `london`), Kasparov - Topalov (Wijk aan Zee 1999, ván "bất hủ",
    Phòng thủ Pirc), Ding Liren - Nepomniachtchi (chung kết Thế giới 2023 ván 6, hệ thống London).
    Tổng **22 câu hỏi** (7 / 8 / 7), mỗi câu có lời giải thích **tự viết** + vè 4-6 chữ.
  - Luật điểm: nước kỳ thủ đã đi = **1 điểm**; nước MÁY mạnh hơn = **2 điểm** (kiểm nước kỳ thủ
    TRƯỚC để hai nước trùng nhau vẫn ra 1 điểm); nước khác = 0 điểm nhưng vẫn hiện lời giải thích.
  - Trang riêng `/gm-games` (mở từ thẻ mời trong tab Khai cuộc) - **không thêm tab** nên vẫn đủ 6
    tab trên điện thoại. Bàn cờ tự chạy ván, tới câu hỏi thì dừng chờ bé kéo-thả; vừa trả lời xong
    băng giải thích giữ **1.8 giây** cho bé đọc phần "Vì sao?" và câu vè.
  - `npm run verify:gm` (**Stockfish MultiPV**, độ sâu 18): mọi nửa nước của cả 3 ván hợp lệ, nước
    ghi là "nước máy mạnh hơn" **đúng là nước máy chọn** và **hơn nước kỳ thủ ≥ 40 centipawn**;
    3 câu đủ điều kiện (hơn 44-54 cp) đã được ghi vào dữ liệu, 19 câu còn lại thì máy cũng chọn
    đúng nước của kỳ thủ.
  - `scripts/browser-gm-test.mjs` (`npm run check:gm`): bấm-chọn-đi thật để đoán đúng nước kỳ thủ
    (1 điểm) và tìm ra nước máy mạnh hơn ở câu cuối (2 điểm), phiếu điểm phải cộng đúng 3/8.

---

## 9. GIAI ĐOẠN 5 — SƯ PHẠM TƯƠNG TÁC

### 9.1. Luyện "Âm mưu đối thủ" (yêu cầu đã xếp hàng trước đó)

- Trước khi tới lượt bé, app hỏi: *"Đối thủ vừa đi nước đó. Bé thử bấm quân nào của mình ĐANG BỊ ĐE
  DỌA?"* → bé bấm đúng quân → **+1 ⭐** → mới được đi tiếp.
- Dùng sẵn: `findHangingPieces` + `computeHeatmap` trong `src/lib/threats.ts`.
- Tần suất theo giai đoạn: bé Nhí hỏi 1 lần/bài; lớn hơn hỏi mỗi khi đối thủ vừa tạo đe dọa mới.
- **Không** dùng cho mọi nước (sẽ mệt) — thiết kế: chỉ khi có ít nhất 1 quân của bé bị treo thật.

### 9.2. Luyện thứ tự suy nghĩ

- Khuôn 2 bước, hiện dưới dạng thẻ hỏi trước khi đi: ① *"Đối thủ vừa đi để làm gì?"* (chọn 1 trong 3
  khả năng) → ② *"Vậy bé nên làm gì?"*. Đúng cả hai → ⭐.
- Nguồn phương án nhiễu: sinh từ engine (các nước ứng viên) + mẫu câu viết tay.

### 9.3. Xem lại ván đấu (ngay sau ván, tối đa 3 lỗi)

> **Vị trí — ĐÃ CHỐT**: xem lại ván **nhúng thẳng trong tab "Đấu với Máy"** (`/free-play`), hiện
> ngay sau khi ván kết thúc. **Không** tạo tab riêng cho xem lại ván. Tab Ôn tập (§5.1) chỉ lo
> việc ôn câu đố/thế cờ theo lịch, không phải nơi xem lại ván.

- Lưu ván (chuỗi SAN + FEN đầu) vào `localStorage` (khoá riêng, giới hạn ~20 ván gần nhất).
- Sau khi ván kết thúc: chạy phân tích (Stockfish lazy hoặc engine JS) → chọn **tối đa 3 lỗi quan
  trọng nhất** theo thứ tự: mất quân không đền → bỏ lỡ đòn thắng → đi nước vô nghĩa.
- Hiện bằng lời đơn giản, ví dụ: *"Nước 12: bé để mất Mã vì Xe của bé không ai che."*
- Không dùng ký hiệu ❓❌ ở giai đoạn nhỏ; thêm từ 13 tuổi.

### 9.4. Thói quen "nghĩ rồi mới chạm quân"

- Thêm tuỳ chọn (mặc định BẬT từ 10 tuổi): kéo sai thì **không trả quân ngay** mà hỏi *"Bé chắc chưa?
  Nước này mất quân đó!"* → bé phải xác nhận mới đi.
- Không bật cho bé 7-9 (dễ nản).

---

## 10. GIAI ĐOẠN 6 — KHUNG "GỢI Ý CHO BA MẸ" (yêu cầu đã xếp hàng trước đó) — ✅ ĐÃ LÀM

- Hiện thực: `src/components/ParentTips.tsx` (khung) · `src/lib/parentTips.ts` (câu hỏi) ·
  `src/store/lesson.tsx` (`LessonProvider` + `useReportLesson`), gắn trong `RootLayout` nên có mặt ở
  **cả 7 đường dẫn**.
- Vị trí: **góc dưới bên phải, hiện ở MỌI tab, thu gọn được** (nút ▸/▾), trạng thái thu/mở nhớ trong
  `localStorage` (`hoc-vien-co-vua-nhi.parent-tips.v1`). Mặc định **MỞ** để ba mẹ thấy ngay lần đầu.
  ✅ Khi thu gọn chỉ còn một nút nhỏ (đo thật: 132×33px).
- Nội dung theo ngữ cảnh: với bài giảng/ván đang học, hiện **1-2 câu hỏi gợi ý để bố mẹ hỏi bé**, ví
  dụ: *"Đố con: vì sao Carlsen đưa Tượng ra f4 trước khi đẩy Tốt e3?"*.
- Nguồn câu hỏi: viết tay cho **8 khai cuộc + 4 bài giảng** (`TIPS_BY_LESSON`, khoá
  `opening:<id>` / `lecture:<id>`) + mẫu chung cho các tab khác (`TIPS_BY_TAB`). Trang tự báo bài
  đang mở qua `useReportLesson` nên câu hỏi đổi **ngay khi bé đổi bài**, không cần tải lại trang.
- Trong khung này cũng hiện (ẩn với bé): **số Elo**, điểm từng dạng đòn (10 dòng, cùng nguồn với
  tab Trung cuộc), và nút chọn giai đoạn tuổi + ô năm sinh.
- Không có báo cáo tuần, không có giới hạn thời gian (chủ dự án không chọn).
- Điều kiện: khung **không được** làm hỏng bố cục không-cuộn — kiểm tra bằng LAYOUT test; khi thu gọn
  chỉ còn một nút nhỏ. ✅ Khung là khối `position: fixed`, bề rộng/chiều cao chặn theo màn hình và
  thân tự cuộn bên trong; **LAYOUT 11/11 xanh**, `npm run check:tips` đo riêng ở 1440×900 và 390×844
  (không tràn ngang, không làm trang cao thêm).

---

## 11. CÂU HỎI ĐÃ CHỐT (trước đây là mục "Câu hỏi mở")

Cả 8 câu hỏi đã được chủ dự án chốt qua **Vòng A + Vòng B**. Ghi lại nguyên văn quyết định dưới
đây để các giai đoạn 0-6 không còn điểm mơ hồ nào.

### 11.1. Vòng A

| # | Câu hỏi | ✅ Quyết định đã chốt |
| --- | --- | --- |
| 1 | Câu đố 1 nước dễ | **Giữ mỗi họ đòn 1 câu**, gọi là **"Khởi động"**, **không tính điểm**. Phần còn lại chuyển sang **kho luyện tập**, KHÔNG xoá khỏi dữ liệu (xem §4.0.5). |
| 2 | Tên 5 cấp độ hiện cho bé | **Mầm cờ → Biết đi cờ → Chơi chắc tay → Đánh sắc bén → Cao thủ nhí** (xem §6). |
| 3 | Điểm trình độ khởi đầu | **500** (chọn thay vì 600 để bé thấy tiến bộ nhanh). **Không cần nút đặt lại điểm** (xem §6). |
| 4 | Tab Ôn tập / xem lại ván | **1 tab riêng "Ôn tập"** (`/review`, tab thứ 6); **xem lại ván nhúng trong "Đấu với Máy"** (`/free-play`) — không tạo tab riêng cho ván. |

### 11.2. Vòng B

| # | Câu hỏi | ✅ Quyết định đã chốt |
| --- | --- | --- |
| 5 | Đóng gói gói ~1.000 câu Lichess | **Sinh lúc build + commit bản đã lọc** vào `src/data/puzzlePacks/`. App 100% offline; build/CI không cần mạng; CSV Lichess tải ngoài repo chỉ khi chạy script lọc (xem §4.1). |
| 6 | Lời giải thích tiếng Việt cho câu luyện thêm | **Mẫu tự sinh + nước đi** (không vè riêng), gắn nhãn **"bài luyện thêm"** phân biệt với "bài giảng" (xem §4.1). |
| 7 | Stockfish WASM GPL-3.0 | **Chấp nhận GPL-3**, ghi chú rõ hệ quả (nếu mở mã nguồn/phát hành thì toàn app theo GPL-3) trong README (xem §3.2). |
| 8 | `useChessGame.autoReply` | **Xoá hẳn khỏi mã.** Mọi chỗ cũ đổi sang `pickMove(fen, 'easy')`; tab "Đấu với Máy" dùng thẳng thang `pickMove`. Không giữ lại cho Free Play (xem §4.0.2, §4.0.6). |

### 11.3. Rủi ro còn lại (theo dõi, không phải câu hỏi mở)

- Thanh tab phải hiển thị đủ **6 tab** trên điện thoại 390px — kiểm bằng LAYOUT test sau khi thêm
  tab Ôn tập (§1.1).
- `browser-hint-drag-test.mjs` cần cập nhật khi 0.2 đổi Endgames sang engine (bộ đếm nước 0 → 2).
- Nếu sau này repo được mở mã nguồn/phát hành: bắt buộc chuyển toàn app sang **GPL-3** (do Stockfish).

---

## 12. THỨ TỰ THỰC HIỆN ĐỀ XUẤT

| GĐ | Nội dung | Vì sao thứ tự này |
| --- | --- | --- |
| **0** | Dọn dẹp & cắt bớt | Chủ dự án chọn làm trước; bỏ thói quen xấu trước khi thêm nội dung |
| **1** | Nối `review.ts` + `stages.ts` | Đã viết & test xong, nối vào là dùng được ngay; là nền cho mọi thứ sau |
| **2** | Mini-Elo | Cần cho chọn bài, cho máy đấu, cho xem lại ván |
| **3** | Engine (mức `master` + mắc lỗi như người + Stockfish lazy) | Nền cho phân tích & máy đấu thật |
| **4** | Nội dung: kho câu đố Lichess → chiếu bí → vị trí → cây khai cuộc → tàn cuộc Xe+Tốt → ván kỳ thủ | Nội dung mới cần GĐ 2-3 để chọn đúng độ khó |
| **5** | Sư phạm tương tác: Âm mưu đối thủ → thứ tự suy nghĩ → xem lại ván → nghĩ rồi mới chạm | Cần nội dung + engine ở trên |
| **6** | Khung Gợi ý cho Ba mẹ | Nhỏ, độc lập, làm cuối để gom hết số liệu hiển thị |

Mỗi giai đoạn phải kết thúc bằng: `tsc` 0 lỗi · `oxlint` 0 warning · `npm run check` xanh ·
`npm run check:browser` 11/11 xanh · LAYOUT 10 khung nhìn không cuộn/không tràn · cập nhật README ·
thêm test cho tính năng mới.

---

## 13. TUYÊN BỐ PHẠM VI

**Trong phạm vi**: dọn dẹp theo danh sách §0 · nối 2 module đã có (thêm **tab thứ 6 "Ôn tập"**) ·
mini-Elo · engine (JS + Stockfish lazy) · kho câu đố Lichess ~1.000 câu · thư viện chiếu bí · chiến
lược vị trí · cây khai cuộc · tàn cuộc Xe+Tốt · ván kỳ thủ hiện đại · luyện âm mưu đối thủ · luyện
thứ tự suy nghĩ · xem lại ván (3 lỗi, **nhúng trong "Đấu với Máy"**) · khung gợi ý cho ba mẹ.

**Ngoài phạm vi** (đã cân nhắc, không làm ở đợt này): tài khoản/server/đấu online · đồng hồ thi đấu &
ghi biên bản · chế độ 2 người chung máy · luyện tầm nhìn bàn cờ / nhắm mắt · báo cáo tuần cho bố mẹ ·
giới hạn thời gian mỗi ngày · streak & nhắc học · thay đổi bảng màu "Sồi & Ngọc" · thay đổi bố cục
"bàn làm việc".

---

> **Kết luận**: 8 câu hỏi mở trước đây (§11) đã được chốt toàn bộ (Vòng A + Vòng B). Đặc tả này
> sẵn sàng để bắt đầu **Giai đoạn 0 — Dọn dẹp**.
