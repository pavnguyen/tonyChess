import type { Opening } from '../types'
// Ghi rõ đuôi `.ts`: các bài kiểm chứng chạy bằng `node scripts/*.ts` (Node tự
// bỏ kiểu) nên chuỗi import lúc chạy PHẢI có đuôi, không như các file chỉ chạy
// qua Vite. Vite vẫn hiểu đuôi `.ts` bình thường.
import { OPENING_TREES } from './openingTrees.ts'

/**
 * Khai cuộc chuẩn Grand Master.
 *
 * Nước đi nằm ở `openingTrees.ts` dưới dạng **một dòng chính**; ở đây chỉ giữ phần
 * giới thiệu (tên, Grand Master, màu quân của bé) rồi ghép lại thành bài học.
 *
 * THỨ TỰ TRONG MẢNG LÀ THỨ TỰ ƯU TIÊN HỌC (bản đồ đánh số 1, 2, 3… theo đúng thứ
 * tự này). Xếp theo hai tiêu chí của phụ huynh:
 *   1. xác suất gặp trên bàn cờ thật (khai cuộc càng phổ biến càng học trước),
 *   2. dễ triển khai quân và mạnh về lâu dài (không cần thuộc nhiều biến).
 *
 * BÉ CẦM TRẮNG (xếp theo nước đáp bé THẬT SỰ gặp, rồi mới tới độ dễ):
 *   1. Ván cờ Ý - sống trong thế giới 1...e5, mục tiêu f7 dễ thấy nhất;
 *   2. Ruy Lopez - cũng là 1...e5 và dùng lại ĐÚNG khung của Ván cờ Ý
 *      (1.e4 e5 2.Nf3 Nc6), chỉ đổi 3.Bc4 thành 3.Bb5, nên học ngay sau là rẻ nhất;
 *   3. London - dễ chơi nhất nhưng chỉ dùng được khi Đen đáp 1...d5 kiểu kín,
 *      nên đứng sau hai bài 1...e5;
 *   4. Gambit Hậu - cần hiểu căng Tốt c4/d5 trước đã;
 *   5. English - trừu tượng nhất (1.c4 dẫn nhập vào nhiều thế khác nhau).
 *
 * BÉ CẦM ĐEN (xếp thẳng theo tần suất gặp): Sicilian ≫ Caro-Kann > Pháp >
 * King's Indian > Nimzo-Indian.
 *
 * LƯU Ý VỀ TÍNH TRUNG THỰC: đây là **lựa chọn sư phạm**, KHÔNG phải kết quả đo từ
 * cơ sở dữ liệu nào. Vì vậy `rankNote` chỉ nói lý do DẠY HỌC ("Dễ chơi nhất",
 * "Nhiều lý thuyết", "Học sau cùng"…) - không dùng chữ nghe như số liệu thống kê
 * ("Gặp nhiều nhất", "Phổ biến") để phụ huynh không hiểu nhầm là có dẫn chứng.
 */
interface OpeningMeta {
  id: string
  name: string
  englishName: string
  gm: string
  side: Opening['side']
  emoji: string
  tagline: string
  /** Bé muốn gì với khai cuộc này - xem `Opening['goal']` trong `src/types.ts`. */
  goal: string
  /** Vì sao khai cuộc này đứng ở vị trí này trong thứ tự ưu tiên học. */
  rankNote: string
  /** Bài chỉ cần nhận diện + ý tưởng (dòng chính ngắn 6 nửa nước) - xem `Opening`. */
  ideaOnly?: boolean
}

const META: OpeningMeta[] = [
  // ── BÉ CẦM TRẮNG ────────────────────────────────────────────────────────
  {
    id: 'italian',
    name: 'Ván cờ Ý',
    englishName: 'Italian Game',
    gm: 'GM Wesley So',
    side: 'white',
    emoji: '🇮🇹',
    tagline: 'Tốt e nhảy vọt, Tượng nhắm tim Vua Đen ở ô f7.',
    goal: 'Tượng c4 nhắm f7; giữ trung tâm c3-d3 rồi đẩy d4 đúng lúc.',
    rankNote: 'Dễ học, hay gặp',
  },
  {
    id: 'london',
    name: 'Hệ thống London',
    englishName: 'London System',
    gm: 'GM Magnus Carlsen',
    side: 'white',
    emoji: '🇬🇧',
    tagline: 'Kim tự tháp Tốt siêu cứng, Vua chỉ việc nhập thành an toàn.',
    goal: 'Khung c3-d4-e3 + Tượng f4, nhập thành rồi đổi Tượng ô đen và mở cột h.',
    rankNote: 'Dễ chơi nhất',
  },
  {
    id: 'ruy-lopez',
    name: 'Khai cuộc Tây Ban Nha',
    // Viết không dấu cho đúng cách tra cứu phổ biến (ChessBase, chess.com, sách
    // tiếng Anh đều ghi "Ruy Lopez"); tên tiếng Việt vẫn là "Khai cuộc Tây Ban Nha".
    englishName: 'Ruy Lopez',
    gm: 'GM Bobby Fischer',
    side: 'white',
    emoji: '🇪🇸',
    tagline: 'Tượng ra ghim Mã đen rồi nhập thành - khai cuộc huyền thoại của Fischer.',
    goal: 'Tượng b5 ghim Mã c6; chơi d3-c3 rồi đẩy d4, áp lực từ từ.',
    rankNote: 'Hay gặp, nhiều lý thuyết',
  },
  {
    id: 'queens-gambit',
    name: 'Gambit Hậu',
    englishName: "Queen's Gambit",
    gm: 'GM Judit Polgár',
    side: 'white',
    emoji: '🇭🇺',
    tagline: 'Dâng Tốt c mời đổi, giành trung tâm rồi ghim quân - tuyệt kỹ của Judit.',
    goal: 'Dâng c4 đổi Tốt d5, giữ d4 làm bàn đạp; đường chính là cột c.',
    rankNote: 'Bài tiếp theo',
  },
  {
    id: 'english',
    name: 'Khai cuộc Anh',
    englishName: 'English Opening',
    gm: 'GM Tony Miles',
    side: 'white',
    emoji: '🏝️',
    tagline: 'Kiểm soát ô d5 từ xa bằng Tốt cánh rồi mới mở trung tâm.',
    goal: 'Tốt c4 kiểm soát d5 từ xa rồi mới mở trung tâm.',
    rankNote: 'Học sau cùng',
  },

  // ── BÉ CẦM ĐEN ──────────────────────────────────────────────────────────
  {
    id: 'sicilian',
    name: 'Phòng thủ Sicilian',
    englishName: 'Sicilian Defense',
    gm: 'GM Garry Kasparov',
    side: 'black',
    emoji: '🌋',
    tagline: 'Tốt c ngáng đường rồi phản công mãnh liệt từ cánh.',
    goal: 'Đổi c5 lấy d4 để Trắng mất trung tâm, rồi đánh cánh Hậu bằng b5-b4.',
    rankNote: 'Hay gặp nhất, phản công mạnh',
  },
  {
    id: 'caro-kann',
    name: 'Phòng thủ Caro-Kann',
    englishName: 'Caro-Kann Defense',
    gm: 'GM Tigran Petrosian',
    side: 'black',
    emoji: '🛡️',
    tagline: 'Đưa Tượng ra ngoài TRƯỚC khi đóng Tốt e6 - bí quyết của Petrosian.',
    goal: 'Tượng c8 ra f5 TRƯỚC khi đóng e6, rồi đánh d4 bằng c5.',
    rankNote: 'Dễ chơi nhất',
  },
  {
    id: 'french',
    name: 'Phòng thủ Pháp',
    englishName: 'French Defense',
    gm: 'GM Mikhail Botvinnik',
    side: 'black',
    emoji: '🇫🇷',
    tagline: 'Dựng hàng rào Tốt vững như thành rồi phản công vào chân đế d4.',
    goal: 'Hàng rào e6-d5 giam Tốt e4, rồi đánh chân đế d4 bằng c5.',
    rankNote: 'Chắc, hơi chật',
  },
  {
    id: 'kings-indian',
    name: "Phòng thủ King's Indian",
    englishName: 'King\'s Indian Defense',
    gm: 'GM Hikaru Nakamura',
    side: 'black',
    emoji: '🏰',
    tagline: 'Giấu Tượng vào lều g7 rồi nhập thành dựng pháo đài.',
    goal: 'Dựng pháo đài Tượng g7 rồi đập e5-f5 vào cánh Vua.',
    rankNote: 'Nhiều kế hoạch',
  },
  {
    id: 'nimzo-indian',
    name: 'Phòng thủ Nimzo-Indian',
    englishName: 'Nimzo-Indian Defense',
    gm: 'GM Aron Nimzowitsch',
    side: 'black',
    emoji: '⛓️',
    tagline: 'Tượng ra ghim Mã c3, khoá chặt không cho Trắng đẩy Tốt e4.',
    goal: 'Tượng b4 ghim Mã c3: Trắng phải nhân đôi Tốt c hoặc bỏ e4.',
    rankNote: 'Chỉ cần nhận diện',
    ideaOnly: true,
  },
]

/** Nếu ai đó quên viết dòng nước cho một khai cuộc, bài đó vẫn hiện ra (rỗng). */
const EMPTY: Opening['moves'] = []

export const OPENINGS: Opening[] = META.map((meta) => {
  const entry = OPENING_TREES[meta.id]
  if (!entry && import.meta.env?.DEV) {
    console.warn(`Khai cuộc "${meta.id}" chưa có dòng nước đi trong openingTrees.ts`)
  }
  return {
    ...meta,
    moves: entry?.main ?? EMPTY,
    plan: entry?.plan ?? { title: 'Kế hoạch tiếp theo', points: [] },
    sidelines: entry?.sidelines,
  }
})
