import { useCallback, useEffect, useRef } from 'react'
import { pickMove, toEngineMove } from './minimax'
import type { Difficulty, EngineMove } from './minimax'

interface EngineResponse {
  id: number
  move: EngineMove | null
}

/**
 * Cầu nối tới "bộ não" cờ vua. Chạy trong Web Worker để bàn cờ của bé
 * không bao giờ bị đứng hình khi máy đang suy nghĩ.
 * Nếu trình duyệt chặn Worker, tự động tính ngay trên luồng chính.
 */
export function useChessEngine() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef(new Map<number, (move: EngineMove | null) => void>())
  const idRef = useRef(0)

  useEffect(() => {
    let worker: Worker | null = null
    try {
      worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<EngineResponse>) => {
        const { id, move } = event.data
        const resolve = pendingRef.current.get(id)
        pendingRef.current.delete(id)
        resolve?.(move)
      }
      worker.onerror = () => {
        workerRef.current = null
      }
      workerRef.current = worker
    } catch {
      workerRef.current = null
    }

    return () => {
      worker?.terminate()
      workerRef.current = null
      pendingRef.current.clear()
    }
  }, [])

  /** Nhờ máy tính toán một nước đi cho thế cờ `fen`. */
  const think = useCallback(
    (fen: string, difficulty: Difficulty): Promise<EngineMove | null> =>
      new Promise((resolve) => {
        const worker = workerRef.current
        if (!worker) {
          // Dự phòng: tính trực tiếp (chấp nhận khựng nhẹ nếu Worker bị chặn).
          resolve(toEngineMove(pickMove(fen, difficulty)))
          return
        }
        const id = (idRef.current += 1)
        pendingRef.current.set(id, resolve)
        worker.postMessage({ id, fen, difficulty })
      }),
    [],
  )

  return { think }
}
