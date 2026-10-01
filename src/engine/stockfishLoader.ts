/**
 * Cầu nối tới Stockfish WASM ("lite single-threaded", ~1.8 MB).
 *
 * Nguyên tắc:
 *  - **Lười (lazy)**: Worker chỉ được tạo ở lần dùng đầu tiên, KHÔNG nằm trong
 *    bundle chính. File engine là tài sản tĩnh ở `public/stockfish/`.
 *  - **Luôn có đường lui**: mọi lỗi (không tải được, worker chết, quá hạn) đều
 *    trả về `null` để nơi gọi tự dùng engine JS dựng sẵn.
 *  - **Nối tiếp (serialize)**: các yêu cầu xếp hàng, tránh hai lệnh `go` chồng nhau.
 */
import type { EngineMove } from './minimax'
import { extractBestMove, isReady, uciToEngineMove } from './uci'

const ENGINE_FILE = 'stockfish-19-lite-single.js'
const BOOT_TIMEOUT_MS = 20_000

export interface StockfishOptions {
  /** Giới hạn độ sâu tối đa. */
  depth?: number
  /** Giới hạn thời gian suy nghĩ (ms) - engine dừng khi chạm một trong hai. */
  movetime?: number
}

let worker: Worker | null = null
let readyPromise: Promise<Worker> | null = null
let collect: ((line: string) => void) | null = null
/** Hàng đợi: mọi yêu cầu xếp sau yêu cầu trước. */
let chain: Promise<unknown> = Promise.resolve()

function engineUrl(): string {
  const base = (import.meta.env?.BASE_URL ?? '/') || '/'
  return `${base.replace(/\/$/, '')}/stockfish/${ENGINE_FILE}`
}

function onLine(line: string) {
  collect?.(line)
}

function bootWorker(): Promise<Worker> {
  return new Promise<Worker>((resolve, reject) => {
    let instance: Worker
    try {
      instance = new Worker(engineUrl())
    } catch (error) {
      reject(error)
      return
    }

    const seen: string[] = []
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        instance.terminate()
      } catch {
        /* bỏ qua */
      }
      reject(error)
    }
    const timer = setTimeout(() => fail(new Error('Stockfish: hết thời gian khởi động')), BOOT_TIMEOUT_MS)

    instance.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data : String(event.data)
      if (!settled) {
        seen.push(line)
        if (isReady(seen)) {
          settled = true
          clearTimeout(timer)
          instance.onmessage = (later: MessageEvent) =>
            onLine(typeof later.data === 'string' ? later.data : String(later.data))
          worker = instance
          // Bộ nhớ nhỏ cho gọn, một luồng (bản single-threaded không có Threads).
          instance.postMessage('setoption name Hash value 16')
          resolve(instance)
        }
        return
      }
      onLine(line)
    }
    instance.onerror = () => fail(new Error('Stockfish: worker lỗi'))

    instance.postMessage('uci')
  })
}

/** Tạo (một lần) và trả về Worker Stockfish đã sẵn sàng. */
export function ensureStockfish(): Promise<Worker> {
  if (worker) return Promise.resolve(worker)
  if (!readyPromise) {
    readyPromise = bootWorker().catch((error: unknown) => {
      // Cho phép thử lại lần sau thay vì kẹt mãi ở promise đã hỏng.
      readyPromise = null
      worker = null
      throw error
    })
  }
  return readyPromise
}

/** Hâm nóng engine trước (gọi khi bé chọn mức Siêu) - lỗi thì im lặng. */
export function preloadStockfish(): void {
  void ensureStockfish().catch(() => {})
}

/** Stockfish đã sẵn sàng chưa? */
export function isStockfishReady(): boolean {
  return worker !== null
}

/** Tắt hẳn engine (dùng khi rời trang hoặc trong bài kiểm tra). */
export function disposeStockfish(): void {
  try {
    worker?.terminate()
  } catch {
    /* bỏ qua */
  }
  worker = null
  readyPromise = null
  collect = null
  chain = Promise.resolve()
}

function run(commands: readonly string[], timeoutMs: number): Promise<string[]> {
  return ensureStockfish().then(
    (instance) =>
      new Promise<string[]>((resolve, reject) => {
        const lines: string[] = []
        let done = false
        const finish = (settle: () => void) => {
          if (done) return
          done = true
          clearTimeout(timer)
          collect = null
          settle()
        }
        const timer = setTimeout(() => finish(() => reject(new Error('Stockfish: quá hạn'))), timeoutMs)

        // Kết thúc ngay khi thấy `bestmove` (kể cả `bestmove (none)`).
        collect = (line) => {
          lines.push(line)
          if (line.trim().startsWith('bestmove')) finish(() => resolve(lines))
        }
        for (const command of commands) instance.postMessage(command)
      }),
  )
}

/**
 * Nhờ Stockfish tính một nước cho thế cờ `fen`.
 * Trả về `null` khi không tải được / quá hạn / thế cờ không hợp lệ.
 */
export function stockfishThink(fen: string, options: StockfishOptions = {}): Promise<EngineMove | null> {
  const depth = options.depth ?? 18
  const movetime = options.movetime ?? 1500

  const request = chain.then(async () => {
    const lines = await run([`position fen ${fen}`, `go depth ${depth} movetime ${movetime}`], movetime + 5000)
    const uci = extractBestMove(lines)
    return uci ? uciToEngineMove(fen, uci) : null
  })

  // Giữ hàng đợi không bị "kẹt" bởi một yêu cầu lỗi.
  chain = request.catch(() => null)
  return request
}
