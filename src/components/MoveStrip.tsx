import { moveLabel } from '../lib/notation'
import type { NotationStyle, Opening } from '../types'

interface Props {
  opening: Opening
  /** Số ply đã đi xong (ô có index = ply-1 là nước vừa đi). */
  ply: number
  notation: NotationStyle
  onJump?: (ply: number) => void
  className?: string
}

export function MoveStrip({ opening, ply, notation, onJump, className = '' }: Props) {
  return (
    <div className={`flex gap-1.5 overflow-x-auto pb-1 ${className}`}>
      {opening.moves.map((move, index) => {
        const done = index < ply
        const isNext = index === ply
        const isKid =
          opening.side === 'white' ? index % 2 === 0 : index % 2 === 1
        return (
          <button
            key={`${index}-${move.san}`}
            onClick={() => onJump?.(index)}
            disabled={!onJump}
            className={`shrink-0 rounded-xl border-2 px-2.5 py-1.5 text-xs font-extrabold transition-all sm:text-sm ${
              done
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                : isNext
                  ? 'border-amber-400 bg-amber-100 text-amber-900 shadow-[0_3px_0_#fbbf24]'
                  : 'border-violet-200 bg-white text-violet-500'
            } ${onJump ? 'active:translate-y-[2px]' : 'cursor-default'}`}
            title={isKid ? 'Nước của bé' : 'Nước của đối thủ'}
          >
            {isKid && <span className="mr-0.5">🐣</span>}
            {moveLabel(index, move.san, notation)}
          </button>
        )
      })}
    </div>
  )
}
