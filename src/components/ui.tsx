import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'sun' | 'grass' | 'rose' | 'sky' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-violet-600 text-white shadow-[0_5px_0_#4c1d95] hover:bg-violet-500 active:shadow-[0_2px_0_#4c1d95]',
  sun: 'bg-amber-400 text-amber-950 shadow-[0_5px_0_#b45309] hover:bg-amber-300 active:shadow-[0_2px_0_#b45309]',
  grass:
    'bg-emerald-500 text-white shadow-[0_5px_0_#065f46] hover:bg-emerald-400 active:shadow-[0_2px_0_#065f46]',
  rose: 'bg-rose-500 text-white shadow-[0_5px_0_#9f1239] hover:bg-rose-400 active:shadow-[0_2px_0_#9f1239]',
  sky: 'bg-sky-500 text-white shadow-[0_5px_0_#075985] hover:bg-sky-400 active:shadow-[0_2px_0_#075985]',
  ghost:
    'bg-white text-violet-700 shadow-[0_4px_0_#ddd6fe] hover:bg-violet-50 active:shadow-[0_2px_0_#ddd6fe]',
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
      className={`inline-flex flex-wrap gap-1 rounded-2xl bg-violet-100/80 p-1 ${className}`}
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
                ? 'bg-white text-violet-700 shadow-[0_3px_0_#c4b5fd]'
                : 'text-violet-500 hover:bg-white/60'
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
  return <div className={`card-pop p-3 sm:p-4 ${className}`}>{children}</div>
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
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-md">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-extrabold text-violet-900 sm:text-xl">{title}</h2>
        {subtitle && <p className="truncate text-xs font-bold text-violet-500 sm:text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}
