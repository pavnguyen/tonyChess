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
 *
 * Ba kiểu bố cục, chọn bằng biến thể Tailwind (`src/index.css`):
 *
 * - mặc định (điện thoại dựng đứng, cửa sổ hẹp): MỘT cột, bàn cờ rộng hết cỡ.
 * - `stage` (cửa sổ đủ rộng và không cao hơn bề rộng): bàn cờ nằm trong cột bên
 *   trái của cả trang, tự co theo chiều cao cột.
 * - `shallow` (điện thoại NẰM NGANG, cửa sổ bị thu thấp): chiều cao mới là thứ
 *   khan hiếm, nên ngay trong thẻ này bàn cờ chiếm trọn cột trái cao hết cỡ,
 *   còn hàng trạng thái + băng giải thích / nút dồn sang cột phải và tự cuộn.
 *   Nhờ vậy bé vẫn thấy TRỌN bàn cờ mà không phải cuộn trang.
 */
export function BoardStage({ top, board, under, reserve = 260 }: Props) {
  return (
    <div className="card-pop flex min-h-0 flex-col gap-1.5 p-1.5 sm:gap-2 sm:p-2.5 shallow:grid shallow:h-[calc(100dvh-5rem)] shallow:shrink-0 shallow:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] shallow:grid-rows-[auto_minmax(0,1fr)] shallow:gap-2 shallow:[grid-template-areas:'board_top'_'board_under']">
      {top ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 shallow:min-h-0 shallow:overflow-y-auto shallow:[grid-area:top]">
          {top}
        </div>
      ) : null}
      <BoardBox reserve={reserve}>{board}</BoardBox>
      {under ? (
        <div className="flex shrink-0 flex-col gap-2 shallow:min-h-0 shallow:min-w-0 shallow:overflow-y-auto shallow:[grid-area:under]">
          {under}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Hộp vuông dành cho bàn cờ. Bàn cờ luôn lấy cạnh nhỏ hơn giữa:
 *
 * - bề rộng của cột, và
 * - bề cao còn lại - `100cqh` khi khung bàn cờ đã có chiều cao xác định
 *   (`stage` / `shallow`), hoặc `100dvh - reserve` khi cửa sổ hẹp và cả trang
 *   cuộn dọc (lúc này phải tự giới hạn chiều cao).
 *
 * Lưu ý: `max-w` (trần theo `100dvh`) được gỡ trong hai bố cục `stage` /
 * `shallow` vì lúc đó bàn cờ đã nằm trong một khung có chiều cao xác định - dùng
 * `100cqh` mới đo đúng phần chiều cao thật sự còn trống.
 */
function BoardBox({ children, reserve }: { children: ReactNode; reserve: number }) {
  return (
    <div className="flex items-center justify-center stage:min-h-0 stage:flex-1 stage:[container-type:size] shallow:min-h-0 shallow:[container-type:size] shallow:[grid-area:board]">
      <div
        className="w-full max-w-[max(17rem,calc(100dvh-var(--board-reserve)))] stage:w-[min(100%,100cqh)] stage:max-w-none shallow:w-[min(100%,max(14rem,100cqh))] shallow:max-w-none"
        style={{ '--board-reserve': `${reserve}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
