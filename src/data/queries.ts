import { useQuery } from '@tanstack/react-query'
import { ENDGAMES } from './endgames'
import { OPENINGS } from './openings'
import { BEST_MOVES } from './bestMoves'

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Lớp dữ liệu giả lập API: nhờ TanStack Query nên các bài học được
 * cache lại, đổi tab qua lại là hiện ngay, không nháy màn hình.
 */
export function useOpeningsQuery() {
  return useQuery({
    queryKey: ['openings'],
    queryFn: async () => {
      await pause(60)
      return OPENINGS
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useTacticsQuery() {
  return useQuery({
    queryKey: ['best-moves'],
    queryFn: async () => {
      await pause(60)
      return BEST_MOVES
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useEndgamesQuery() {
  return useQuery({
    queryKey: ['endgames'],
    queryFn: async () => {
      await pause(60)
      return ENDGAMES
    },
    staleTime: Number.POSITIVE_INFINITY,
  })
}
