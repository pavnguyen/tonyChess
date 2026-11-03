export type PieceCode = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type Side = 'white' | 'black'
/**
 * Tuýp ghi nước đi cho bé.
 *
 * Chỉ còn HAI tuýp: `figurine` (hình cờ + ký hiệu quốc tế, ví dụ `♘Nf3`) và
 * `vietnamese` (`Mf3`). Tuýp thuần quốc tế (`Nf3`, không có hình quân) đã bỏ -
 * `figurine` vốn đã chứa sẵn ký hiệu quốc tế nên không cần thêm một lựa chọn
 * riêng nữa, bé nào cũng đọc được ký hiệu thi đấu.
 */
export type NotationStyle = 'figurine' | 'vietnamese'

/** Một nước cờ có gắn lời giải thích dành cho bé. */
export interface MoveAnnotation {
  /** Nước đi viết theo chuẩn SAN, ví dụ "Nf3", "O-O". */
  san: string
  /** Loại quân cờ để hiển thị tên + ký hiệu linh hoạt. */
  piece: PieceCode
  /** Vì sao đi nước này (1 câu ngắn). */
  reason: string
  /** Khẩu quyết vè 4-6 chữ cho bé nhẩm thuộc. */
  rhyme: string
  /** Câu nguyên tắc cờ vua, dùng khi bước đi không có vè (không bắt buộc). */
  principle?: string
}

export interface OpeningMove {
  /** Nước đi SAN của cả hai bên, theo thứ tự thực tế trên bàn cờ. */
  san: string
  /** Chỉ có ở những nước thuộc về bé (các nước được dạy). */
  annotation?: MoveAnnotation
}

/** "Kế hoạch tiếp theo": việc bé cần làm sau khi hết phần khai cuộc đã học. */
export interface OpeningPlan {
  /** Tiêu đề ngắn, ví dụ "Kế hoạch trung cuộc của Trắng". */
  title: string
  /** Từng việc cụ thể, mỗi việc một câu ngắn cho bé. */
  points: string[]
}

/**
 * Tần suất gặp của một khai cuộc - **số đo thật**, khác hẳn `rankNote` (lựa chọn dạy học).
 *
 * `percent` là xác suất đi tới thế cờ đặc trưng của bài, tính bằng **tích xác suất
 * từng nước trên dòng chính** trong cơ sở dữ liệu Lichess, nên là số **xấp xỉ**.
 */
export interface OpeningPopularity {
  /** % số ván tới được thế cờ mốc (đã làm tròn 1 chữ số thập phân). */
  percent: number
  /** Đo ở đâu - hiện kèm để phụ huynh kiểm chứng lại được. */
  source: string
  /** Thế cờ mốc dùng để đo, ví dụ "sau 3.Bc4". */
  position: string
}

export interface Opening {
  id: string
  name: string
  englishName: string
  /** Grand Master nổi tiếng gắn với khai cuộc này. */
  gm: string
  side: Side
  emoji: string
  tagline: string
  /**
   * **Bé muốn gì với khai cuộc này** - ý niệm bao trùm trong MỘT câu, viết cho bé
   * 7 tuổi. Trả lời câu hỏi "mình ra quân kiểu này để làm gì?" trước khi học từng
   * nước, để bé có đích đến chứ không học vẹt.
   *
   * Câu này nên nhắc tới **ô cờ cụ thể** (ví dụ `f7`, `d5`): giao diện đọc chính câu
   * đó để tô sáng các ô ấy trên bàn cờ (`parsePlanFocus`), nên mục tiêu trở nên trực
   * quan mà không cần thêm dữ liệu riêng.
   */
  goal: string
  /**
   * Nhãn 2-3 chữ nói vì sao khai cuộc này đứng ở vị trí đó trong thứ tự ưu tiên
   * học ("Dễ chơi nhất", "Nhiều lý thuyết", "Học sau cùng"…). Hiện ngay dưới tên trên
   * bản đồ.
   *
   * Đây là **lựa chọn dạy học**, không phải số liệu thống kê - muốn nói về tần suất
   * gặp thì dùng `popularity` (số đo thật), đừng viết nhãn nghe như số liệu.
   */
  rankNote?: string
  /**
   * Số liệu thật: khoảng bao nhiêu % số ván đi vào đúng thế cờ của khai cuộc này.
   * Bỏ trống thì giao diện không hiện chip - không hiện ô rỗng cho khai cuộc chưa đo.
   */
  popularity?: OpeningPopularity
  /** Một dòng chính duy nhất, đủ cho cả hai bên (xen kẽ nước bé và nước đối thủ). */
  moves: OpeningMove[]
  /** Kế hoạch trung cuộc, hiện sau khi bé đi hết phần khai cuộc. */
  plan: OpeningPlan
}

/**
 * Chủ đề của bài "tìm nước hay nhất" ở tab Trung cuộc.
 *
 * Khác bộ "đố mẫu" cũ: bé soi **một thế cờ thật** rồi tự tìm nước mạnh nhất, chứ
 * không học thuộc tên đòn. Các nước được máy kiểm chứng là thật sự tốt nhất.
 */
export type BestMoveTheme =
  | 'win-material'
  | 'win-queen'
  | 'pin'
  /** Chiếu bí trong 3 nước: bé đi, đối thủ đỡ một nước, bé chiếu bí. */
  | 'mate'
  /** Hy sinh quân để mở đường cho Hậu/Xe chiếu bí. */
  | 'sacrifice'

/**
 * Một thế cờ trung cuộc để bé "tìm nước hay nhất".
 *
 * `bestSan` là nước mạnh nhất theo đánh giá của engine (kiểm bằng
 * `scripts/verify-bestmove.ts`). `goodMoves` là những nước cũng giữ nguyên lợi thế -
 * bé đi nước nào trong đây cũng được tính đúng, không phải chỉ một đáp án.
 */
export interface BestMovePuzzle {
  id: string
  theme: BestMoveTheme
  title: string
  fen: string
  side: Side
  /** Nước mạnh nhất (SAN), máy đã kiểm chứng. */
  bestSan: string
  /** Các nước cũng được chấp nhận (SAN), luôn chứa `bestSan`. */
  goodMoves: string[]
  hint: string
  explanation: string
  rhyme: string
  /**
   * Chuỗi nước **đánh tiếp** để kết liễu sau nước hay nhất (SAN), luôn bắt đầu bằng
   * nước ĐÁP TRẢ của đối thủ rồi tới nước của bé. Máy tự đi các nước đối thủ, bé phải
   * tự tìm các nước còn lại.
   *
   * Ví dụ `['Kh7', 'Rh1#']`: sau nước hay nhất của bé, máy đi Kh7, bé phải đi Rh1#.
   * Độ dài luôn là **số chẵn** (kết thúc bằng nước của bé). Bỏ trống = thế chỉ cần
   * tìm một nước như cũ.
   */
  continuation?: string[]
}

/**
 * Một nước trong dòng **đối phó** (tab Đối phó). Chỉ nước CỦA BÉ mới có
 * `annotation`, nước của đối thủ thì để trống - giống quy ước của khai cuộc.
 */
export interface CounterMove {
  san: string
  annotation?: MoveAnnotation
}

/**
 * Một bài "đối phó khai cuộc": **đối thủ chơi X thì bé đáp lại Y**.
 *
 * Dòng nước bắt đầu từ nước 1 của ván cờ, xen kẽ nước đối thủ và nước bé. Bé cầm
 * quân NGƯỢC LẠI với `opponentSide`. Mục tiêu là phá thế khai cuộc và chặn đứng
 * kế hoạch triển khai quân của đối phương.
 */
export interface CounterLesson {
  id: string
  /**
   * Id khai cuộc tương ứng trong `OPENINGS` (ví dụ `sicilian`) - dùng để nhảy qua
   * lại giữa bài Đối phó và bài Khai cuộc. Bỏ trống với những bài chỉ bàn về một
   * **nước mở đầu phổ biến** (1.e4, 1.d4…) vốn không có bài khai cuộc riêng.
   * Khi có `openingId` thì id theo quy ước `id = \`vs-${openingId}\``.
   */
  openingId?: string
  /**
   * Tên **QUỐC TẾ** của khai cuộc đối thủ ("London System", "Queen's Indian
   * Defense"…) - tên bé/ba mẹ tra sách, video, cơ sở dữ liệu cờ đều gặp, nên nó
   * là tên hiện chính trên thẻ bài.
   */
  englishName: string
  /** Tên tiếng Việt của khai cuộc đối thủ (dòng phụ dưới tên quốc tế), ví dụ "Hệ thống London". */
  opponentOpening: string
  /** Đối thủ cầm quân gì - bé cầm quân còn lại. */
  opponentSide: Side
  emoji: string
  /** Tên cách đối phó của bé, ví dụ "Giữ d5, đánh vào chân đế d4". */
  counterName: string
  /** Ý tưởng đối phó gói trong 1-2 câu. */
  idea: string
  /**
   * **Đối thủ đang định làm gì** - một câu tóm ý đồ/đe doạ của đối phương, để bé
   * tập thói quen nhận diện kế hoạch của đối thủ trước khi phá nó.
   */
  opponentPlan: string
  /** Ba việc bé cần làm, mỗi việc một câu ngắn. */
  points: string[]
  /** Dòng nước từ nước 1: xen kẽ nước đối thủ và nước bé. */
  moves: CounterMove[]
}

export type EndgameGoal = 'promote' | 'checkmate'

/**
 * Mức của bài tàn cuộc - bé chọn theo trình độ, không phải đoán độ khó.
 *
 * `basic` = kỹ thuật nền (Vua che Tốt, Xe/Hậu chiếu bí); `advanced` = kỹ thuật
 * thật ở mức 1500+: đổi Xe, Tượng đôi, Mã + Tượng, Lucena.
 */
export type EndgameLevel = 'basic' | 'advanced'

export interface EndgameChallenge {
  id: string
  title: string
  goal: EndgameGoal
  /** Mức luyện; bỏ trống thì coi như `basic`. */
  level?: EndgameLevel
  fen: string
  /** Bé cầm quân màu nào. */
  playerSide: Side
  hint: string
  explanation: string
  rhyme: string
}
