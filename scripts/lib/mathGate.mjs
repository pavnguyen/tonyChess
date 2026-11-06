/**
 * Giải hộ "cửa toán" trong bài kiểm trình duyệt.
 *
 * Các bài kiểm cờ chỉ quan tâm nước đi; từ khi mỗi nước của bé phải giải một phép
 * toán, helper này đọc phương trình từ `#kid-math-gate[data-equation]`, tìm `x`
 * bằng cách thử 1…99, gõ đáp án và bấm Đồng ý. Không có cửa toán thì trả `false`
 * sau một khoảng chờ ngắn - nhờ vậy bài kiểm không bị chậm ở mỗi lần chạm ô cờ.
 */
import { sleep } from './cdp.mjs'

/** Giải `12 − x = 8` → 4. Trả `null` nếu không tìm được. */
export function solveEquation(equation) {
  const [left, right] = String(equation).split('=')
  if (!right) return null
  const clean = (part) =>
    part
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '')
  for (let answer = 1; answer <= 99; answer += 1) {
    try {
      // eslint-disable-next-line no-new-func -- biểu thức do app sinh, chỉ chạy trong bài kiểm
      const value = Function(
        `return (${clean(left).replace(/x/g, String(answer))}) - (${clean(right).replace(/x/g, String(answer))})`,
      )()
      if (Number.isFinite(value) && Math.abs(value) < 1e-9) return answer
    } catch {
      return null
    }
  }
  return null
}

/**
 * Nếu cửa toán đang mở thì giải và chờ nó đóng. Trả `true` khi đã giải xong.
 * `timeoutMs` ngắn vì helper còn được gọi ở mọi nước - từ khi cửa toán chỉ mở
 * mỗi 2–3 nước, phần lớn lần gọi không có cửa nào để giải.
 */
export async function solveMathGate(evaluate, timeoutMs = 400) {
  let equation = ''
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    equation = String(
      await evaluate(`document.getElementById('kid-math-gate')?.dataset.equation ?? ''`),
    ).trim()
    if (equation) break
    await sleep(60)
  }
  if (!equation) return false

  const answer = solveEquation(equation)
  if (answer === null) throw new Error(`Không giải được phương trình: ${equation}`)

  // Gõ đáp án + bấm Đồng ý. React cập nhật state sau sự kiện `input`, nên phải
  // chờ một nhịp rồi mới bấm; dưới tải nặng có thể trượt, nên thử lại một lần.
  const fillAndSubmit = async () => {
    await evaluate(`(() => {
      const input = document.getElementById('kid-math-input')
      if (!input) return false
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, ${JSON.stringify(String(answer))})
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })()`)
    await sleep(120)
    await evaluate(`(() => {
      const button = document.getElementById('kid-math-submit')
      if (!button || button.disabled) return false
      button.click()
      return true
    })()`)
  }

  await fillAndSubmit()

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (!(await evaluate(`Boolean(document.getElementById('kid-math-gate'))`))) {
      // Cửa đóng rồi mới gọi `onDrop` cho nước đang giữ; chờ hoạt ảnh quân cờ
      // (~280ms) để bài kiểm thấy đúng thế cờ đã đi.
      await sleep(400)
      return true
    }
    if (attempt === 12) await fillAndSubmit()
    await sleep(80)
  }
  return false
}
