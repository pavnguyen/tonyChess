# ♟️ Học Viện Cờ Vua Nhí

Web App tương tác (SPA) giúp **bé 7 tuổi** học thuộc **Khai cuộc Đại Kiện Tướng (GM)**, kỹ năng
**Trung cuộc** và **Tàn cuộc** — giao diện hoạt hình tươi sáng, responsive 100% cho điện thoại,
iPad/tablet và máy tính.

## 🚀 Chạy ngay

```bash
npm install
npm run dev        # mở http://localhost:5173
npm run build      # build production
npm run preview    # xem thử bản production
npm run lint       # kiểm tra code (oxlint)
npm run check:chess # kiểm tra toàn bộ dữ liệu cờ vua bằng chess.js
```

## 🧠 Nguyên tắc sư phạm

Mỗi nước đi của bé (hoặc khi bấm “xem nước tiếp theo”) đều bật **Banner Giải Thích Siêu Ngắn**
gồm đúng 3 phần:

1. **Nước đi + Tên quân** — ký hiệu linh hoạt theo tuỳ chọn (`♘f3` / `Nf3` / `Mf3`).
2. **Lý do** — 1 câu logic, dễ hiểu.
3. **Khẩu quyết vè** — 4–6 chữ để bé nhẩm thuộc lòng.

## 🗂️ Ba tab học tập

| Tab | Nội dung |
| --- | --- |
| 🛡️ **Khai cuộc Đại Kiện Tướng** | London System (Carlsen), Ván cờ Ý (Wesley So), King's Indian (Nakamura), Sicilian (Kasparov). Có bàn cờ tương tác, mũi tên vàng chỉ nước kế tiếp, chế độ **Học từng bước**, **Luyện thuộc lòng** (nhận Cúp Vàng 🏆) và **Đua tốc độ 30s**. |
| ⚔️ **Trung cuộc — Mẹo săn quân** | Mini-game giải thế cờ cho các đòn **Bắt đôi (Fork)**, **Ghim quân (Pin)**, **Xiên quân (Skewer)**. Giải đúng → pháo hoa 🎆 + âm thanh “Ting!” reo hò. |
| 👑 **Tàn cuộc — Trạm năng lượng Hậu** | “Vua + Tốt đua biến Hậu” và “Chiếu bí bằng 2 Xe / Hậu + Vua”, đấu với Vua Đen đi ngẫu nhiên như một bạn nhỏ đang tập chơi. |

## 👁️ Mắt Thần Cờ Vua

Nút công tắc ở góc khu bàn cờ:

- Ô bị quân đối phương kiểm soát → nền **ĐỎ NHẸ** (nguy hiểm).
- Ô an toàn → nền **XANH LÁ NHẠT**; ô trung tâm quý `d4, e4, d5, e5` → **XANH ĐẬM**.

Bấm nút **?** để xem chú giải màu. Mục tiêu: dạy bé nhìn toàn cảnh bàn cờ để không “cúng quân”.

## ⚙️ Tuỳ chọn cho bé

- **Đổi ký hiệu nước đi**: Hình con cờ (mặc định) · Chuẩn quốc tế FIDE · Tiếng Việt (M, T, X, H, V).
- **Xoay bàn cờ tự động**: chọn bài cờ Đen là bàn cờ tự lật 180° để hàng 7–8 nằm sát bé.
- **Âm thanh**: tiếng đặt quân, “Ting!” khi đúng, nhạc thắng (tổng hợp bằng Web Audio, không cần file mp3).
- **Gamification**: tích luỹ ⭐ để thăng cấp từ *Kỳ thủ Nhí* → *Tập sự Cờ vua* → *Kiện tướng Nhí* →
  *Đại Kiện tướng Nhí*. Tiến độ lưu trong `localStorage`.

## 🧱 Công nghệ

- **React 19 + Vite + TypeScript**
- **TanStack Router** (định tuyến 3 tab) + **TanStack Query** (lớp dữ liệu bài học, có cache)
- **chess.js** (luật cờ, sinh nước hợp lệ, `isAttacked` cho bản đồ nguy hiểm)
- **react-chessboard v5** (bàn cờ, mũi tên, kéo-thả)
- **Tailwind CSS v4** (theme hoạt hình, animation tự viết)

## 📁 Cấu trúc

```
src/
├── components/     # Bàn cờ, banner giải thích, Mắt Thần, HUD sao, modal, UI primitives
├── data/           # openings · tactics · endgames · ranks · queries (TanStack Query)
├── hooks/          # useChessGame — ván cờ điều khiển bằng danh sách nước SAN
├── layout/         # RootLayout: header, tab nav, thanh tuỳ chọn của bé
├── lib/            # notation · threats (heatmap) · hints · sound (Web Audio)
├── pages/          # OpeningsPage · TacticsPage · EndgamesPage
└── store/          # KidProgressProvider (⭐, huy chương, tuỳ chọn — localStorage)
scripts/            # validate-chess · smoke-logic
```

Dữ liệu khai cuộc/đòn/tàn cuộc được kiểm tra tự động bằng `chess.js`: mọi FEN phải hợp lệ, mọi
nước giải phải đi được, thế cờ tàn phải thực sự có nước chiếu bí.
