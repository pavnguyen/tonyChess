import { useEffect, useState } from 'react'

/**
 * Cửa sổ đang ở bố cục "bàn làm việc" 2 cột chưa? (`stage` trong `index.css`:
 * rộng ≥ 60rem **và** không cao hơn bề rộng.)
 *
 * Một số trang cần biết điều này trong JS chứ không chỉ bằng class Tailwind: khi
 * cùng một bộ điều khiển có bản "trên bàn cờ" (điện thoại) và bản "cột phải"
 * (máy tính), render CẢ HAI rồi ẩn bằng CSS sẽ nhân đôi nút trong DOM - bài kiểm
 * đếm nút và trình đọc màn hình đều thấy thừa. Render đúng một bản thì sạch hơn.
 */
const QUERY = '(min-width: 60rem) and (min-aspect-ratio: 1/1)'

function matches(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches
}

export function useStageLayout(): boolean {
  const [stage, setStage] = useState(matches)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const update = () => setStage(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return stage
}
