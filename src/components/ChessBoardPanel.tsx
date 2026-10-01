import { Chessboard } from 'react-chessboard'
import type { Arrow } from 'react-chessboard'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Chess } from 'chess.js'
import { PIECE_NAME_VI } from '../lib/notation'
import { computeHeatmap, findHangingPieces, legalTargets } from '../lib/threats'
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

const DARK_SQUARE: CSSProperties = { backgroundColor: '#7ea6f5' }
const LIGHT_SQUARE: CSSProperties = { backgroundColor: '#fdf3d8' }

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

  // Quân của bé đang bị treo — hiện kèm danh sách cảnh báo bên dưới bàn cờ.
  const hanging = useMemo(
    () => (heatmap ? findHangingPieces(game, playerSide) : []),
    [game, heatmap, playerSide],
  )

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    if (heatmap) Object.assign(styles, computeHeatmap(game, playerSide))
    if (selected && interactive) {
      Object.assign(styles, legalTargets(game, selected))
      styles[selected] = {
        ...(styles[selected] ?? {}),
        boxShadow: 'inset 0 0 0 4px #facc15',
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
      <div className="aspect-square w-full overflow-hidden rounded-[1.4rem] border-[6px] border-white bg-white shadow-[0_16px_30px_-16px_rgba(88,28,135,0.65)]">
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
            arrowOptions: {
              colors: {
                default: '#f59e0b',
                shift: '#f59e0b',
                ctrl: '#f59e0b',
                alt: '#f59e0b',
                meta: '#f59e0b',
              },
              color: '#f59e0b',
              secondaryColor: '#f59e0b',
              tertiaryColor: '#f59e0b',
              arrowLengthReducerDenominator: 5,
              sameTargetArrowLengthReducerDenominator: 6,
              arrowWidthDenominator: 5,
              activeArrowWidthMultiplier: 1.1,
              opacity: 0.9,
              activeOpacity: 0.9,
              arrowStartOffset: 6,
            },
            squareStyles,
            darkSquareStyle: DARK_SQUARE,
            lightSquareStyle: LIGHT_SQUARE,
            dropSquareStyle: { boxShadow: 'inset 0 0 0 5px #facc15' },
            showNotation: true,
            animationDurationInMs: 280,
            allowDragOffBoard: false,
            dragActivationDistance: 2,
          }}
        />
      </div>

      {heatmap && hanging.length > 0 && (
        <div className="animate-pop-in mt-2 rounded-2xl border-[3px] border-rose-300 bg-rose-50 p-2.5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-rose-600">
            ⚠️ Mắt Thần báo động: {hanging.length} quân đang bị treo!
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {hanging.map((item) => (
              <li
                key={item.square}
                className="rounded-xl bg-white px-2 py-1 text-xs font-extrabold text-rose-700 shadow-sm"
              >
                {PIECE_NAME_VI[item.piece]} ở ô {item.square}
                {item.defenders === 0 ? ' — không ai đỡ!' : ' — bị quân rẻ hơn tấn công!'}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[0.7rem] font-bold text-rose-500">
            🆘 Bé hãy tìm cách cứu quân, hoặc đổi quân cho ngang sức nhé!
          </p>
        </div>
      )}

      {heatmap && hanging.length === 0 && (
        <p className="mt-2 rounded-2xl border-[3px] border-emerald-200 bg-emerald-50 p-2 text-center text-xs font-extrabold text-emerald-700">
          ✅ Mắt Thần thấy an toàn: chưa có quân nào của bé bị treo!
        </p>
      )}
    </div>
  )
}
