import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastKind = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

type ShowToast = (message: string, kind?: ToastKind) => void

const ToastContext = createContext<ShowToast | null>(null)

const KIND_STYLES: Record<ToastKind, { box: string; icon: string }> = {
  error: { box: 'bg-error-container text-on-error-container', icon: 'error' },
  success: { box: 'bg-primary-container text-on-primary-container', icon: 'check_circle' },
  info: { box: 'bg-surface-container-high text-on-surface', icon: 'info' },
}

const TOAST_DURATION_MS = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback<ShowToast>(
    (message, kind = 'error') => {
      const id = ++seq.current
      setToasts((prev) => [...prev, { id, message, kind }])
      setTimeout(() => dismiss(id), TOAST_DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="assertive"
          className="fixed bottom-lg left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-sm w-full max-w-md px-md pointer-events-none"
        >
          {toasts.map((t) => {
            const style = KIND_STYLES[t.kind]
            return (
              <div
                key={t.id}
                role="alert"
                className={`pointer-events-auto flex items-start gap-sm rounded-xl px-md py-sm shadow-md text-body-md ${style.box}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>
                  {style.icon}
                </span>
                <span className="flex-1 min-w-0 break-words">{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Fechar aviso"
                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                >
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}

/** Avisos transitórios não bloqueantes — substitui os `alert()` que travavam a UI. */
export function useToast(): ShowToast {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
