/**
 * Chọn sẵn một bài NGẪU NHIÊN mỗi lần mở app.
 *
 * Bốc MỘT lần cho mỗi tab rồi giữ nguyên (xem `picks`): bé đang học dở, lỡ bấm
 * sang tab khác rồi quay lại thì vẫn đúng bài đó - không nhảy bài giữa chừng.
 * Mở lại app hoặc F5 là bốc bài mới.
 *
 * Hàm không đụng `window`, để `scripts/smoke-random-pick.ts` kiểm được bằng Node.
 */

/** Kết quả đã bốc trong phiên này: `salt` → chỉ số. */
const picks = new Map<string, number>()

/**
 * Chỉ số ngẫu nhiên trong danh sách `length` phần tử, ổn định cho tới khi mở lại
 * app. `salt` tách lựa chọn giữa các tab (`opening`, `tactic`, `endgame`) để ba
 * trang không cùng bốc về một "vị trí may mắn" giống nhau.
 *
 * `random` chỉ dùng khi bốc lần đầu - tham số để bài kiểm bơm số tất định.
 */
export function randomIndex(
  length: number,
  salt: string,
  random: () => number = Math.random,
): number {
  if (!Number.isFinite(length) || length <= 0) return 0
  const size = Math.floor(length)
  const picked = picks.get(salt)
  if (picked !== undefined && picked < size) return picked
  const index = Math.min(size - 1, Math.floor(random() * size))
  picks.set(salt, index)
  return index
}
