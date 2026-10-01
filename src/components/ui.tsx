import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'sun' | 'grass' | 'rose' | 'sky' | 'ghost'

/**
 * Bóng đổ dùng tông XANH RỪNG đậm thay cho tím như bản cũ, và độ dày giảm từ
 * 5px xuống 4px - vẫn giữ cảm giác "bấm được" cho bé nhưng bớt nặng nề.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white shadow-[0_4px_0_#163125] hover:bg-brand-600 active:shadow-[0_2px_0_#163125]',
  sun: 'bg-gold-400 text-gold-950 shadow-[0_4px_0_#9c711a] hover:bg-gold-300 active:shadow-[0_2px_0_#9c711a]',
  grass:
    'bg-leaf-600 text-white shadow-[0_4px_0_#24482d] hover:bg-leaf-500 active:shadow-[0_2px_0_#24482d]',
  rose: 'bg-coral-500 text-white shadow-[0_4px_0_#823c30] hover:bg-coral-400 active:shadow-[0_2px_0_#823c30]',
  sky: 'bg-info-500 text-white shadow-[0_4px_0_#2a535f] hover:bg-info-400 active:shadow-[0_2px_0_#2a535f]',
  ghost:
    'border border-sand-200 bg-white text-brand-700 shadow-[0_3px_0_#dcd4c1] hover:bg-brand-50 active:shadow-[0_2px_0_#dcd4c1]',
}

interface KidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function KidButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: KidButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition-all duration-100 select-none active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-[3px] sm:text-base ${VARIANTS[variant]} ${className}`}
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
    <div
      role="tablist"
      className={`inline-flex flex-wrap gap-1 rounded-2xl border border-sand-200 bg-sand-100 p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-xl font-extrabold transition-all ${
              size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
            } ${
              active
                ? 'bg-white text-brand-700 shadow-[0_2px_4px_rgba(31,42,36,0.16)]'
                : 'text-ink-500 hover:bg-white/70 hover:text-brand-700'
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
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`card-pop p-2.5 sm:p-3 ${className}`}>{children}</div>
}

export function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle?: string
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
        {subtitle && <p className="truncate text-xs font-bold text-brand-500 sm:text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}
