import { Chessboard, defaultArrowOptions } from 'react-chessboard'
import type { Arrow } from 'react-chessboard'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Chess } from 'chess.js'
import { coordinateLabels } from '../lib/coordinates'
import { speakMove, speakPiece, speakSquare } from '../lib/speech'
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
  /**
   * Nước đi (SAN) cần **đọc to** khi nó vừa xuất hiện, ví dụ `Ne3` → "Knight E 3".
   * Đổi giá trị là đọc; `null` là không đọc gì.
   */
  announce?: string | null
  onDrop?: (from: string, to: string) => boolean
  /**
   * Tiền tố id của các phần tử DOM bàn cờ (mặc định `kid-board`). Đặt khác đi khi
   * render NHIỀU bàn cờ trên cùng một trang (ví dụ bàn cờ trong modal ôn mẫu hình)
   * để không trùng id - trùng id cũng làm id sinh tự động của thư viện trùng theo.
   */
  boardId?: string
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
  announce = null,
  onDrop,
  boardId = 'kid-board',
  className = '',
}: ChessBoardPanelProps) {
  // Đọc to nước đi vừa hiện ra (nếu ba mẹ đang bật âm thanh).
  useEffect(() => {
    if (announce) speakMove(announce)
  }, [announce])

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
      {/*
        Khung toạ độ kiểu "bàn cờ gỗ": `-m-3` + `p-3` vẽ một khung 12px **quanh**
        bàn cờ mà KHÔNG làm bàn cờ nhỏ đi - nhãn a-h / 1-8 nằm gọn trong khung, ngoài
        các ô, không đè lên quân nào.
      */}
      <div className="-m-3 relative rounded-[1.1rem] bg-brand-800 p-3 shadow-[0_18px_34px_-18px_rgba(13,32,24,0.7)]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[0.7rem] bg-white">
        <Chessboard
          options={{
            id: boardId,
            position: fen,
            boardOrientation: orientation,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              targetSquare ? tryMove(sourceSquare, targetSquare) : false,
            onSquareClick: ({ square, piece }) => {
              const ownPiece = Boolean(piece && piece.pieceType[0] === playerColorChar)
              // “Bàn cờ biết nói”: chạm QUÂN NÀO (của bé hay của địch) cũng đọc TÊN QUÂN
              // tiếng Anh kèm ô (“Knight C 3”, “Bishop”, “Pawn”…); chạm ô trống thì đọc
              // tên ô (“E 2”). Đọc NGAY cả khi chưa tới lượt bé - bé ngồi xem vẫn nghe để
              // quen toạ độ và tên quân, rồi mới xét tới kéo-thả bên dưới.
              if (piece) speakPiece(piece.pieceType.slice(-1), square)
              else speakSquare(square)
              if (!interactive) return
              if (selected && selected !== square) {
                if (tryMove(selected, square)) return
              }
              if (ownPiece) {
                setSelected(square === selected ? null : square)
              } else {
                setSelected(null)
              }
            },
            // Bé KÉO quân: cũng đọc tên quân lúc nhấc lên, để dù kéo hay chạm đều nghe.
            onPieceDrag: ({ piece, square }) => {
              if (piece && square) speakPiece(piece.pieceType.slice(-1), square)
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
        </div>

        {/*
          Khung toạ độ: nhãn cột ở khung TRÊN/DƯỚI, nhãn hàng ở khung TRÁI/PHẢI -
          tất cả nằm NGOÀI các ô. `pointer-events-none` để không cản kéo quân. Vì
          khung ngoài dùng `p-3`, `inset-3` ở đây đúng bằng vùng bàn cờ.
        */}
        <div
          id={`${boardId}-coords`}
          aria-hidden
          className="pointer-events-none absolute inset-3"
        >
          {/*
            Tên ô ở GÓC TRÊN-PHẢI từng ô (a1, e4…): bé liếc là biết ngay mình đang
            nhìn ô nào, khỏi dò ra mép. Chữ nhỏ, mờ, tự đổi màu theo ô sáng/tối nên
            vẫn thanh lịch.
          */}
          <div
            id={`${boardId}-square-coords`}
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
            }}
          >
            {ranks.map((rank) =>
              files.map((file) => {
                const square = `${file}${rank}`
                const dark = (file.charCodeAt(0) - 97 + Number(rank)) % 2 === 1
                return (
                  <span key={square} className="flex items-start justify-end p-[2px] leading-none">
                    <span
                      data-square-coord={square}
                      className="select-none text-[0.5rem] font-extrabold sm:text-[0.55rem]"
                      style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(31,42,36,0.42)' }}
                    >
                      {square}
                    </span>
                  </span>
                )
              }),
            )}
          </div>

          {/* Dải cột nằm trong KHUNG bàn cờ (ngoài các ô, không đè lên ô), chữ ĐẬM. */}
          {(['top', 'bottom'] as const).map((edge) => (
            <div
              key={edge}
              data-coord-edge={edge}
              className={`absolute left-0 right-0 ${edge === 'top' ? '-top-3' : '-bottom-3'} grid h-3`}
              style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
            >
              {files.map((file) => (
                <span
                  key={`${edge}-${file}`}
                  data-coord={file}
                  data-coord-side={edge}
                  className={`grid place-items-center text-[0.6rem] font-extrabold leading-none ${
                    activeFiles.has(file) ? 'text-gold-300' : 'text-white/55'
                  }`}
                >
                  {file}
                </span>
              ))}
            </div>
          ))}

          {/* Dải hàng nằm trong KHUNG bàn cờ (ngoài các ô), chữ ĐẬM. */}
          {(['left', 'right'] as const).map((edge) => (
            <div
              key={edge}
              data-coord-edge={edge}
              className={`absolute top-0 bottom-0 ${edge === 'left' ? '-left-3' : '-right-3'} grid w-3`}
              style={{ gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}
            >
              {ranks.map((rank) => (
                <span
                  key={`${edge}-${rank}`}
                  data-coord={rank}
                  data-coord-side={edge}
                  className={`grid place-items-center text-[0.6rem] font-extrabold leading-none ${
                    activeRanks.has(rank) ? 'text-gold-300' : 'text-white/55'
                  }`}
                >
                  {rank}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/*
          Ô đọc tên ô ("c1", "e2 → e4"): đặt NGAY TRONG mép TRÊN của bàn cờ, nằm
          DƯỚI dải toạ độ a-h nên **không che** các nhãn cột/hàng. Trước đây nó nổi
          phía trên khung nên đè lên dải toạ độ (và có thể bị thanh tiêu đề che mất),
          vì bàn cờ nằm sát mép trên thẻ - không còn chỗ trống phía trên.
        */}
        {focusLabel && (
          <div
            id={`${boardId}-coord-readout`}
            className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-gold-300 bg-brand-900/95 px-3 py-0.5 text-xs font-extrabold tracking-wide text-white shadow-[0_6px_14px_rgba(13,32,24,0.45)] sm:text-sm"
          >
            {focusLabel}
          </div>
        )}
      </div>
    </div>
  )
}
