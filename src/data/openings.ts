import type { Opening, OpeningMove } from '../types'

/**
 * Khai cuộc chuẩn Đại Kiện Tướng.
 * `moves` là dòng nước đi đầy đủ cho CẢ HAI bên (để bàn cờ chạy đúng luật),
 * còn `annotation` chỉ gắn ở những nước thuộc về bé.
 */
export const OPENINGS: Opening[] = [
  {
    id: 'london',
    name: 'Hệ thống London',
    englishName: 'London System',
    gm: 'GM Magnus Carlsen',
    side: 'white',
    emoji: '🇬🇧',
    tagline: 'Kim tự tháp Tốt siêu cứng, Vua chỉ việc nhập thành an toàn.',
    moves: annotate(
      ['d4', 'd5', 'Bf4', 'Nf6', 'Nf3', 'e6', 'e3', 'c5', 'c3', 'Nc6'],
      {
        0: {
          san: 'd4',
          piece: 'p',
          reason: 'Chiếm trung tâm, mở đường Tượng.',
          rhyme: 'Dâng Tốt trung tâm',
        },
        2: {
          san: 'Bf4',
          piece: 'b',
          reason: 'Đưa Tượng ra ngoài trước khi đóng Tốt.',
          rhyme: 'Tượng phi ra trước',
        },
        4: {
          san: 'Nf3',
          piece: 'n',
          reason: 'Nhảy Mã bảo vệ Tốt d4, chuẩn bị nhập thành.',
          rhyme: 'Mã nhảy giữ nhà',
        },
        6: {
          san: 'e3',
          piece: 'p',
          reason: 'Khóa đuôi Tượng f4, làm chân đế giữ Tốt.',
          rhyme: 'Chèn Tốt làm đế',
        },
        8: {
          san: 'c3',
          piece: 'p',
          reason: 'Hoàn thành Kim tự tháp Tốt c3-d4-e3 siêu cứng.',
          rhyme: 'Lô-kốt kiên cố',
        },
      },
    ),
  },
  {
    id: 'italian',
    name: 'Ván cờ Ý',
    englishName: 'Italian Game',
    gm: 'GM Wesley So',
    side: 'white',
    emoji: '🇮🇹',
    tagline: 'Tốt e nhảy vọt, Tượng nhắm tim Vua Đen ở ô f7.',
    moves: annotate(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6'], {
      0: {
        san: 'e4',
        piece: 'p',
        reason: 'Chiếm trung tâm, mở đường Hậu & Tượng.',
        rhyme: 'Tốt e nhảy vọt',
      },
      2: {
        san: 'Nf3',
        piece: 'n',
        reason: 'Nhảy Mã tấn công Tốt e5 của Đen.',
        rhyme: 'Mã ra dọa Tốt',
      },
      4: {
        san: 'Bc4',
        piece: 'b',
        reason: 'Tượng nhắm thẳng vào điểm yếu f7 gần Vua Đen.',
        rhyme: 'Tượng nhắm tim Vua',
      },
      6: {
        san: 'O-O',
        piece: 'k',
        reason: 'Giấu Vua vào góc an toàn.',
        rhyme: 'Vua chui vào lều',
      },
    }),
  },
  {
    id: 'kings-indian',
    name: "Phòng thủ King's Indian",
    englishName: "King's Indian Defense",
    gm: 'GM Hikaru Nakamura',
    side: 'black',
    emoji: '🏰',
    tagline: 'Giấu Tượng vào lều g7 rồi nhập thành dựng pháo đài.',
    moves: annotate(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'O-O'], {
      1: {
        san: 'Nf6',
        piece: 'n',
        reason: 'Nhảy Mã chặn Trắng đẩy Tốt e4.',
        rhyme: 'Mã chặn trung tâm',
      },
      3: {
        san: 'g6',
        piece: 'p',
        reason: 'Mở ô g7 đưa Tượng vào góc.',
        rhyme: 'Mở cửa lều Tượng',
      },
      5: {
        san: 'Bg7',
        piece: 'b',
        reason: 'Đưa Tượng vào Pháo đài càn quét đường chéo.',
        rhyme: 'Tượng giấu trong lều',
      },
      7: {
        san: 'O-O',
        piece: 'k',
        reason: 'Nhập thành giấu Vua ngay.',
        rhyme: 'Vua an toàn nhất',
      },
    }),
  },
  {
    id: 'sicilian',
    name: 'Phòng thủ Sicilian',
    englishName: 'Sicilian Defense',
    gm: 'GM Garry Kasparov',
    side: 'black',
    emoji: '🌋',
    tagline: 'Tốt c ngáng đường rồi phản công mãnh liệt từ cánh.',
    moves: annotate(['e4', 'c5', 'Nf3', 'd6', 'd4', 'Nf6'], {
      1: {
        san: 'c5',
        piece: 'p',
        reason: 'Khống chế ô d4 của Trắng từ cánh.',
        rhyme: 'Tốt c ngáng đường',
      },
      3: {
        san: 'd6',
        piece: 'p',
        reason: 'Mở đường cho Tượng và bảo vệ ô e5.',
        rhyme: 'Dựng hàng rào Tốt',
      },
      5: {
        san: 'Nf6',
        piece: 'n',
        reason: 'Nhảy Mã đe doạ Tốt e4 của Trắng.',
        rhyme: 'Mã ra phản công',
      },
    }),
  },
  {
    id: 'ruy-lopez',
    name: 'Khai cuộc Tây Ban Nha',
    englishName: 'Ruy López',
    gm: 'GM Bobby Fischer',
    side: 'white',
    emoji: '🇪🇸',
    tagline: 'Tượng ra ghim Mã đen rồi nhập thành — khai cuộc huyền thoại của Fischer.',
    moves: annotate(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'], {
      0: {
        san: 'e4',
        piece: 'p',
        reason: 'Chiếm trung tâm, mở đường Hậu & Tượng.',
        rhyme: 'Tốt e nhảy vọt',
      },
      2: {
        san: 'Nf3',
        piece: 'n',
        reason: 'Nhảy Mã tấn công Tốt e5 của Đen.',
        rhyme: 'Mã ra dọa Tốt',
      },
      4: {
        san: 'Bb5',
        piece: 'b',
        reason: 'Tượng áp sát Mã c6 — quân đang giữ Tốt e5.',
        rhyme: 'Tượng ghim Mã Đen',
      },
      6: {
        san: 'Ba4',
        piece: 'b',
        reason: 'Tượng lùi một bước mà vẫn giữ nguyên mũi ghim.',
        rhyme: 'Lùi mà không mất',
      },
      8: {
        san: 'O-O',
        piece: 'k',
        reason: 'Giấu Vua vào góc an toàn.',
        rhyme: 'Vua chui vào lều',
      },
    }),
  },
  {
    id: 'queens-gambit',
    name: 'Gambit Hậu',
    englishName: "Queen's Gambit",
    gm: 'GM Judit Polgár',
    side: 'white',
    emoji: '🇭🇺',
    tagline: 'Dâng Tốt c mời đổi, giành trung tâm rồi ghim quân — tuyệt kỹ của Judit.',
    moves: annotate(['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'], {
      0: {
        san: 'd4',
        piece: 'p',
        reason: 'Chiếm trung tâm bằng Tốt Hậu, mở đường Tượng c1.',
        rhyme: 'Dâng Tốt Hậu',
      },
      2: {
        san: 'c4',
        piece: 'p',
        reason: 'Gambit: dâng Tốt c ngay để giành thế chủ động.',
        rhyme: 'Dâng Tốt c mời',
      },
      4: {
        san: 'Nc3',
        piece: 'n',
        reason: 'Mã ra giữ chặt hai ô trung tâm d5 và e4.',
        rhyme: 'Mã giữ trung tâm',
      },
      6: {
        san: 'Bg5',
        piece: 'b',
        reason: 'Tượng ra ghim Mã f6 vào đúng Hậu Đen.',
        rhyme: 'Tượng ghim Mã Đen',
      },
      8: {
        san: 'e3',
        piece: 'p',
        reason: 'Chèn Tốt e mở đường cho Tượng f1 ra ngoài.',
        rhyme: 'Mở cửa Tượng nhà',
      },
    }),
  },
  {
    id: 'french',
    name: 'Phòng thủ Pháp',
    englishName: 'French Defense',
    gm: 'GM Mikhail Botvinnik',
    side: 'black',
    emoji: '🇫🇷',
    tagline: 'Dựng hàng rào Tốt vững như thành rồi phản công vào chân đế d4.',
    moves: annotate(['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7', 'f4', 'c5'], {
      1: {
        san: 'e6',
        piece: 'p',
        reason: 'Mở đường Tượng c8, chuẩn bị dựng hàng rào.',
        rhyme: 'Tốt e dựng rào',
      },
      3: {
        san: 'd5',
        piece: 'p',
        reason: 'Dựng trung tâm Tốt vững chắc, thách Trắng tiến e5.',
        rhyme: 'Tốt d đáp trả',
      },
      5: {
        san: 'Nf6',
        piece: 'n',
        reason: 'Mã ra tấn công Tốt e4 của Trắng.',
        rhyme: 'Mã ra dọa Tốt',
      },
      7: {
        san: 'Nfd7',
        piece: 'n',
        reason: 'Mã né sang d7 để chuẩn bị phản công vào ô e5.',
        rhyme: 'Mã né rồi công',
      },
      9: {
        san: 'c5',
        piece: 'p',
        reason: 'Tấn công chân đế Tốt d4 từ cánh Hậu.',
        rhyme: 'Tốt c phản công',
      },
    }),
  },
  {
    id: 'caro-kann',
    name: 'Phòng thủ Caro-Kann',
    englishName: 'Caro-Kann Defense',
    gm: 'GM Tigran Petrosian',
    side: 'black',
    emoji: '🛡️',
    tagline: 'Đưa Tượng ra ngoài TRƯỚC khi đóng Tốt e6 — bí quyết của Petrosian.',
    moves: annotate(['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'], {
      1: {
        san: 'c6',
        piece: 'p',
        reason: 'Chuẩn bị đẩy d5 mà không sợ bị đuổi bằng e5.',
        rhyme: 'Tốt c mở đường',
      },
      3: {
        san: 'd5',
        piece: 'p',
        reason: 'Chiếm trung tâm, thách Trắng ăn Tốt.',
        rhyme: 'Tốt d tiến lên',
      },
      5: {
        san: 'dxe4',
        piece: 'p',
        reason: 'Đổi Tốt để mở đường cho Tượng c8.',
        rhyme: 'Đổi Tốt mở đường',
      },
      7: {
        san: 'Bf5',
        piece: 'b',
        reason: 'Tượng ra ngoài trước khi đóng Tốt e6 — tuyệt chiêu Caro-Kann!',
        rhyme: 'Tượng ra trước Tốt',
      },
    }),
  },
]

function annotate(
  sans: string[],
  notes: Record<number, OpeningMove['annotation']>,
): OpeningMove[] {
  return sans.map((san, index) => ({ san, annotation: notes[index] }))
}

export function getOpening(id: string): Opening | undefined {
  return OPENINGS.find((opening) => opening.id === id)
}
