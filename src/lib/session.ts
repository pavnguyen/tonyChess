/**
 * **Buổi luyện hôm nay** - 4-5 bài / 10-15 phút, tự sinh theo NGÀY.
 *
 * Vì sao tất định theo ngày: cùng một ngày mở lại app phải ra **đúng buổi luyện đó**,
 * bé không bị "random" khó hiểu, và ba mẹ nói chuyện với bé vẫn khớp.
 *
 * Cách trộn: 1 bài Khai cuộc (hoặc Đối phó) · 1 thế Trung cuộc · 1 thế Tàn cuộc ·
 * 1 lượt Soi quân treo · 1 ván Đấu Máy ngắn.
 */
import { OPENINGS } from '../data/openings'
import { BEST_MOVES } from '../data/bestMoves'
import { ENDGAMES } from '../data/endgames'

export interface SessionItem {
  id: string
  label: string
  icon: string
  to: string
}

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.session.v1'

/** `YYYY-MM-DD` theo giờ máy - khoá của buổi luyện trong ngày. */
export function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Băm chuỗi thành số dương, ổn định (cùng chuỗi → cùng số). */
function hash(text: string): number {
  let value = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return Math.abs(value)
}

function pick<T>(items: T[], seed: number): T | undefined {
  return items.length === 0 ? undefined : items[seed % items.length]
}

/** Buổi luyện của một ngày (mặc định hôm nay). */
export function buildSession(date = new Date()): SessionItem[] {
  const key = todayKey(date)
  const seed = hash(key)
  const items: SessionItem[] = []

  const opening = pick(OPENINGS, seed)
  if (opening) {
    items.push({
      id: `opening:${opening.id}`,
      label: `Học ${opening.name}`,
      icon: '🛡️',
      to: `/?opening=${opening.id}`,
    })
  }

  const puzzle = pick(BEST_MOVES, seed >> 3)
  if (puzzle) {
    items.push({
      id: `puzzle:${puzzle.id}`,
      label: `Tìm nước hay: ${puzzle.title}`,
      icon: '⚔️',
      to: `/tactics?theme=${puzzle.theme}`,
    })
  }

  const endgame = pick(ENDGAMES, seed >> 6)
  if (endgame) {
    items.push({
      id: `endgame:${endgame.id}`,
      label: `Tàn cuộc: ${endgame.title}`,
      icon: '👑',
      to: '/endgames',
    })
  }

  items.push({
    id: 'hazard:daily',
    label: 'Soi quân treo 1 thế',
    icon: '🔍',
    to: '/hazards',
  })

  items.push({
    id: 'play:daily',
    label: 'Đấu với máy 1 ván ngắn',
    icon: '🎮',
    to: '/free-play',
  })

  return items
}

interface SessionState {
  date: string
  done: number
}

export function loadSessionState(): SessionState {
  const fallback: SessionState = { date: todayKey(), done: 0 }
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as SessionState
    if (!parsed || parsed.date !== todayKey()) return fallback
    return { date: parsed.date, done: Math.max(0, Number(parsed.done) || 0) }
  } catch {
    return fallback
  }
}

export function saveSessionState(done: number) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), done }))
  } catch {
    /* bỏ qua */
  }
}

/** Đánh dấu xong bài thứ `index` (0-based). */
export function markDone(index: number) {
  const state = loadSessionState()
  saveSessionState(Math.max(state.done, index + 1))
}

export function resetSession() {
  saveSessionState(0)
}
