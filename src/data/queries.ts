import { useQuery } from '@tanstack/react-query'
import { ENDGAMES } from './endgames'
import { OPENINGS } from './openings'
import { BEST_MOVES } from './bestMoves'
import { COUNTERS } from './counters'

/**
 * Dữ liệu bài học nằm ngay trong bundle - không có API, không có mạng.
 *
 * Trước đây mỗi hook `await pause(60)` để "giả lập API", hậu quả là mở tab nào
 * cũng có một nhịp skeleton 60ms và bàn cờ hiện chậm hơn cần thiết. Nay
 * `initialData` trả dữ liệu ngay từ lần render đầu, `isLoading` luôn `false`;
 * TanStack Query chỉ còn giữ vai trò cache/không nháy khi đổi tab.
 */
export function useOpeningsQuery() {
  return useQuery({
    queryKey: ['openings'],
    queryFn: async () => OPENINGS,
    initialData: OPENINGS,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useTacticsQuery() {
  return useQuery({
    queryKey: ['best-moves'],
    queryFn: async () => BEST_MOVES,
    initialData: BEST_MOVES,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useCountersQuery() {
  return useQuery({
    queryKey: ['counters'],
    queryFn: async () => COUNTERS,
    initialData: COUNTERS,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useEndgamesQuery() {
  return useQuery({
    queryKey: ['endgames'],
    queryFn: async () => ENDGAMES,
    initialData: ENDGAMES,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
