/**
 * Phần THUẦN của "Buổi luyện hôm nay": biết một bài thuộc loại nào và có được
 * phép đẩy tiến độ hay không.
 *
 * Tách khỏi `session.ts` để `scripts/smoke-session.ts` chạy được bằng Node mà
 * không phải kéo theo dữ liệu khai cuộc/tàn cuộc (và để logic này có test thật).
 */
export type SessionKind = 'opening' | 'puzzle' | 'endgame' | 'hazard' | 'play'

export const SESSION_KINDS: readonly SessionKind[] = [
  'opening',
  'puzzle',
  'endgame',
  'hazard',
  'play',
]

/** Loại của một mục trong buổi luyện, suy ra từ tiền tố id (`opening:italian`). */
export function itemKind(item: { id: string } | undefined): SessionKind | null {
  if (!item) return null
  const prefix = item.id.split(':')[0]
  return (SESSION_KINDS as readonly string[]).includes(prefix) ? (prefix as SessionKind) : null
}

/**
 * Tiến độ mới sau khi bé **hoàn thành** một bài thuộc loại `kind`.
 *
 * Chỉ tiến khi bài đang chờ đúng loại đó: làm lại một bài cũ (hay mở bài số 4
 * bằng ▶) không đẩy buổi luyện đi trước, nên "3/5" luôn là 3 bài đã làm xong.
 */
export function advanceDone(
  items: readonly { id: string }[],
  done: number,
  kind: SessionKind,
): number {
  const pending = items[Math.max(0, done)]
  return itemKind(pending) === kind ? done + 1 : Math.max(0, done)
}
