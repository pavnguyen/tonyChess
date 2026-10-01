/**
 * Chụp ảnh màn hình một trang để xem bố cục thật.
 *
 * Chạy: node scripts/browser-shot.mjs [route] [width] [height] [outFile]
 * Ví dụ: node scripts/browser-shot.mjs / 1440 900 /tmp/shot.png
 */
import { writeFileSync } from 'node:fs'
import { openPage, sleep } from './lib/cdp.mjs'

const BASE = process.env.APP_URL ?? 'http://localhost:5198'
const route = process.argv[2] ?? '/'
const width = Number(process.argv[3] ?? 1440)
const height = Number(process.argv[4] ?? 900)
const out = process.argv[5] ?? '/tmp/shot.png'

const { skipped, failedToConnect, evaluate, send, close } = await openPage(
  `${BASE}${route}`,
  { port: 9336 },
)

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
})
await evaluate(`location.href = ${JSON.stringify(`${BASE}${route}`)}`)
await sleep(2000)

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
console.log(`📸 Đã lưu ${out} (${width}×${height})`)

close()
process.exit(0)
