import { useEffect } from 'react'
import Spinner from './Spinner'

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => { if (!loading) onCancel() }}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md">
        <div className="flex items-start gap-md">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            danger ? 'bg-error-container' : 'bg-surface-container-high'
          }`}>
            <span aria-hidden="true"
              className={`material-symbols-outlined ${danger ? 'text-on-error-container' : 'text-on-surface-variant'}`}
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              {danger ? 'warning' : 'help'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="text-headline-sm text-on-surface">
              {title}
            </h2>
            {description && (
              <p className="text-body-md text-on-surface-variant mt-xs">{description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-sm justify-end pt-xs">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-sm px-lg py-sm rounded-lg text-label-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              danger
                ? 'bg-error text-on-error hover:opacity-90'
                : 'bg-primary text-on-primary hover:opacity-90'
            }`}
          >
            {loading && (
              <Spinner className="h-4 w-4" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
