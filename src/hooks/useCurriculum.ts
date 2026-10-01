import { useMemo } from 'react'
import { useKidProgress } from '../store/progress'

export interface CurriculumEntry<T> {
  item: T
  /** Cấp 1, 2, 3... theo đúng thứ tự bài học. */
  level: number
  /** Id dùng để đánh dấu đã hoàn thành trong sổ tiến độ. */
  completionId: string
  completed: boolean
  unlocked: boolean
}

/**
 * Xếp bài học thành các cấp mở dần: cấp 1 mở sẵn, mỗi cấp sau chỉ mở khi
 * bé đã hoàn thành cấp liền trước. Bố mẹ có thể mở khoá tất cả.
 */
export function useCurriculum<T extends { id: string }>(
  items: T[],
  prefix: string,
  suffix = '',
): CurriculumEntry<T>[] {
  const { isCompleted, unlockAll } = useKidProgress()

  return useMemo(
    () =>
      items.map((item, index) => {
        const completionId = `${prefix}:${item.id}${suffix}`
        const previous = items[index - 1]
        const previousId = previous ? `${prefix}:${previous.id}${suffix}` : null
        return {
          item,
          level: index + 1,
          completionId,
          completed: isCompleted(completionId),
          unlocked: unlockAll || index === 0 || (previousId ? isCompleted(previousId) : true),
        }
      }),
    [items, prefix, suffix, isCompleted, unlockAll],
  )
}
