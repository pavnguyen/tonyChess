import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { currentRank, nextRankOf } from '../data/ranks'
import { REVIEW_INTERVALS_DAYS, estimateElo } from '../lib/rating'
import { setMuted } from '../lib/sound'
import type { NotationStyle, RankInfo } from '../types'

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.v1'

const DAY_MS = 24 * 60 * 60 * 1000

/** Dấu ôn tập của một hoạt động: lần cuối làm + đang ở "hộp" nào. */
export interface ReviewMark {
  last: number
  box: number
}

interface Persisted {
  stars: number
  completed: string[]
  notation: NotationStyle
  soundOn: boolean
  /** Bố mẹ mở khoá toàn bộ bài học, bỏ qua thứ tự leo cấp. */
  unlockAll: boolean
  /** Dấu ôn tập ngắt quãng theo id hoạt động. */
  reviews: Record<string, ReviewMark>
}

const DEFAULTS: Persisted = {
  stars: 0,
  completed: [],
  notation: 'figurine',
  soundOn: true,
  unlockAll: false,
  reviews: {},
}

interface KidContextValue extends Persisted {
  rank: RankInfo
  nextRank: RankInfo | null
  progressToNext: number
  isCompleted: (id: string) => boolean
  addStars: (amount: number) => void
  /** Trả về `true` nếu đây là lần đầu hoàn thành hoạt động này. */
  completeActivity: (id: string, stars?: number) => boolean
  setNotation: (notation: NotationStyle) => void
  toggleSound: () => void
  toggleUnlockAll: () => void
  resetProgress: () => void
  /** `true` nếu hoạt động đã làm và đã tới hạn cần ôn lại. */
  isReviewDue: (id: string) => boolean
  /** Số hoạt động đang tới hạn ôn lại. */
  dueCount: number
  /** Ước lượng vui về trình độ của bé (chỉ để động viên). */
  estimatedElo: number
}

const KidContext = createContext<KidContextValue | null>(null)

function load(): Persisted {
  if (typeof localStorage === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      stars: typeof parsed.stars === 'number' ? parsed.stars : 0,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      // Bản cũ từng cho bé chọn tuýp "chuẩn quốc tế thuần" (Nf3) - nay đã bỏ, nên
      // dữ liệu đã lưu cần quy về "hình cờ + quốc tế" cho khớp bảng tuỳ chọn.
      notation: parsed.notation === 'vietnamese' ? 'vietnamese' : 'figurine',
      soundOn: parsed.soundOn ?? true,
      unlockAll: parsed.unlockAll ?? false,
      reviews:
        parsed.reviews && typeof parsed.reviews === 'object'
          ? (parsed.reviews as Record<string, ReviewMark>)
          : {},
    }
  } catch {
    return DEFAULTS
  }
}

export function KidProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  // Giá trị trả về phải có ngay, không phụ thuộc lúc React chạy updater.
  const completedRef = useRef(new Set(state.completed))
  // "Bây giờ" chỉ để tính việc tới hạn ôn tập; cập nhật lúc mở app, khi quay lại tab,
  // và định kỳ - đủ để huy hiệu 🔁 không bị cũ mà không gọi Date.now() khi render.
  const [now, setNow] = useState(0)

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    refresh()
    const timer = window.setInterval(refresh, 30 * 60 * 1000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* bỏ qua khi trình duyệt chặn lưu trữ */
    }
    setMuted(!state.soundOn)
  }, [state])

  const addStars = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, stars: Math.max(0, prev.stars + amount) }))
  }, [])

  const completeActivity = useCallback((id: string, stars = 3) => {
    const firstTime = !completedRef.current.has(id)
    completedRef.current.add(id)
    setState((prev) => {
      const already = prev.completed.includes(id)
      // Ghi dấu ôn tập: lần đầu vào hộp 0, mỗi lần làm lại leo một hộp (nhắc thưa dần).
      const previousBox = prev.reviews[id]?.box
      const box =
        previousBox === undefined
          ? 0
          : Math.min(previousBox + 1, REVIEW_INTERVALS_DAYS.length - 1)
      return {
        ...prev,
        stars: prev.stars + (already ? Math.max(1, Math.floor(stars / 2)) : stars),
        completed: already ? prev.completed : [...prev.completed, id],
        reviews: { ...prev.reviews, [id]: { last: Date.now(), box } },
      }
    })
    return firstTime
  }, [])

  const setNotation = useCallback((notation: NotationStyle) => {
    setState((prev) => ({ ...prev, notation }))
  }, [])

  const toggleSound = useCallback(() => {
    setState((prev) => ({ ...prev, soundOn: !prev.soundOn }))
  }, [])

  const toggleUnlockAll = useCallback(() => {
    setState((prev) => ({ ...prev, unlockAll: !prev.unlockAll }))
  }, [])

  const resetProgress = useCallback(() => {
    completedRef.current.clear()
    setState(DEFAULTS)
  }, [])

  const value = useMemo<KidContextValue>(() => {
    const rank = currentRank(state.stars)
    const nextRank = nextRankOf(state.stars)
    const span = nextRank ? nextRank.minStars - rank.minStars : 1
    const progressToNext = nextRank
      ? Math.min(1, Math.max(0, (state.stars - rank.minStars) / span))
      : 1

    const isReviewDue = (id: string) => {
      const mark = state.reviews[id]
      if (!mark) return false
      const box = Math.min(mark.box, REVIEW_INTERVALS_DAYS.length - 1)
      return now - mark.last >= REVIEW_INTERVALS_DAYS[box] * DAY_MS
    }

    return {
      ...state,
      rank,
      nextRank,
      progressToNext,
      isCompleted: (id: string) => state.completed.includes(id),
      addStars,
      completeActivity,
      setNotation,
      toggleSound,
      toggleUnlockAll,
      resetProgress,
      isReviewDue,
      dueCount: Object.keys(state.reviews).filter(isReviewDue).length,
      estimatedElo: estimateElo(state.completed.length),
    }
  }, [
    state,
    now,
    addStars,
    completeActivity,
    setNotation,
    toggleSound,
    toggleUnlockAll,
    resetProgress,
  ])

  return <KidContext.Provider value={value}>{children}</KidContext.Provider>
}

/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useKidProgress(): KidContextValue {
  const context = useContext(KidContext)
  if (!context) throw new Error('useKidProgress phải dùng bên trong <KidProgressProvider>')
  return context
}
