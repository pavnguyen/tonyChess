import { useEffect } from 'react'

interface Options {
  /** Lùi một bước (phím ◀ hoặc ▼). */
  onPrev?: () => void
  /** Tiến một bước (phím ▶ hoặc ▲). */
  onNext?: () => void
  /** Bật/tắt phím tắt, ví dụ chỉ dùng trong chế độ “Học từng bước”. */
  enabled?: boolean
}

const BACK_KEYS = ['ArrowLeft', 'ArrowDown']
const FORWARD_KEYS = ['ArrowRight', 'ArrowUp']

/**
 * Cho bé điều khiển Tiến / Lùi bằng phím mũi tên của bàn phím.
 *
 * - ◀ và ▼ lùi một nước, ▶ và ▲ tiến một nước.
 * - Bỏ qua khi bé đang gõ vào ô nhập liệu, hoặc đang giữ Cmd/Ctrl/Alt (để không
 *   cướp phím tắt của trình duyệt).
 * - Luôn `preventDefault` để phím mũi tên không làm trang tự cuộn.
 *
 * `onPrev` / `onNext` nên được bọc trong `useCallback` để listener không phải
 * gỡ rồi gắn lại sau mỗi lần render.
 */
export function useArrowKeys({ onPrev, onNext, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase() ?? ''
      if (target?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select') {
        return
      }

      const forward = FORWARD_KEYS.includes(event.key)
      const back = BACK_KEYS.includes(event.key)
      if (!forward && !back) return

      event.preventDefault()
      if (forward) onNext?.()
      else onPrev?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onNext, onPrev])
}
