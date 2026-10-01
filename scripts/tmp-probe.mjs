/** TẠM THỜI: liệt kê chiều cao từng khối ở cột phải để tìm chỗ làm cột bị cuộn. */
import { openPage, sleep } from './lib/cdp.mjs'

const BASE = process.env.APP_URL ?? 'http://localhost:5198'
const route = process.argv[2] ?? '/'
const width = Number(process.argv[3] ?? 980)
const height = Number(process.argv[4] ?? 720)

const { evaluate, send, close } = await openPage(`${BASE}${route}#probe`, { port: 9356 })
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
})
await evaluate(`location.href = ${JSON.stringify(`${BASE}${route}#probe`)}`)
await sleep(2500)

const report = await evaluate(`(() => {
  // Cột phải là phần tử có overflowY auto ở chế độ 2 cột (stage).
  const col = [...document.querySelectorAll('div')].find((el) => getComputedStyle(el).overflowY === 'auto')
  if (!col) return { note: 'không phải bố cục 2 cột' }
  const kids = [...col.children].map((el) => ({
    h: Math.round(el.getBoundingClientRect().height),
    text: (el.innerText || '').replace(/\\n/g, '|').slice(0, 34),
    kids: [...el.children].map((child) => ({
      h: Math.round(child.getBoundingClientRect().height),
      w: Math.round(child.getBoundingClientRect().width),
      text: (child.innerText || '').replace(/\\n/g, '|').slice(0, 30),
    })),
  }))
  return {
    columnHeight: col.clientHeight,
    contentHeight: col.scrollHeight,
    hidden: col.scrollHeight - col.clientHeight,
    blocks: kids,
  }
})()`)

console.log(JSON.stringify(report, null, 2))
close()
process.exit(0)
