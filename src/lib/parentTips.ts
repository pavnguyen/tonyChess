/**
 * Nội dung khung **“Gợi ý cho ba mẹ”** (§10).
 *
 * Ý tưởng: ba mẹ ngồi cạnh bé thường không biết hỏi gì, mà cũng **không phải dân
 * chuyên cờ Vua** nên nhiều khi không dám hỏi. Vì vậy mỗi câu hỏi ở đây đều có kèm
 * một **đáp án gợi ý ngắn** - ba mẹ đọc là biết ngay nên nói gì với bé, không cần
 * biết trước. Toàn bộ câu hỏi và đáp án do app tự viết.
 *
 * Hai tầng dữ liệu:
 *  - `TIPS_BY_TAB`    - mẫu chung cho từng tab (khi chưa biết bài cụ thể).
 *  - `TIPS_BY_LESSON` - câu hỏi RIÊNG cho từng bài học, khoá `opening:<id>` /
 *                       `principle:<id>` (bài học tự “báo lên” qua `useReportLesson`).
 *
 * Module thuần dữ liệu, không phụ thuộc React/DOM.
 */

/** Một câu “đố con” kèm đáp án gợi ý để ba mẹ không biết cờ vẫn dùng được. */
export interface ParentQuestion {
  /** Câu ba mẹ hỏi bé. */
  q: string
  /** Đáp án gợi ý ngắn - ba mẹ đọc rồi nhắc bé. */
  a: string
}

export interface ParentTip {
  /** Tiêu đề ngắn của tab đang học, ví dụ “Khai cuộc Grand Master”. */
  title: string
  /** 1-2 câu ba mẹ có thể hỏi bé ngay, mỗi câu có sẵn đáp án gợi ý. */
  questions: ParentQuestion[]
}

export const TIPS_BY_TAB: Record<string, ParentTip> = {
  '/': {
    title: 'Khai cuộc Grand Master',
    questions: [
      {
        q: 'Đố con: vì sao Tượng ra f4 TRƯỚC khi đóng Tốt e3?',
        a: 'Ra f4 trước thì Tốt e3 mới khoá được “đuôi” Tượng mà không nhốt nó lại trong nhà.',
      },
      {
        q: 'Con thử kể 3 nước đầu của “Kim tự tháp Tốt” trong hệ thống London.',
        a: 'Đại khái là đẩy Tốt d4, rồi Tốt e3, rồi Tốt c3 - ba chân đế xếp vững như kim tự tháp.',
      },
    ],
  },
  '/counters': {
    title: 'Đối phó khai cuộc',
    questions: [
      {
        q: 'Đố con: đối thủ đang chơi khai cuộc gì, và mình đáp lại để phá thế nào?',
        a: 'Cùng bé gọi tên khai cuộc của đối thủ rồi nhắc lại một việc đối phó - ví dụ đánh vào chân đế Tốt trung tâm.',
      },
      {
        q: 'Con thử chỉ ra nước nào của mình đang đuổi quân đối thủ đi chỗ khác.',
        a: 'Những nước như đẩy Tốt đuổi Tượng hay Tốt đuổi Mã làm đối thủ phải lùi - đó là cách chặn triển khai quân của bạn.',
      },
    ],
  },
  '/tactics': {
    title: 'Trung cuộc - Tìm nước hay nhất',
    questions: [
      {
        q: 'Đố con: vì sao nước đó là mạnh nhất, chứ không phải nước nào khác?',
        a: 'Vì nó giữ được lợi thế lớn nhất - ăn quân to, đẩy Tốt thông, hay chiếu bí. Máy đã chấm nước này là tốt nhất.',
      },
      {
        q: 'Con thử chỉ ra quân nào của đối thủ đang không ai che.',
        a: 'Đó là quân đang bị tấn công mà đối thủ không có quân nào bảo vệ - mình có thể ăn.',
      },
    ],
  },
  '/endgames': {
    title: 'Tàn cuộc cơ bản',
    questions: [
      {
        q: 'Đố con: vì sao trong tàn cuộc Vua phải đi TRƯỚC quân của mình?',
        a: 'Vì ở tàn cuộc Vua là quân tấn công mạnh: Vua dọn đường rồi Tốt và quân mới theo sau an toàn.',
      },
      {
        q: 'Con đếm giúp: còn mấy nước nữa thì Tốt thành Hậu?',
        a: 'Đếm số ô từ Tốt tới hàng cuối rồi trừ đi số nước cần - ba mẹ chỉ cần cùng bé đếm.',
      },
    ],
  },
  '/strategy': {
    title: 'Chiến lược - 10 nguyên tắc vàng',
    questions: [
      {
        q: 'Đố con: bốn nguyên tắc vàng đầu tiên là gì?',
        a: 'Chiếm trung tâm, phát triển quân, nhập thành sớm, và đừng để quân bị treo.',
      },
      {
        q: 'Con thử chỉ ra cột mở mà Xe nên chiếm trong thế này.',
        a: 'Là cột không còn Tốt nào (hoặc chỉ còn Tốt một bên) - Xe đứng đó mới có đường xuống.',
      },
    ],
  },
  '/free-play': {
    title: 'Đấu tập với chú Máy',
    questions: [
      {
        q: 'Trước mỗi nước, hỏi con: “Đối thủ vừa đi để làm gì?”',
        a: 'Câu này dạy bé nhìn ý đồ đối thủ thay vì chỉ lo đi nước của mình.',
      },
      {
        q: 'Đố con: quân nào của con đang bị treo (không ai che)?',
        a: 'Cùng bé soi lại: quân nào đang bị tấn công mà không có quân mình bảo vệ thì phải lo cứu.',
      },
    ],
  },
}

/** Câu hỏi riêng cho từng bài học. Thiếu thì rơi về mẫu chung của tab. */
export const TIPS_BY_LESSON: Record<string, ParentQuestion[]> = {
  // 10 khai cuộc đang dạy
  'opening:london': [
    {
      q: 'Đố con: vì sao Tượng ra f4 TRƯỚC khi đóng Tốt e3?',
      a: 'Ra f4 trước thì Tốt e3 mới khoá được “đuôi” Tượng mà không nhốt nó lại trong nhà.',
    },
    {
      q: 'Con thử nhắc lại “Kế hoạch trung cuộc” của hệ thống London.',
      a: 'Đưa Tượng f1 ra d3 rồi nhập thành cho Vua an toàn; sau đó đẩy Tốt e4 mở trung tâm, và đánh sang cánh Vua bằng h4-h5 mở cột h.',
    },
  ],
  'opening:italian': [
    {
      q: 'Đố con: Tượng ở c4 đang nhắm ô nào? Vì sao ô đó yếu?',
      a: 'Tượng nhắm ô f7 - ô yếu nhất quanh Vua Đen vì chỉ có mỗi Vua che.',
    },
    {
      q: 'Con thử nói tên quân nào đang giữ Tốt e5 của Đen.',
      a: 'Là Mã c6 - quân đang bảo vệ Tốt e5.',
    },
  ],
  'opening:kings-indian': [
    {
      q: 'Đố con: vì sao Đen giấu Tượng vào g7 mà không đưa ra ngoài?',
      a: 'Vì Tượng ở g7 nằm sau hàng Tốt, quét đường chéo dài mà không bị quân nào đuổi.',
    },
    {
      q: 'Con thử chỉ ra nước nào của Đen khoá trung tâm.',
      a: 'Là nước đẩy Tốt e5 - vừa khoá trung tâm vừa mở đường đánh sang cánh Vua.',
    },
  ],
  'opening:sicilian': [
    {
      q: 'Đố con: vì sao Đen đẩy Tốt c5 mà không đẩy Tốt e5?',
      a: 'Tốt c5 đánh vào cánh Hậu để giành thế chủ động, thay vì đáp cân bằng bằng e5.',
    },
    {
      q: 'Tốt c của Đen đổi quân để mở cột nào cho Xe?',
      a: 'Mở cột c cho Xe Đen tràn xuống.',
    },
  ],
  'opening:ruy-lopez': [
    {
      q: 'Đố con: Tượng Trắng ở b5 đang ghim quân nào của Đen?',
      a: 'Ghim Mã c6 - quân đang giữ Tốt e5, nên thật ra là tấn công gián tiếp Tốt e5.',
    },
    {
      q: 'Vì sao Tượng lùi về a4 mà không ăn Mã c6 ngay?',
      a: 'Ăn ngay thì Đen lấy lại bằng Hậu; lùi về giữ nguyên mũi ghim và tránh bị đổi.',
    },
  ],
  'opening:queens-gambit': [
    {
      q: 'Đố con: vì sao lại dâng Tốt c4 cho Đen ăn?',
      a: 'Dâng Tốt c4 để Đen bận giữ Tốt d5, nhờ đó Trắng làm chủ trung tâm và ra quân nhanh hơn.',
    },
    {
      q: 'Con thử nói Đen ăn Tốt c4 thì Trắng lấy lại bằng cách nào.',
      a: 'Trắng đưa Tượng ra đòi lại Tốt c4, còn Đen lo giữ Tốt thì bị chậm ra quân.',
    },
  ],
  'opening:french': [
    {
      q: 'Đố con: vì sao Đen đóng Tốt e6 trước khi đẩy d5?',
      a: 'Tốt e6 dựng hàng rào vững rồi mới đẩy d5 để chiếm trung tâm.',
    },
    {
      q: 'Đen đẩy Tốt c5 để tấn công chân đế Tốt nào của Trắng?',
      a: 'Để tấn công chân đế Tốt d4 của Trắng.',
    },
  ],
  'opening:caro-kann': [
    {
      q: 'Đố con: vì sao Tượng Đen ra f5 TRƯỚC khi đóng Tốt e6?',
      a: 'Ra f5 trước để Tượng thoát ra ngoài, khỏi bị Tốt e6 nhốt lại - đúng bí quyết Caro-Kann.',
    },
    {
      q: 'Con thử nói vì sao Đen lại đổi Tốt ở d5.',
      a: 'Đổi Tốt ở d5 để mở đường cho Tượng c8 ra ngoài.',
    },
  ],
  'opening:english': [
    {
      q: 'Đố con: Tốt c4 kiểm soát ô trung tâm nào?',
      a: 'Kiểm soát ô d5 từ xa, chưa vội chiếm trung tâm bằng Tốt.',
    },
    {
      q: 'Con thử nói vì sao khai cuộc Anh không vội đẩy Tốt trung tâm.',
      a: 'Giữ Tốt trung tâm chưa đẩy để còn tuỳ thế trận mà chọn hướng, chơi rất linh hoạt.',
    },
  ],
  'opening:nimzo-indian': [
    {
      q: 'Đố con: Tượng b4 ghim Mã c3 để làm gì?',
      a: 'Ghim Mã c3 để khoá không cho Trắng đẩy e4, đồng thời dọa đổi Tượng lấy Mã.',
    },
    {
      q: 'Con thử nói vì sao Đen không cho Trắng đẩy Tốt e4.',
      a: 'Vì nếu Trắng đẩy được e4 thì Trắng chiếm trung tâm mạnh; ghim Mã c3 sẽ ngăn nước đó.',
    },
  ],

  // 10 nguyên tắc vàng
  'principle:center': [
    {
      q: 'Đố con: bốn ô trung tâm là ô nào?',
      a: 'Là d4, e4, d5, e5 - bốn ô ở chính giữa bàn cờ.',
    },
    {
      q: 'Con thử đếm xem mấy quân của con đang kiểm soát trung tâm.',
      a: 'Đếm số quân (kể cả Tốt) đang nhắm hoặc đứng ở bốn ô giữa.',
    },
  ],
  'principle:develop': [
    {
      q: 'Đố con: còn mấy quân của con đang còn nằm ở hàng cuối?',
      a: 'Đếm số Mã và Tượng còn ở hàng 1 (Trắng) hoặc hàng 8 (Đen).',
    },
    {
      q: 'Con thử chỉ ra nước vừa rồi đã đưa thêm được quân nào ra trận.',
      a: 'Nước phát triển là nước đưa Mã hoặc Tượng từ hàng cuối ra ngoài.',
    },
  ],
  'principle:castle': [
    {
      q: 'Đố con: nhập thành để làm gì?',
      a: 'Đưa Vua vào góc an toàn sau hàng Tốt, đồng thời đưa Xe ra gần trung tâm.',
    },
    {
      q: 'Con đếm xem Vua của con đã an toàn trong lều chưa.',
      a: 'Vua nhập thành xong và có hàng Tốt che phía trước là an toàn.',
    },
  ],
  'principle:hanging': [
    {
      q: 'Đố con: quân nào của con đang bị treo (không ai che)?',
      a: 'Là quân đang bị đối phương tấn công mà không có quân mình bảo vệ.',
    },
    {
      q: 'Trước khi con đi, mình thử đếm lại một lượt quân nhé.',
      a: 'Cùng bé điểm qua từng quân xem có quân nào đang bị tấn công không.',
    },
  ],
  'principle:open-file': [
    {
      q: 'Đố con: cột nào đang hết Tốt để Xe tràn xuống?',
      a: 'Là cột không còn Tốt nào (hoặc chỉ còn Tốt một bên) - Xe nên chiếm cột đó.',
    },
    {
      q: 'Con thử nói vì sao Xe lại thích đứng ở cột mở.',
      a: 'Vì Xe đi đường dài; cột mở cho Xe con đường thông để tràn xuống hàng địch.',
    },
  ],
  'principle:outpost': [
    {
      q: 'Đố con: ô nào Tốt địch không đuổi được Mã của con?',
      a: 'Là ô ở hàng 5-6 mà Tốt địch không còn cách nào tới đánh, lại được Tốt mình che.',
    },
    {
      q: 'Con thử chỉ ra tiền đồn đẹp nhất trên bàn cờ.',
      a: 'Tìm ô mà Mã đứng yên an toàn và toả ra được nhiều ô.',
    },
  ],
  'principle:seventh-rank': [
    {
      q: 'Đố con: Xe lên hàng 7 thì đe dọa được gì?',
      a: 'Tấn công Tốt chưa tiến của địch và nhốt Vua địch ở hàng cuối.',
    },
    {
      q: 'Con thử tìm cách đưa Xe lên hàng Tốt của địch.',
      a: 'Tìm cột mở rồi đưa Xe lên hàng 7 (Trắng) hoặc hàng 2 (Đen).',
    },
  ],
  'principle:passed-pawn': [
    {
      q: 'Đố con: Tốt thông là Tốt thế nào?',
      a: 'Là Tốt không còn Tốt địch nào trên cùng cột hay cột bên cạnh để cản đường.',
    },
    {
      q: 'Con đếm xem Tốt thông của con còn mấy bước nữa thành Hậu.',
      a: 'Đếm số ô còn lại từ Tốt tới hàng cuối.',
    },
  ],
  'principle:bishop-pair': [
    {
      q: 'Đố con: vì sao giữ được hai Tượng lại là lợi thế?',
      a: 'Hai Tượng phủ cả ô sáng lẫn ô tối; bàn cờ càng thoáng thì càng mạnh.',
    },
    {
      q: 'Con thử đếm xem mỗi bên còn mấy Tượng.',
      a: 'Đếm số Tượng của mỗi bên đang có trên bàn.',
    },
  ],
  'principle:trade': [
    {
      q: 'Đố con: đang hơn quân thì nên đổi quân hay giữ quân?',
      a: 'Hơn quân thì nên đổi bớt cho gọn để tiến thẳng tới thắng.',
    },
    {
      q: 'Con thử nói khi nào thì nên đổi quân cho gọn.',
      a: 'Khi đang hơn quân, hoặc khi đổi được quân xấu của mình lấy quân tốt của địch.',
    },
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
