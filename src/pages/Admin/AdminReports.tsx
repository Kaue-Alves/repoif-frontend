import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import type { PageMeta } from '../../utils/pagination'
import {
  REASON_LABELS,
  STATUS_LABELS,
  type ReportStatus,
  type ReportTargetType,
} from '../Reports/reports.service'
import {
  getAdminFileDownloadUrl,
  listReports,
  updateReportStatus,
  type AdminReport,
} from './admin.service'

const LIMIT = 20
const STATUSES: ReportStatus[] = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']
const TARGET_TYPES: ReportTargetType[] = ['USER', 'FILE']

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: 'bg-error-container text-on-error-container',
  REVIEWED: 'bg-primary-container/40 text-primary',
  RESOLVED: 'bg-primary-container text-on-primary-container',
  DISMISSED: 'bg-surface-container-high text-on-surface-variant',
}

export default function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | ''>('')

  const [moderating, setModerating] = useState<AdminReport | null>(null)

  const fetchReports = useCallback(() => {
    setLoading(true)
    setError('')
    listReports({
      page,
      limit: LIMIT,
      status: statusFilter || undefined,
      targetType: typeFilter || undefined,
    })
      .then((res) => {
        setReports(res.data)
        setMeta(res.meta)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao carregar denúncias.'))
      .finally(() => setLoading(false))
  }, [page, statusFilter, typeFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, typeFilter])

  function handleModerated(updated: AdminReport) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === updated.id
          ? { ...r, status: updated.status, resolutionNote: updated.resolutionNote, resolvedBy: updated.resolvedBy }
          : r
      )
    )
    setModerating(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-lg">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-md">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportTargetType | '')}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos os alvos</option>
            {TARGET_TYPES.map((t) => (
              <option key={t} value={t}>{t === 'USER' ? 'Usuário' : 'Arquivo'}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-xl">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>flag</span>
            <p className="text-body-md text-on-surface-variant">Nenhuma denúncia encontrada.</p>
          </div>
        ) : (
          <ul className="space-y-md">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} onModerate={() => setModerating(r)} />
            ))}
          </ul>
        )}

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      {moderating && (
        <ModerateModal
          report={moderating}
          onClose={() => setModerating(null)}
          onModerated={handleModerated}
        />
      )}
    </AdminLayout>
  )
}

// ─── Card de denúncia ─────────────────────────────────────────────────────────

function ReportCard({ report, onModerate }: { report: AdminReport; onModerate: () => void }) {
  const [opening, setOpening] = useState(false)
  const [openError, setOpenError] = useState('')

  const isUser = report.targetType === 'USER'
  const targetUser = report.targetUser
  const targetFile = report.targetFile
  const owner = targetFile?.uploader ?? null

  async function handleViewFile() {
    if (!targetFile) return
    setOpening(true)
    setOpenError('')
    try {
      const url = await getAdminFileDownloadUrl(targetFile.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : 'Não foi possível abrir o arquivo.')
    } finally {
      setOpening(false)
    }
  }

  return (
    <li className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg space-y-md">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div className="flex items-center gap-sm min-w-0">
          <span
            className={`material-symbols-outlined flex-shrink-0 ${isUser ? 'text-tertiary' : 'text-primary'}`}
            style={{ fontSize: 22 }}
          >
            {isUser ? 'person' : 'description'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-xs flex-wrap">
              {isUser ? (
                targetUser ? (
                  <Link to={`/profile/${targetUser.username}`} className="text-label-lg text-on-surface hover:text-primary transition-colors truncate">
                    @{targetUser.username}
                  </Link>
                ) : (
                  <span className="text-label-lg text-on-surface truncate">Usuário removido</span>
                )
              ) : targetFile ? (
                <button
                  onClick={handleViewFile}
                  disabled={opening}
                  title="Abrir arquivo em nova aba"
                  className="flex items-center gap-xs text-label-lg text-on-surface hover:text-primary transition-colors truncate disabled:opacity-60"
                >
                  <span className="truncate">{targetFile.originalName}</span>
                  {opening ? (
                    <Spinner className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 16 }}>open_in_new</span>
                  )}
                </button>
              ) : (
                <span className="text-label-lg text-on-surface truncate">Arquivo removido</span>
              )}
              {((isUser && !!targetUser?.deletedAt) || (!isUser && (!targetFile || !!targetFile.deletedAt))) && (
                <span className="text-label-sm px-xs rounded bg-error-container text-on-error-container">excluído</span>
              )}
            </div>
            <span className="text-label-sm text-on-surface-variant">
              {isUser ? 'Usuário denunciado' : 'Arquivo denunciado'}
            </span>
            {!isUser && (
              owner ? (
                <span className="flex items-center gap-xs text-label-sm text-on-surface-variant mt-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>account_circle</span>
                  dono:
                  <Link to={`/profile/${owner.username}`} className="text-on-surface hover:text-primary transition-colors truncate">
                    @{owner.username}
                  </Link>
                  {owner.deletedAt && (
                    <span className="text-label-sm px-xs rounded bg-error-container text-on-error-container">excluído</span>
                  )}
                </span>
              ) : targetFile ? (
                <span className="text-label-sm text-on-surface-variant mt-xs block">dono desconhecido</span>
              ) : null
            )}
          </div>
        </div>

        <span className={`text-label-sm px-sm py-xs rounded-full font-medium ${STATUS_STYLES[report.status]}`}>
          {STATUS_LABELS[report.status]}
        </span>
      </div>

      {openError && (
        <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
          {openError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-lg gap-y-xs text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-xs">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>label</span>
          {REASON_LABELS[report.reason]}
        </span>
        <span className="flex items-center gap-xs">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_raised_hand</span>
          por @{report.reporter?.username ?? 'desconhecido'}
        </span>
        <span className="flex items-center gap-xs">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
          {new Date(report.createdAt).toLocaleString('pt-BR')}
        </span>
      </div>

      {report.description && (
        <p className="text-body-md text-on-surface bg-surface-container-low rounded-lg px-md py-sm">
          {report.description}
        </p>
      )}

      {report.resolutionNote && (
        <p className="text-body-md text-on-surface-variant border-l-2 border-primary pl-md">
          <span className="text-label-sm text-primary block">Nota da moderação:</span>
          {report.resolutionNote}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onModerate}
          className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>gavel</span>
          Moderar
        </button>
      </div>
    </li>
  )
}

// ─── Modal de moderação ───────────────────────────────────────────────────────

function ModerateModal({
  report,
  onClose,
  onModerated,
}: {
  report: AdminReport
  onClose: () => void
  onModerated: (updated: AdminReport) => void
}) {
  const [status, setStatus] = useState<ReportStatus>(report.status)
  const [note, setNote] = useState(report.resolutionNote ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [submitting, onClose])

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const updated = await updateReportStatus(report.id, {
        status,
        resolutionNote: note.trim() || undefined,
      })
      onModerated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar denúncia.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moderate-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!submitting) onClose() }} />

      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-md">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary-container/40">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>gavel</span>
          </div>
          <div className="flex-1">
            <h2 id="moderate-title" className="text-headline-sm text-on-surface">Moderar denúncia</h2>
            <p className="text-body-md text-on-surface-variant mt-xs">{REASON_LABELS[report.reason]}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-xs">
          <label htmlFor="moderate-status" className="text-label-lg text-on-surface">Status</label>
          <select
            id="moderate-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
            disabled={submitting}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-xs">
          <label htmlFor="moderate-note" className="text-label-lg text-on-surface">
            Nota da moderação <span className="text-on-surface-variant font-normal">(opcional)</span>
          </label>
          <textarea
            id="moderate-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            disabled={submitting}
            rows={3}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-60"
          />
          <span className="text-label-sm text-on-surface-variant text-right">{note.length}/1000</span>
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
            className="flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Spinner className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
