import { useEffect, useRef, useState } from 'react'
import { makeMathProblem } from '../lib/mathProblem'
import type { MathProblem } from '../lib/mathProblem'
import { KidButton } from './ui'

interface Props {
  /** Gọi sau khi bé trả lời đúng (nút Đồng ý đã khoá, chờ ~0.12s cho bé thấy ✅). */
  onSolved: () => void
}

/**
 * "Cửa toán" trước mỗi nước đi: một phép tính cộng/trừ/nhân/chia với đúng một ô
 * trống, bé gõ số vào chính ô đó rồi bấm **Đồng ý**.
 *
 * Vì sao để ô trống NGAY TRONG phép tính (chứ không phải "đáp án: …" bên dưới):
 * bé 7 tuổi đọc `12 − [ ] = 8` hay `[ ] × 3 = 6` là hiểu ngay mình cần tìm gì,
 * không phải dịch từ câu chữ. Ô nhập dùng bàn phím số trên điện thoại (`inputMode="numeric"`) và tự
 * lấy nét để bé gõ được luôn, không phải chạm thêm một lần.
 *
 * Không có nút đóng: đây là cửa "phải giải xong mới qua", không phải hộp thoại
 * thông báo. Trả lời sai thì ô rung nhẹ màu đỏ và bé thử lại, không bị trừ gì.
 */
export function MathGate({ onSolved }: Props) {
  const [problem] = useState<MathProblem>(() => makeMathProblem())
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(0)
  const [correct, setCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)

  // Cha chỉ mount cửa toán khi mở, nên mỗi lần mount là một phép mới. Việc duy
  // nhất ở đây là đưa con trỏ vào ô đáp án (một hệ thống ngoài React).
  useEffect(() => {
    // Lấy nét ngay, rồi thử lại sau một nhịp vẽ - vài trình duyệt di động chỉ mở
    // bàn phím số khi ô đã thật sự nằm trên màn hình.
    const focus = () => inputRef.current?.focus()
    focus()
    const timer = window.setTimeout(focus, 80)
    return () => window.clearTimeout(timer)
  }, [])

  // Rời trang khi bé chưa bấm xong thì huỷ hẹn giờ, tránh gọi onSolved muộn.
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const submit = () => {
    if (correct) return
    const answer = Number.parseInt(value, 10)
    if (!Number.isFinite(answer)) return
    if (answer === problem.answer) {
      setCorrect(true)
      // Đóng gần như ngay: chỉ giữ đúng một nhịp để bé kịp thấy dấu ✅, không bắt
      // bé chờ nửa giây. Nước cờ đi ngay sau đó nên cảm giác là "gõ xong là đi".
      timerRef.current = window.setTimeout(onSolved, 120)
      return
    }
    setWrong((count) => count + 1)
    setValue('')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div
      id="kid-math-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kid-math-title"
      data-equation={problem.equation}
      /*
        Trên điện thoại bàn phím số chiếm nửa dưới màn hình, nên thẻ nằm cao một
        chút và cả lớp phủ được cuộn - bé vẫn thấy phép tính + nút Đồng ý.
      */
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-brand-950/60 p-4 pt-[10vh] backdrop-blur-sm sm:items-center sm:pt-4"
    >
      <div className="animate-pop-in w-full max-w-sm rounded-[2rem] border-[5px] border-white bg-white p-4 text-center shadow-2xl sm:p-5">
        <div className="text-3xl" aria-hidden>
          🧮
        </div>
        <h2 id="kid-math-title" className="mt-1 text-xl font-extrabold text-brand-900 sm:text-2xl">
          Giải toán trước khi đi cờ
        </h2>
        <p className="mt-0.5 text-xs font-bold text-brand-600">
          Trả lời đúng rồi bé mới đi được nước này nhé!
        </p>

        <div
          id="kid-math-equation"
          role="group"
          aria-label={`Phép tính: ${problem.equation}`}
          className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-3xl font-extrabold tabular-nums text-brand-900 sm:text-4xl"
        >
          {problem.equation.split(' ').map((token, index) =>
            token === 'x' ? (
              <input
                key={index}
                ref={inputRef}
                id="kid-math-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                enterKeyHint="done"
                maxLength={3}
                value={value}
                onChange={(event) => setValue(event.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  submit()
                }}
                aria-label="Đáp án"
                disabled={correct}
                className={`w-20 rounded-xl border-[3px] bg-gold-50 py-0.5 text-center text-3xl font-extrabold text-brand-900 outline-none transition-colors sm:w-24 sm:text-4xl ${
                  wrong > 0 && !correct
                    ? 'animate-pop-in border-coral-500'
                    : 'border-gold-400 focus:border-brand-500'
                }`}
              />
            ) : (
              <span key={index}>{token}</span>
            ),
          )}
        </div>

        <p
          aria-live="polite"
          className={`mt-2 min-h-4 text-xs font-extrabold ${
            correct ? 'text-leaf-700' : 'text-coral-600'
          }`}
        >
          {correct
            ? '✅ Đúng rồi! Giỏi quá!'
            : wrong > 0
              ? 'Chưa đúng rồi, bé thử lại nhé!'
              : ' '}
        </p>

        <KidButton
          id="kid-math-submit"
          variant="grass"
          onClick={submit}
          disabled={!value || correct}
          className="mt-1 w-full"
        >
          ✅ Đồng ý
        </KidButton>
      </div>
    </div>
  )
}
