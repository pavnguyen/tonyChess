/**
 * Cây khai cuộc phân nhánh (§4.4).
 *
 * Quy ước xuyên suốt: **phần tử ĐẦU TIÊN của `replies` là nhánh chính** - đúng
 * dòng lý thuyết app dạy. Nhờ vậy:
 *  - đọc "dòng chính" chỉ là đi theo `replies[0]` ở mọi tầng;
 *  - mọi nhánh khác là cách đáp khác mà Đối thủ (hoặc bé) có thể chọn, để bé học
 *    **phản ứng** thay vì học vẹt một dòng.
 *
 * Module này thuần dữ liệu + hàm, không phụ thuộc React/DOM, nên vừa dùng được
 * trong trang vừa đem đi kiểm chứng bằng `validate-chess.ts`.
 */
import type { MoveAnnotation, OpeningMove, OpeningNode } from '../types'

/** Một nước trong dữ liệu viết tay (nhánh chính hoặc nhánh phụ). */
export interface RawOpeningMove {
  san: string
  /** Lời giảng, chỉ gắn ở nước của bé. */
  annotation?: MoveAnnotation
}

/**
 * Một nhánh phụ: rẽ ở ply `at` của NHÁNH CHÍNH rồi đi tiếp `moves`.
 * `moves[0]` chính là nước thay thế; các nước sau là dòng tiếp theo của nhánh đó.
 */
export interface RawBranch {
  /** Ply (0-based) trong nhánh chính mà nhánh này thay thế. */
  at: number
  /** Một câu ngắn vì sao đối thủ (hoặc bé) chọn nước này. */
  note: string
  moves: RawOpeningMove[]
}

/**
 * Dựng cây từ dạng "dòng chính + danh sách nhánh" - dễ viết tay và dễ soi lỗi hơn
 * nhiều so với lồng ngoặc thủ công.
 */
export function buildOpeningTree(main: RawOpeningMove[], branches: RawBranch[]): OpeningNode[] {
  const chain: OpeningNode[] = main.map((move) => ({ san: move.san, annotation: move.annotation }))
  for (let i = chain.length - 1; i > 0; i -= 1) {
    chain[i - 1].replies = [chain[i]]
  }

  // Gốc cây là TẦNG ĐẦU TIÊN, không phải cả dãy `chain` (mỗi nút trong `chain`
  // là con của nút trước nó, không phải anh em ruột).
  const root: OpeningNode[] = chain.length > 0 ? [chain[0]] : []

  // Nhánh nông trước để thông báo lỗi (nếu có) đọc theo đúng thứ tự nước đi.
  for (const branch of [...branches].sort((a, b) => a.at - b.at)) {
    const nodes: OpeningNode[] = branch.moves.map((move, index) => ({
      san: move.san,
      annotation: move.annotation,
      note: index === 0 ? branch.note : undefined,
    }))
    for (let i = nodes.length - 1; i > 0; i -= 1) {
      nodes[i - 1].replies = [nodes[i]]
    }
    if (branch.at === 0) {
      // Nhánh rẽ ngay nước đầu: thêm vào CUỐI để nhánh chính giữ vị trí đầu tiên
      // (mọi hàm dưới đây đọc dòng chính bằng `replies[0]`).
      root.push(nodes[0])
      continue
    }
    const parent = chain[branch.at - 1]
    if (!parent) {
      throw new Error(
        `Nhánh rẽ ở ply ${branch.at} nhưng dòng chính chỉ có ${chain.length} ply`,
      )
    }
    parent.replies = [...(parent.replies ?? []), nodes[0]]
  }

  return root
}

/** Nước đi của DÒNG CHÍNH: luôn đi theo nhánh đầu tiên. */
export function mainLine(tree: OpeningNode[]): OpeningMove[] {
  const moves: OpeningMove[] = []
  let level = tree
  while (level.length > 0) {
    const node = level[0]
    moves.push({ san: node.san, annotation: node.annotation })
    level = node.replies ?? []
  }
  return moves
}

/** Các NÚT của dòng chính (khác `mainLine` chỉ trả về nước đi). */
export function mainNodes(tree: OpeningNode[]): OpeningNode[] {
  const nodes: OpeningNode[] = []
  let level = tree
  while (level.length > 0) {
    nodes.push(level[0])
    level = level[0].replies ?? []
  }
  return nodes
}

/** Các nước có thể đi tiếp từ vị trí hiện tại (`path` = các nút đã đi). */
export function repliesOf(tree: OpeningNode[], path: OpeningNode[]): OpeningNode[] {
  if (path.length === 0) return tree
  return path[path.length - 1].replies ?? []
}

/** Đổi đường đi đã chọn thành danh sách nước cho `MoveStrip`. */
export function pathToMoves(path: OpeningNode[]): OpeningMove[] {
  return path.map((node) => ({ san: node.san, annotation: node.annotation }))
}

/** Nhãn "1. d4" / "1... d5" cho một ply. */
export function plyLabel(index: number): string {
  const moveNumber = Math.floor(index / 2) + 1
  return `${moveNumber}${index % 2 === 0 ? '.' : '...'}`
}

/**
 * Mọi nhánh phụ của cây, kèm đường đi tới đó - dùng để hiển thị "cây khai cuộc"
 * cho bé xem trước những cách đáp khác, và để kiểm chứng bằng validate-chess.
 */
export interface TreeFork {
  /** Ply trong nhánh chính nơi rẽ. */
  at: number
  /** Tất cả nước có thể đi ở ply đó (phần tử đầu là nhánh chính). */
  options: OpeningNode[]
}

export function forksOf(tree: OpeningNode[]): TreeFork[] {
  const forks: TreeFork[] = []
  const walk = (level: OpeningNode[], ply: number) => {
    if (level.length === 0) return
    if (level.length > 1) forks.push({ at: ply, options: level })
    walk(level[0].replies ?? [], ply + 1)
  }
  walk(tree, 0)
  return forks
}

/** Độ sâu của dòng chính (số ply). */
export function treeDepth(tree: OpeningNode[]): number {
  return mainLine(tree).length
}

/** Số nút của cả cây (mọi nhánh) - để báo cáo trong bài kiểm chứng. */
export function countNodes(tree: OpeningNode[]): number {
  let total = 0
  for (const node of tree) {
    total += 1 + countNodes(node.replies ?? [])
  }
  return total
}
