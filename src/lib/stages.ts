/**
 * Lộ trình 7 → 18 tuổi.
 *
 * Nguyên tắc quan trọng nhất: **tuổi chỉ là gợi ý, trình độ mới là quyết định.**
 * Một bé 13 tuổi mới chơi cờ lần đầu cần giao diện của "Thiếu nhi", không phải của
 * "Thiếu niên". Vì vậy mô hình này tách hẳn hai thứ:
 *
 *  - `stage`  - giai đoạn ĐANG HỌC (bố mẹ chọn, mặc định suy ra từ năm sinh), quyết định
 *               nội dung, độ khó máy, những tính năng đã mở khoá.
 *  - `density` - độ "lớn" của giao diện (Nhí = to, hoạt hình, ít chữ; Chuyên nghiệp = dày,
 *               nhiều số liệu, không emoji). Bố mẹ có thể kéo ô này lên/xuống riêng, để một bé
 *               9 tuổi thích "người lớn" vẫn dùng được, và một bé 15 tuổi mới học vẫn thấy dễ đọc.
 *
 * Toàn bộ module chỉ là dữ liệu + hàm thuần, không phụ thuộc React/DOM, nên test được bằng
 * `node scripts/smoke-stages.ts` và dùng lại được ở mọi nơi.
 */
import type { NotationStyle } from '../types'

export type StageId = 'nhi' | 'thieu-nhi' | 'thieu-nien' | 'chuyen-nghiep'

/** Mật độ giao diện: càng lớn càng "người lớn". */
export type Density = 'nhi' | 'thieu-nhi' | 'thieu-nien' | 'chuyen-nghiep'

export type BotLevel = 'easy' | 'medium' | 'hard' | 'master'

/** Chính sách gợi ý: bé nhỏ được giúp nhiều, bé lớn phải tự tính. */
export type HintPolicy = 'auto-after-wrong' | 'on-request' | 'off'

export type Stage = {
  id: StageId
  label: string
  emoji: string
  /** Khoảng tuổi gợi ý (đầu-cuối, tính theo tuổi). */
  ages: readonly [number, number]
  tagline: string
  /** Nội dung cần tập trung ở giai đoạn này. */
  focus: string
  /** Mốc để được lên giai đoạn tiếp theo. */
  promotion: string
  /** Những gì được mở khoá thêm khi vào giai đoạn này. */
  unlocks: readonly string[]
  notation: NotationStyle
  /** Có hiện khẩu quyết vè 4-6 chữ trong banner "Siêu Ngắn" hay không. */
  showRhyme: boolean
  /** Có hiện banner giải thích 3 phần dưới bàn cờ hay không (bé lớn vẫn cần, nhưng gọn hơn). */
  showCoachBanner: boolean
  showEmoji: boolean
  confetti: boolean
  hintPolicy: HintPolicy
  botLevel: BotLevel
  /** Nhãn ô bàn cờ: bé nhỏ cần thấy toạ độ to rõ. */
  boardNotation: boolean
}

export const STAGES: readonly Stage[] = [
  {
    id: 'nhi',
    label: 'Nhí Tò Mò',
    emoji: '🐣',
    ages: [7, 9],
    tagline: 'Chơi mà học: mỗi nước cờ là một câu chuyện ngắn.',
    focus: 'Quân cờ đi thế nào, ăn quân, chiếu Vua, giữ quân khỏi bị treo.',
    promotion: 'Đi hết 4 khai cuộc không cần gợi ý, giải 30 đòn đôi/ghim.',
    unlocks: [
      'Bàn cờ to, chữ to, hoạt hình',
      'Khẩu quyết vè 4-6 chữ dưới mỗi nước',
      '👁️ Mắt Thần Cờ Vua và cảnh báo quân bị treo',
      'Tô màu nước đi bằng mũi tên vàng',
    ],
    notation: 'figurine',
    showRhyme: true,
    showCoachBanner: true,
    showEmoji: true,
    confetti: true,
    hintPolicy: 'auto-after-wrong',
    botLevel: 'easy',
    boardNotation: false,
  },
  {
    id: 'thieu-nhi',
    label: 'Thiếu Nhi Tập Sự',
    emoji: '🛡️',
    ages: [10, 12],
    tagline: 'Bắt đầu có chiến thuật: nhìn trước hai nước.',
    focus: 'Đòn phối hợp 2 nước, cấu trúc tốt, nhập thành, tàn cuộc Vua + Tốt.',
    promotion: 'Tự tìm được đòn 2 nước, thắng máy mức trung bình không cần gợi ý.',
    unlocks: [
      'Đọc trọn biên bản cờ: nhập thành, chiếu, chiếu bí, phong cấp',
      'Chọn câu đố theo chủ đề thay vì học lẫn lộn',
      'Xuất ván đấu ra file PGN',
      'Câu hỏi “đố con” cho ba mẹ theo đúng bài đang học',
    ],
    notation: 'figurine',
    showRhyme: true,
    showCoachBanner: true,
    showEmoji: true,
    confetti: true,
    hintPolicy: 'on-request',
    botLevel: 'medium',
    boardNotation: true,
  },
  {
    id: 'thieu-nien',
    label: 'Thiếu Niên Chiến Lược',
    emoji: '⚔️',
    ages: [13, 15],
    tagline: 'Từ chiến thuật sang chiến lược: kế hoạch dài hơi.',
    focus: 'Chiến lược (cột mở, ô tiền đồn, cặp tượng), tàn cuộc lý thuyết, phân tích ván của mình.',
    promotion: 'Tự phân tích ván vừa đấu, tìm ra nước sai của mình mà không cần máy chỉ.',
    unlocks: [
      'Xem lại ván đấu kèm nhận xét từng nước',
      'Máy chơi có điểm trình độ và tự điều chỉnh theo bé',
      'Cây khai cuộc có phân nhánh (học phản ứng, không học vẹt)',
      'Đấu có đồng hồ: 5|0, 10|0, 15|10',
    ],
    notation: 'figurine',
    showRhyme: false,
    showCoachBanner: true,
    showEmoji: true,
    confetti: false,
    hintPolicy: 'on-request',
    botLevel: 'hard',
    boardNotation: true,
  },
  {
    id: 'chuyen-nghiep',
    label: 'Kỳ Thủ Trưởng Thành',
    emoji: '👑',
    ages: [16, 18],
    tagline: 'Học như một kỳ thủ thật: dữ liệu, phân tích, thi đấu.',
    focus: 'Chuẩn bị khai cuộc cho giải đấu, tính toán sâu, tàn cuộc chuyên sâu, tâm lý thi đấu.',
    promotion: 'Không còn "lên giai đoạn" - giờ là tích lũy điểm và tham gia giải.',
    unlocks: [
      'Bàn phân tích: nhiều biến, đánh giá điểm từng nước',
      'Ngân hàng tàn cuộc lý thuyết (Lucena, Philidor, pháo đài)',
      'Nhập PGN từ Lichess/chess.com để phân tích lại',
      'Chế độ thi đấu nhiều ván và bảng điểm dài hạn',
    ],
    notation: 'figurine',
    showRhyme: false,
    showCoachBanner: false,
    showEmoji: false,
    confetti: false,
    hintPolicy: 'off',
    botLevel: 'master',
    boardNotation: true,
  },
] as const

export const DEFAULT_STAGE_ID: StageId = 'nhi'

/** Tuổi bé lớn nhất mà app còn tính đến - sau đó coi như kỳ thủ trưởng thành. */
export const MAX_TRACKED_AGE = 18

export function stageById(id: StageId): Stage {
  const found = STAGES.find((stage) => stage.id === id)
  if (!found) throw new Error(`Không có giai đoạn nào tên "${id}"`)
  return found
}

/** Giai đoạn gợi ý theo tuổi. Bé dưới 7 tuổi vẫn dùng bản Nhí. */
export function stageForAge(age: number): Stage {
  const safe = Math.max(0, Math.trunc(age))
  const found = STAGES.find((stage) => safe <= stage.ages[1])
  return found ?? STAGES[STAGES.length - 1]
}

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return Math.max(0, now.getFullYear() - Math.trunc(birthYear))
}

/** Tuổi gợi ý của bé theo năm sinh - dùng làm mặc định trong phần cài đặt. */
export function suggestedStage(
  profile: { birthYear?: number | null; age?: number | null },
  now = new Date(),
): Stage {
  if (typeof profile.birthYear === 'number') return stageForAge(ageFromBirthYear(profile.birthYear, now))
  if (typeof profile.age === 'number') return stageForAge(profile.age)
  return stageById(DEFAULT_STAGE_ID)
}

export function nextStageOf(id: StageId): Stage | null {
  const index = STAGES.findIndex((stage) => stage.id === id)
  if (index < 0 || index === STAGES.length - 1) return null
  return STAGES[index + 1]
}

/** Mật độ giao diện đi kèm mặc định, nhưng bố mẹ kéo lên/xuống được độc lập với nội dung. */
export function defaultDensityFor(stage: Stage): Density {
  return stage.id
}

/**
 * Cần đúng gợi ý ở lần sai đầu tiên không?
 * Bé nhỏ thì có (không để bé bí quá lâu rồi nản), bé lớn thì phải tự thử tiếp.
 */
export function shouldAutoHint(stage: Stage, wrongAttempts: number): boolean {
  if (stage.hintPolicy === 'off') return false
  if (stage.hintPolicy === 'on-request') return false
  return wrongAttempts >= 1
}
