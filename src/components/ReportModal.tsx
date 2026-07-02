import { useEffect, useState } from 'react'
import Spinner from './Spinner'
import {
  REASON_LABELS,
  createReport,
  type ReportReason,
  type ReportTargetType,
} from '../pages/Reports/reports.service'

interface ReportModalProps {
  open: boolean
  targetType: ReportTargetType
  /** Obrigatório quando targetType = "USER" */
  targetUserId?: string
  /** Obrigatório quando targetType = "FILE" */
  targetFileId?: string
  /** Nome exibido do alvo (ex.: @username ou nome do arquivo) */
  targetLabel: string
  onClose: () => void
}

const REASONS = Object.keys(REASON_LABELS) as ReportReason[]
const MAX_DESCRIPTION = 1000

export default function ReportModal({
  open,
  targetType,
  targetUserId,
  targetFileId,
  targetLabel,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Reseta o formulário sempre que o modal abre
  useEffect(() => {
    if (open) {
      setReason('INAPPROPRIATE')
      setDescription('')
      setSubmitting(false)
      setError('')
      setDone(false)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !submitting) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, submitting, onClose])

  if (!open) return null

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      await createReport({
        targetType,
        targetUserId: targetType === 'USER' ? targetUserId : undefined,
        targetFileId: targetType === 'FILE' ? targetFileId : undefined,
        reason,
        description: description.trim() || undefined,
      })
      setDone(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar denúncia.'
      // 409 → denúncia duplicada pendente
      setError(
        /409|já|conflit/i.test(message)
          ? 'Você já denunciou este item e a análise ainda está pendente.'
          : message
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => { if (!submitting) onClose() }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-md">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-error-container">
            <span
              className="material-symbols-outlined text-on-error-container"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              flag
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="report-modal-title" className="text-headline-sm text-on-surface">
              Denunciar {targetType === 'USER' ? 'usuário' : 'arquivo'}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-xs truncate">{targetLabel}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            title="Fechar"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-md py-lg text-center">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <p className="text-body-md text-on-surface">
              Denúncia enviada. Sua denúncia está em análise pela moderação.
            </p>
            <button
              onClick={onClose}
              className="px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label htmlFor="report-reason" className="text-label-lg text-on-surface">Motivo</label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                disabled={submitting}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{REASON_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="report-description" className="text-label-lg text-on-surface">
                Detalhes <span className="text-on-surface-variant font-normal">(opcional)</span>
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
                disabled={submitting}
                rows={4}
                placeholder="Descreva o problema para ajudar a moderação..."
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-60"
              />
              <span className="text-label-sm text-on-surface-variant text-right">
                {description.length}/{MAX_DESCRIPTION}
              </span>
            </div>

            <div className="flex gap-sm justify-end pt-xs">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-sm px-lg py-sm bg-error text-on-error rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && <Spinner className="h-4 w-4" />}
                Enviar denúncia
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
