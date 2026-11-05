/**
 * Chọn "bài mặc định của hôm nay" - mỗi ngày một khác, nhưng **ổn định trong
 * ngày**.
 *
 * Vì sao không dùng `Math.random()`: mỗi lần chuyển tab hoặc F5 lại đổi bài thì
 * bé đang đọc dở sẽ bị nhảy bài, và ba mẹ không thể nói "hôm nay con học bài
 * này". Băm ngày (giờ máy) + tên tab thành một chỉ số cố định: sáng mở lên là
 * bài mới, cả ngày giữ nguyên, qua nửa đêm tự đổi.
 *
 * Hàm thuần, không dùng `window` để `scripts/smoke-daily-pick.ts` kiểm được.
 */

/** Khoá ngày theo GIỜ MÁY: `YYYY-MM-DD` (đổi lúc 00:00, không phải theo UTC). */
export function dayKey(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Băm FNV-1a 32-bit - tất định, phân bố đủ đều cho vài chục lựa chọn. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Chỉ số của lựa chọn hôm nay trong danh sách `length` phần tử.
 *
 * `salt` tách lựa chọn giữa các tab (`opening`, `tactic`, `endgame`) để ba trang
 * không cùng nhảy về một "vị trí may mắn" giống nhau.
 */
export function dailyIndex(length: number, salt: string, now: Date = new Date()): number {
  if (!Number.isFinite(length) || length <= 0) return 0
  return hashString(`${dayKey(now)}|${salt}`) % Math.floor(length)
}
