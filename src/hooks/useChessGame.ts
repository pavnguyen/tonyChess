import { Chess } from 'chess.js'
import type { Move, Square } from 'chess.js'
import { useCallback, useMemo, useState } from 'react'
import type { Side } from '../types'

export interface LastMove {
  from: string
  to: string
  san: string
  color: 'w' | 'b'
  captured?: string
  promotion?: string
}

interface HistoryState {
  key: string
  sans: string[]
}

/** Mảng rỗng dùng chung để deps của useMemo luôn ổn định. */
const NO_MOVES: string[] = []

/**
 * Ván cờ "điều khiển": trạng thái chỉ lưu danh sách nước SAN,
 * `chess.js` được dựng lại từ FEN gốc nên không bao giờ lệch trạng thái.
 * Khi FEN gốc đổi (sang thế cờ mới), ván cờ tự động bắt đầu lại.
 */
export function useChessGame(initialFen: string, playerSide: Side) {
  const [state, setState] = useState<HistoryState>({ key: initialFen, sans: [] })
  const playerColor: 'w' | 'b' = playerSide === 'white' ? 'w' : 'b'

  // FEN gốc đổi → coi như ván mới, không cần effect reset.
  const sans = useMemo(
    () => (state.key === initialFen ? state.sans : NO_MOVES),
    [state.key, state.sans, initialFen],
  )

  const game = useMemo(() => {
    const chess = new Chess()
    try {
      chess.load(initialFen)
    } catch {
      /* FEN gốc lỗi thì để bàn cờ mặc định */
    }
    for (const san of sans) {
      try {
        chess.move(san)
      } catch {
        /* bỏ qua nước lỗi */
      }
    }
    return chess
  }, [initialFen, sans])

  const history = useMemo(() => {
    const probe = new Chess()
    try {
      probe.load(initialFen)
    } catch {
      /* ignore */
    }
    const verbose: Move[] = []
    for (const san of sans) {
      try {
        verbose.push(probe.move(san))
      } catch {
        /* ignore */
      }
    }
    return verbose
  }, [initialFen, sans])

  const lastMove: LastMove | null = useMemo(() => {
    const last = history[history.length - 1]
    if (!last) return null
    return {
      from: last.from,
      to: last.to,
      san: last.san,
      color: last.color,
      captured: last.captured,
      promotion: last.promotion,
    }
  }, [history])

  const append = useCallback(
    (san: string) => {
      setState((prev) => {
        const base = prev.key === initialFen ? prev.sans : []
        return { key: initialFen, sans: [...base, san] }
      })
    },
    [initialFen],
  )

  const fen = game.fen()
  const playerToMove = game.turn() === playerColor

  /** Bé thử đi một nước; trả về nước hợp lệ hoặc null. */
  const playMove = useCallback(
    (from: string, to: string, promotion = 'q'): Move | null => {
      const probe = new Chess(game.fen())
      let move: Move
      try {
        move = probe.move({ from, to, promotion })
      } catch {
        return null
      }
      append(move.san)
      return move
    },
    [game, append],
  )

  /** Đi đúng một nước SAN cho trước (để kiểm tra đáp án / dọn bàn). */
  const playSan = useCallback(
    (san: string): Move | null => {
      const probe = new Chess(game.fen())
      let move: Move
      try {
        move = probe.move(san)
      } catch {
        return null
      }
      append(move.san)
      return move
    },
    [game, append],
  )

  const reset = useCallback(() => {
    setState({ key: initialFen, sans: [] })
  }, [initialFen])

  /** Lùi lại `count` nửa nước (dùng cho nút "Đi lại" của bé). */
  const undoMoves = useCallback(
    (count = 1) => {
      setState((prev) => {
        const base = prev.key === initialFen ? prev.sans : []
        return { key: initialFen, sans: base.slice(0, Math.max(0, base.length - count)) }
      })
    },
    [initialFen],
  )

  const legalMovesFor = useCallback(
    (square: string): Move[] => {
      try {
        return game.moves({ square: square as Square, verbose: true })
      } catch {
        return []
      }
    },
    [game],
  )

  return {
    game,
    fen,
    sans,
    history,
    lastMove,
    playerToMove,
    playMove,
    playSan,
    reset,
    undoMoves,
    legalMovesFor,
  }
}
