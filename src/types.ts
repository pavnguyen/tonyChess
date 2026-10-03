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
export type BestMoveTheme = 'attack' | 'win-material' | 'win-queen' | 'passed-pawn'

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
