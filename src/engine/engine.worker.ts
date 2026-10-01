/// <reference lib="webworker" />
import { pickMove, toEngineMove } from './minimax'
import type { Difficulty } from './minimax'

interface EngineRequest {
  id: number
  fen: string
  difficulty: Difficulty
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<EngineRequest>) => void) | null
  postMessage: (message: unknown) => void
}

ctx.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { id, fen, difficulty } = event.data
  let move = null
  try {
    move = toEngineMove(pickMove(fen, difficulty))
  } catch {
    move = null
  }
  ctx.postMessage({ id, move })
}
