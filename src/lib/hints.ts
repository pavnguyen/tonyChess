import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import type { EndgameGoal } from '../types'

const rankOf = (square: string) => Number(square.replace(/[^0-9]/g, ''))

const distance = (a: string, b: string) => {
  const fileA = a.charCodeAt(0)
  const fileB = b.charCodeAt(0)
  return Math.abs(fileA - fileB) + Math.abs(rankOf(a) - rankOf(b))
}

/**
 * Gợi ý nước đi tốt nhất theo mục tiêu bài tập (dùng cho nút 💡 Gợi ý).
 */
export function findHintMove(
  game: Chess,
  goal: EndgameGoal,
  playerColor: 'w' | 'b',
): Move | null {
  let moves: Move[]
  try {
    moves = game.moves({ verbose: true })
  } catch {
    return null
  }
  if (moves.length === 0) return null

  if (goal === 'checkmate') {
    // Ưu tiên nước chiếu bí, rồi tới nước chiếu, rồi nước ăn quân.
    for (const move of moves) {
      const probe = new Chess(game.fen())
      probe.move(move.san)
      if (probe.isCheckmate()) return move
    }
    const checks = moves.filter((move) => move.san.includes('+'))
    if (checks.length) return checks[0]
    const captures = moves.filter((move) => move.captured)
    if (captures.length) return captures[0]
    return moves[0]
  }

  // Mục tiêu phong Hậu: đẩy Tốt tiến xa nhất, nếu không thì Vua tiến theo Tốt.
  const pawnMoves = moves.filter((move) => move.piece === 'p')
  if (pawnMoves.length) {
    const playerPawns = game
      .board()
      .flat()
      .filter((square) => square && square.type === 'p' && square.color === playerColor)
    const forward = playerColor === 'w' ? 1 : -1
    const advancing = pawnMoves.filter((move) => rankOf(move.to) > rankOf(move.from))
    const pool = advancing.length ? advancing : pawnMoves
    pool.sort((a, b) => {
      const aNearPawn = playerPawns.length
        ? Math.min(...playerPawns.map((sq) => distance(a.to, sq!.square)))
        : 0
      const bNearPawn = playerPawns.length
        ? Math.min(...playerPawns.map((sq) => distance(b.to, sq!.square)))
        : 0
      const aScore = (rankOf(a.to) - rankOf(a.from)) * forward * 10 - aNearPawn
      const bScore = (rankOf(b.to) - rankOf(b.from)) * forward * 10 - bNearPawn
      return bScore - aScore
    })
    return pool[0]
  }

  const playerPawns = game
    .board()
    .flat()
    .filter((square) => square && square.type === 'p' && square.color === playerColor)
  const kingMoves = moves.filter((move) => move.piece === 'k')
  if (playerPawns.length && kingMoves.length) {
    const target = playerPawns[0]!
    kingMoves.sort((a, b) => distance(a.to, target.square) - distance(b.to, target.square))
    return kingMoves[0]
  }
  return moves[0]
}
