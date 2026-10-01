import { useCallback, useEffect, useRef } from 'react'
import { DIFFICULTY, pickMove, toEngineMove } from './minimax'
import { stockfishThink } from './stockfishLoader'
import type { Difficulty, EngineMove } from './minimax'

interface EngineResponse {
  id: number
  move: EngineMove | null
}

interface PendingRequest {
  fen: string
  difficulty: Difficulty
  timer: ReturnType<typeof setTimeout>
  resolve: (move: EngineMove | null) => void
}

/** Tính ngay trên luồng chính khi Worker không dùng được. */
const computeHere = (fen: string, difficulty: Difficulty) =>
  toEngineMove(pickMove(fen, difficulty))

/**
 * Cầu nối tới "bộ não" cờ vua. Chạy trong Web Worker để bàn cờ của bé
 * không bao giờ đứng hình khi máy đang suy nghĩ.
 *
 * Ba lớp bảo hiểm để máy không bao giờ "đứng hình":
 * 1. Worker lỗi → giải phóng mọi yêu cầu bằng cách tính trực tiếp.
 * 2. Worker im lặng quá lâu (quá ngân sách thời gian) → tính trực tiếp.
 * 3. Trình duyệt chặn Worker → dùng luôn luồng chính.
 */
export function useChessEngine() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef(new Map<number, PendingRequest>())
  const idRef = useRef(0)

  useEffect(() => {
    // Giữ tham chiếu tới Map để hàm dọn dẹp không truy cập `.current` trực tiếp.
    const pending = pendingRef.current

    const settleAllHere = () => {
      for (const [id, item] of pending) {
        pending.delete(id)
        clearTimeout(item.timer)
        item.resolve(computeHere(item.fen, item.difficulty))
      }
    }

    let worker: Worker | null = null
    try {
      worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<EngineResponse>) => {
        const { id, move } = event.data
        const item = pending.get(id)
        if (!item) return
        pending.delete(id)
        clearTimeout(item.timer)
        item.resolve(move)
      }
      worker.onerror = () => {
        workerRef.current = null
        settleAllHere()
      }
      workerRef.current = worker
    } catch {
      workerRef.current = null
    }

    return () => {
      worker?.terminate()
      workerRef.current = null
      for (const item of pending.values()) clearTimeout(item.timer)
      pending.clear()
    }
  }, [])

  /**
   * Nhờ máy tính toán một nước đi cho thế cờ `fen`.
   * Mức `master` ưu tiên **Stockfish WASM** (mạnh thật); nếu không tải được thì
   * tự động rơi về engine JS dựng sẵn - app không bao giờ vỡ.
   */
  const think = useCallback(
    (fen: string, difficulty: Difficulty): Promise<EngineMove | null> => {
      if (difficulty === 'master') {
        return stockfishThink(fen, { depth: 18, movetime: 1600 })
          .then((move) => move ?? computeHere(fen, difficulty))
          .catch(() => computeHere(fen, difficulty))
      }
      return new Promise((resolve) => {
        const worker = workerRef.current
        if (!worker) {
          resolve(computeHere(fen, difficulty))
          return
        }
        const id = (idRef.current += 1)
        const timer = setTimeout(() => {
          const item = pendingRef.current.get(id)
          if (!item) return
          pendingRef.current.delete(id)
          item.resolve(computeHere(fen, difficulty))
        }, DIFFICULTY[difficulty].timeBudget + 2000)

        pendingRef.current.set(id, { fen, difficulty, timer, resolve })
        worker.postMessage({ id, fen, difficulty })
      })
    },
    [],
  )

  return { think }
}
