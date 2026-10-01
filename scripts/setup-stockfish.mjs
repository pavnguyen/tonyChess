#!/usr/bin/env node
/**
 * Chép bản Stockfish WASM "lite single-threaded" từ node_modules vào public/stockfish/.
 *
 * Vì sao bản lite-single:
 *  - ~1.8 MB (bản đầy đủ 99 MB - tải quá lâu cho bé).
 *  - Chạy đơn luồng nên KHÔNG cần header COOP/COEP, hoạt động trên Vercel tĩnh.
 *  - Vẫn mạnh hơn bất kỳ người chơi nào rất nhiều.
 *
 * Chạy: npm run setup:engine  (chạy tự động trước `npm run build` / `npm run dev`)
 *
 * ⚠️ Giấy phép: Stockfish là GPL-3.0. Ghi nguồn đầy đủ nằm ở public/stockfish/LICENSE.txt.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules', 'stockfish', 'bin')
const to = join(root, 'public', 'stockfish')

const BUILD = 'stockfish-19-lite-single'
const files = [`${BUILD}.js`, `${BUILD}.wasm`]

mkdirSync(to, { recursive: true })

let copied = 0
for (const name of files) {
  const src = join(from, name)
  if (!existsSync(src)) {
    console.error(`✗ Không thấy ${src}`)
    console.error('  Hãy chạy `npm install` trước (gói `stockfish` là devDependency).')
    process.exit(1)
  }
  copyFileSync(src, join(to, name))
  copied += 1
}

const licensePath = join(root, 'node_modules', 'stockfish', 'Copying.txt')
const license = existsSync(licensePath) ? licensePath : null
if (license) copyFileSync(license, join(to, 'LICENSE.txt'))

// Nhắc giấy phép - bắt buộc khi phân phối kèm Stockfish (GPL-3.0).
writeFileSync(
  join(to, 'NOTICE.txt'),
  [
    'Stockfish.js (WASM) - https://github.com/nmrugg/stockfish.js',
    'Based on Stockfish - https://github.com/official-stockfish/Stockfish',
    '',
    'License: GPL-3.0 (xem LICENSE.txt).',
    'Bản build: stockfish-19-lite-single (đơn luồng, ~1.8 MB).',
    '',
    'LƯU Ý: vì app phân phối kèm Stockfish (GPL-3.0), nếu sau này mở mã nguồn',
    'hoặc phát hành thì TOÀN BỘ app phải theo GPL-3.0.',
    '',
  ].join('\n'),
)

console.log(`✓ Đã chép ${copied} tệp Stockfish vào public/stockfish/ (bản ${BUILD}).`)
