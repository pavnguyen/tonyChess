/**
 * Tiện ích nhỏ để điều khiển Chrome thật qua DevTools Protocol.
 * Node 22+ có WebSocket toàn cục nên không cần thư viện ngoài.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const DEFAULT_CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/**
 * Mở một trang trong Chrome headless và trả về hàm `evaluate` để chạy JS trong trang.
 * Trả về `{ skipped: true }` nếu máy không có Chrome (bài kiểm tra sẽ tự bỏ qua).
 */
export async function openPage(appUrl, { port = 9333, windowSize = '1280,1600' } = {}) {
  if (!existsSync(DEFAULT_CHROME)) return { skipped: true }

  const child = spawn(
    DEFAULT_CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      `--window-size=${windowSize}`,
      `--remote-debugging-port=${port}`,
      `--user-data-dir=/tmp/kid-chess-cdp-${port}`,
      appUrl,
    ],
    { stdio: 'ignore' },
  )

  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    try {
      child.kill('SIGKILL')
    } catch {
      /* ignore */
    }
  }
  process.on('exit', close)

  let target = null
  for (let attempt = 0; attempt < 40 && !target; attempt += 1) {
    await sleep(250)
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const targets = await response.json()
      target = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl) ?? null
    } catch {
      /* Chrome chưa sẵn sàng */
    }
  }
  if (!target) {
    close()
    return { skipped: false, failedToConnect: true, close }
  }

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let messageId = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data)
    const handler = pending.get(data.id)
    if (handler) {
      pending.delete(data.id)
      handler(data)
    }
  })

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      messageId += 1
      pending.set(messageId, resolve)
      socket.send(JSON.stringify({ id: messageId, method, params }))
    })

  const evaluate = async (expression, awaitPromise = false) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    })
    if (result.result?.exceptionDetails) {
      throw new Error(result.result.exceptionDetails.text ?? 'lỗi khi chạy JS trong trang')
    }
    return result.result?.result?.value
  }

  const closeAll = () => {
    try {
      socket.close()
    } catch {
      /* ignore */
    }
    close()
  }

  return { skipped: false, evaluate, send, close: closeAll, sleep }
}

/** In kết quả kiểm tra và trả về số lỗi. */
export function makeChecker() {
  let failures = 0
  const check = (ok, label) => {
    if (ok) console.log('  ✓ ' + label)
    else {
      failures += 1
      console.error('  ✗ ' + label)
    }
  }
  return {
    check,
    get failures() {
      return failures
    },
    finish(title) {
      console.log(
        failures === 0 ? `\n✅ ${title} PASS!\n` : `\n❌ ${title} CÓ ${failures} LỖI\n`,
      )
      process.exit(failures === 0 ? 0 : 1)
    },
  }
}
