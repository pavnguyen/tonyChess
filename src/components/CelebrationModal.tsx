import type { ReactNode } from 'react'
import { KidButton } from './ui'

interface Props {
  open: boolean
  emoji: string
  title: string
  message: string
  children?: ReactNode
  onClose: () => void
  onRetry?: () => void
  retryLabel?: string
}

export function CelebrationModal({
  open,
  emoji,
  title,
  message,
  children,
  onClose,
  onRetry,
  retryLabel = 'Chơi lại',
}: Props) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 grid place-items-center bg-brand-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-md rounded-[2rem] border-[5px] border-white bg-white p-5 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="animate-float-slow text-6xl sm:text-7xl">{emoji}</div>
        <h3 className="mt-2 text-2xl font-extrabold text-brand-900 sm:text-3xl">{title}</h3>
        <p className="mt-1 text-sm font-bold text-brand-600 sm:text-base">{message}</p>

        {children}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <KidButton variant="ghost" onClick={onRetry}>
              🔄 {retryLabel}
            </KidButton>
          )}
          <KidButton variant="primary" onClick={onClose}>
            👍 Tuyệt vời!
          </KidButton>
        </div>
      </div>
    </div>
  )
}
