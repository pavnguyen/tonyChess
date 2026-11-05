interface Props {
  on: boolean
  onToggle: () => void
  className?: string
}

/**
 * Nút **“Mắt Thần Cờ Vua”**.
 *
 * Bản gọn: chỉ còn 👁️ + BẬT/TẮT (tên đầy đủ nằm ở `title`/`aria-label`). Trước
 * đây nút chiếm gần 1/3 bề ngang và cao 2 dòng chữ “Mắt Thần Cờ Vua” nên đẩy bàn
 * cờ nhỏ lại trên điện thoại; nút **?** mở bảng chú giải màu đã bỏ vì bấm không
 * ra bảng.
 */
export function EyeToggle({ on, onToggle, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        id="kid-eye-toggle"
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        aria-label="Mắt Thần Cờ Vua: nhìn toàn cảnh nguy hiểm"
        title={
          on
            ? 'Mắt Thần Cờ Vua đang BẬT - bấm để tắt'
            : 'Mắt Thần Cờ Vua đang TẮT - bấm để xem ô nguy hiểm'
        }
        className={`flex items-center gap-1 rounded-full border-2 border-white px-2 py-1 text-xs font-extrabold shadow transition-all active:translate-y-[1px] ${
          on
            ? 'bg-gradient-to-br from-brand-700 to-leaf-500 text-white'
            : 'bg-white text-brand-600'
        }`}
      >
        <span className={`text-base leading-none ${on ? '' : 'grayscale'}`} aria-hidden>
          👁️
        </span>
        <span className="whitespace-nowrap">{on ? 'BẬT' : 'TẮT'}</span>
      </button>
    </div>
  )
}
