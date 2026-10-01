import { Chess } from 'chess.js'
import type { Move, Square } from 'chess.js'
import type { CSSProperties } from 'react'
import type { PieceCode, Side } from '../types'

export interface HeatmapColors {
  danger: string
  safe: string
  center: string
  /** Quân của bé đang bị treo - đỏ đậm kèm huy hiệu ⚠️. */
  hanging: string
}

// Bảng màu "đất nung" cho nguy hiểm và "xanh non" cho an toàn - hai gam này
// vẫn nổi rõ trên nền ô trắng lẫn ô xanh lá đậm của bàn cờ.
export const HEATMAP_COLORS: HeatmapColors = {
  danger: 'rgba(188, 95, 78, 0.42)',
  safe: 'rgba(104, 174, 119, 0.3)',
  center: 'rgba(74, 145, 89, 0.55)',
  hanging: 'rgba(160, 74, 59, 0.58)',
}

/** Giá trị quân cờ dùng để phát hiện quân đang bị treo. */
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
}

const CENTER_SQUARES = new Set(['d4', 'e4', 'd5', 'e5'])
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

/** Huy hiệu ⚠️ (dấu chấm than trong vòng tròn đỏ) vẽ bằng SVG nội tuyến. */
const BADGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
  '<circle cx="20" cy="20" r="16" fill="#a04a3b" stroke="#ffffff" stroke-width="4"/>' +
  '<text x="20" y="29" font-family="Arial,Helvetica,sans-serif" font-size="24" ' +
  'font-weight="bold" fill="#ffffff" text-anchor="middle">!</text></svg>'

export const WARNING_BADGE = `url("data:image/svg+xml,${encodeURIComponent(BADGE_SVG)}")`

export interface HangingPiece {
  square: string
  piece: PieceCode
  /** Số quân đối phương đang tấn công ô này (không tính Vua). */
  attackers: number
  /** Số quân nhà đang bảo vệ ô này. */
  defenders: number
}

/**
 * Tìm những quân của bé đang "bị treo" - tức là đối phương có thể ăn mà
 * giành lợi thế. Đây là phần quan trọng nhất của Mắt Thần Cờ Vua.
 *
 * Một quân bị coi là treo khi:
 * - bị tấn công mà KHÔNG có quân nào đỡ, hoặc
 * - bị tấn công bởi quân rẻ hơn giá trị của nó (kể cả khi có quân đỡ).
 */
export function findHangingPieces(game: Chess, viewpoint: Side): HangingPiece[] {
  const own: 'w' | 'b' = viewpoint === 'white' ? 'w' : 'b'
  const foe: 'w' | 'b' = own === 'w' ? 'b' : 'w'
  const found: HangingPiece[] = []

  const board = game.board()
  for (const row of board) {
    for (const cell of row) {
      // Không nhắc về Vua: việc bị chiếu đã được báo riêng.
      if (!cell || cell.color !== own || cell.type === 'k') continue
      const square = cell.square as Square
      const attackers = game.attackers(square, foe)
      if (attackers.length === 0) continue

      const defenders = game.attackers(square, own)
      // Vua đối phương không thể ăn quân đang được bảo vệ.
      const realAttackers = attackers.filter((from) => game.get(from)?.type !== 'k')
      const cheapest = realAttackers.length
        ? Math.min(...realAttackers.map((from) => PIECE_VALUES[game.get(from)?.type ?? 'p']))
        : Number.POSITIVE_INFINITY
      const pieceValue = PIECE_VALUES[cell.type] ?? 0

      const hanging =
        defenders.length === 0 || (realAttackers.length > 0 && cheapest < pieceValue)

      if (hanging) {
        found.push({
          square,
          piece: cell.type as PieceCode,
          attackers: attackers.length,
          defenders: defenders.length,
        })
      }
    }
  }

  return found
}

/**
 * "Mắt Thần Cờ Vua": tô màu ô cờ theo bản đồ nguy hiểm.
 * - Ô bị quân đối phương kiểm soát → đỏ nhẹ.
 * - Quân của bé đang bị treo → đỏ đậm + huy hiệu ⚠️ ở góc ô.
 * - Ô trung tâm quan trọng → xanh đậm; ô an toàn → xanh nhạt.
 */
export function computeHeatmap(
  game: Chess,
  viewpoint: Side,
): Record<string, CSSProperties> {
  const foe: 'w' | 'b' = viewpoint === 'white' ? 'b' : 'w'
  const styles: Record<string, CSSProperties> = {}
  const hanging = new Map(
    findHangingPieces(game, viewpoint).map((item) => [item.square, item]),
  )

  for (const file of FILES) {
    for (let rank = 1; rank <= 8; rank += 1) {
      const square = `${file}${rank}`

      if (hanging.has(square)) {
        styles[square] = {
          backgroundColor: HEATMAP_COLORS.hanging,
          boxShadow: 'inset 0 0 0 3px #a04a3b',
          backgroundImage: WARNING_BADGE,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top right',
          backgroundSize: '44%',
        }
        continue
      }

      const attacked = game.isAttacked(square as Square, foe)
      if (attacked) {
        styles[square] = {
          backgroundColor: HEATMAP_COLORS.danger,
          boxShadow: 'inset 0 0 0 2px rgba(160, 74, 59, 0.5)',
        }
      } else if (CENTER_SQUARES.has(square)) {
        styles[square] = {
          backgroundColor: HEATMAP_COLORS.center,
          boxShadow: 'inset 0 0 0 2px rgba(58, 117, 71, 0.55)',
        }
      } else {
        styles[square] = { backgroundColor: HEATMAP_COLORS.safe }
      }
    }
  }

  return styles
}

/** Nước đi hợp lệ của một quân để tô gợi ý nhẹ khi bé nhấc quân. */
export function legalTargets(game: Chess, square: string): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {}
  let moves: Move[]
  try {
    moves = game.moves({ square: square as Square, verbose: true })
  } catch {
    return styles
  }
  for (const move of moves) {
    const isCapture = Boolean(move.captured)
    styles[move.to] = {
      background: isCapture
        ? 'radial-gradient(circle, rgba(244,63,94,0.55) 0 34%, transparent 36%)'
        : 'radial-gradient(circle, rgba(109,40,217,0.5) 0 22%, transparent 26%)',
      boxShadow: isCapture ? 'inset 0 0 0 3px rgba(244,63,94,0.6)' : undefined,
    }
  }
  return styles
}
