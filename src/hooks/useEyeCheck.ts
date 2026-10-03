import { useCallback, useState } from 'react'

/**
 * “Mắt Thần Cờ Vua”: **tắt sẵn** — bàn cờ mặc định sạch, bé/ba mẹ chủ động bật
 * khi muốn soi thế cờ (quân bị treo, ô nguy hiểm).
 */
export function useEyeCheck() {
  const [on, setOn] = useState(false)
  const toggle = useCallback(() => setOn((value) => !value), [])
  return { on, toggle }
}
