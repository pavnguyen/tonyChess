import { Chessboard, defaultArrowOptions } from 'react-chessboard'
import type { Arrow } from 'react-chessboard'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Chess } from 'chess.js'
import { coordinateLabels } from '../lib/coordinates'
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

  /*
   * “Bàn cờ biết nói” (§ nâng cấp toạ độ): thay vì nhãn a-h / 1-8 mờ nhạt của thư
   * viện, ta tự vẽ khung toạ độ và **làm sáng đúng cột + hàng** bé đang quan tâm.
   * Ưu tiên việc bé ĐANG làm: chạm vào quân nào thì đọc ô đó trước; chỉ khi bé chưa
   * chọn gì mới đọc mũi tên gợi ý của máy. Nhờ vậy bé thấy ngay “quân này đang ở cột
   * e, hàng 2” và quen dần với `e2` mà không phải dò bảng toạ độ ở đâu xa.
   */
  const focusSquares = useMemo(() => {
    if (selected) return [selected]
    return arrows.flatMap((arrow) => [arrow.startSquare, arrow.endSquare])
  }, [selected, arrows])

  const activeFiles = new Set(focusSquares.map((square) => square[0]))
  const activeRanks = new Set(focusSquares.map((square) => square[1]))
  const { files, ranks } = coordinateLabels(orientation)

  // Nhãn đọc to: chọn quân thì đọc đúng ô (`e2`); chưa chọn gì mà có gợi ý thì
  // đọc cả nước (`e2 → e4`).
  const focusLabel = useMemo(() => {
    if (selected) return selected
    const arrow = arrows[0]
    return arrow ? `${arrow.startSquare} → ${arrow.endSquare}` : null
  }, [arrows, selected])

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.1rem] border-[6px] border-brand-800 bg-white shadow-[0_18px_34px_-18px_rgba(13,32,24,0.7)]">
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
            // Tự vẽ khung toạ độ bên dưới thay cho nhãn mặc định của thư viện.
            showNotation: false,
            animationDurationInMs: 280,
            allowDragOffBoard: false,
            dragActivationDistance: 2,
          }}
        />

        {/*
          Khung toạ độ: nhãn cột nằm ở MÉP DƯỚI, nhãn hàng nằm ở MÉP TRÁI (đúng chỗ
          bé hay dò nhất). `pointer-events-none` để không cản thao tác kéo quân.
        */}
        <div id="kid-board-coords" aria-hidden className="pointer-events-none absolute inset-0">
          {focusLabel && (
            <div
              id="kid-board-coord-readout"
              className="absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-full bg-brand-900/85 px-2.5 py-0.5 text-[0.7rem] font-extrabold tracking-wide text-white shadow-lg sm:text-xs"
            >
              {focusLabel}
            </div>
          )}

          <div
            className="absolute inset-x-0 bottom-0 grid"
            style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
          >
            {files.map((file) => (
              <span
                key={file}
                data-coord={file}
                className={`mx-auto mb-0.5 grid size-5 place-items-center rounded-md text-[0.7rem] font-extrabold transition-all sm:size-6 sm:text-xs ${
                  activeFiles.has(file)
                    ? 'scale-110 bg-gold-400 text-gold-950 shadow-md'
                    : 'bg-brand-900/70 text-white'
                }`}
              >
                {file}
              </span>
            ))}
          </div>

          <div
            className="absolute inset-y-0 left-0 grid"
            style={{ gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}
          >
            {ranks.map((rank) => (
              <span
                key={rank}
                data-coord={rank}
                className={`my-auto ml-0.5 grid size-5 place-items-center rounded-md text-[0.7rem] font-extrabold transition-all sm:size-6 sm:text-xs ${
                  activeRanks.has(rank)
                    ? 'scale-110 bg-gold-400 text-gold-950 shadow-md'
                    : 'bg-brand-900/70 text-white'
                }`}
              >
                {rank}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
