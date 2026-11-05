import { useEffect } from 'react'
import { MoveText } from './MoveText'
import { LessonLabel } from './ui'
import {
  describeMove,
  formatSan,
  formatSanLetters,
  moveLabel,
  pieceFromSan,
  PIECE_GLYPH,
  PIECE_NAME_VI,
} from '../lib/notation'
import { speakVietnamese } from '../lib/speech'
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

  /**
   * Khẩu quyết chỉ là **lời nhắc cho nước SẮP TỚI của bé** (hoặc câu trấn an khi bé
   * đi sai). Nước của đối thủ mà kèm “khẩu quyết” thì bé dễ tưởng đó là việc mình
   * phải làm - nên bỏ hẳn ở trạng thái `opponent`, và cũng không khoe lại sau khi bé
   * đã đi xong (`played`) vì lúc đó bé cần xem nước đã đi, không cần nhắc nữa.
   */
  const showRhyme = Boolean(annotation.rhyme) && (variant === 'hint' || variant === 'wrong')
  const showPrinciple = !showRhyme && Boolean(annotation.principle)

  /**
   * Nhắc tuồng: khẩu quyết được đọc to bằng tiếng Việt ngay khi băng "nước sắp tới"
   * hiện ra, để bé nghe trước rồi làm theo. Máy tắt tiếng (🔇) hoặc không có giọng
   * đọc thì im lặng, không báo lỗi.
   */
  useEffect(() => {
    if (variant !== 'hint' || !annotation.rhyme) return
    speakVietnamese(annotation.rhyme)
  }, [variant, annotation.rhyme, annotation.san])

  /*
    Bố cục BA CỘT ĐỀU NHAU trên màn hình rộng (nước đi · vì sao · khẩu quyết) thay
    cho hai cột lệch trước đây: cột trái vừa chip vừa khối xanh lớn nên cao gấp rưỡi
    cột phải, khối xanh lại phình to trong khi chữ bên cạnh ngắn - nhìn nặng và
    chiếm chiều cao của bàn cờ. Ba khối cùng một hàng, cùng bo góc, cùng đệm dọc,
    chỉ khác màu - cân đối và thấp hơn hẳn. Trên điện thoại ba khối tự xếp dọc.
  */
  return (
    <section
      aria-live="polite"
      className={`animate-pop-in card-pop border-2 ${style.ring} px-2 py-1.5 sm:px-2.5`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold ${style.chip}`}>
          {style.icon} {style.label}
        </span>
        <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[0.7rem] font-bold text-brand-700 ring-1 ring-sand-200">
          {moveLabel(plyIndex, annotation.san, notation)}
        </span>
      </div>

      <div
        className={`mt-1.5 grid gap-1.5 sm:gap-2 ${
          showRhyme || showPrinciple
            ? 'sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.05fr)]'
            : 'sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'
        }`}
      >
        {/* 1. Nước đi + tên quân */}
        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 px-2 py-1 text-white shadow-[0_8px_16px_-14px_rgba(13,32,24,0.95)]">
          {/* Hình quân cờ chuẩn (♚♛♜♝♞♟) để bé nhận ra ngay quân gì. */}
          <span
            className="shrink-0 text-2xl leading-none text-white drop-shadow-[0_2px_0_rgba(13,32,24,0.5)]"
            aria-hidden
          >
            {PIECE_GLYPH[piece]}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              {shownNotation}
            </div>
            <div className="truncate text-[0.7rem] font-bold text-white/85">
              Quân {PIECE_NAME_VI[piece]} · {info.action}
            </div>
          </div>
        </div>

        {/* 2. Lý do */}
        <div className="flex min-w-0 flex-col justify-center rounded-xl bg-brand-50 px-2 py-1">
          <LessonLabel icon="💡" title="Vì sao?" tone="gold" size="sm" />
          <p className="text-xs font-bold leading-snug text-brand-900 sm:text-[0.8rem]">
            <MoveText text={annotation.reason} />
          </p>
        </div>

        {/* 3. Khẩu quyết vè (chỉ khi là lời nhắc cho nước sắp tới của bé) */}
        {showRhyme ? (
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl border-2 border-dashed border-sun bg-sun/20 px-2 py-1">
            <div className="min-w-0 flex-1">
              <LessonLabel icon="🎵" title="Khẩu quyết" tone="gold" size="sm" />
              <div className="text-sm font-extrabold leading-snug text-gold-900">
                “{annotation.rhyme}”
              </div>
            </div>
            <button
              type="button"
              onClick={() => speakVietnamese(annotation.rhyme ?? '')}
              aria-label="Đọc lại khẩu quyết"
              title="Đọc lại khẩu quyết"
              className="shrink-0 rounded-full px-1 text-sm leading-none text-gold-700 transition-colors hover:bg-gold-100 active:translate-y-[1px]"
            >
              🔊
            </button>
          </div>
        ) : (
          showPrinciple && (
            <div className="flex min-w-0 items-center gap-1.5 rounded-xl border-2 border-dashed border-info-300 bg-info-50 px-2 py-1">
              <div className="min-w-0">
                <LessonLabel icon="🎯" title="Nguyên tắc" tone="info" size="sm" />
                <div className="text-xs font-extrabold leading-snug text-info-900 sm:text-sm">
                  {annotation.principle}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
