/**
 * Câu nói của **HLV** - viết bằng tiếng Việt, giọng **trung tính, chỉ nêu sự thật**,
 * đúng như chủ dự án chọn: không khen mở đầu, không hài hước, không mắng.
 *
 * Quy ước ngưỡng (spec `app-upgrade-spec.md` §4.3): chỉ nói khi nước đi kém hơn nước
 * tốt nhất **≥ 1 điểm** (100 centipawn). Dưới ngưỡng đó thì im lặng - im lặng chính là
 * phần thưởng.
 */
export interface Blunder {
  /** ISO time - dùng để hiện "ngày gần nhất" ở sổ lỗi. */
  date: string
  /** Thế cờ TRƯỚC nước bé đi (FEN) - nơi bé sẽ luyện lại. */
  fen: string
  /** Nước bé đã đi (SAN). */
  san: string
  /** Nước mạnh nhất (SAN). */
  bestSan: string
  /** Mất bao nhiêu centipawn. */
  lossCp: number
  /** Số nửa nước đã đi trong ván (để hiện "nước 12"). */
  ply: number
}

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.coach.v1'
/** Giữ tối đa 80 lỗi gần nhất - đủ để nhóm "lỗi hay lặp lại" mà không phình lưu trữ. */
const LIMIT = 80

/** Đổi centipawn ra số điểm cho bé đọc: 137 → "1.4". */
export function lossPoints(lossCp: number): string {
  return (Math.max(0, lossCp) / 100).toFixed(1)
}

export type LossBand = 'none' | 'small' | 'piece' | 'heavy'

/** Ngưỡng chia mức theo spec: <1 điểm im lặng, 1–2 điểm nhẹ, 2–5 điểm, ≥5 điểm nặng. */
export function lossBand(lossCp: number): LossBand {
  if (lossCp < 100) return 'none'
  if (lossCp < 200) return 'small'
  if (lossCp < 500) return 'piece'
  return 'heavy'
}

/**
 * Câu nhận xét của HLV.
 *
 * `bestLabel` là nước mạnh nhất đã định dạng theo tuýp ký hiệu bé chọn (♞Nf5 / Mf5).
 * `hanging` là tên quân vừa bị treo (nếu biết) - nhờ vậy câu nói chỉ đúng **lỗi**:
 * "Nước này để Mã f3 bị ăn miễn phí", chứ không chỉ nói "kém 3 điểm".
 */
export function describeLoss(lossCp: number, bestLabel: string, hanging?: string): string {
  const points = lossPoints(lossCp)
  const band = lossBand(lossCp)

  if (band === 'none') return ''

  if (hanging) {
    if (band === 'small') {
      return `Nước này để ${hanging} bị ăn miễn phí - kém hơn ${bestLabel} khoảng ${points} điểm.`
    }
    if (band === 'piece') {
      return `Nước này để ${hanging} bị ăn miễn phí - mất khoảng ${points} điểm. Nước hay hơn là ${bestLabel}.`
    }
    return `Nước này để ${hanging} bị ăn miễn phí - mất ${points} điểm. Bấm “Đi lại” rồi thử ${bestLabel}.`
  }

  if (band === 'small') {
    return `Nước này kém hơn ${bestLabel} khoảng ${points} điểm.`
  }
  if (band === 'piece') {
    return `Nước này kém hơn ${bestLabel} khoảng ${points} điểm - gần mất một quân nhỏ.`
  }
  return `Nước này kém hơn ${bestLabel} ${points} điểm - mất quân. Bấm “Đi lại” để thử ${bestLabel}.`
}

/** Câu cảnh báo TRƯỚC khi bé đi (rẻ, không cần engine - dùng `findHangingPieces`). */
export function describeDanger(pieces: readonly string[]): string {
  if (pieces.length === 0) return ''
  if (pieces.length === 1) {
    return `Nước này để ${pieces[0]} bị ăn miễn phí. Bé vẫn đi được, nhưng hãy nhìn kỹ trước đã.`
  }
  return `Nước này để ${pieces.join(', ')} bị bắt. Bé vẫn đi được, nhưng hãy nhìn kỹ trước đã.`
}

/* ── Sổ lỗi: lưu lại để tab Tiến bộ (giai đoạn 2) dùng ─────────────────────── */

export function loadBlunders(): Blunder[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is Blunder =>
        Boolean(item) &&
        typeof item.fen === 'string' &&
        typeof item.san === 'string' &&
        typeof item.lossCp === 'number',
    )
  } catch {
    return []
  }
}

/** Thêm một lỗi vào sổ (bỏ lỗi nhẹ và khử trùng theo FEN + nước đi). */
export function saveBlunder(blunder: Blunder) {
  if (blunder.lossCp < 100) return
  if (typeof localStorage === 'undefined') return
  try {
    const existing = loadBlunders().filter(
      (item) => !(item.fen === blunder.fen && item.san === blunder.san),
    )
    const next = [blunder, ...existing].slice(0, LIMIT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* trình duyệt chặn lưu trữ thì HLV vẫn chạy trong phiên này */
  }
}

export function clearBlunders() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* bỏ qua */
  }
}

/**
 * Nhóm lỗi theo **kiểu** để sổ lỗi nói được "bé hay treo quân" thay vì liệt kê
 * từng nước rời rạc.
 */
export interface BlunderGroup {
  key: 'hanging' | 'queen' | 'heavy' | 'small'
  label: string
  count: number
  latest: Blunder
  worst: Blunder
}

const GROUP_LABEL: Record<BlunderGroup['key'], string> = {
  hanging: 'Treo quân (bị ăn miễn phí)',
  queen: 'Mất Hậu',
  heavy: 'Sai nặng (≥ 5 điểm)',
  small: 'Sai nhẹ (1–2 điểm)',
}

/** Đoán kiểu lỗi từ nước đi: mất Hậu thì ưu tiên, rồi tới mức điểm. */
export function groupBlunders(blunders: readonly Blunder[]): BlunderGroup[] {
  const groups = new Map<BlunderGroup['key'], BlunderGroup>()
  for (const blunder of blunders) {
    const key: BlunderGroup['key'] = blunder.lossCp >= 800
      ? 'queen'
      : blunder.lossCp >= 500
        ? 'heavy'
        : blunder.lossCp >= 200
          ? 'heavy'
          : 'small'
    const current = groups.get(key)
    if (!current) {
      groups.set(key, {
        key,
        label: GROUP_LABEL[key],
        count: 1,
        latest: blunder,
        worst: blunder,
      })
    } else {
      current.count += 1
      if (new Date(blunder.date) > new Date(current.latest.date)) current.latest = blunder
      if (blunder.lossCp > current.worst.lossCp) current.worst = blunder
    }
  }
  return [...groups.values()].sort((a, b) => b.count * b.worst.lossCp - a.count * a.worst.lossCp)
}

/** Ba lỗi nặng nhất của một ván - đúng thứ HLV tổng kết cho bé xem. */
export function worstOf(blunders: readonly Blunder[], count = 3): Blunder[] {
  return [...blunders].sort((a, b) => b.lossCp - a.lossCp).slice(0, count)
}
