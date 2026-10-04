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
  | 'attack'
  | 'win-material'
  | 'win-queen'
  | 'passed-pawn'
  | 'fork'
  | 'pin'
  | 'mate-two'

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
  /** Khai cuộc mà ĐỐI THỦ đang dùng, ví dụ "Hệ thống London". */
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

export interface EndgameChallenge {
  id: string
  title: string
  goal: EndgameGoal
  fen: string
  /** Bé cầm quân màu nào. */
  playerSide: Side
  hint: string
  explanation: string
  rhyme: string
}

export type RankId = 'seed' | 'apprentice' | 'knight' | 'master'

export interface RankInfo {
  id: RankId
  title: string
  emoji: string
  minStars: number
}
