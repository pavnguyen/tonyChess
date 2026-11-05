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
 *
 * Bốn hook chỉ khác nhau ở khoá cache + mảng dữ liệu, nên gom về một chỗ.
 */
function useLocalLessonData<T>(queryKey: string, data: T) {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => data,
    initialData: data,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export const useOpeningsQuery = () => useLocalLessonData('openings', OPENINGS)
export const useTacticsQuery = () => useLocalLessonData('best-moves', BEST_MOVES)
export const useCountersQuery = () => useLocalLessonData('counters', COUNTERS)
export const useEndgamesQuery = () => useLocalLessonData('endgames', ENDGAMES)
