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
 */
interface OpeningMeta {
  id: string
  name: string
  englishName: string
  gm: string
  side: Opening['side']
  emoji: string
  tagline: string
}

const META: OpeningMeta[] = [
  {
    id: 'london',
    name: 'Hệ thống London',
    englishName: 'London System',
    gm: 'GM Magnus Carlsen',
    side: 'white',
    emoji: '🇬🇧',
    tagline: 'Kim tự tháp Tốt siêu cứng, Vua chỉ việc nhập thành an toàn.',
  },
  {
    id: 'italian',
    name: 'Ván cờ Ý',
    englishName: 'Italian Game',
    gm: 'GM Wesley So',
    side: 'white',
    emoji: '🇮🇹',
    tagline: 'Tốt e nhảy vọt, Tượng nhắm tim Vua Đen ở ô f7.',
  },
  {
    id: 'kings-indian',
    name: "Phòng thủ King's Indian",
    englishName: "King's Indian Defense",
    gm: 'GM Hikaru Nakamura',
    side: 'black',
    emoji: '🏰',
    tagline: 'Giấu Tượng vào lều g7 rồi nhập thành dựng pháo đài.',
  },
  {
    id: 'sicilian',
    name: 'Phòng thủ Sicilian',
    englishName: 'Sicilian Defense',
    gm: 'GM Garry Kasparov',
    side: 'black',
    emoji: '🌋',
    tagline: 'Tốt c ngáng đường rồi phản công mãnh liệt từ cánh.',
  },
  {
    id: 'ruy-lopez',
    name: 'Khai cuộc Tây Ban Nha',
    englishName: 'Ruy López',
    gm: 'GM Bobby Fischer',
    side: 'white',
    emoji: '🇪🇸',
    tagline: 'Tượng ra ghim Mã đen rồi nhập thành - khai cuộc huyền thoại của Fischer.',
  },
  {
    id: 'queens-gambit',
    name: 'Gambit Hậu',
    englishName: "Queen's Gambit",
    gm: 'GM Judit Polgár',
    side: 'white',
    emoji: '🇭🇺',
    tagline: 'Dâng Tốt c mời đổi, giành trung tâm rồi ghim quân - tuyệt kỹ của Judit.',
  },
  {
    id: 'french',
    name: 'Phòng thủ Pháp',
    englishName: 'French Defense',
    gm: 'GM Mikhail Botvinnik',
    side: 'black',
    emoji: '🇫🇷',
    tagline: 'Dựng hàng rào Tốt vững như thành rồi phản công vào chân đế d4.',
  },
  {
    id: 'caro-kann',
    name: 'Phòng thủ Caro-Kann',
    englishName: 'Caro-Kann Defense',
    gm: 'GM Tigran Petrosian',
    side: 'black',
    emoji: '🛡️',
    tagline: 'Đưa Tượng ra ngoài TRƯỚC khi đóng Tốt e6 - bí quyết của Petrosian.',
  },

  // ── Hai khai cuộc giữ lại từ bộ bổ sung (5 Trắng / 5 Đen) ────────────────
  {
    id: 'english',
    name: 'Khai cuộc Anh',
    englishName: 'English Opening',
    gm: 'GM Tony Miles',
    side: 'white',
    emoji: '🏝️',
    tagline: 'Kiểm soát ô d5 từ xa bằng Tốt cánh rồi mới mở trung tâm.',
  },
  {
    id: 'nimzo-indian',
    name: 'Phòng thủ Nimzo-Indian',
    englishName: 'Nimzo-Indian Defense',
    gm: 'GM Aron Nimzowitsch',
    side: 'black',
    emoji: '⛓️',
    tagline: 'Tượng ra ghim Mã c3, khoá chặt không cho Trắng đẩy Tốt e4.',
  },
]

/** Nếu ai đó quên viết dòng nước cho một khai cuộc, bài đó vẫn hiện ra (rỗng). */
const EMPTY: Opening['moves'] = []

export const OPENINGS: Opening[] = META.map((meta) => {
  const entry = OPENING_TREES[meta.id]
  if (!entry) {
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
