/**
 * Chỗ trống dọc (px) mỗi trang chừa cho header + hàng trạng thái + băng giải
 * thích / hàng nút dưới bàn cờ.
 *
 * `BoardStage` dùng con số này để giới hạn bàn cờ bằng `100dvh - reserve` khi
 * cửa sổ hẹp (một cột). Đây là kiến thức dùng chung của cả 7 trang, nên gom về
 * một chỗ: trước kia mỗi trang tự viết 232–300 rải rác, sửa một khối là bàn cờ
 * tràn hoặc teo ở cửa sổ thấp mà không ai thấy ngay.
 *
 * Số càng lớn = càng chừa nhiều chỗ cho phần dưới = bàn cờ càng nhỏ.
 */
export const BOARD_RESERVE = {
  openings: 296,
  counters: 244,
  tactics: 232,
  endgames: 296,
  strategy: 300,
  freePlay: 350,
  hazards: 260,
} as const
