import type { CSSProperties, ReactNode } from 'react'

interface Props {
  /** Hàng mỏng ngay TRÊN bàn cờ: nhãn trạng thái, nút Mắt Thần… */
  top?: ReactNode
  /** Bàn cờ - nhân vật chính, luôn được phóng to hết cỡ. */
  board: ReactNode
  /** Khối nằm ngay DƯỚI bàn cờ: băng giải thích, hàng nút điều khiển… */
  under?: ReactNode
  /**
   * Khoảng trống dọc (px) cần chừa cho header + băng giải thích + nút điều khiển.
   * Chỉ dùng khi màn hình hẹp (dưới `lg`) - lúc đó bàn cờ được thu lại cho vừa
   * khung nhìn để bé thấy trọn bàn cờ mà không phải cuộn.
   */
  reserve?: number
}

/**
 * Khung bàn cờ dùng chung cho cả 4 trang: hàng trạng thái mỏng ở trên, bàn cờ ở
 * giữa (tự co cho vừa khung), rồi băng giải thích / hàng nút ngay bên dưới.
 *
 * Nhờ gói gọn trong một khối như vậy, bàn cờ và phần giải thích luôn nằm chung
 * một tầm mắt - bé không phải cuộn xuống mới thấy nước đi và lý do.
 */
export function BoardStage({ top, board, under, reserve = 260 }: Props) {
  return (
    <div className="card-pop flex min-h-0 flex-col gap-2 p-2 sm:p-2.5">
      {top ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">{top}</div>
      ) : null}
      <BoardBox reserve={reserve}>{board}</BoardBox>
      {under ? <div className="flex shrink-0 flex-col gap-2">{under}</div> : null}
    </div>
  )
}

/**
 * Hộp vuông dành cho bàn cờ. Bàn cờ luôn lấy cạnh nhỏ hơn giữa:
 *
 * - bề rộng của cột, và
 * - bề cao còn lại - `100cqh` khi cửa sổ đủ rộng, hoặc `100dvh - reserve` khi
 *   cửa sổ hẹp (lúc này cả trang cuộn dọc nên phải tự giới hạn chiều cao).
 */
function BoardBox({ children, reserve }: { children: ReactNode; reserve: number }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center stage:[container-type:size]">
      <div
        className="w-full max-w-[max(17rem,calc(100dvh-var(--board-reserve)))] stage:w-[min(100%,100cqh)] stage:max-w-none"
        style={{ '--board-reserve': `${reserve}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
