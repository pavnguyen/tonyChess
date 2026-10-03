import { useEffect, useState } from 'react'
import { NOTATION_LEGEND, NOTATION_OPTIONS, NOTATION_SYMBOLS } from '../lib/notation'
import {
  getSelectedVoiceName,
  listEnglishVoices,
  previewSpeech,
  setSelectedVoice,
  subscribeVoices,
} from '../lib/speech'
import { InfoButton } from './InfoPopover'
import { useKidProgress } from '../store/progress'

/**
 * Bánh răng ⚙️ trên thanh tiêu đề: gom hết tuỳ chọn của bé vào một bảng nhỏ,
 * để phần nội dung chính không bị chiếm mất chiều cao.
 */
/** Câu đọc mẫu khi bé/ba mẹ bấm 🔊 ở mỗi dòng giọng. */
const VOICE_SAMPLE = 'Knight F 3, check'

export function HeaderOptions() {
  const [open, setOpen] = useState(false)
  // Danh sách giọng đọc máy có - Chrome/Safari nạp BẤT ĐỒNG BỘ, nên vừa đọc lần
  // đầu vừa nghe `voiceschanged` để cập nhật lại khi giọng về muộn.
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceName, setVoiceName] = useState<string | null>(getSelectedVoiceName)

  useEffect(() => {
    const refresh = () => setVoices(listEnglishVoices())
    refresh()
    return subscribeVoices(refresh)
  }, [])
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
          {/*
            Bảng tuỳ chọn nay dài hơn (thêm bảng đối chiếu ký hiệu đầy đủ) nên phải
            tự cuộn trong khung: trước đây để cao tự nhiên sẽ tràn khỏi màn hình
            điện thoại, bé không với tới nút cuối.
          */}
          <div className="animate-pop-in absolute right-0 top-full z-50 mt-2 max-h-[80dvh] w-[18.5rem] overflow-y-auto rounded-2xl border-[3px] border-white bg-white p-3 text-left shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-sm font-extrabold text-brand-900">
                🎛️ Tùy chọn của bé
                <InfoButton topic="stars" />
              </div>
              <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[0.7rem] font-extrabold text-gold-800">
                {rank.emoji} ⭐ {stars}
              </span>
            </div>
            <p className="mt-1 text-[0.7rem] font-bold text-brand-500">
              {nextRank
                ? `Còn ${nextRank.minStars - stars} ⭐ nữa để thành ${nextRank.emoji} ${nextRank.title}`
                : 'Bé đã đạt danh hiệu cao nhất! 🌟'}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              ✍️ Cách ghi nước đi
              <InfoButton topic="notation" />
            </div>
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

            {/*
              Phần thứ hai của bảng đối chiếu: ký hiệu ĐẶC BIỆT (nhập thành, chiếu,
              chiếu bí, ăn quân, phong cấp, bắt Tốt qua đường, nước hay/dở, kết quả
              ván) - nhờ vậy bé đọc được trọn một biên bản cờ chứ không chỉ tên quân.
            */}
            <div className="mt-1.5 grid gap-0.5 rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/60 px-2.5 py-1.5">
              <div className="text-[0.6rem] font-extrabold uppercase tracking-wide text-brand-500">
                ✍️ Ký hiệu đặc biệt trên biên bản
              </div>
              {NOTATION_SYMBOLS.map((row) => (
                <div
                  key={row.glyph}
                  className="flex items-center gap-1.5 text-[0.7rem] font-bold text-brand-700"
                >
                  <span className="w-10 shrink-0 text-center text-xs leading-none font-extrabold text-brand-900">
                    {row.glyph}
                  </span>
                  <span className="text-brand-300">=</span>
                  <span className="min-w-0 flex-1 truncate">{row.meaning}</span>
                  <span className="shrink-0 font-bold text-brand-400">{row.sample}</span>
                </div>
              ))}
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              🔈 Giọng đọc
            </div>
            {voices.length === 0 ? (
              <p className="mt-1 text-[0.65rem] font-bold text-brand-400">
                Máy này chưa có giọng tiếng Anh riêng - app sẽ đọc bằng giọng mặc định của trình duyệt.
              </p>
            ) : (
              <div
                id="kid-voice-list"
                className="mt-1 grid max-h-44 gap-0.5 overflow-y-auto rounded-xl border-2 border-brand-100 p-1"
              >
                <div
                  data-voice-name=""
                  className={`flex items-center gap-1 rounded-lg px-1 py-0.5 ${
                    voiceName === null ? 'bg-brand-50' : ''
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={voiceName === null}
                    onClick={() => {
                      setSelectedVoice(null)
                      setVoiceName(null)
                    }}
                    className={`min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-[0.7rem] font-extrabold ${
                      voiceName === null ? 'text-brand-800' : 'text-brand-500'
                    }`}
                  >
                    ⭐ Tự động (giọng hay nhất)
                  </button>
                  <button
                    type="button"
                    title="Nghe thử giọng tự động"
                    onClick={() => previewSpeech(VOICE_SAMPLE, '')}
                    className="grid size-6 shrink-0 place-items-center rounded-lg bg-white text-[0.7rem] shadow-sm ring-1 ring-brand-100"
                  >
                    🔊
                  </button>
                </div>
                {voices.map((voice) => {
                  const active = voiceName === voice.name
                  return (
                    <div
                      key={`${voice.name}-${voice.lang}`}
                      data-voice-name={voice.name}
                      className={`flex items-center gap-1 rounded-lg px-1 py-0.5 ${
                        active ? 'bg-brand-50' : ''
                      }`}
                    >
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelectedVoice(voice.name)
                          setVoiceName(voice.name)
                        }}
                        className={`min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-[0.7rem] font-extrabold ${
                          active ? 'text-brand-800' : 'text-brand-500'
                        }`}
                      >
                        {voice.name} <span className="text-brand-300">· {voice.lang}</span>
                      </button>
                      <button
                        type="button"
                        title={`Nghe thử: ${voice.name}`}
                        onClick={() => previewSpeech(VOICE_SAMPLE, voice.name)}
                        className="grid size-6 shrink-0 place-items-center rounded-lg bg-white text-[0.7rem] shadow-sm ring-1 ring-brand-100"
                      >
                        🔊
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

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
