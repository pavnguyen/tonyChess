/**
 * **Bàn cờ biết nói** - phát âm toạ độ và tên nước đi bằng Web Speech API.
 *
 * Vì sao dùng Web Speech API: Chrome (và hầu hết trình duyệt hiện đại) đã có sẵn
 * `speechSynthesis`, **không cần thư viện, không cần file mp3**. Nếu trình duyệt
 * không hỗ trợ thì `speechSupported()` trả `false` và mọi lời gọi đều im lặng -
 * app vẫn chạy y như cũ.
 *
 * Đọc bằng **giọng Mỹ** (`en-US`) đúng như ba mẹ yêu cầu: bé vừa học toạ độ vừa
 * làm quen cách đọc nước đi kiểu quốc tế - `Ne3` đọc là "Knight E 3".
 *
 * Tôn trọng nút 🔊 Âm thanh: đang tắt âm thanh thì không đọc gì (xem `isMuted`).
 * Toàn bộ phần dựng câu là hàm thuần (`describeMoveEnglish`, `squareSpeech`) nên
 * kiểm chứng được bằng `node scripts/smoke-logic.ts`, không cần mở trình duyệt.
 */
// Đuôi `.ts` là bắt buộc: file này còn được `node scripts/smoke-logic.ts` nạp thẳng
// (Node tự bỏ kiểu), mà Node không tự thêm đuôi cho import lúc chạy.
import { isMuted } from './sound.ts'

/** Tên quân cờ tiếng Anh - dùng cho giọng đọc quốc tế. */
const PIECE_EN: Record<string, string> = {
  K: 'King',
  Q: 'Queen',
  R: 'Rook',
  B: 'Bishop',
  N: 'Knight',
  P: 'Pawn',
}

/** Trình duyệt có giọng đọc không? */
export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  )
}

let cachedVoice: SpeechSynthesisVoice | null = null

/** Khoá lưu giọng bé/ba mẹ đã chọn. */
const VOICE_STORAGE_KEY = 'hoc-vien-co-vua-nhi.voice.v1'

/**
 * Các giọng tiếng Anh nghe tự nhiên nhất trên máy phổ thông, xếp theo mức ưu
 * tiên (giọng Mỹ trước). Khi bé **chưa tự chọn** giọng, ta duyệt theo thứ tự
 * này - thay vì lấy bừa giọng đầu tiên (thường là giọng robotic nhất).
 */
const PREFERRED_VOICE_HINTS = [
  'Google US English',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Samantha',
  'Alex',
  'Eddy',
  'Flo',
  'Sandy',
  'Reed',
  'Rocko',
  'Microsoft Aria',
  'Microsoft Jenny',
  'Karen',
  'Moira',
  'Tessa',
  'Google UK English Female',
  'Daniel',
]

/**
 * Giọng "đồ chơi" của macOS (Albert, Bad News, Bells…) - nghe rất vui nhưng
 * không dùng để dạy cờ được. Ta chỉ tránh chúng khi **tự chọn** giọng mặc định;
 * bé vẫn chọn được trong ⚙️ nếu muốn.
 */
const NOVELTY_VOICES = new Set([
  'Albert',
  'Bad News',
  'Bahh',
  'Bells',
  'Boing',
  'Bubbles',
  'Cellos',
  'Deranged',
  'Good News',
  'Grandma',
  'Grandpa',
  'Hysterical',
  'Jester',
  'Junior',
  'Organ',
  'Pipe Organ',
  'Superstar',
  'Trinoids',
  'Whisper',
  'Wobble',
  'Zarvox',
])

/** `Eddy (English (United States))` vẫn tính là giọng “Eddy”. */
function matchesHint(name: string, hint: string): boolean {
  return name === hint || name.startsWith(`${hint} (`)
}

function isNovelty(name: string): boolean {
  return NOVELTY_VOICES.has(name.split(' (')[0])
}

function loadSelectedVoiceName(): string | null {
  try {
    return typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(VOICE_STORAGE_KEY)
  } catch {
    return null
  }
}

let selectedVoiceName: string | null = loadSelectedVoiceName()

/** Giọng đang được chọn trong ⚙️ (null = để app tự chọn giọng tốt nhất). */
export function getSelectedVoiceName(): string | null {
  return selectedVoiceName
}

/**
 * Đặt giọng bé/ba mẹ chọn (`null` = quay về tự động). Lưu vào `localStorage` và
 * xoá bộ nhớ đệm để lần đọc kế tiếp dùng đúng giọng mới.
 */
export function setSelectedVoice(name: string | null) {
  selectedVoiceName = name
  cachedVoice = null
  try {
    if (typeof localStorage === 'undefined') return
    if (name) localStorage.setItem(VOICE_STORAGE_KEY, name)
    else localStorage.removeItem(VOICE_STORAGE_KEY)
  } catch {
    /* trình duyệt chặn lưu trữ thì thôi, giọng vẫn dùng được trong phiên này */
  }
}

/** Danh sách giọng TIẾNG ANH máy có, xếp en-US trước rồi theo tên. */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return []
  const voices = window.speechSynthesis.getVoices() ?? []
  return voices
    .filter((voice) => (voice.lang ?? '').toLowerCase().startsWith('en'))
    .sort((a, b) => {
      const usA = a.lang?.toLowerCase() === 'en-us' ? 0 : 1
      const usB = b.lang?.toLowerCase() === 'en-us' ? 0 : 1
      if (usA !== usB) return usA - usB
      return a.name.localeCompare(b.name)
    })
}

/**
 * Nghe khi danh sách giọng thay đổi. Chrome/Safari trả danh sách RỖNG ở lần gọi
 * đầu nên giao diện cần cập nhật lại sau sự kiện `voiceschanged`.
 */
export function subscribeVoices(listener: () => void): () => void {
  if (!speechSupported()) return () => {}
  const synth = window.speechSynthesis
  synth.addEventListener?.('voiceschanged', listener)
  return () => synth.removeEventListener?.('voiceschanged', listener)
}

/**
 * Giọng “hay nhất máy có” khi bé KHÔNG tự chọn: các giọng quen thuộc trước, rồi
 * giọng Mỹ thật (bỏ qua giọng “đồ chơi”), rồi tới bất kỳ giọng tiếng Anh nào.
 */
function autoVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const hint of PREFERRED_VOICE_HINTS) {
    const match = voices.find((voice) => matchesHint(voice.name, hint))
    if (match) return match
  }
  return (
    voices.find((voice) => voice.lang === 'en-US' && !isNovelty(voice.name)) ??
    voices.find((voice) => voice.lang?.toLowerCase().startsWith('en') && !isNovelty(voice.name)) ??
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang?.toLowerCase().startsWith('en')) ??
    null
  )
}

/**
 * Chọn giọng để đọc: ưu tiên giọng bé đã chọn → nếu không thì tới giọng tự động.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices() ?? []
  if (voices.length === 0) return null
  if (selectedVoiceName) {
    const chosen = voices.find((voice) => voice.name === selectedVoiceName)
    if (chosen) return chosen
  }
  return autoVoice(voices)
}

/**
 * Nạp sẵn danh sách giọng đọc. **Quan trọng**: Chrome/Safari trả danh sách RỖNG ở
 * lần gọi đầu và chỉ có giọng sau sự kiện `voiceschanged`. Nếu ta “khoá” kết quả
 * rỗng lại thì mãi mãi không có giọng Mỹ - nên chỉ lưu khi thật sự tìm thấy giọng,
 * và nghe tiếp sự kiện `voiceschanged` để lấy giọng muộn.
 *
 * Gọi một lần lúc app khởi động (xem `src/main.tsx`).
 */
export function primeSpeech() {
  if (!speechSupported()) return
  const synth = window.speechSynthesis
  const refresh = () => {
    const voice = pickVoice()
    if (voice) cachedVoice = voice
  }
  refresh()
  synth.addEventListener?.('voiceschanged', refresh)
}

function usVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  if (!speechSupported()) return null
  const voice = pickVoice()
  if (voice) cachedVoice = voice
  return voice
}

/**
 * Đọc một câu tiếng Anh. Cắt câu đang đọc dở trước khi đọc câu mới để bé bấm
 * liên tục không bị "dồn" thành một tràng lộn xộn.
 */
export function speak(text: string) {
  utter(text, false)
}

/**
 * Nghe thử một giọng trong ⚙️. **Bỏ qua nút tắt âm thanh**: bé/ba mẹ vừa bấm
 * “Nghe thử” thì phải nghe được, nếu không nút trông như hỏng.
 *
 * - `voiceName` bỏ trống  → đọc bằng giọng đang dùng.
 * - `voiceName = ''`      → đọc bằng giọng “tự động” (hay nhất máy có).
 * - `voiceName = tên`     → đọc đúng giọng đó (dùng cho từng dòng trong bảng chọn).
 */
export function previewSpeech(text: string, voiceName?: string) {
  if (!text || !speechSupported()) return
  const voices = window.speechSynthesis.getVoices() ?? []
  const voice =
    voiceName === undefined
      ? usVoice()
      : voiceName === ''
        ? autoVoice(voices)
        : (voices.find((item) => item.name === voiceName) ?? null)
  utter(text, true, voice)
}

function utter(text: string, force: boolean, voiceOverride?: SpeechSynthesisVoice | null) {
  if (!text || !speechSupported()) return
  if (!force && isMuted()) return
  try {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    // Chậm hơn một chút cho bé 7 tuổi nghe kịp.
    utterance.rate = 0.92
    const voice = voiceOverride ?? usVoice()
    if (voice) utterance.voice = voice
    // Đang đọc dở thì ngắt để câu mới phát ngay; đang rảnh thì đọc thẳng - tránh
    // vài bản Chrome “nuốt” mất câu khi vừa `cancel()` xong đã `speak()` liền.
    if (synth.speaking || synth.pending) {
      synth.cancel()
      window.setTimeout(() => {
        if (force || !isMuted()) synth.speak(utterance)
      }, 70)
    } else {
      synth.speak(utterance)
    }
  } catch {
    /* máy không có giọng đọc thì bỏ qua, không làm sập trang */
  }
}

/** `e2` → "E 2". Ô không hợp lệ → chuỗi rỗng. */
export function squareSpeech(square: string): string {
  if (!/^[a-h][1-8]$/.test(square)) return ''
  return `${square[0].toUpperCase()} ${square[1]}`
}

/**
 * Đọc một nước SAN theo giọng Mỹ, ví dụ:
 *  - `Nf3`  → "Knight F 3"
 *  - `Nxe5+` → "Knight takes E 5, check"
 *  - `e4`   → "Pawn E 4"
 *  - `exd5` → "Pawn takes D 5"
 *  - `O-O`  → "Castles kingside"
 *  - `e8=Q+` → "Pawn E 8, promotes to Queen, check"
 *
 * Phần chỉ định nguồn (chữ `b` trong `Nbd2`) được lược cho gọn tai bé.
 */
export function describeMoveEnglish(san: string): string {
  const clean = (san ?? '').trim()
  if (!clean) return ''
  if (clean.startsWith('O-O-O')) return 'Castles queenside'
  if (clean.startsWith('O-O')) return 'Castles kingside'

  let rest = clean.replace(/[+#!?]+$/g, '')
  const notes: string[] = []
  if (clean.includes('#')) notes.push('checkmate')
  else if (clean.includes('+')) notes.push('check')

  const promotion = rest.match(/=([QRBN])$/)
  if (promotion) {
    notes.unshift(`promotes to ${PIECE_EN[promotion[1]]}`)
    rest = rest.replace(/=[QRBN]$/, '')
  }

  const pieceKey = 'KQRBN'.includes(rest[0]) ? rest[0] : null
  const pieceName = pieceKey ? PIECE_EN[pieceKey] : 'Pawn'
  let body = pieceKey ? rest.slice(1) : rest

  const takes = body.includes('x')
  body = body.replace(/x/g, '')

  // Ô đích luôn là hai ký tự cuối; phần đứng trước (nếu có) chỉ là chỉ định nguồn.
  const square = squareSpeech(body.slice(-2))
  if (!square) return ''

  return [[pieceName, takes ? 'takes' : '', square].filter(Boolean).join(' '), ...notes].join(', ')
}

/**
 * Tên quân tiếng Anh kèm ô (nếu có): `n` + `c3` → "Knight C 3"; `p` → "Pawn".
 * Khi bé chọn một quân, bàn cờ đọc tên quân để bé quen tai (Bishop, Knight, Queen…).
 */
export function describePieceEnglish(pieceType: string, square?: string): string {
  if (!pieceType) return ''
  const name = PIECE_EN[pieceType.slice(-1).toUpperCase()]
  if (!name) return ''
  const sq = square ? squareSpeech(square) : ''
  return [name, sq].filter(Boolean).join(' ')
}

/**
 * Đọc TÊN KHAI CUỘC theo giọng Mỹ, ví dụ:
 *  - `Hệ thống London`   → "London System"
 *  - `Phòng thủ Pháp`    → "French Defense"
 *  - `Gambit Hậu`        → "Queen's Gambit"
 *
 * Đọc tên tiếng Anh (`englishName`) vì đó mới là tên quốc tế bé sẽ gặp ở sách/bàn cờ;
 * kèm tên Grand Master nếu có: "London System, Magnus Carlsen".
 */
export function describeOpeningEnglish(englishName: string, gm?: string | null): string {
  const clean = (englishName ?? '').trim()
  if (!clean) return ''
  // Bỏ tiền tố GM trong tên kỳ thủ cho gọn tai: "GM Magnus Carlsen" → "Magnus Carlsen".
  const speaker = (gm ?? '').replace(/^GM\s+/i, '').trim()
  return speaker ? `${clean}, ${speaker}` : clean
}

/** Đọc tên một khai cuộc: `London System, Magnus Carlsen`. */
export function speakOpening(englishName: string, gm?: string | null) {
  speak(describeOpeningEnglish(englishName, gm))
}

/** Chạm vào ô nào thì đọc tên ô đó: `e2` → "E 2". */
export function speakSquare(square: string) {
  speak(squareSpeech(square))
}

/** Bé chọn một quân → đọc TÊN QUÂN tiếng Anh: `b`@`c1` → "Bishop C 1". */
export function speakPiece(pieceType: string, square?: string) {
  speak(describePieceEnglish(pieceType, square))
}

/** Đọc một nước đi: `Ne3` → "Knight E 3". */
export function speakMove(san: string) {
  speak(describeMoveEnglish(san))
}
