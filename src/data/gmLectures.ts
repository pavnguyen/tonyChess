import type { GmLecture } from '../types'

/**
 * Bốn bài giảng cấp Grand Master.
 *
 * Mỗi bài là một DÒNG NƯỚC ĐI có kịch bản: nước của bé có `annotation` (đúng 3 phần
 * mà banner Siêu Ngắn bắt buộc phải có - tên nước + lý do + khẩu quyết vè), nước của
 * đối thủ thì không. Nhờ vậy trang Chiến lược dùng lại được đúng bộ máy của tab
 * Khai cuộc: kéo-thả, mũi tên vàng, tô ô gợi ý, đối thủ tự đáp trả.
 *
 * Mọi nước đi đều được `scripts/validate-chess.ts` kiểm tra hợp lệ bằng chess.js.
 */
export const GM_LECTURES: GmLecture[] = [
  {
    id: 'minority-attack',
    module: 'lever',
    kind: 'middlegame',
    title: 'Đòn bẩy cấu trúc Tốt',
    gm: 'Carlsbad · Kasparov',
    emoji: '⚖️',
    tagline: 'Trắng có 2 Tốt cánh Hậu, Đen có 3 - dùng ít Tốt hơn để ép ra một Tốt yếu.',
    fen: 'r4rk1/pp2bppp/2p2n2/3p4/3P4/3BPN2/PP3PPP/R2Q1RK1 w - - 0 1',
    playerSide: 'white',
    moves: [
      {
        san: 'Rb1',
        annotation: {
          san: 'Rb1',
          piece: 'r',
          reason: 'Đưa Xe ra cột b để chuẩn bị đẩy Tốt b lên.',
          rhyme: 'Xe ra cột b',
        },
      },
      { san: 'h6' },
      {
        san: 'b4',
        annotation: {
          san: 'b4',
          piece: 'p',
          reason: 'Dâng Tốt b lên chuẩn bị làm đòn bẩy phá cấu trúc của Đen.',
          rhyme: 'Dâng Tốt cánh Hậu',
        },
      },
      { san: 'Rfe8' },
      {
        san: 'b5',
        annotation: {
          san: 'b5',
          piece: 'p',
          reason: 'Tốt b va chạm thẳng vào Tốt c6 của Đen - đây là đòn bẩy.',
          rhyme: 'Đòn bẩy phá Tốt',
        },
      },
      { san: 'Nd7' },
      {
        san: 'bxc6',
        annotation: {
          san: 'bxc6',
          piece: 'p',
          reason: 'Ăn Tốt c6. Đen phải lấy lại bằng Tốt b7, thế là Tốt c6 trở thành Tốt cô lập.',
          rhyme: 'Tạo Tốt cô lập',
        },
      },
      { san: 'bxc6' },
      {
        san: 'Rc1',
        annotation: {
          san: 'Rc1',
          piece: 'r',
          reason: 'Dồn Xe sang cột c, cùng Mã và Hậu vây hãm Tốt c6 đang không ai che.',
          rhyme: 'Dồn lực bắt ngay',
        },
      },
      { san: 'Nf8' },
    ],
  },
  {
    id: 'prophylaxis',
    module: 'prophylaxis',
    kind: 'middlegame',
    title: 'Phòng thủ dự phòng',
    gm: 'Phong cách Anatoly Karpov',
    emoji: '🛡️',
    tagline: 'Nhìn ra ý đồ xấu của đối thủ rồi dập tắt nó TRƯỚC khi làm kế hoạch của mình.',
    fen: 'r1b2rk1/pp3ppp/2p2n2/8/3P4/4PN2/5PPP/1N1Q1RK1 w - - 0 1',
    playerSide: 'white',
    moves: [
      {
        san: 'h3',
        annotation: {
          san: 'h3',
          piece: 'p',
          reason: 'Đen định nhảy Mã hoặc Tượng lên g4 để ghim Mã f3. Tốt h3 bịt luôn ô đó.',
          rhyme: 'Bịt mắt đối thủ',
        },
        spotlight: ['g4'],
      },
      { san: 'Re8' },
      {
        san: 'Nbd2',
        annotation: {
          san: 'Nbd2',
          piece: 'n',
          reason: 'Đối thủ đã hết ý đồ, giờ mới là lúc triển khai kế hoạch của mình.',
          rhyme: 'Xong rồi lo kế mình',
        },
      },
    ],
  },
  {
    id: 'lucena',
    module: 'lucena',
    kind: 'endgame',
    title: 'Kỹ thuật bắc cầu Lucena',
    gm: 'Bắc cầu Xe · Nimzowitsch',
    emoji: '🌉',
    tagline: 'Thắng tàn cuộc Xe + Tốt: lấy Xe làm tấm khiên chắn các nước chiếu.',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    playerSide: 'white',
    moves: [
      {
        san: 'Rd1+',
        annotation: {
          san: 'Rd1+',
          piece: 'r',
          reason: 'Chiếu Vua Đen để ép nó dạt ra xa cột d, không còn chắn đường Tốt.',
          rhyme: 'Đuổi Vua ra xa',
        },
      },
      { san: 'Ke7' },
      {
        san: 'Rd4',
        annotation: {
          san: 'Rd4',
          piece: 'r',
          reason: 'Cắm Xe ở hàng 4 - đây là nước chìa khoá để lát nữa làm cây cầu.',
          rhyme: 'Xe cắm hàng bốn',
        },
      },
      { san: 'Ra1' },
      {
        san: 'Kc7',
        annotation: {
          san: 'Kc7',
          piece: 'k',
          reason: 'Vua bước ra khỏi ô b8. Tốt b7 đã có chỗ trống để lên Hậu!',
          rhyme: 'Vua bước ra ngoài',
        },
      },
      { san: 'Rc1+' },
      {
        san: 'Kb6',
        annotation: {
          san: 'Kb6',
          piece: 'k',
          reason: 'Vua cứ tiến về phía Xe Đen, coi các nước chiếu chỉ như muỗi đốt.',
          rhyme: 'Vua tiến về phía Xe',
        },
      },
      { san: 'Rb1+' },
      {
        san: 'Kc6',
        annotation: {
          san: 'Kc6',
          piece: 'k',
          reason: 'Cứ nhích từng ô một sang bên - Xe Đen chiếu mãi mà không ăn được gì.',
          rhyme: 'Nhích từng ô một',
        },
      },
      { san: 'Rc1+' },
      {
        san: 'Kb5',
        annotation: {
          san: 'Kb5',
          piece: 'k',
          reason: 'Vua đã tới đúng ô cần đứng để cây cầu được dựng lên.',
          rhyme: 'Tới ô dựng cầu',
        },
      },
      { san: 'Rb1+' },
      {
        san: 'Rb4',
        annotation: {
          san: 'Rb4',
          piece: 'r',
          reason:
            'Xe lao sang b4 chắn ngay giữa Xe Đen và Vua mình. Cây cầu đã xong - Xe Đen hết đường chiếu, Tốt b7 đi lên thành Hậu!',
          rhyme: 'Xe vào bắc cầu',
        },
      },
    ],
  },
  {
    id: 'philidor',
    module: 'philidor',
    kind: 'endgame',
    title: 'Bức tường hàng 6 Philidor',
    gm: 'Phòng thủ Philidor · Karpov',
    emoji: '🧱',
    tagline: 'Thế yếu hơn vẫn hoà được: Xe chặn hàng 6, rồi lùi về đáy mà chiếu.',
    fen: '8/3k4/8/3P4/2K5/8/r7/7R b - - 0 1',
    playerSide: 'black',
    moves: [
      {
        san: 'Ra6',
        annotation: {
          san: 'Ra6',
          piece: 'r',
          reason: 'Xe lên hàng 6 dựng bức tường: Vua Trắng không thể bước lên giúp Tốt.',
          rhyme: 'Xe chặn hàng sáu',
        },
      },
      { san: 'd6' },
      {
        san: 'Ra1',
        annotation: {
          san: 'Ra1',
          piece: 'r',
          reason:
            'Trắng vừa dâng Tốt lên d6 thì Xe phải lùi ngay về hàng đáy. Đứng hàng 6 nữa là hết đất dùng.',
          rhyme: 'Xe lùi về đáy',
        },
      },
      { san: 'Kc5' },
      {
        san: 'Rc1+',
        annotation: {
          san: 'Rc1+',
          piece: 'r',
          reason:
            'Chiếu liên tục từ sau lưng Vua Trắng. Vua không có chỗ nấp, cứ bị chiếu mãi là hoà!',
          rhyme: 'Chiếu sau lưng Vua',
        },
      },
      { san: 'Kd5' },
    ],
  },
]

export function getGmLecture(id: string): GmLecture | undefined {
  return GM_LECTURES.find((lecture) => lecture.id === id)
}

/** Số nước của BÉ trong bài - dùng để tính điểm và thanh tiến độ. */
export function kidStepCount(lecture: GmLecture): number {
  return lecture.moves.filter((ply) => ply.annotation).length
}

/**
 * Nửa nước này có phải của bé không.
 *
 * KHÔNG suy từ `playerSide` - bài Philidor là thế cờ ĐEN ĐI TRƯỚC, nên phải đọc
 * đúng bên đi nước đầu từ FEN (trường thứ hai), nếu không bé sẽ bị hỏi những nước
 * của đối thủ.
 */
export function isKidPly(lecture: GmLecture, ply: number): boolean {
  const firstMover = lecture.fen.split(' ')[1] === 'b' ? 'black' : 'white'
  const firstMoverIsKid = firstMover === lecture.playerSide
  return (ply % 2 === 0) === firstMoverIsKid
}

/** Hệ số dịch số thứ tự nước đi: bài Đen đi trước lệch nửa nước. */
export function plyLabelOffset(lecture: GmLecture): number {
  return lecture.fen.split(' ')[1] === 'b' ? 1 : 0
}
