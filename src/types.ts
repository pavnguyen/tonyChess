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
  /** Câu nguyên tắc cờ vua thay cho vè ở giai đoạn từ 13 tuổi (không bắt buộc). */
  principle?: string
}

export interface OpeningMove {
  /** Nước đi SAN của cả hai bên, theo thứ tự thực tế trên bàn cờ. */
  san: string
  /** Chỉ có ở những nước thuộc về bé (các nước được dạy). */
  annotation?: MoveAnnotation
}

/**
 * Một nút trong **cây khai cuộc**: một nước đi, kèm các nhánh đi tiếp.
 *
 * Quy ước quan trọng: **phần tử ĐẦU TIÊN của `replies` là nhánh chính** - đúng
 * dòng lý thuyết mà app dạy. Nhờ vậy đọc cây ra được "dòng chính" bằng cách luôn
 * đi theo `replies[0]`, còn các nhánh sau là những cách đáp khác mà đối thủ (hoặc
 * bé) có thể chọn - học phản ứng thay vì học vẹt.
 */
export interface OpeningNode {
  /** Nước đi SAN của nút này. */
  san: string
  /** Lời giảng, chỉ gắn ở nước của bé. */
  annotation?: MoveAnnotation
  /**
   * Một câu ngắn vì sao nên chọn nước này - chỉ có ở nước MỞ ĐẦU một nhánh phụ,
   * hiện làm gợi ý cho bé khi tới ngã ba.
   */
  note?: string
  /** Nhánh đi tiếp. Không có / rỗng = hết bài. */
  replies?: OpeningNode[]
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
  /** Danh sách ply (nửa nước) của NHÁNH CHÍNH, đủ cho cả hai bên. */
  moves: OpeningMove[]
  /** Cây nước đi đầy đủ (nhánh chính = phần tử đầu của `replies`). */
  tree: OpeningNode[]
  /** Kế hoạch trung cuộc, hiện sau khi bé đi hết phần khai cuộc. */
  plan: OpeningPlan
}

export type TacticType =
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered'
  | 'double-check'
  | 'back-rank'
  | 'smothered'

export interface TacticPuzzle {
  id: string
  type: TacticType
  title: string
  /**
   * Câu "Khởi động": câu dễ nhất của mỗi họ đòn, dành cho bé mới học.
   * **Không tính điểm vào mini-Elo** (vẫn ghi vào lịch ôn tập).
   */
  warmup?: boolean
  fen: string
  /** Nước đi đúng (SAN). */
  solution: string
  /** Gợi ý ngắn hiện khi bé bí. */
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

/** Một nửa nước trong bài giảng GM. Nước của bé có `annotation`; nước đối thủ thì không. */
export interface GmPly {
  san: string
  /** Chỉ có ở những nửa nước thuộc về bé. */
  annotation?: MoveAnnotation
  /**
   * Ô cần tô đỏ để bé thấy rõ ý đồ xấu của đối thủ vừa bị hoá giải
   * (dùng cho bài “Phòng thủ dự phòng” - ví dụ ô g4).
   */
  spotlight?: string[]
}

export type GmModule = 'lever' | 'prophylaxis' | 'lucena' | 'philidor'

export interface GmLecture {
  id: string
  module: GmModule
  kind: 'middlegame' | 'endgame'
  title: string
  /** Grand Master gắn với kỹ thuật này. */
  gm: string
  emoji: string
  /** Câu dẫn 1 dòng cho bé. */
  tagline: string
  /** Thế cờ bắt đầu. */
  fen: string
  /** Bé cầm quân màu nào (có bài Đen đi trước - Philidor). */
  playerSide: Side
  /** Đan xen nước của bé và nước đối thủ. */
  moves: GmPly[]
}

/** Kết luận về một thế Tốt: tốt hay xấu cho bé. */
export type PawnVerdict = 'good' | 'bad'

export interface PawnMarker {
  square: string
  tone: 'good' | 'bad'
}

/** Một dạng cấu trúc Tốt để bé nhận diện bằng màu. */
export interface PawnStructureLesson {
  id: string
  name: string
  englishName: string
  verdict: PawnVerdict
  emoji: string
  fen: string
  /** Ô chứa Tốt cần soi, kèm màu xanh (mạnh) hay đỏ (yếu). */
  markers: PawnMarker[]
  reason: string
  /** Khẩu quyết vè 4-6 chữ. */
  rhyme: string
}

export interface RankInfo {
  id: RankId
  title: string
  emoji: string
  minStars: number
}
