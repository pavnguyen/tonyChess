import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { setMuted } from '../lib/sound'
import type { NotationStyle } from '../types'

const STORAGE_KEY = 'hoc-vien-co-vua-nhi.v1'

/**
 * Tuỳ chọn của bé được lưu lại giữa các lần mở app.
 *
 * App cố ý **không** theo dõi điểm số/tiến độ: bé tự nhớ mình đã học tới đâu, ba mẹ
 * muốn cho bé học mảng nào lúc nào cũng được. Chỉ còn những tuỳ chọn ảnh hưởng tới
 * cách app hiển thị và đọc.
 */
interface Persisted {
  notation: NotationStyle
  soundOn: boolean
  /**
   * Ngày (YYYY-MM-DD theo giờ máy) ba mẹ tạm tắt cửa toán; `null` là đang bật.
   * Chỉ có hiệu lực trong ĐÚNG ngày đó - hôm sau cửa toán tự bật lại.
   */
  mathGateOffOn: string | null
}

/** Ngày hôm nay dạng `YYYY-MM-DD` theo giờ máy (không dùng UTC kẻo lệch múi giờ). */
function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const DEFAULTS: Persisted = {
  notation: 'figurine',
  soundOn: true,
  mathGateOffOn: null,
}

interface KidContextValue {
  notation: NotationStyle
  setNotation: (notation: NotationStyle) => void
  soundOn: boolean
  toggleSound: () => void
  /** Ba mẹ đã tạm tắt cửa toán trong hôm nay chưa (bật/tắt trong ⚙️ Tùy chọn của bé). */
  mathGateOff: boolean
  toggleMathGate: () => void
}

const KidContext = createContext<KidContextValue | null>(null)

function load(): Persisted {
  if (typeof localStorage === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Persisted> & { mathGateOff?: boolean }
    const today = todayKey()
    // Bản cũ lưu cờ `mathGateOff: true` và nhớ mãi; nay chỉ tắt cho hết ngày, nên
    // dữ liệu cũ được coi như vừa tắt hôm nay rồi mai tự bật lại.
    const legacyOff = parsed.mathGateOff === true
    return {
      // Bản cũ từng cho bé chọn tuýp "chuẩn quốc tế thuần" (Nf3) - nay đã bỏ, nên
      // dữ liệu đã lưu cần quy về "hình cờ + quốc tế" cho khớp bảng tuỳ chọn.
      notation: parsed.notation === 'vietnamese' ? 'vietnamese' : 'figurine',
      soundOn: parsed.soundOn ?? true,
      // Qua ngày mới thì coi như đang BẬT, kể cả khi app không được mở lại.
      mathGateOffOn:
        parsed.mathGateOffOn === today || (parsed.mathGateOffOn == null && legacyOff)
          ? today
          : null,
    }
  } catch {
    return DEFAULTS
  }
}

export function KidProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* bỏ qua khi trình duyệt chặn lưu trữ */
    }
    setMuted(!state.soundOn)
  }, [state])

  const setNotation = useCallback((notation: NotationStyle) => {
    setState((prev) => ({ ...prev, notation }))
  }, [])

  const toggleSound = useCallback(() => {
    setState((prev) => ({ ...prev, soundOn: !prev.soundOn }))
  }, [])

  const toggleMathGate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      // Tắt là tắt cho hết HÔM NAY; mai mở app là cửa toán tự bật lại.
      mathGateOffOn: prev.mathGateOffOn === null ? todayKey() : null,
    }))
  }, [])

  // Máy tính bảng để mở qua đêm: vừa qua ngày mới là tự bật lại cửa toán, không
  // đợi ba mẹ nhớ ra. Hẹn đúng mốc nửa đêm nên không phải kiểm tra mỗi phút.
  useEffect(() => {
    if (!state.mathGateOffOn) return
    const now = new Date()
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = window.setTimeout(
      () => setState((prev) => (prev.mathGateOffOn ? { ...prev, mathGateOffOn: null } : prev)),
      Math.max(1000, nextDay.getTime() - now.getTime()),
    )
    return () => window.clearTimeout(timer)
  }, [state.mathGateOffOn])

  const value = useMemo<KidContextValue>(
    () => ({
      notation: state.notation,
      soundOn: state.soundOn,
      setNotation,
      toggleSound,
      mathGateOff: state.mathGateOffOn !== null,
      toggleMathGate,
    }),
    [state.notation, state.soundOn, state.mathGateOffOn, setNotation, toggleSound, toggleMathGate],
  )

  return <KidContext.Provider value={value}>{children}</KidContext.Provider>
}

/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useKidProgress(): KidContextValue {
  const context = useContext(KidContext)
  if (!context) throw new Error('useKidProgress phải dùng bên trong <KidProgressProvider>')
  return context
}
