import { useState } from 'react'
import { NOTATION_LEGEND, NOTATION_OPTIONS } from '../lib/notation'
import { STAGES } from '../lib/stages'
import { useKidProgress } from '../store/progress'

/**
 * Bánh răng ⚙️ trên thanh tiêu đề: gom hết tuỳ chọn của bé vào một bảng nhỏ,
 * để phần nội dung chính không bị chiếm mất chiều cao.
 */
export function HeaderOptions() {
  const [open, setOpen] = useState(false)
  const {
    notation,
    setNotation,
    soundOn,
    toggleSound,
    stars,
    rank,
    nextRank,
    unlockAll,
    toggleUnlockAll,
    resetProgress,
    stage,
    setStageId,
    birthYear,
    setBirthYear,
  } = useKidProgress()

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Tùy chọn của bé"
        title="Tùy chọn của bé"
        className={`relative z-50 grid size-9 place-items-center rounded-2xl border-2 border-white/70 text-lg shadow-md transition-all active:translate-y-[2px] ${
          open ? 'bg-white text-brand-700' : 'bg-white/20 text-white hover:bg-white/30'
        }`}
      >
        {open ? '✕' : '⚙️'}
        {!soundOn && (
          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-coral-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-[18.5rem] rounded-2xl border-[3px] border-white bg-white p-3 text-left shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <p className="text-sm font-extrabold text-brand-900">🎛️ Tùy chọn của bé</p>
              <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[0.7rem] font-extrabold text-gold-800">
                {rank.emoji} ⭐ {stars}
              </span>
            </div>
            <p className="mt-1 text-[0.7rem] font-bold text-brand-500">
              {nextRank
                ? `Còn ${nextRank.minStars - stars} ⭐ nữa để thành ${nextRank.emoji} ${nextRank.title}`
                : 'Bé đã đạt danh hiệu cao nhất! 🌟'}
            </p>

            <p className="mt-2.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              🎚️ Giai đoạn của bé
            </p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {STAGES.map((item) => {
                const active = item.id === stage.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStageId(item.id)}
                    className={`flex items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 text-xs font-extrabold transition-all active:translate-y-[1px] ${
                      active
                        ? 'border-brand-400 bg-brand-50 text-brand-800'
                        : 'border-brand-100 bg-white text-brand-500 hover:border-brand-300'
                    }`}
                  >
                    <span aria-hidden>{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <label htmlFor="kid-birth-year" className="text-xs font-extrabold text-brand-600">
                🎂 Năm sinh
              </label>
              <input
                id="kid-birth-year"
                type="number"
                inputMode="numeric"
                min={1990}
                max={2100}
                placeholder="VD 2019"
                value={birthYear ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setBirthYear(value ? Number(value) : null)
                }}
                className="w-24 rounded-xl border-2 border-brand-100 px-2 py-1 text-xs font-extrabold text-brand-800"
              />
            </div>
            <p className="mt-1 text-[0.65rem] font-bold text-brand-600">
              {stage.emoji} <b>{stage.label}</b> · {stage.focus}
            </p>
            <p className="text-[0.65rem] font-bold text-brand-400">🏅 {stage.promotion}</p>

            <p className="mt-2.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              ✍️ Cách ghi nước đi
            </p>
            <div className="mt-1 grid gap-1">
              {NOTATION_OPTIONS.map((option) => {
                const active = option.value === notation
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNotation(option.value)}
                    className={`flex items-center justify-between rounded-xl border-2 px-2.5 py-1.5 text-xs font-extrabold transition-all active:translate-y-[1px] ${
                      active
                        ? 'border-brand-400 bg-brand-50 text-brand-800'
                        : 'border-brand-100 bg-white text-brand-500 hover:border-brand-300'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="rounded-lg bg-white px-2 py-0.5 text-sm shadow-sm">
                      {option.sample}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Bảng đối chiếu để bé học ánh xạ: hình cờ = ký hiệu FIDE = tiếng Việt. */}
            <div className="mt-1.5 grid gap-0.5 rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/60 px-2.5 py-1.5">
              <div className="text-[0.6rem] font-extrabold uppercase tracking-wide text-brand-500">
                🔤 Bảng đối chiếu ký hiệu
              </div>
              {NOTATION_LEGEND.map((row) => (
                <div
                  key={row.piece}
                  className="flex items-center gap-1.5 text-[0.7rem] font-bold text-brand-700"
                >
                  <span className="w-4 text-center text-base leading-none" aria-hidden>
                    {row.glyph}
                  </span>
                  <span className="text-brand-300">=</span>
                  <span className="w-10 text-center font-extrabold text-brand-900">
                    {row.fide || 'ô cờ'}
                  </span>
                  <span className="text-brand-300">=</span>
                  <span className="min-w-0 truncate">
                    {row.name}
                    {row.viet ? ` (${row.viet})` : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2.5 grid gap-1.5">
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white px-2.5 py-1.5 text-xs font-extrabold text-brand-600 transition-all active:translate-y-[1px]"
              >
                <span>🔊 Âm thanh</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                    soundOn ? 'bg-leaf-100 text-leaf-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {soundOn ? 'BẬT' : 'TẮT'}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleUnlockAll}
                className="flex items-center justify-between rounded-xl border-2 border-brand-100 bg-white px-2.5 py-1.5 text-xs font-extrabold text-brand-600 transition-all active:translate-y-[1px]"
              >
                <span>🔓 Mở khoá tất cả bài</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                    unlockAll ? 'bg-gold-100 text-gold-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {unlockAll ? 'BẬT' : 'TẮT'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Bé muốn xóa hết sao và bắt đầu lại từ đầu chứ?')) {
                    resetProgress()
                  }
                }}
                className="rounded-xl border-2 border-coral-100 bg-coral-50 px-2.5 py-1.5 text-xs font-extrabold text-coral-600 transition-all active:translate-y-[1px]"
              >
                🧹 Chơi lại từ đầu
              </button>
            </div>

            <p className="mt-2 text-[0.65rem] font-bold text-brand-400">
              🔄 Bài cờ Đen tự xoay bàn cờ 180° · 🗺️ Bài học mở dần theo cấp.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
