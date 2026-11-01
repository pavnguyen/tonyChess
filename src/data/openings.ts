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
 * Mỗi bài có `rankNote` - một nhãn 2-3 chữ nói vì sao nó đứng ở vị trí đó.
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
    goal: 'Tượng c4 nhắm ô f7 yếu nhất của Vua Đen; giữ trung tâm bằng c3-d3 rồi đẩy d4 đúng lúc - mục tiêu là f7, không phải ăn quân.',
    rankNote: 'Gặp nhiều nhất',
  },
  {
    id: 'london',
    name: 'Hệ thống London',
    englishName: 'London System',
    gm: 'GM Magnus Carlsen',
    side: 'white',
    emoji: '🇬🇧',
    tagline: 'Kim tự tháp Tốt siêu cứng, Vua chỉ việc nhập thành an toàn.',
    goal: 'Dựng khung c3-d4-e3 với Tượng f4 rồi nhập thành cho chắc; sau đó đổi Tượng ô đen của Đen và mở cánh Vua bằng h4-h5.',
    rankNote: 'Dễ nhất',
  },
  {
    id: 'queens-gambit',
    name: 'Gambit Hậu',
    englishName: "Queen's Gambit",
    gm: 'GM Judit Polgár',
    side: 'white',
    emoji: '🇭🇺',
    tagline: 'Dâng Tốt c mời đổi, giành trung tâm rồi ghim quân - tuyệt kỹ của Judit.',
    goal: 'Dâng Tốt c4 để đổi được Tốt d5 và lấy ô d4 làm bàn đạp; con đường tấn công chính là cột c, không phải ăn Tốt.',
    rankNote: 'Phổ biến',
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
    goal: 'Tượng b5 ghim Mã c6 làm Tốt e5 của Đen yếu dần; bé chơi d3-c3 rồi mới đẩy d4 - áp lực từ từ, không đổi quân vội.',
    rankNote: 'Nhiều lý thuyết',
  },
  {
    id: 'english',
    name: 'Khai cuộc Anh',
    englishName: 'English Opening',
    gm: 'GM Tony Miles',
    side: 'white',
    emoji: '🏝️',
    tagline: 'Kiểm soát ô d5 từ xa bằng Tốt cánh rồi mới mở trung tâm.',
    goal: 'Kiểm soát ô d5 từ xa bằng Tốt c4 rồi mới mở trung tâm: English dạy bé chơi theo Ô, không theo nước.',
    rankNote: 'Ít gặp hơn',
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
    goal: 'Đổi Tốt c5 lấy Tốt d4 để Trắng mất trung tâm, rồi phản công cánh Hậu bằng b5-b4 và cột c - Sicilian thắng bằng cột c.',
    rankNote: 'Gặp nhiều nhất',
  },
  {
    id: 'caro-kann',
    name: 'Phòng thủ Caro-Kann',
    englishName: 'Caro-Kann Defense',
    gm: 'GM Tigran Petrosian',
    side: 'black',
    emoji: '🛡️',
    tagline: 'Đưa Tượng ra ngoài TRƯỚC khi đóng Tốt e6 - bí quyết của Petrosian.',
    goal: 'Đưa Tượng c8 ra f5 trước khi đóng Tốt e6 để Tượng không bị nhốt, rồi mới đánh vào d4 bằng c5 - đó là cả bí quyết Caro-Kann.',
    rankNote: 'Dễ nhất',
  },
  {
    id: 'french',
    name: 'Phòng thủ Pháp',
    englishName: 'French Defense',
    gm: 'GM Mikhail Botvinnik',
    side: 'black',
    emoji: '🇫🇷',
    tagline: 'Dựng hàng rào Tốt vững như thành rồi phản công vào chân đế d4.',
    goal: 'Hàng rào e6-d5 giam Tốt e4 của Trắng, rồi đánh vào chân đế d4 bằng c5 - chấp nhận chật một chút để Trắng hết đường tiến.',
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
    goal: 'Nhường trung tâm để dựng pháo đài Tượng g7 + Vua nhập thành, rồi đập e5-f5 vào cánh Vua: càng về sau càng mạnh.',
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
    goal: 'Tượng b4 ghim Mã c3 buộc Trắng chọn: nhân đôi Tốt c hoặc mất quyền đẩy e4 - Đen thắng bằng cấu trúc Tốt, không bằng nước hay.',
    rankNote: 'Khó nhất',
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
  }
})

export function getOpening(id: string): Opening | undefined {
  return OPENINGS.find((opening) => opening.id === id)
}
