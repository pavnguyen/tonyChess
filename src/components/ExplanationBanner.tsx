import {
  describeMove,
  formatSan,
  moveLabel,
  pieceFromSan,
  PIECE_NAME_VI,
} from '../lib/notation'
import type { MoveAnnotation, NotationStyle } from '../types'

const PIECE_EMOJI: Record<string, string> = {
  k: '👑',
  q: '💃',
  r: '🏰',
  b: '🃏',
  n: '🐴',
  p: '🛡️',
}

export type BannerVariant = 'hint' | 'played' | 'opponent' | 'wrong'

const VARIANT_STYLE: Record<
  BannerVariant,
  { ring: string; chip: string; label: string; icon: string }
> = {
  hint: {
    ring: 'border-amber-300',
    chip: 'bg-amber-100 text-amber-900',
    label: 'Nước sắp tới',
    icon: '👉',
  },
  played: {
    ring: 'border-emerald-300',
    chip: 'bg-emerald-100 text-emerald-900',
    label: 'Bé vừa đi',
    icon: '✅',
  },
  opponent: {
    ring: 'border-sky-300',
    chip: 'bg-sky-100 text-sky-900',
    label: 'Đối thủ đi',
    icon: '🤖',
  },
  wrong: {
    ring: 'border-rose-300',
    chip: 'bg-rose-100 text-rose-900',
    label: 'Thử lại nhé',
    icon: '🤔',
  },
}

interface Props {
  annotation: MoveAnnotation
  plyIndex: number
  notation: NotationStyle
  variant?: BannerVariant
}

/**
 * Banner Giải Thích Siêu Ngắn gồm 3 phần:
 * 1) Nước đi + Tên quân  2) Lý do  3) Khẩu quyết vè.
 */
export function ExplanationBanner({
  annotation,
  plyIndex,
  notation,
  variant = 'hint',
}: Props) {
  const style = VARIANT_STYLE[variant]
  const piece = annotation.piece ?? pieceFromSan(annotation.san)
  const info = describeMove(annotation.san, notation)
  const shownNotation = annotation.san.startsWith('O-O')
    ? 'O-O'
    : formatSan(annotation.san, notation)

  return (
    <section
      aria-live="polite"
      className={`animate-pop-in card-pop border-[3px] ${style.ring} p-3 sm:p-4`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold sm:text-sm ${style.chip}`}
        >
          {style.icon} {style.label}
        </span>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 sm:text-sm">
          {moveLabel(plyIndex, annotation.san, notation)}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,auto)_1fr] sm:gap-3">
        {/* 1. Nước đi + tên quân */}
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-3 py-2 text-white shadow-md">
          <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
            {PIECE_EMOJI[piece]}
          </span>
          <div className="leading-tight">
            <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {shownNotation}
            </div>
            <div className="text-xs font-bold text-white/85 sm:text-sm">
              Quân {PIECE_NAME_VI[piece]} · {info.action}
            </div>
          </div>
        </div>

        {/* 2. Lý do */}
        <div className="rounded-2xl bg-violet-50 px-3 py-2">
          <div className="text-xs font-extrabold uppercase tracking-wide text-violet-500">
            💡 Vì sao?
          </div>
          <p className="text-sm font-bold text-violet-900 sm:text-base">{annotation.reason}</p>
        </div>
      </div>

      {/* 3. Khẩu quyết vè */}
      <div className="mt-2 flex items-center gap-2 rounded-2xl border-2 border-dashed border-sun bg-sun/20 px-3 py-2">
        <span className="text-xl sm:text-2xl" aria-hidden>
          🎵
        </span>
        <div>
          <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-amber-600">
            Khẩu quyết vè — đọc to lên nhé!
          </div>
          <div className="text-lg font-extrabold text-amber-900 sm:text-xl">
            “{annotation.rhyme}”
          </div>
        </div>
      </div>
    </section>
  )
}
