import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Lưới an toàn cuối cùng: một FEN hỏng, một worker Stockfish không khởi động
 * được hay một lỗi render bất ngờ sẽ chỉ thay khối nội dung bằng thẻ báo lỗi,
 * thay vì để cả app trắng màn hình (nhất là bản PWA đã cài, bé không biết bấm
 * vào đâu để thoát).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Lỗi giao diện:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="m-auto grid max-w-md justify-items-center gap-2 rounded-2xl border-2 border-coral-200 bg-white p-4 text-center shadow-sm">
        <p className="text-3xl" aria-hidden>
          🛠️
        </p>
        <p className="text-base font-extrabold text-brand-900">Có gì đó chưa chạy được</p>
        <p className="text-sm font-bold text-ink-600">
          Bé bấm nút bên dưới để mở lại nhé. Ba mẹ không cần làm gì thêm.
        </p>
        <button
          type="button"
          onClick={() => {
            this.setState({ error: null })
            window.location.reload()
          }}
          className="mt-1 min-h-11 rounded-2xl bg-brand-700 px-4 text-base font-extrabold text-white shadow-[0_3px_0_#1b2639] active:translate-y-[3px]"
        >
          ↻ Mở lại
        </button>
      </div>
    )
  }
}
