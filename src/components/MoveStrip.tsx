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
                ? 'border-leaf-300 bg-leaf-100 text-leaf-800'
                : isNext
                  ? 'border-gold-400 bg-gold-100 text-gold-900 shadow-[0_2px_5px_rgba(124,89,20,0.28)]'
                  : 'border-brand-200 bg-white text-brand-500'
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
