/**
 * Hiển thị trong lúc chờ file JS của một tab đang được tải về (code-splitting).
 *
 * Cố tình giữ thật nhẹ: chỉ vài thẻ div + emoji, không kéo theo thư viện nào.
 * Bàn cờ xương (skeleton) dùng đúng 2 màu ô của bàn cờ thật (#2f6b4f / #ffffff) và
 * đúng tỉ lệ 8×8 nên khi bàn cờ thật hiện ra bé gần như không thấy "nhảy" bố cục.
 */
const DARK_SQUARE = '#2f6b4f'
const LIGHT_SQUARE = '#ffffff'

// 64 ô, ô trên-trái là a8 (sáng). Cùng công thức (file + rank) % 2 như bàn cờ thật.
const SKELETON_SQUARES = Array.from({ length: 64 }, (_, index) => {
  const file = index % 8
  const rank = Math.floor(index / 8)
  return { key: `${file}-${rank}`, dark: (file + rank) % 2 === 0 }
})

const BACK_RANK = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜']
const PAWNS = Array.from({ length: 8 }, (_, index) => `pawn-${index}`)

export function PageFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
      <div className="relative w-[min(80vw,360px)]">
        <div className="grid grid-cols-8 overflow-hidden rounded-2xl border-[6px] border-brand-800 opacity-90 shadow-[0_18px_34px_-18px_rgba(13,32,24,0.7)]">
          {SKELETON_SQUARES.map((square) => (
            <div
              key={square.key}
              className="aspect-square animate-pulse"
              style={{ backgroundColor: square.dark ? DARK_SQUARE : LIGHT_SQUARE }}
            />
          ))}
        </div>

        {/* Hai hàng quân mờ nằm đúng trên hàng 8 và hàng 2 cho giống bàn cờ thật */}
        <div className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-8 px-1.5" aria-hidden>
          {BACK_RANK.map((piece, index) => (
            <span
              key={`black-${index}`}
              className="grid aspect-square place-items-center text-[min(4.2vw,1.4rem)] leading-none text-[#1f2320]/40"
            >
              {piece}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-[12.5%] grid grid-cols-8 px-1.5" aria-hidden>
          {PAWNS.map((key) => (
            <span
              key={`black-${key}`}
              className="grid aspect-square place-items-center text-[min(4.2vw,1.4rem)] leading-none text-[#1f2320]/30"
            >
              ♟
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          ♟️
        </span>
        <p className="text-sm font-extrabold text-brand-700">Đang mở bàn cờ cho bé…</p>
      </div>
      <p className="text-xs font-semibold text-ink-500">Chờ một chút xíu thôi nhé!</p>
    </div>
  )
}
