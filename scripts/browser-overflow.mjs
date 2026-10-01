/**
 * Tìm phần tử gây tràn ngang: liệt kê những khối có mép phải (hoặc chữ bên
 * trong) vượt khỏi màn hình.
 *
 * Đi qua đúng dải khung nhìn như bài kiểm tra bố cục, vì có lỗi chỉ xuất hiện
 * sau khi thu nhỏ cửa sổ từ khung lớn xuống khung nhỏ.
 *
 * Chạy: node scripts/browser-overflow.mjs [route]
 */
import { openPage, sleep } from './lib/cdp.mjs'

const BASE = process.env.APP_URL ?? 'http://localhost:5198'
const route = process.argv[2] ?? '/'

const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1366, h: 768 },
  { w: 1024, h: 768 },
  { w: 390, h: 844 },
]

const { skipped, failedToConnect, evaluate, send, close } = await openPage(`${BASE}${route}`, {
  port: 9338,
})

if (skipped) {
  console.log('⚠️  Không tìm thấy Chrome - bỏ qua.')
  process.exit(0)
}
if (failedToConnect) {
  console.error('✗ Không kết nối được vào Chrome DevTools Protocol')
  process.exit(1)
}

const probe = () =>
  evaluate(`
    (() => {
      const limit = window.innerWidth
      const describe = (el) => {
        const r = el.getBoundingClientRect()
        const cls = typeof el.className === 'string' ? el.className : ''
        return {
          tag: el.tagName.toLowerCase(),
          cls: cls.slice(0, 64),
          text: (el.textContent ?? '').trim().replace(/\\s+/g, ' ').slice(0, 34),
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width),
          over: Math.round(el.scrollWidth - el.clientWidth),
        }
      }
      const all = [...document.querySelectorAll('body *')]
      const boxes = all.filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.right > limit + 1
      })
      const inner = all.filter((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (cs.overflowX !== 'visible') return false
        if (r.width === 0) return false
        return el.scrollWidth > el.clientWidth + 1
      })
      const merged = [...boxes, ...inner]
      const deepest = merged.filter(
        (el) => !merged.some((other) => other !== el && el.contains(other)),
      )
      return {
        limit,
        pageW: document.documentElement.scrollWidth,
        offenders: deepest.slice(0, 12).map(describe),
      }
    })()
  `)

for (const vp of VIEWPORTS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await evaluate(`location.href = ${JSON.stringify(`${BASE}${route}`)}`)
  await sleep(1600)
  const m = await probe()
  console.log(`\n=== ${route} @ ${vp.w}×${vp.h} - trang rộng ${m.pageW}px / màn ${m.limit}px ===`)
  if (!m.offenders.length) console.log('  ✓ Không có phần tử nào tràn ngang.')
  for (const o of m.offenders) {
    console.log(
      `  ↗ ${o.tag} right=${o.right} w=${o.w} over=${o.over} | ${o.cls} | “${o.text}”`,
    )
  }
}

close()
process.exit(0)
