import { Chess } from 'chess.js'
import type { OpeningMove } from '../types'

/**
 * **% số ván thật** của một khai cuộc, lấy từ Lichess Opening Explorer.
 *
 * Vì sao lấy lúc chạy chứ không nhúng số vào code: một con số "% ván" chỉ có nghĩa
 * khi biết **đo ở đâu, lúc nào, bộ lọc nào**. Nhúng số cứng thì sáu tháng sau nó
 * vẫn nằm đó như một sự thật, trong khi dữ liệu Lichess đã đổi. Ở đây app hỏi thẳng
 * API (đúng bộ lọc ghi trong `STATS_SOURCE`), cache 30 ngày trên máy, và **không
 * hiện gì** nếu mất mạng / API từ chối - thà không có số còn hơn số sai.
 *
 * Đại lượng đo: tỉ lệ các ván **đi tới đúng thế cờ nhận diện** của khai cuộc (ví dụ
 * Ruy Lopez là thế cờ sau 3.Bb5) trên tổng số ván trong cùng bộ lọc.
 */
const EXPLORER = 'https://explorer.lichess.ovh/lichess'
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const CACHE_KEY = 'hoc-vien-co-vua-nhi.opening-stats.v1'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Ghi nguyên văn trên chip để ba mẹ kiểm chứng lại được. */
export const STATS_SOURCE = 'Lichess Opening Explorer · blitz + rapid · mức 1200-1800'
export const STATS_URL = 'https://lichess.org/analysis'

/**
 * **Thế cờ nhận diện** của từng khai cuộc - số nửa nước tính từ nước 1.
 *
 * Chọn đúng nước "định danh" chứ không phải hết dòng chính: hết dòng chính thì
 * khai cuộc nào cũng còn rất ít ván, các bài không so sánh được với nhau.
 */
export const STATS_PLY: Record<string, number> = {
  italian: 5, // 1.e4 e5 2.Nf3 Nc6 3.Bc4
  'ruy-lopez': 5, // 1.e4 e5 2.Nf3 Nc6 3.Bb5
  london: 3, // 1.d4 d5 2.Bf4
  'queens-gambit': 3, // 1.d4 d5 2.c4
  english: 1, // 1.c4
  sicilian: 2, // 1.e4 c5
  'caro-kann': 2, // 1.e4 c6
  french: 2, // 1.e4 e6
  'kings-indian': 4, // 1.d4 Nf6 2.c4 g6
  'nimzo-indian': 6, // 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4
}

export interface OpeningStat {
  /** % ván đi tới thế cờ mốc (1 chữ số thập phân). */
  percent: number
  /** Số ván thật sự đi tới thế cờ mốc - để biết con số % có đáng tin không. */
  sample: number
  /** Lúc lấy số (ISO) - cache 30 ngày. */
  fetchedAt: string
}

type Cache = Record<string, OpeningStat>

function readCache(): Cache {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const value = JSON.parse(raw)
    return value && typeof value === 'object' ? (value as Cache) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: Cache) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* chặn lưu trữ thì mỗi lần mở lại hỏi API, không sao */
  }
}

/** FEN sau `plies` nửa nước đầu của dòng chính (null nếu dòng không hợp lệ). */
export function markerFen(moves: readonly OpeningMove[], plies: number): string | null {
  if (plies <= 0 || moves.length < plies) return null
  const game = new Chess()
  for (const move of moves.slice(0, plies)) {
    try {
      game.move(move.san)
    } catch {
      return null
    }
  }
  return game.fen()
}

async function totalGames(fen: string): Promise<number | null> {
  const url = new URL(EXPLORER)
  url.searchParams.set('variant', 'standard')
  url.searchParams.set('fen', fen)
  for (const speed of ['blitz', 'rapid']) url.searchParams.append('speeds[]', speed)
  for (const rating of ['1200', '1400', '1600', '1800']) url.searchParams.append('ratings[]', rating)
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    const data = (await response.json()) as { white?: number; draws?: number; black?: number }
    const total = (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0)
    return total > 0 ? total : null
  } catch {
    return null
  }
}

/**
 * % ván đi tới thế cờ `fen`, so với tổng số ván của cùng bộ lọc.
 * Trả `null` khi không hỏi được API (mất mạng, bị chặn) - nơi gọi phải tự ẩn chip.
 */
export async function fetchOpeningStat(fen: string, now = Date.now()): Promise<OpeningStat | null> {
  const cached = readCache()[fen]
  if (cached && now - Date.parse(cached.fetchedAt) < TTL_MS) return cached

  const [base, here] = await Promise.all([totalGames(START_FEN), totalGames(fen)])
  if (!base || !here) return null

  const stat: OpeningStat = {
    percent: Math.round((here / base) * 1000) / 10,
    sample: here,
    fetchedAt: new Date(now).toISOString(),
  }
  writeCache({ ...readCache(), [fen]: stat })
  return stat
}
