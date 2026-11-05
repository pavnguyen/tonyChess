import type { Side } from '../types'
import type { Blunder } from './coach'

/**
 * **Sổ ván đã chơi** - lưu trên máy (localStorage), không gửi đi đâu.
 *
 * Vì sao cần: trước đây bé chơi xong là mất ván, không có cách nào xem lại “ván
 * trước mình sai ở đâu”. Sổ này giữ 20 ván gần nhất (đủ để ba mẹ xem cùng bé), mỗi
 * ván chỉ lưu biên bản SAN + danh sách lỗi đã chấm - không lưu PGN, không lưu FEN
 * của từng nước, nên không phình bộ nhớ.
 */
const STORAGE_KEY = 'hoc-vien-co-vua-nhi.games.v1'
/** Giữ 20 ván gần nhất - nhiều hơn thì bé không xem hết, mà tốn chỗ lưu. */
const LIMIT = 20

export interface SavedGame {
  id: string
  /** ISO time - dùng để hiện “hôm nay / hôm qua”. */
  date: string
  kidSide: Side
  /** Nhãn mức máy lúc chơi (“Dễ”, “Khá”). */
  level: string
  /** “Bé thắng” / “Máy thắng” / “Hòa”. */
  result: string
  /** Toàn bộ nước của ván (SAN). */
  sans: string[]
  /** Các nước bé mất ≥ 1 điểm, đã chấm trong lúc chơi. */
  blunders: Blunder[]
}

function parse(raw: string | null): SavedGame[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is SavedGame =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.date === 'string' &&
        Array.isArray(item.sans) &&
        Array.isArray(item.blunders),
    )
  } catch {
    return []
  }
}

export function loadGames(): SavedGame[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

function persist(games: SavedGame[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
  } catch {
    /* trình duyệt chặn lưu trữ thì sổ chỉ có tác dụng trong phiên này */
  }
}

/** Thêm một ván vừa chơi xong; trả về danh sách mới (mới nhất đứng đầu). */
export function saveGame(input: Omit<SavedGame, 'id' | 'date'>): SavedGame[] {
  const game: SavedGame = {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  }
  const next = [game, ...loadGames()].slice(0, LIMIT)
  persist(next)
  return next
}

/** Nhãn ngày gọn cho danh sách ván: “Hôm nay 14:05” / “2 ngày trước”. */
export function gameDateLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) {
    return `Hôm nay ${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }
  const days = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
  if (days === 1) return 'Hôm qua'
  if (days > 1 && days < 30) return `${days} ngày trước`
  return `${date.getDate()}/${date.getMonth() + 1}`
}
