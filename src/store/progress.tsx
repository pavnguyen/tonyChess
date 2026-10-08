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
}

const DEFAULTS: Persisted = {
  notation: 'figurine',
  soundOn: true,
}

interface KidContextValue {
  notation: NotationStyle
  setNotation: (notation: NotationStyle) => void
  soundOn: boolean
  toggleSound: () => void
}

const KidContext = createContext<KidContextValue | null>(null)

function load(): Persisted {
  if (typeof localStorage === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      // Bản cũ từng cho bé chọn tuýp "chuẩn quốc tế thuần" (Nf3) - nay đã bỏ, nên
      // dữ liệu đã lưu cần quy về "hình cờ + quốc tế" cho khớp bảng tuỳ chọn.
      notation: parsed.notation === 'vietnamese' ? 'vietnamese' : 'figurine',
      soundOn: parsed.soundOn ?? true,
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

  const value = useMemo<KidContextValue>(
    () => ({ notation: state.notation, soundOn: state.soundOn, setNotation, toggleSound }),
    [state.notation, state.soundOn, setNotation, toggleSound],
  )

  return <KidContext.Provider value={value}>{children}</KidContext.Provider>
}

/* eslint-disable-next-line react/only-export-components -- hook đi kèm provider là mẫu Context quen thuộc */
export function useKidProgress(): KidContextValue {
  const context = useContext(KidContext)
  if (!context) throw new Error('useKidProgress phải dùng bên trong <KidProgressProvider>')
  return context
}
