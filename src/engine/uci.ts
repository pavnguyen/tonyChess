/**
 * Hàm thuần xử lý giao thức UCI của Stockfish (không đụng tới Worker/DOM) để
 * test được bằng `node scripts/smoke-uci.ts`.
 */
import { Chess } from 'chess.js'
// Chỉ nhập KIỂU (bị xoá khi chạy) để module này không có phụ thuộc runtime nội bộ,
// nhờ vậy `node scripts/smoke-uci.ts` chạy thẳng được mà không cần bước build.
import type { EngineMove } from './minimax'

/**
 * Lấy nước đi từ chuỗi `bestmove` cuối cùng trong các dòng UCI.
 * Trả về nước dạng UCI (ví dụ `e2e4`, `e7e8q`) hoặc `null` nếu không có.
 */
export function extractBestMove(lines: readonly string[]): string | null {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim()
    if (!line.startsWith('bestmove')) continue
    const token = line.split(/\s+/)[1]
    if (!token || token === '(none)' || token === 'none') return null
    return token
  }
  return null
}

/** Độ sâu mà Stockfish đã đạt tới ở dòng `info` cuối cùng (nếu có). */
export function extractDepth(lines: readonly string[]): number | null {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const match = /(?:^|\s)depth\s+(\d+)/.exec(lines[i])
    if (match) return Number(match[1])
  }
  return null
}

/** Stockfish đã sẵn sàng chưa (đã trả `uciok`). */
export function isReady(lines: readonly string[]): boolean {
  return lines.some((line) => line.trim() === 'uciok')
}

/**
 * Đổi một nước UCI (ví dụ `e2e4`, `e7e8q`) thành nước có ký hiệu SAN hợp lệ
 * trên thế cờ `fen`. Dùng chess.js để kiểm tra luật và suy ra SAN.
 */
export function uciToEngineMove(fen: string, uci: string): EngineMove | null {
  const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/i.exec(uci.trim())
  if (!match) return null
  const game = new Chess()
  try {
    game.load(fen)
    const move = game.move({
      from: match[1],
      to: match[2],
      promotion: (match[3] ?? 'q').toLowerCase(),
    })
    return { san: move.san, from: move.from, to: move.to, promotion: move.promotion }
  } catch {
    return null
  }
}
