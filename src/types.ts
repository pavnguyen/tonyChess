export type PieceCode = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type Side = 'white' | 'black'
export type NotationStyle = 'figurine' | 'english' | 'vietnamese'

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

export interface Opening {
  id: string
  name: string
  englishName: string
  /** Đại Kiện Tướng nổi tiếng gắn với khai cuộc này. */
  gm: string
  side: Side
  emoji: string
  tagline: string
  /** Danh sách ply (nửa nước) đầy đủ cho cả hai bên. */
  moves: OpeningMove[]
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
  /** Đại Kiện Tướng gắn với kỹ thuật này. */
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
