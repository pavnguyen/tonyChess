import { useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { InfoButton } from './InfoPopover'

type Variant = 'primary' | 'sun' | 'grass' | 'rose' | 'sky' | 'ghost'

/**
 * Bóng "3D" dày 3px, màu bóng là bản ĐẬM HƠN 2 BẬC của nền nút - nhờ vậy nút
 * vẫn "bấm được" cho bé mà không nặng nề như bản 4-5px trước đây.
 *
 * Ánh xạ sang gam Navy - Gỗ sáng - Đỏ son:
 *   primary → navy 700 (chữ trắng)   sun → vàng đồng 400 (chữ nâu đậm)
 *   grass   → xanh ngọc 600          rose → đỏ son 500
 *   sky     → xanh thép 500          ghost → trắng + viền gỗ 200
 *
 * ⚠️ Vàng CHỈ dùng cho "phần thưởng / quân cần đi"; đỏ son CHỈ cho "sai / nguy
 * hiểm". Không trộn hai màu này cho cùng một ý.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white shadow-[0_3px_0_#1b2639] hover:bg-brand-600 hover:shadow-[0_3px_0_#24334f] active:shadow-[0_2px_0_#1b2639]',
  sun: 'bg-gold-400 text-gold-950 shadow-[0_3px_0_#9a7018] hover:bg-gold-300 hover:shadow-[0_3px_0_#bf8c22] active:shadow-[0_2px_0_#9a7018]',
  grass:
    'bg-leaf-600 text-white shadow-[0_3px_0_#17392c] hover:bg-leaf-500 hover:shadow-[0_3px_0_#1d4f3a] active:shadow-[0_2px_0_#17392c]',
  // `rose` dùng coral-600 (không phải 500) vì chữ trắng trên #cc5847 chỉ đạt
  // 4.15:1 - dưới ngưỡng đọc của bé. #ad4235 cho 5.9:1 (xem `scripts/check-contrast.ts`).
  rose: 'bg-coral-600 text-white shadow-[0_3px_0_#54211c] hover:bg-coral-500 hover:shadow-[0_3px_0_#6d2a23] active:shadow-[0_2px_0_#54211c]',
  sky: 'bg-info-500 text-white shadow-[0_3px_0_#294e5a] hover:bg-info-400 hover:shadow-[0_3px_0_#33606f] active:shadow-[0_2px_0_#294e5a]',
  ghost:
    'border border-sand-300 bg-white text-brand-700 shadow-[0_3px_0_#e3cda3] hover:bg-brand-50 active:shadow-[0_2px_0_#e3cda3]',
}

/**
 * Cỡ nút. `sm` dùng cho những hàng có nhiều nút (trang Chiến lược) - nhờ vậy cả
 * hàng nút nằm gọn một dòng, bé không phải cuộn và bàn cờ được rộng hơn.
 */
const SIZES = {
  // `md` luôn ≥ 44px chiều cao: ngón tay bé 7 tuổi bấm trúng, không phải nhắm.
  md: 'min-h-11 px-4 py-2.5 text-base',
  sm: 'min-h-10 px-2.5 py-1.5 text-sm',
} as const

interface KidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: keyof typeof SIZES
  children: ReactNode
}

export function KidButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: KidButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700 transition-all duration-100 select-none active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-[3px] ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: string
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedProps<T>) {
  return (
    /*
     * MỘT HÀNG cuộn ngang trên điện thoại (thay vì `flex-wrap`): 5 chủ đề Trung
     * cuộc trước đây làm vỡ thành 2-3 hàng, chiếm mất chỗ của bàn cờ. Mục đang
     * chọn nền trắng + chữ navy đậm, mục thường chữ xám navy.
     */
    <div
      role="tablist"
      className={`flex flex-nowrap items-stretch gap-1 overflow-x-auto rounded-2xl border border-sand-300 bg-sand-100 p-0.5 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl font-extrabold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 transition-all ${
              size === 'sm' ? 'min-h-10 px-2.5 py-1.5 text-sm' : 'min-h-11 px-3 py-2 text-base'
            } ${
              active
                ? 'border border-brand-200 bg-white text-brand-800 shadow-[0_2px_4px_rgba(27,38,57,0.16)]'
                : 'text-ink-600 hover:bg-white/70 hover:text-brand-700'
            }`}
          >
            {option.icon && <span aria-hidden>{option.icon}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Panel({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  /** Định danh để bài kiểm tra trình duyệt bám vào (ví dụ khung cây khai cuộc). */
  id?: string
}) {
  return (
    <div id={id} className={`card-pop p-2.5 sm:p-3 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Khung nội dung PHỤ: trên điện thoại thu lại sau một dòng “xem thêm” để trang
 * không dài lê thê, còn trên máy tính (bố cục `stage`) luôn mở sẵn như cũ.
 *
 * Vì sao không dùng `<details>`: cần bố cục hai chế độ khác nhau (đóng trên điện
 * thoại, luôn mở trên máy tính) mà vẫn giữ NGUYÊN nội dung trong DOM - nhờ vậy
 * không phải render hai bản, không sinh id trùng, và bài kiểm tra trình duyệt
 * vẫn bấm được các nút bên trong.
 */
export function FoldPanel({
  children,
  className = '',
  id,
  icon,
  title,
  defaultOpen = false,
}: {
  children: ReactNode
  className?: string
  id?: string
  icon: string
  title: string
  /** Mở sẵn trên điện thoại (dùng cho khung MIND-SET - thứ bé cần thấy ngay). */
  defaultOpen?: boolean
}) {
  /*
   * Nhớ trạng thái mở/đóng trong PHIÊN (không phải localStorage): ba mẹ đang tra
   * cứu mà chuyển tab rồi quay lại thì khung vẫn mở như lúc rời đi, nhưng mở app
   * lần sau lại gọn như mặc định. Khoá theo `id` nên mỗi khung nhớ riêng.
   */
  const storageKey = `kid-fold:${id ?? title}`
  const [open, setOpen] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem(storageKey)
      if (saved === 'open') return true
      if (saved === 'closed') return false
    } catch {
      /* chế độ riêng tư chặn sessionStorage - rơi về mặc định */
    }
    return defaultOpen
  })

  const toggle = () =>
    setOpen((value) => {
      try {
        window.sessionStorage.setItem(storageKey, value ? 'closed' : 'open')
      } catch {
        /* không lưu được thì thôi, khung vẫn mở/đóng bình thường */
      }
      return !value
    })

  return (
    // `minmax(0,1fr)` chặn cột phình theo nội dung: một câu dài trong khung không
    // được kéo cả trang rộng hơn màn hình điện thoại (chữ vẫn tự xuống dòng).
    <Panel id={id} className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border-2 border-brand-200 bg-brand-50 px-2.5 py-1.5 text-left text-sm font-extrabold text-brand-700 active:translate-y-[1px] stage:hidden"
      >
        <span className="min-w-0 truncate">
          <span aria-hidden>{icon}</span> {title}
        </span>
        <span aria-hidden className="shrink-0 text-brand-500">
          {open ? '▲' : '▼'}
        </span>
      </button>
      <div className={`${open ? 'grid' : 'hidden'} gap-2 stage:grid`}>{children}</div>
    </Panel>
  )
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  info,
}: {
  icon: string
  title: string
  subtitle?: string
  /**
   * Khoá nội dung cho nút ⓘ (xem `src/lib/info.ts`). Bỏ trống thì không hiện nút -
   * nên chỉ cần gắn ở những khung đã có sẵn giải thích, không phải sửa mọi nơi.
   */
  info?: string
}) {
  return (
    // `min-w-0` rất quan trọng: tiêu đề dùng `truncate` (nowrap) nên nếu đặt
    // trong lưới mà không cho phép co lại, cả lưới sẽ bị đẩy rộng hơn màn hình.
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-2xl shadow-[0_8px_18px_-10px_rgba(13,32,24,0.9)]">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-extrabold text-brand-900 sm:text-xl">{title}</h2>
        {/* Phụ đề 14px chữ xám-navy: đủ đậm để đọc (≥ 4.5:1), không dùng brand-500 nhạt nữa. */}
        {subtitle && <p className="truncate text-sm font-bold text-ink-600">{subtitle}</p>}
      </div>
      <InfoButton topic={info} />
    </div>
  )
}
