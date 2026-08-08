import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '../../utils/helpers'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || icons.info
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md border min-w-[300px] max-w-md animate-slide-up',
                'bg-dark-850/90 border-dark-700/50 text-dark-100'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0 text-dark-300" />
              <span className="text-sm flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-dark-500 hover:text-dark-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
