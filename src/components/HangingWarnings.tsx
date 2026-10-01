import { useMemo } from 'react'
import { Chess } from 'chess.js'
import { PIECE_NAME_VI } from '../lib/notation'
import { findHangingPieces } from '../lib/threats'
import type { Side } from '../types'

interface Props {
  fen: string
  viewpoint: Side
  enabled: boolean
}

/**
 * Danh sách cảnh báo của "Mắt Thần Cờ Vua": những quân của bé đang bị treo.
 * Tách riêng khỏi bàn cờ để bàn cờ luôn giữ được hình vuông vừa khung nhìn.
 */
export function HangingWarnings({ fen, viewpoint, enabled }: Props) {
  const hanging = useMemo(() => {
    if (!enabled) return []
    const game = new Chess()
    try {
      game.load(fen)
    } catch {
      return []
    }
    return findHangingPieces(game, viewpoint)
  }, [fen, viewpoint, enabled])

  if (!enabled) return null

  if (hanging.length === 0) {
    return (
      <p className="rounded-xl border-2 border-leaf-200 bg-leaf-50 px-2.5 py-1.5 text-center text-[0.7rem] font-extrabold text-leaf-700">
        ✅ Mắt Thần thấy an toàn: chưa có quân nào của bé bị treo!
      </p>
    )
  }

  return (
    <div className="rounded-xl border-2 border-coral-300 bg-coral-50 p-2">
      <p className="text-[0.7rem] font-extrabold uppercase tracking-wide text-coral-600">
        ⚠️ Báo động: {hanging.length} quân đang bị treo!
      </p>
      <ul className="mt-1 flex flex-wrap gap-1">
        {hanging.map((item) => (
          <li
            key={item.square}
            className="rounded-lg bg-white px-1.5 py-0.5 text-[0.7rem] font-extrabold text-coral-700 shadow-sm"
          >
            {PIECE_NAME_VI[item.piece]} {item.square}
            {item.defenders === 0 ? ' - không ai đỡ!' : ' - bị quân rẻ hơn tấn công!'}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[0.65rem] font-bold text-coral-500">
        🆘 Bé hãy cứu quân, hoặc đổi quân cho ngang sức nhé!
      </p>
    </div>
  )
}
