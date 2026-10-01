/**
 * Nhãn toạ độ bàn cờ (cột `a`-`h`, hàng `1`-`8`) theo hướng bàn cờ đang xoay.
 *
 * Vì sao tách riêng: đây là thứ dễ sai nhất khi bàn cờ lật 180° cho bé cầm quân Đen -
 * nếu nhãn vẫn theo thứ tự cũ thì bé đọc nhầm hết. Tách ra thành hàm thuần để bài
 * kiểm tự động soi được, thay vì phải mở trình duyệt mới biết đúng hay sai.
 */

/** Cột theo hướng bàn Trắng: trái → phải là `a` → `h`. */
export const COORD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

/** Hàng theo hướng bàn Trắng: TRÊN → DƯỚI là `8` → `1` (hàng 1 nằm sát bé Trắng). */
export const COORD_RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

export type CoordOrientation = 'white' | 'black'

/**
 * Trả về thứ tự nhãn ĐÚNG NHƯ BÉ NHÌN THẤY khi bàn cờ xoay theo `orientation`.
 * - Bàn Trắng: cột `a`…`h`, hàng `8`…`1`.
 * - Bàn Đen (xoay 180°): cột `h`…`a`, hàng `1`…`8`.
 */
export function coordinateLabels(orientation: CoordOrientation): {
  files: readonly string[]
  ranks: readonly string[]
} {
  if (orientation === 'white') return { files: COORD_FILES, ranks: COORD_RANKS }
  return {
    files: [...COORD_FILES].reverse(),
    ranks: [...COORD_RANKS].reverse(),
  }
}

/** Tách một ô cờ (`e2`) thành cột và hàng; trả `null` nếu không hợp lệ. */
export function splitSquare(square: string): { file: string; rank: string } | null {
  if (!/^[a-h][1-8]$/.test(square)) return null
  return { file: square[0], rank: square[1] }
}
