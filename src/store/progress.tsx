import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { currentRank, nextRankOf } from '../data/ranks'
import { setMuted } from '../lib/sound'
import type { NotationStyle, RankInfo } from '../types'

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.v1'

interface Persisted {
  stars: number
  completed: string[]
  notation: NotationStyle
  soundOn: boolean
  /** Bố mẹ mở khoá toàn bộ bài học, bỏ qua thứ tự leo cấp. */
  unlockAll: boolean
}

const DEFAULTS: Persisted = {
  stars: 0,
  completed: [],
  notation: 'figurine',
  soundOn: true,
  unlockAll: false,
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
    }
  } catch {
    return DEFAULTS
  }
}

export function KidProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)

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
    let firstTime = false
    setState((prev) => {
      const already = prev.completed.includes(id)
      firstTime = !already
      return {
        ...prev,
        stars: prev.stars + (already ? Math.max(1, Math.floor(stars / 2)) : stars),
        completed: already ? prev.completed : [...prev.completed, id],
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

  const resetProgress = useCallback(() => setState(DEFAULTS), [])

  const value = useMemo<KidContextValue>(() => {
    const rank = currentRank(state.stars)
    const nextRank = nextRankOf(state.stars)
    const span = nextRank ? nextRank.minStars - rank.minStars : 1
    const progressToNext = nextRank
      ? Math.min(1, Math.max(0, (state.stars - rank.minStars) / span))
      : 1
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
    }
  }, [
    state,
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
