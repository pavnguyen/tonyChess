import {
  describeMove,
  formatSan,
  formatSanLetters,
  moveLabel,
  pieceFromSan,
  PIECE_GLYPH,
  PIECE_NAME_VI,
} from '../lib/notation'
import type { MoveAnnotation, NotationStyle } from '../types'

export type BannerVariant = 'hint' | 'played' | 'opponent' | 'wrong'

const VARIANT_STYLE: Record<
  BannerVariant,
  { ring: string; chip: string; label: string; icon: string }
> = {
  hint: {
    ring: 'border-gold-300',
    chip: 'bg-gold-100 text-gold-900',
    label: 'Nước sắp tới',
    icon: '👉',
  },
  played: {
    ring: 'border-leaf-300',
    chip: 'bg-leaf-100 text-leaf-900',
    label: 'Bé vừa đi',
    icon: '✅',
  },
  opponent: {
    ring: 'border-info-300',
    chip: 'bg-info-100 text-info-900',
    label: 'Đối thủ đi',
    icon: '🤖',
  },
  wrong: {
    ring: 'border-coral-300',
    chip: 'bg-coral-100 text-coral-900',
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
  const isCastle = annotation.san.startsWith('O-O')
  /**
   * Chữ TO bên cạnh hình quân: với tuýp `figurine` (♘Nf3) thì BỎ hình quân đi -
   * hình quân đã được vẽ to ngay bên trái rồi, để nguyên sẽ thành "♗ ♗Bf4" (lặp
   * hình hai lần). Tuýp "Tiếng Việt" không kèm hình nên giữ nguyên `Mf3`.
   *
   * Nhãn nhỏ phía trên (`moveLabel`) vẫn hiện ĐÚNG tuýp bé đã chọn, để bé còn
   * thấy được cả cách viết "Hình cờ + quốc tế".
   */
  const shownNotation = isCastle
    ? 'O-O'
    : notation === 'figurine'
      ? formatSanLetters(annotation.san)
      : formatSan(annotation.san, notation)

  return (
    <section
      aria-live="polite"
      className={`animate-pop-in card-pop border-[3px] ${style.ring} p-2.5 sm:p-3`}
    >
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {/* 1. Nước đi + tên quân */}
        <div className="grid content-start gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold ${style.chip}`}
            >
              {style.icon} {style.label}
            </span>
            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[0.7rem] font-bold text-brand-700 ring-1 ring-sand-200">
              {moveLabel(plyIndex, annotation.san, notation)}
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 px-3 py-2 text-white shadow-[0_10px_20px_-14px_rgba(13,32,24,0.95)]">
            {/* Hình quân cờ chuẩn (♚♛♜♝♞♟) để bé nhận ra ngay quân gì. */}
            <span
              className="text-3xl leading-none text-white drop-shadow-[0_2px_0_rgba(13,32,24,0.5)] sm:text-4xl"
              aria-hidden
            >
              {PIECE_GLYPH[piece]}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-xl font-extrabold tracking-tight sm:text-2xl">
                {shownNotation}
              </div>
              <div className="truncate text-[0.7rem] font-bold text-white/85 sm:text-xs">
                Quân {PIECE_NAME_VI[piece]} · {info.action}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Lý do + 3. Khẩu quyết vè */}
        <div className="grid content-start gap-1.5">
          <div className="rounded-2xl bg-brand-50 px-2.5 py-1.5">
            <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              💡 Vì sao?
            </div>
            <p className="text-sm font-bold text-brand-900">{annotation.reason}</p>
          </div>
          {annotation.rhyme ? (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-sun bg-sun/20 px-2.5 py-1.5">
              <span className="text-lg sm:text-xl" aria-hidden>
                🎵
              </span>
              <div className="min-w-0">
                <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-gold-600">
                  Khẩu quyết vè - đọc to lên nhé!
                </div>
                <div className="text-base font-extrabold text-gold-900 sm:text-lg">
                  “{annotation.rhyme}”
                </div>
              </div>
            </div>
          ) : (
            annotation.principle && (
              <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-info-300 bg-info-50 px-2.5 py-1.5">
                <span className="text-lg sm:text-xl" aria-hidden>
                  🎯
                </span>
                <div className="min-w-0">
                  <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-info-600">
                    Nguyên tắc
                  </div>
                  <div className="text-sm font-extrabold text-info-900">
                    {annotation.principle}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}
