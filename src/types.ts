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

export type TacticType = 'fork' | 'pin' | 'skewer'

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

export interface RankInfo {
  id: RankId
  title: string
  emoji: string
  minStars: number
}
