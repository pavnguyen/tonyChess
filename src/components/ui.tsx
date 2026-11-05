import { Fragment, useEffect, useRef, useState } from 'react'
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
     * Xuống hàng thay vì cuộn ngang: 5 chủ đề Trung cuộc mà để một hàng cuộn thì
     * chủ đề cuối bị cắt cụt ("Hy sinh mở…"), bé phải vuốt mới đọc được - khó tra
     * cứu. Giờ các chip tự xuống hàng, mỗi nhãn nằm trọn một dòng; chữ nhỏ gọn nên
     * 5 chủ đề chỉ chiếm 2 hàng, không giành chỗ của bàn cờ.
     */
    <div
      role="tablist"
      className={`flex flex-wrap items-stretch gap-1 rounded-2xl border border-sand-300 bg-sand-100 p-0.5 ${className}`}
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
              size === 'sm'
                ? 'min-h-7 px-2 py-1 text-xs sm:text-sm'
                : 'min-h-9 px-3 py-1.5 text-sm sm:text-base'
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

/**
 * Chọn một mục trong danh sách: **bảng chọn của app** khi màn hình hẹp
 * (ngoài `stage`), **lưới thẻ** do trang tự vẽ trên máy tính (`stage`).
 *
 * Vì sao: danh sách 5–10 mục vẽ thành thẻ thì trên điện thoại chiếm gần trọn một
 * màn hình, đẩy bàn cờ và nội dung bài học xuống dưới; trên máy tính thì thẻ lại
 * dễ quét mắt và bấm hơn một combo. Hai bản cùng nằm trong DOM (như `FoldPanel`)
 * nên không phải render hai lần, và bài kiểm tra trình duyệt vẫn bấm được thẻ.
 */
export function PickSwitch({
  id,
  label,
  value,
  onChange,
  options,
  children,
  className = '',
}: {
  id: string
  /** Nhãn ngắn đứng trước combo ("Khai cuộc", "Nguyên tắc"…). */
  label: string
  value: string
  onChange: (value: string) => void
  options: { id: string; label: string; icon?: string }[]
  /** Lưới thẻ chỉ hiện trên máy tính. */
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <KidPicker
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        groups={[{ items: options }]}
        className="stage:hidden"
      />
      <div className="hidden stage:block">{children}</div>
    </div>
  )
}

export type KidTagTone = 'leaf' | 'gold' | 'info'

/** Màu của nhãn nhỏ (độ khó, mức…): xanh ngọc = dễ, vàng đồng = vừa, xanh thép = khó. */
const TAG_TONES: Record<KidTagTone, string> = {
  leaf: 'bg-leaf-100 text-leaf-800 ring-leaf-200',
  gold: 'bg-gold-100 text-gold-800 ring-gold-200',
  info: 'bg-info-100 text-info-800 ring-info-200',
}

export interface KidPickerItem {
  id: string
  label: string
  /** Icon nhỏ cuối hàng (♞ quân hay 🛡️/🏁 mục tiêu) - cũng là icon trên nút khi đã chọn. */
  icon?: string
  /** Nhãn nhỏ cạnh tên ("Dễ / Vừa / Khó") - đọc là biết ngay mức của thế này. */
  tag?: { label: string; tone?: KidTagTone }
  /** Thuộc tính `data-*` gắn lên `<option>` (bài kiểm trình duyệt bám vào). */
  data?: Record<string, string>
}

export interface KidPickerGroup {
  label?: string
  icon?: string
  items: KidPickerItem[]
}

/**
 * Chọn một mục trong danh sách - bản "của bé" thay cho `<select>` của máy.
 *
 * Vì sao không dùng `<select>` trần: danh sách xổ xuống của HỆ ĐIỀU HÀNH là một
 * khối xám/đen không thể tô màu hay thêm icon, chữ dài bị cắt, và hàng cao thấp
 * theo hệ thống nên ngón tay bé 7 tuổi dễ bấm nhầm hàng bên cạnh. Ở đây bảng
 * chọn do app tự vẽ:
 *   - mỗi hàng cao ≥ 44px, số thứ tự nằm trong ô tròn để bé đếm được thứ tự dễ → khó;
 *   - hàng ĐANG CHỌN tô vàng đồng + dấu ✓ (cùng ngôn ngữ với phần thưởng của app);
 *   - tiêu đề dài xuống tối đa 2 dòng thay vì bị cắt cụt, không phải viết tắt tên thế cờ;
 *   - nhóm (Cơ bản / Nâng cao) có nhãn riêng ngay trong danh sách.
 *
 * `<select>` gốc vẫn nằm trong DOM nhưng bị ẩn (`sr-only`): nhờ vậy đoạn mã cũ /
 * bài kiểm trình duyệt gán `value` rồi bắn `change` vẫn chạy, và dữ liệu vẫn còn
 * một bản dự phòng nếu JavaScript của bảng chọn gặp lỗi.
 */
export function KidPicker({
  id,
  label,
  value,
  onChange,
  groups,
  className = '',
}: {
  id: string
  /** Nhãn ngắn hiện phía trên tên mục đang chọn ("Thế cờ", "Bài tàn cuộc"…). */
  label: string
  value: string
  onChange: (value: string) => void
  groups: KidPickerGroup[]
  className?: string
}) {
  const flat = groups.flatMap((group) => group.items)
  const selectedIndex = Math.max(
    0,
    flat.findIndex((item) => item.id === value),
  )
  const current = flat[selectedIndex]
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(selectedIndex)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = `${id}-panel`

  // Bấm ra ngoài hoặc Esc thì đóng, như mọi bảng chọn khác của hệ điều hành.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Mở ra là đưa bàn phím về đúng hàng đang chọn và cuộn hàng đó vào tầm mắt.
  useEffect(() => {
    if (!open) return
    const node = panelRef.current?.querySelector<HTMLElement>(
      `[data-kid-option="${cursor}"]`,
    )
    node?.focus({ preventScroll: true })
    node?.scrollIntoView({ block: 'nearest' })
  }, [open, cursor])

  const choose = (index: number) => {
    const item = flat[index]
    if (!item) return
    onChange(item.id)
    setCursor(index)
    setOpen(false)
    triggerRef.current?.focus()
  }

  /** Phím mũi tên / Home / End di chuyển giữa các hàng khi bảng đang mở. */
  const move = (delta: number | 'home' | 'end') => {
    setCursor((index) => {
      if (delta === 'home') return 0
      if (delta === 'end') return flat.length - 1
      return Math.min(flat.length - 1, Math.max(0, index + delta))
    })
  }

  /** Vị trí (1-based) của từng mục trong danh sách phẳng - dùng cho ô số thứ tự. */
  const indexById = new Map(flat.map((item, index) => [item.id, index]))

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {groups.map((group, groupIndex) => {
          const options = group.items.map((item) => (
            <option key={item.id} value={item.id} {...item.data}>
              {item.label}
            </option>
          ))
          if (!group.label) return <Fragment key={groupIndex}>{options}</Fragment>
          return (
            <optgroup key={groupIndex} label={`${group.icon ? `${group.icon} ` : ''}${group.label}`}>
              {options}
            </optgroup>
          )
        })}
      </select>

      <button
        ref={triggerRef}
        type="button"
        id={`${id}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${current?.label ?? 'chưa chọn'}`}
        onClick={() => {
          setCursor(selectedIndex)
          setOpen((value) => !value)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          event.preventDefault()
          setCursor(selectedIndex)
          setOpen(true)
        }}
        className="flex w-full min-w-0 items-center gap-2 rounded-2xl border-2 border-brand-200 bg-white px-2 py-1.5 text-left shadow-[0_2px_0_#e3cda3] transition-all hover:border-brand-300 hover:bg-brand-50 active:translate-y-[1px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        {/* Ô icon màu navy: quân cờ / mục tiêu của thế đang chọn, nhìn là nhận ra. */}
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 text-base font-extrabold text-white shadow-[0_2px_6px_-2px_rgba(27,38,57,0.7)]"
        >
          {current?.icon ?? selectedIndex + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-xs font-extrabold uppercase tracking-wide text-brand-500">
              {label}
            </span>
            <span className="shrink-0 rounded-full bg-gold-100 px-1.5 text-xs font-extrabold text-gold-800 ring-1 ring-gold-200">
              {selectedIndex + 1}/{flat.length}
            </span>
            {current?.tag && (
              <span
                className={`shrink-0 rounded-full px-1.5 text-xs font-extrabold ring-1 ${
                  TAG_TONES[current.tag.tone ?? 'gold']
                }`}
              >
                {current.tag.label}
              </span>
            )}
          </span>
          <span className="block truncate text-sm font-extrabold leading-tight text-brand-900">
            {current?.label ?? 'Đang tải…'}
          </span>
        </span>
        <span
          aria-hidden
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-transform ${
            open
              ? 'rotate-180 bg-brand-700 text-white'
              : 'bg-brand-100 text-brand-700'
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="listbox"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              move(event.key === 'ArrowDown' ? 1 : -1)
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              move(event.key === 'Home' ? 'home' : 'end')
            } else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              choose(cursor)
            }
          }}
          className="animate-pop-in absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[min(16rem,45vh)] overflow-y-auto overscroll-contain rounded-2xl border-2 border-brand-200 bg-white p-1 shadow-[0_18px_36px_-14px_rgba(27,38,57,0.45)]"
        >
          {groups.map((group, groupIndex) => (
            <Fragment key={groupIndex}>
              {group.label && (
                <div className="flex items-center gap-1 px-2 pb-0.5 pt-1.5 text-xs font-extrabold uppercase tracking-wide text-brand-500 first:pt-0.5">
                  {group.icon && <span aria-hidden>{group.icon}</span>}
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const index = indexById.get(item.id) ?? 0
                const active = item.id === value
                const highlighted = index === cursor
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-kid-option={index}
                    tabIndex={-1}
                    onClick={() => choose(index)}
                    onMouseEnter={() => setCursor(index)}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors ${
                      active
                        ? 'bg-gold-100 ring-1 ring-gold-300'
                        : highlighted
                          ? 'bg-brand-50'
                          : ''
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                        active ? 'bg-gold-400 text-gold-950' : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`line-clamp-2 min-w-0 flex-1 text-sm font-extrabold leading-snug ${
                        active ? 'text-gold-900' : 'text-brand-900'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.tag && (
                      <span
                        className={`shrink-0 rounded-full px-1.5 text-xs font-extrabold ring-1 ${
                          TAG_TONES[item.tag.tone ?? 'gold']
                        }`}
                      >
                        {item.tag.label}
                      </span>
                    )}
                    {item.icon && (
                      <span
                        aria-hidden
                        className={`shrink-0 text-base ${
                          active ? 'text-gold-700' : 'text-brand-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span
                      aria-hidden
                      className={`shrink-0 text-sm font-extrabold text-gold-600 ${
                        active ? 'visible' : 'invisible'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      )}
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
