import { Chessboard, defaultArrowOptions } from 'react-chessboard'
import type { Arrow } from 'react-chessboard'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Chess } from 'chess.js'
import { computeHeatmap, legalTargets } from '../lib/threats'
import type { Side } from '../types'

export interface ChessBoardPanelProps {
  fen: string
  orientation: Side
  playerSide: Side
  interactive?: boolean
  heatmap?: boolean
  arrows?: Arrow[]
  extraSquareStyles?: Record<string, CSSProperties>
  onDrop?: (from: string, to: string) => boolean
  className?: string
}

// Bàn cờ kiểu giải đấu: ô trắng ngà + ô xanh lá đậm, viền ngoài xanh rừng.
const DARK_SQUARE: CSSProperties = { backgroundColor: '#2f6b4f' }
const LIGHT_SQUARE: CSSProperties = { backgroundColor: '#ffffff' }

/**
 * Bàn cờ hoạt hình dành cho bé: kéo-thả hoặc bấm-chọn-đi,
 * kèm lớp phủ "Mắt Thần Cờ Vua".
 */
export function ChessBoardPanel({
  fen,
  orientation,
  playerSide,
  interactive = false,
  heatmap = false,
  arrows = [],
  extraSquareStyles,
  onDrop,
  className = '',
}: ChessBoardPanelProps) {
  // Ô đang chọn được lưu kèm thế cờ: đổi FEN là tự bỏ chọn, khỏi cần effect.
  const [selection, setSelection] = useState<{ fen: string; square: string | null }>({
    fen,
    square: null,
  })
  const selected = selection.fen === fen ? selection.square : null
  const setSelected = (square: string | null) => setSelection({ fen, square })

  const game = useMemo(() => {
    const chess = new Chess()
    try {
      chess.load(fen)
    } catch {
      /* giữ bàn cờ trống nếu FEN lỗi */
    }
    return chess
  }, [fen])

  const playerColorChar = playerSide === 'white' ? 'w' : 'b'

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    if (heatmap) Object.assign(styles, computeHeatmap(game, playerSide))
    if (selected && interactive) {
      Object.assign(styles, legalTargets(game, selected))
      styles[selected] = {
        ...(styles[selected] ?? {}),
        boxShadow: 'inset 0 0 0 4px #d9a93f',
      }
    }
    if (extraSquareStyles) Object.assign(styles, extraSquareStyles)
    return styles
  }, [game, heatmap, playerSide, selected, interactive, extraSquareStyles])

  const tryMove = (from: string, to: string): boolean => {
    if (!onDrop) return false
    const moved = onDrop(from, to)
    setSelected(null)
    return moved
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="aspect-square w-full overflow-hidden rounded-[1.1rem] border-[6px] border-brand-800 bg-white shadow-[0_18px_34px_-18px_rgba(13,32,24,0.7)]">
        <Chessboard
          options={{
            id: 'kid-board',
            position: fen,
            boardOrientation: orientation,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              targetSquare ? tryMove(sourceSquare, targetSquare) : false,
            onSquareClick: ({ square, piece }) => {
              if (!interactive) return
              if (selected && selected !== square) {
                if (tryMove(selected, square)) return
              }
              if (piece && piece.pieceType[0] === playerColorChar) {
                setSelected(square === selected ? null : square)
              } else {
                setSelected(null)
              }
            },
            canDragPiece: ({ piece }) =>
              interactive && piece.pieceType[0] === playerColorChar,
            allowDragging: interactive,
            allowDrawingArrows: false,
            arrows,
            // Chỉ nắn nhẹ phần nhìn thấy cho bé; TOÀN BỘ thông số hình học
            // (độ dài, độ dày, điểm bắt đầu) lấy từ mặc định của thư viện.
            // Lưu ý: `arrowStartOffset` tính bằng PHẦN của một ô cờ (0 = tâm ô,
            // 0.5 = mép ô) - đặt sai giá trị sẽ làm đuôi mũi tên nhảy sang ô khác.
            arrowOptions: {
              ...defaultArrowOptions,
              opacity: 0.9,
              // Đuôi mũi tên bắt đầu gần chân quân cờ cho giống chess.com.
              arrowStartOffset: 0.35,
            },
            squareStyles,
            darkSquareStyle: DARK_SQUARE,
            lightSquareStyle: LIGHT_SQUARE,
            dropSquareStyle: { boxShadow: 'inset 0 0 0 5px #d9a93f' },
            showNotation: true,
            animationDurationInMs: 280,
            allowDragOffBoard: false,
            dragActivationDistance: 2,
          }}
        />
      </div>
    </div>
  )
}
