import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { dueItems, recordAttempt, summarizeDeck } from '../lib/review'
import type { ReviewDeck, ReviewItem } from '../lib/review'

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.review.v1'

interface ReviewContextValue {
  deck: ReviewDeck
  /** Ghi kết quả một câu: đúng thì hẹn xa hơn, sai thì gặp lại sau 10 phút. */
  record: (key: string, correct: boolean) => void
  /** Các quân bài đã tới hạn ôn, quá hạn lâu nhất lên trước. */
  due: ReviewItem[]
  dueCount: number
  summary: ReturnType<typeof summarizeDeck>
  resetDeck: () => void
}

const ReviewContext = createContext<ReviewContextValue | null>(null)

function load(): ReviewDeck {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') return parsed as ReviewDeck
    return {}
  } catch {
    return {}
  }
}

/** Nhịp cập nhật lại danh sách tới hạn (một buổi ôn kéo dài vài phút). */
const TICK_MS = 30_000

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<ReviewDeck>(load)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck))
    } catch {
      /* bỏ qua khi trình duyệt chặn lưu trữ */
    }
  }, [deck])

  // Cập nhật đồng hồ trong setInterval (không setState đồng bộ trong effect).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const record = useCallback((key: string, correct: boolean) => {
    const stamp = Date.now()
    setDeck((prev) => recordAttempt(prev, key, correct, stamp))
    setNow(stamp)
  }, [])

  const resetDeck = useCallback(() => setDeck({}), [])

  const value = useMemo<ReviewContextValue>(() => {
    const due = dueItems(deck, now)
    return {
      deck,
      record,
      due,
      dueCount: due.length,
      summary: summarizeDeck(deck, now),
      resetDeck,
    }
  }, [deck, now, record, resetDeck])

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
}

/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useReview(): ReviewContextValue {
  const context = useContext(ReviewContext)
  if (!context) throw new Error('useReview phải dùng bên trong <ReviewProvider>')
  return context
}
