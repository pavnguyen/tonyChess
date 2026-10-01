import type { Opening, OpeningNode } from '../types'
// Ghi rõ đuôi `.ts`: các bài kiểm chứng chạy bằng `node scripts/*.ts` (Node tự
// bỏ kiểu) nên chuỗi import lúc chạy PHẢI có đuôi, không như các file chỉ chạy
// qua Vite. Vite vẫn hiểu đuôi `.ts` bình thường.
import { OPENING_TREES } from './openingTrees.ts'
import { mainLine } from '../lib/openingTree.ts'

/**
 * Khai cuộc chuẩn Grand Master.
 *
 * Nước đi nằm ở `openingTrees.ts` dưới dạng **cây phân nhánh**; ở đây chỉ giữ
 * phần giới thiệu (tên, Grand Master, màu quân của bé) rồi rút **nhánh chính**
 * ra thành `moves` - đúng dòng mà chế độ "Luyện thuộc lòng" yêu cầu bé đi.
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
]

/** Nếu ai đó quên viết cây cho một khai cuộc, bài đó vẫn hiện ra (chỉ là rỗng). */
const EMPTY_TREE: OpeningNode[] = []

export const OPENINGS: Opening[] = META.map((meta) => {
  const entry = OPENING_TREES[meta.id]
  const tree = entry?.tree ?? EMPTY_TREE
  if (!entry) {
    console.warn(`Khai cuộc "${meta.id}" chưa có cây nước đi trong openingTrees.ts`)
  }
  return {
    ...meta,
    tree,
    // `moves` luôn là NHÁNH CHÍNH rút từ cây, nên không thể lệch với cây.
    moves: mainLine(tree),
    plan: entry?.plan ?? { title: 'Kế hoạch tiếp theo', points: [] },
  }
})

export function getOpening(id: string): Opening | undefined {
  return OPENINGS.find((opening) => opening.id === id)
}
