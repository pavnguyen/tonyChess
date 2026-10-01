import { useCallback, useEffect, useRef, useState } from 'react'
import { useKidProgress } from '../store/progress'

/** Bao lâu thì “Kiểm tra” tự tắt ở giai đoạn lớn (13+). */
const CHECK_VISIBLE_MS = 3000

/**
 * “Mắt Thần Cờ Vua” theo giai đoạn:
 *  - Nhí (7-9): **bật sẵn** — bé mới chơi cần thấy nguy hiểm ngay.
 *  - Thiếu nhi (10-12): **tắt sẵn**, bé tự bật như một công cụ.
 *  - Thiếu niên trở lên: nút đổi thành **“🔍 Kiểm tra”** — bấm thì hiện
 *    và tự tắt sau vài giây để không thành cái nạng.
 *
 * Trạng thái được gắn với `stage.id`: đổi giai đoạn là tự trả về mặc định mới
 * mà không cần effect (tránh setState trong effect).
 */
export function useEyeCheck() {
  const { stage } = useKidProgress()
  const checkMode = stage.id === 'thieu-nien' || stage.id === 'chuyen-nghiep'
  const defaultOn = stage.id === 'nhi'

  const [eye, setEye] = useState<{ stageId: string; on: boolean }>(() => ({
    stageId: stage.id,
    on: defaultOn,
  }))
  const on = eye.stageId === stage.id ? eye.on : defaultOn

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggle = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (checkMode) {
      // “Kiểm tra”: hiện vài giây rồi tự tắt.
      setEye({ stageId: stage.id, on: true })
      timerRef.current = setTimeout(
        () => setEye({ stageId: stage.id, on: false }),
        CHECK_VISIBLE_MS,
      )
      return
    }
    setEye((prev) => {
      const current = prev.stageId === stage.id ? prev.on : defaultOn
      return { stageId: stage.id, on: !current }
    })
  }, [checkMode, stage.id, defaultOn])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return { on, toggle, checkMode }
}
