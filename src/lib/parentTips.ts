/**
 * Nội dung khung **“Gợi ý cho ba mẹ”** (§10).
 *
 * Ý tưởng: ba mẹ ngồi cạnh bé thường không biết hỏi gì. Ở đây có sẵn **1-2 câu hỏi
 * “đố con”** đúng với bài bé đang học - không phải câu chung chung kiểu “con học
 * gì hôm nay”. Toàn bộ câu hỏi do app tự viết.
 *
 * Hai tầng dữ liệu:
 *  - `TIPS_BY_TAB`    - mẫu chung cho từng tab (dùng khi chưa biết bài cụ thể).
 *  - `TIPS_BY_LESSON` - câu hỏi RIÊNG cho từng bài học, khoá `opening:<id>` /
 *                       `lecture:<id>` (bài học tự “báo lên” qua `useReportLesson`).
 *
 * Module thuần dữ liệu, không phụ thuộc React/DOM.
 */

export interface ParentTip {
  /** Tiêu đề ngắn của tab đang học, ví dụ “Khai cuộc Grand Master”. */
  title: string
  /** 1-2 câu ba mẹ có thể hỏi bé ngay. */
  questions: string[]
}

export const TIPS_BY_TAB: Record<string, ParentTip> = {
  '/': {
    title: 'Khai cuộc Grand Master',
    questions: [
      'Đố con: vì sao Tượng ra f4 TRƯỚC khi đóng Tốt e3?',
      'Con thử kể 3 nước đầu của “Kim tự tháp Tốt” trong hệ thống London.',
    ],
  },
  '/tactics': {
    title: 'Trung cuộc - Mẹo săn quân',
    questions: [
      'Đố con: đòn Bắt đôi (fork) khác đòn Ghim quân (pin) ở chỗ nào?',
      'Con thử chỉ ra quân nào của đối thủ đang không ai che.',
    ],
  },
  '/endgames': {
    title: 'Tàn cuộc - Trạm năng lượng Hậu',
    questions: [
      'Đố con: vì sao trong tàn cuộc Vua phải đi TRƯỚC quân của mình?',
      'Con đếm giúp: còn mấy nước nữa thì Tốt thành Hậu?',
    ],
  },
  '/strategy': {
    title: 'Chiến lược Grand Master',
    questions: [
      'Đố con: vì sao Grand Master hay đổi Tượng lấy Mã?',
      'Con thử chỉ ra cột mở mà Xe nên chiếm trong thế này.',
    ],
  },
  '/free-play': {
    title: 'Đấu tập với chú Máy',
    questions: [
      'Trước mỗi nước, hỏi con: “Đối thủ vừa đi để làm gì?”',
      'Đố con: quân nào của con đang bị treo (không ai che)?',
    ],
  },
}

/** Câu hỏi riêng cho từng bài học. Thiếu thì rơi về mẫu chung của tab. */
export const TIPS_BY_LESSON: Record<string, string[]> = {
  // 8 khai cuộc đang dạy
  'opening:london': [
    'Đố con: vì sao Tượng ra f4 TRƯỚC khi đóng Tốt e3?',
    'Con thử nhắc lại “Kế hoạch trung cuộc” của hệ thống London.',
  ],
  'opening:italian': [
    'Đố con: Tượng ở c4 đang nhắm ô nào? Vì sao ô đó yếu?',
    'Con thử nói tên quân nào đang giữ Tốt e5 của Đen.',
  ],
  'opening:kings-indian': [
    'Đố con: vì sao Đen giấu Tượng vào g7 mà không đưa ra ngoài?',
    'Con thử chỉ ra nước nào của Đen khoá trung tâm.',
  ],
  'opening:sicilian': [
    'Đố con: vì sao Đen đẩy Tốt c5 mà không đẩy Tốt e5?',
    'Tốt c của Đen đổi quân để mở cột nào cho Xe?',
  ],
  'opening:ruy-lopez': [
    'Đố con: Tượng Trắng ở b5 đang ghim quân nào của Đen?',
    'Vì sao Tượng lùi về a4 mà không ăn Mã c6 ngay?',
  ],
  'opening:queens-gambit': [
    'Đố con: vì sao lại dâng Tốt c4 cho Đen ăn?',
    'Con thử nói Đen ăn Tốt c4 thì Trắng lấy lại bằng cách nào.',
  ],
  'opening:french': [
    'Đố con: vì sao Đen đóng Tốt e6 trước khi đẩy d5?',
    'Đen đẩy Tốt c5 để tấn công chân đế Tốt nào của Trắng?',
  ],
  'opening:caro-kann': [
    'Đố con: vì sao Tượng Đen ra f5 TRƯỚC khi đóng Tốt e6?',
    'Con thử nói vì sao Đen lại đổi Tốt ở d5.',
  ],

  // 4 bài giảng GM
  'lecture:minority-attack': [
    'Đố con: Tốt b của Trắng tiến b4-b5 để mở đường cho quân nào?',
    'Sau khi Tốt b Trắng tiến lên, cánh nào của Đen yếu đi?',
  ],
  'lecture:prophylaxis': [
    'Đố con: “phòng thủ dự phòng” nghĩa là gì?',
    'Con thử đoán đối thủ muốn đi gì rồi chặn trước một nước.',
  ],
  'lecture:lucena': [
    'Đố con: vì sao Xe phải lên hàng 4 trước khi Vua tiến lên?',
    'Con thử kể thứ tự các bước để đẩy Vua Đen ra khỏi ô chặn.',
  ],
  'lecture:philidor': [
    'Đố con: khi bị Xe đối phương đẩy xuống, Xe Đen lùi về hàng nào?',
    'Vì sao Phòng thủ Philidor lại là thế HOÀ chứ không thua?',
  ],
}

/** Tab nào đang mở, suy ra từ đường dẫn. */
export function tabKeyForPath(path: string): string {
  const key = Object.keys(TIPS_BY_TAB).find(
    (route) => route !== '/' && path.startsWith(route),
  )
  return key ?? '/'
}

/**
 * Câu hỏi cuối cùng cho ba mẹ: ưu tiên câu RIÊNG của bài đang học, không có thì
 * dùng mẫu chung của tab.
 */
export function tipsFor(path: string, lessonId: string | null | undefined): ParentTip {
  const tab = TIPS_BY_TAB[tabKeyForPath(path)] ?? TIPS_BY_TAB['/']
  const lesson = lessonId ? TIPS_BY_LESSON[lessonId] : undefined
  if (!lesson) return tab
  return { title: tab.title, questions: lesson }
}
