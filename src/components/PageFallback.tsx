/**
 * Hiển thị trong lúc chờ file JS của một tab đang được tải về (code-splitting).
 * Cố tình giữ thật nhẹ: chỉ vài thẻ div + emoji, không kéo theo thư viện nào.
 */
export function PageFallback() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="card-pop flex flex-col items-center gap-2 px-6 py-5 text-center">
        <span className="animate-bounce text-3xl" aria-hidden>
          ♟️
        </span>
        <p className="text-sm font-extrabold text-brand-700">Đang mở bàn cờ cho bé…</p>
        <p className="text-xs font-semibold text-ink-500">Chờ một chút xíu thôi nhé!</p>
      </div>
    </div>
  )
}
