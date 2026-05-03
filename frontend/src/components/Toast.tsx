import { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'

const AUTO_DISMISS_MS = 4000

export default function Toast({ message, type, onDismiss }: {
  message: string
  type: 'info' | 'error'
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  const isError = type === 'error'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                  text-sm px-4 py-3 rounded-2xl shadow-lg max-w-xs w-max
                  ${isError
                    ? 'bg-red-50 text-red-900 ring-1 ring-red-200'
                    : 'bg-slate-900 text-white ring-1 ring-slate-700'
                  }`}
    >
      {isError
        ? <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
        : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
      }
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className={`shrink-0 cursor-pointer transition-opacity ${isError ? 'opacity-50 hover:opacity-80' : 'opacity-60 hover:opacity-100'}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
