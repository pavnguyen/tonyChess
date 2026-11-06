/**
 * Sinh phép toán cho "cửa toán" trước mỗi nước cờ.
 *
 * Quy tắc (ba mẹ chốt):
 *  - Cộng/trừ chỉ dùng số tự nhiên **1–2 chữ số** (1…99), kết quả không âm.
 *  - Nhân/chia nằm gọn trong **bảng cửu chương 2–9**, chia luôn chia hết.
 *  - Mỗi phép có ĐÚNG MỘT ô trống (`x`) để bé gõ số vào, và `x` nằm ở MỌI vị
 *    trí: đầu, giữa hay chính kết quả, ví dụ:
 *      `x + 5 = 8`   → 3
 *      `12 − x = 8`  → 4
 *      `12 − 4 = x`  → 8
 *      `x × 3 = 6`   → 2
 *      `3 × x = 21`  → 7
 *      `24 ÷ x = 6`  → 4
 *      `x ÷ 4 = 5`   → 20
 *
 * Hàm thuần, nhận `random` để bài kiểm chạy được không cần trình duyệt.
 */

export interface MathProblem {
  /** Phương trình dạng chữ, ô bé điền là `x` (có dấu cách giữa các phần). */
  equation: string
  answer: number
}

/** Số nguyên ngẫu nhiên trong [min, max] (bao gồm hai đầu). */
function pick(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

/**
 * Mười hai kiểu bài - mỗi phép (cộng, trừ, nhân, chia) có `x` ở cả ba vị trí:
 * số hạng đầu, số hạng sau và kết quả. Nhờ vậy bé phải hiểu phép tính chứ
 * không đoán "ô trống luôn nằm cuối".
 */
export function makeMathProblem(random: () => number = Math.random): MathProblem {
  switch (pick(random, 0, 11)) {
    // a + b = x
    case 0: {
      const a = pick(random, 1, 49)
      const b = pick(random, 1, 99 - a)
      return { equation: `${a} + ${b} = x`, answer: a + b }
    }
    // a + x = c
    case 1: {
      const a = pick(random, 1, 60)
      const answer = pick(random, 1, 99 - a)
      return { equation: `${a} + x = ${a + answer}`, answer }
    }
    // x + a = c  (dạng x + 5 = 8)
    case 2: {
      const answer = pick(random, 1, 60)
      const a = pick(random, 1, 99 - answer)
      return { equation: `x + ${a} = ${answer + a}`, answer }
    }
    // a − b = x
    case 3: {
      const a = pick(random, 11, 99)
      const b = pick(random, 1, a - 1)
      return { equation: `${a} − ${b} = x`, answer: a - b }
    }
    // a − x = b  (dạng 12 − x = 8)
    case 4: {
      const a = pick(random, 11, 99)
      const answer = pick(random, 1, a - 1)
      return { equation: `${a} − x = ${a - answer}`, answer }
    }
    // x − a = b
    case 5: {
      const answer = pick(random, 2, 99)
      const b = pick(random, 1, answer - 1)
      return { equation: `x − ${answer - b} = ${b}`, answer }
    }
    // a × b = x (bảng cửu chương)
    case 6: {
      const a = pick(random, 2, 9)
      const b = pick(random, 2, 9)
      return { equation: `${a} × ${b} = x`, answer: a * b }
    }
    // a × x = c
    case 7: {
      const a = pick(random, 2, 9)
      const answer = pick(random, 2, 9)
      return { equation: `${a} × x = ${a * answer}`, answer }
    }
    // x × a = c  (dạng x × 3 = 6)
    case 8: {
      const a = pick(random, 2, 9)
      const answer = pick(random, 2, 9)
      return { equation: `x × ${a} = ${a * answer}`, answer }
    }
    // c ÷ a = x
    case 9: {
      const a = pick(random, 2, 9)
      const answer = pick(random, 2, 9)
      return { equation: `${a * answer} ÷ ${a} = x`, answer }
    }
    // c ÷ x = a
    case 10: {
      const a = pick(random, 2, 9)
      const answer = pick(random, 2, 9)
      return { equation: `${a * answer} ÷ x = ${a}`, answer }
    }
    // x ÷ a = c  (dạng x ÷ 3 = 2 → 6)
    default: {
      const a = pick(random, 2, 9)
      const answer = pick(random, 2, 9)
      return { equation: `x ÷ ${a} = ${answer}`, answer: a * answer }
    }
  }
}
