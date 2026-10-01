import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Bài học đang mở, do CHÍNH TRANG tự “báo lên”.
 *
 * Khung “Gợi ý cho ba mẹ” (§10) nằm ở `RootLayout` - tức là nằm NGOÀI mọi trang -
 * nên nó không đọc được state của trang. Thay vì luồn prop qua router, mỗi trang
 * gọi `useReportLesson('opening:london')` một lần là khung biết ngay bé đang học
 * bài nào để đổi câu hỏi cho đúng bài.
 */
interface LessonContextValue {
  lessonId: string | null
  setLessonId: (id: string | null) => void
}

const LessonContext = createContext<LessonContextValue | null>(null)

export function LessonProvider({ children }: { children: ReactNode }) {
  const [lessonId, setLessonId] = useState<string | null>(null)
  const value = useMemo<LessonContextValue>(() => ({ lessonId, setLessonId }), [lessonId])
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
}

/** Bài đang mở (`null` khi trang không phải bài học, ví dụ tab Ôn tập). */
/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useActiveLesson(): string | null {
  const context = useContext(LessonContext)
  return context ? context.lessonId : null
}

/**
 * Trang bài học tự báo bài đang mở. Rời trang thì trả về `null` để khung quay lại
 * câu hỏi chung của tab.
 */
/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useReportLesson(id: string | null | undefined) {
  const context = useContext(LessonContext)
  const setLessonId = context?.setLessonId
  useEffect(() => {
    if (!setLessonId) return
    setLessonId(id ?? null)
    return () => setLessonId(null)
  }, [setLessonId, id])
}
