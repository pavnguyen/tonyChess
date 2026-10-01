import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  createRatingBook,
  levelFor,
  levelProgress,
  nextLevelOf,
  suggestedBotLevel,
  suggestedDifficulty,
  themePercent,
  themeRating,
  updateRating,
  weakestTheme,
} from '../lib/rating'
import type { PuzzleDifficulty, RatingBook, RatingLevel } from '../lib/rating'
import { ageFromBirthYear } from '../lib/stages'
import { useKidProgress } from './progress'

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.rating.v1'

interface RatingContextValue {
  book: RatingBook
  /** Điểm tổng (chỉ bố mẹ xem - bé thấy tên cấp độ). */
  overall: number
  /** Cấp độ bé nhìn thấy, ví dụ "Mầm cờ 🌱". */
  level: RatingLevel
  /** Nấc kế tiếp - null khi đã ở nấc cao nhất. */
  nextLevel: RatingLevel | null
  /** Tiến độ 0..1 tới nấc kế tiếp. */
  progress: number
  /** Ghi một lần làm bài. `difficulty` bỏ trống thì tự chọn mức vừa sức. */
  record: (theme: string, correct: boolean, difficulty?: PuzzleDifficulty) => void
  /** Điểm của một dạng bài (mặc định lấy điểm xuất phát). */
  ratingOf: (theme: string) => number
  /** Điểm của một dạng bài quy ra tỉ lệ 0..1 để vẽ thanh nhỏ. */
  percentOf: (theme: string) => number
  /** Dạng bài yếu nhất trong danh sách. */
  weakestOf: (themes: readonly string[]) => string | null
  /** Mức câu vừa sức với điểm tổng hiện tại. */
  suggested: PuzzleDifficulty
  /** Mức máy gợi ý cho tab đấu Robot. */
  botLevel: ReturnType<typeof suggestedBotLevel>
  /** Trả lại điểm khởi đầu 500 (bố mẹ dùng khi muốn chơi lại từ đầu). */
  resetRating: () => void
}

const RatingContext = createContext<RatingContextValue | null>(null)

function load(): RatingBook {
  if (typeof localStorage === 'undefined') return createRatingBook()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createRatingBook()
    const parsed = JSON.parse(raw) as Partial<RatingBook>
    if (!parsed || typeof parsed.overall !== 'number') return createRatingBook()
    return {
      overall: parsed.overall,
      byTheme: parsed.byTheme ?? {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return createRatingBook()
  }
}

export function RatingProvider({ children }: { children: ReactNode }) {
  const { birthYear } = useKidProgress()
  const [book, setBook] = useState<RatingBook>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(book))
    } catch {
      /* bỏ qua khi trình duyệt chặn lưu trữ */
    }
  }, [book])

  // Tuổi chỉ để chọn hệ số K; chưa nhập năm sinh thì coi như bé nhỏ.
  const age = birthYear ? ageFromBirthYear(birthYear) : null

  const record = useCallback(
    (theme: string, correct: boolean, difficulty?: PuzzleDifficulty) => {
      setBook((prev) => {
        const tier = difficulty ?? suggestedDifficulty(themeRating(prev, theme))
        return updateRating(prev, { theme, difficulty: tier, correct, age, now: Date.now() })
      })
    },
    [age],
  )

  const resetRating = useCallback(() => setBook(createRatingBook()), [])

  const value = useMemo<RatingContextValue>(() => {
    return {
      book,
      overall: book.overall,
      level: levelFor(book.overall),
      nextLevel: nextLevelOf(book.overall),
      progress: levelProgress(book.overall),
      record,
      ratingOf: (theme) => themeRating(book, theme),
      percentOf: (theme) => themePercent(themeRating(book, theme)),
      weakestOf: (themes) => weakestTheme(book, themes),
      suggested: suggestedDifficulty(book.overall),
      botLevel: suggestedBotLevel(book.overall),
      resetRating,
    }
  }, [book, record, resetRating])

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>
}

/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useRating(): RatingContextValue {
  const context = useContext(RatingContext)
  if (!context) throw new Error('useRating phải dùng bên trong <RatingProvider>')
  return context
}
