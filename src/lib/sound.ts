/**
 * Âm thanh vui nhộn cho bé — tổng hợp bằng Web Audio, không cần file mp3.
 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  } catch {
    ctx = null
  }
  return ctx
}

interface ToneOptions {
  freq: number
  duration: number
  type?: OscillatorType
  gain?: number
  delay?: number
  slideTo?: number
}

function tone({
  freq,
  duration,
  type = 'sine',
  gain = 0.12,
  delay = 0,
  slideTo,
}: ToneOptions) {
  const context = audioContext()
  if (!context || muted) return
  if (context.state === 'suspended') void context.resume()

  const start = context.currentTime + delay
  const osc = context.createOscillator()
  const amp = context.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)

  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(amp)
  amp.connect(context.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Tiếng "cộp" nhẹ khi đặt quân. */
export function playMove() {
  tone({ freq: 320, slideTo: 190, duration: 0.12, type: 'triangle', gain: 0.16 })
}

/** "Ting!" reo vui khi giải đúng. */
export function playTing() {
  tone({ freq: 1320, duration: 0.22, type: 'sine', gain: 0.16 })
  tone({ freq: 1760, duration: 0.3, type: 'sine', gain: 0.12, delay: 0.08 })
}

/** Tiếng "bụp" khi sai. */
export function playError() {
  tone({ freq: 200, slideTo: 110, duration: 0.26, type: 'sawtooth', gain: 0.1 })
}

/** Nhạc thắng nhỏ (đô-mi-son-đố). */
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, index) =>
    tone({ freq, duration: 0.3, type: 'triangle', gain: 0.14, delay: index * 0.11 }),
  )
}

/** Tiếng lên cấp: Tốt biến thành Hậu. */
export function playPromote() {
  tone({ freq: 440, slideTo: 1200, duration: 0.4, type: 'sine', gain: 0.14 })
  tone({ freq: 880, duration: 0.35, type: 'triangle', gain: 0.1, delay: 0.15 })
}

/** Tiếng tích tắc cho chế độ đua tốc độ. */
export function playTick() {
  tone({ freq: 900, duration: 0.05, type: 'square', gain: 0.05 })
}
