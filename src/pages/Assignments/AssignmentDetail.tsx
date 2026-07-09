import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import AppLayout from '../../components/layouts/AppLayout'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useNow } from '../../hooks/useNow'
import { formatFileSize, getMimeIcon } from '../Subjects/subjects.service'
import {
  allowResubmit,
  dateInputToISO,
  deleteAssignment,
  formatDate,
  formatDateTime,
  getAssignment,
  getAttachmentDownloadUrl,
  getSubmissionDownloadUrl,
  getSubmissionsOverview,
  isPastDue,
  submitAssignment,
  tomorrowDateInput,
  updateAssignment,
  uploadAssignmentAttachment,
  toDateInput,
  type AssignmentDetail as AssignmentDetailType,
  type SubmissionsOverview,
} from './assignments.service'

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const showToast = useToast()
  const now = useNow()

  const [assignment, setAssignment] = useState<AssignmentDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchAssignment(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchAssignment(assignmentId: string) {
    setLoading(true)
    setError('')
    try {
      setAssignment(await getAssignment(assignmentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o trabalho.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadAttachment() {
    if (!id) return
    try {
      const url = await getAttachmentDownloadUrl(id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao abrir o anexo.')
    }
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await deleteAssignment(id)
      navigate(`/subjects/${assignment?.subjectId ?? ''}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir trabalho.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-xl">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (error || !assignment || !id) {
    return (
      <AppLayout>
        <div className="text-center py-xl">
          <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>assignment_late</span>
          <h2 className="text-headline-sm text-on-surface mb-xs">Trabalho indisponível</h2>
          <p className="text-body-md text-on-surface-variant mb-lg">{error || 'Trabalho não encontrado.'}</p>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-sm text-label-lg text-primary hover:underline">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Voltar
          </button>
        </div>
      </AppLayout>
    )
  }

  const past = isPastDue(assignment.dueDate, now)

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs text-label-sm text-on-surface-variant">
          <Link to={`/subjects/${assignment.subjectId}`} className="hover:text-primary transition-colors truncate">
            {assignment.subjectName}
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-on-surface truncate max-w-xs">{assignment.title}</span>
        </nav>

        {/* Header */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
          <div className="flex items-start justify-between gap-md">
            <div className="flex-1 min-w-0">
              <h1 className="text-headline-md text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>assignment</span>
                {assignment.title}
              </h1>
              {assignment.description && (
                <p className="text-body-md text-on-surface-variant mt-sm whitespace-pre-wrap">{assignment.description}</p>
              )}
              <p className={`flex items-center gap-xs text-label-lg mt-md ${past ? 'text-error' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event</span>
                {past ? 'Prazo encerrado em ' : 'Entrega até '}{formatDate(assignment.dueDate)}
              </p>

              {assignment.attachmentKey && (
                <button
                  onClick={downloadAttachment}
                  className="flex items-center gap-sm mt-md p-sm bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors text-left w-full max-w-sm"
                >
                  <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 22 }}>
                    {getMimeIcon(assignment.attachmentMimeType ?? '')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg text-on-surface truncate">{assignment.attachmentName}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      Anexo do trabalho{assignment.attachmentSize ? ` · ${formatFileSize(assignment.attachmentSize)}` : ''}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0" style={{ fontSize: 20 }}>download</span>
                </button>
              )}
            </div>
            {assignment.isOwner && (
              <div className="flex gap-xs flex-shrink-0">
                <button
                  onClick={() => setEditOpen(true)}
                  title="Editar"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  title="Excluir"
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Três papéis, três visões: dono corrige; aluno entrega; qualquer outro
            (outro professor, admin) só lê — sem área de upload que não lhe pertence. */}
        {assignment.isOwner ? (
          <TeacherSubmissions assignmentId={id} />
        ) : user?.role === 'STUDENT' ? (
          <StudentSubmission assignment={assignment} past={past} onChanged={() => fetchAssignment(id)} />
        ) : (
          <p className="flex items-center gap-sm text-body-md text-on-surface-variant bg-surface-container-low rounded-xl px-md py-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
            Você está visualizando este trabalho. Apenas alunos da turma podem enviar entregas.
          </p>
        )}
      </div>

      {assignment.isOwner && (
        <EditAssignmentModal
          open={editOpen}
          assignment={assignment}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            fetchAssignment(id)
          }}
        />
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Excluir trabalho?"
        description={`"${assignment.title}" e todas as entregas serão removidos permanentemente.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </AppLayout>
  )
}

// ─── Aluno: entregar trabalho ──────────────────────────────────────────────────

function StudentSubmission({
  assignment,
  past,
  onChanged,
}: {
  assignment: AssignmentDetailType
  past: boolean
  onChanged: () => void
}) {
  const showToast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const submission = assignment.mySubmission
  const canSubmit = assignment.canSubmit && !past

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !assignment.id) return
    e.target.value = ''
    setUploading(true)
    setProgress(0)
    setError('')
    try {
      await submitAssignment(assignment.id, file, setProgress)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar o trabalho.')
    } finally {
      setUploading(false)
    }
  }

  async function download() {
    if (!submission) return
    try {
      const url = await getSubmissionDownloadUrl(assignment.id, submission.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao abrir o arquivo.')
    }
  }

  return (
    <div className="space-y-md">
      <h2 className="text-headline-sm text-on-surface">Sua entrega</h2>

      {submission && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md">
          <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
            {getMimeIcon(submission.mimeType)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-label-lg text-on-surface truncate">{submission.originalName}</p>
            <div className="flex items-center gap-sm flex-wrap mt-xs">
              <span className="text-label-sm text-on-surface-variant">{formatFileSize(submission.size)}</span>
              <span className="text-outline">·</span>
              <span className="text-label-sm text-on-surface-variant">Enviado em {formatDateTime(submission.submittedAt)}</span>
              {submission.late && (
                <span className="text-label-sm text-error flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
                  Entrega atrasada
                </span>
              )}
            </div>
          </div>
          <button
            onClick={download}
            title="Baixar minha entrega"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-action-download hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
          </button>
        </div>
      )}

      {/* Status / ação */}
      {submission && !assignment.canSubmit && (
        <div className="flex items-center gap-sm bg-primary-container/20 text-primary rounded-lg px-md py-sm text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          Trabalho entregue. Para reenviar, peça ao professor que libere o reenvio.
        </div>
      )}

      {submission && assignment.canSubmit && !past && (
        <div className="flex items-center gap-sm bg-tertiary-fixed/20 text-tertiary rounded-lg px-md py-sm text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_open</span>
          Reenvio liberado. Ao enviar um novo arquivo, o anterior será substituído.
        </div>
      )}

      {past && !submission && (
        <div className="flex items-center gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          O prazo de entrega encerrou e você não enviou este trabalho.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
          {error}
        </div>
      )}

      {canSubmit && (
        <div>
          {uploading ? (
            <div className="space-y-md py-sm">
              <p className="text-body-md text-on-surface-variant">Enviando trabalho...</p>
              <div className="w-full bg-surface-container-high rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-label-sm text-on-surface-variant text-right">{progress}%</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-outline-variant rounded-xl py-xl text-center hover:border-primary hover:bg-primary-container/5 transition-all group"
              >
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" style={{ fontSize: 40 }}>
                  cloud_upload
                </span>
                <p className="text-body-md text-on-surface-variant mt-sm group-hover:text-primary transition-colors">
                  {submission ? 'Selecionar novo arquivo para reenviar' : 'Clique para selecionar seu arquivo'}
                </p>
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Professor: entregas ──────────────────────────────────────────────────────

function TeacherSubmissions({ assignmentId }: { assignmentId: string }) {
  const showToast = useToast()
  const [overview, setOverview] = useState<SubmissionsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // A visão ativa vive na URL: sobrevive a F5 e é compartilhável.
  const [searchParams, setSearchParams] = useSearchParams()
  const view: 'submitted' | 'notSubmitted' =
    searchParams.get('view') === 'notSubmitted' ? 'notSubmitted' : 'submitted'
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      setOverview(await getSubmissionsOverview(assignmentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar entregas.')
    } finally {
      setLoading(false)
    }
  }

  async function download(submissionId: string) {
    try {
      const url = await getSubmissionDownloadUrl(assignmentId, submissionId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao abrir o arquivo.')
    }
  }

  async function handleAllowResubmit(studentId: string) {
    setBusyId(studentId)
    try {
      await allowResubmit(assignmentId, studentId)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao liberar reenvio.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-xl">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    )
  }

  if (error) return <p className="text-body-md text-error text-center py-lg">{error}</p>
  if (!overview) return null

  return (
    <div className="space-y-md">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-sm">
        <StatCard label="Alunos" value={overview.totalStudents} icon="group" />
        <StatCard label="Entregaram" value={overview.submittedCount} icon="task_alt" accent />
        <StatCard label="Não entregaram" value={overview.notSubmittedCount} icon="pending_actions" />
      </div>

      {/* Toggle */}
      <div className="flex gap-xs p-xs bg-surface-container-high rounded-lg w-fit">
        <button
          onClick={() => setSearchParams({ view: 'submitted' })}
          className={`px-md py-xs rounded-md text-label-lg transition-colors ${
            view === 'submitted' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
          }`}
        >
          Entregaram ({overview.submittedCount})
        </button>
        <button
          onClick={() => setSearchParams({ view: 'notSubmitted' })}
          className={`px-md py-xs rounded-md text-label-lg transition-colors ${
            view === 'notSubmitted' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
          }`}
        >
          Não entregaram ({overview.notSubmittedCount})
        </button>
      </div>

      {view === 'submitted' ? (
        overview.submitted.length === 0 ? (
          <EmptyState icon="task_alt" text="Nenhum aluno entregou ainda." />
        ) : (
          <ul className="space-y-sm">
            {overview.submitted.map((s) => (
              <li key={s.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md">
                <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>
                  {getMimeIcon(s.mimeType)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-label-lg text-on-surface truncate">@{s.username ?? '—'}</p>
                  <div className="flex items-center gap-sm flex-wrap mt-xs">
                    <span className="text-label-sm text-on-surface-variant truncate">{s.originalName}</span>
                    <span className="text-outline">·</span>
                    <span className="text-label-sm text-on-surface-variant">{formatFileSize(s.size)}</span>
                    <span className="text-outline">·</span>
                    <span className="text-label-sm text-on-surface-variant">{formatDateTime(s.submittedAt)}</span>
                    {s.late && (
                      <span className="text-label-sm text-error flex items-center gap-xs">
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
                        Atrasada
                      </span>
                    )}
                    {s.resubmitAllowed && (
                      <span className="text-label-sm text-tertiary flex items-center gap-xs">
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock_open</span>
                        Reenvio liberado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-xs flex-shrink-0">
                  <button
                    onClick={() => download(s.id)}
                    title="Baixar entrega"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-action-download hover:bg-surface-container-high transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                  </button>
                  {!s.resubmitAllowed && (
                    <button
                      onClick={() => handleAllowResubmit(s.studentId)}
                      disabled={busyId === s.studentId}
                      title="Permitir reenvio"
                      className="flex items-center gap-xs px-md py-sm rounded-lg text-label-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50"
                    >
                      {busyId === s.studentId ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_open</span>
                      )}
                      Permitir reenvio
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : overview.notSubmitted.length === 0 ? (
        <EmptyState icon="celebration" text="Todos os alunos entregaram!" />
      ) : (
        <ul className="space-y-sm">
          {overview.notSubmitted.map((u) => (
            <li key={u.studentId} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg text-on-surface truncate">@{u.username}</p>
                <p className="text-label-sm text-on-surface-variant truncate">{u.email}</p>
              </div>
              <span className="text-label-sm text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pending</span>
                Pendente
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-md flex flex-col items-center text-center ${accent ? 'border-primary/30 bg-primary-container/15' : 'border-outline-variant bg-surface-container-lowest'}`}>
      <span className={`material-symbols-outlined ${accent ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontSize: 22 }}>{icon}</span>
      <span className="text-headline-sm text-on-surface mt-xs">{value}</span>
      <span className="text-label-sm text-on-surface-variant">{label}</span>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-md py-xl text-center border-2 border-dashed border-outline-variant rounded-xl">
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>{icon}</span>
      <p className="text-body-md text-on-surface-variant">{text}</p>
    </div>
  )
}

// ─── Editar trabalho ──────────────────────────────────────────────────────────

function EditAssignmentModal({
  open,
  assignment,
  onClose,
  onSaved,
}: {
  open: boolean
  assignment: AssignmentDetailType
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(assignment.title)
  const [description, setDescription] = useState(assignment.description ?? '')
  const originalDueDate = toDateInput(assignment.dueDate)
  const [dueDate, setDueDate] = useState(originalDueDate)
  const [file, setFile] = useState<File | null>(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasCurrentAttachment = !!assignment.attachmentKey && !removeAttachment && !file

  useEffect(() => {
    if (open) {
      setTitle(assignment.title)
      setDescription(assignment.description ?? '')
      setDueDate(toDateInput(assignment.dueDate))
      setFile(null)
      setRemoveAttachment(false)
      setProgress(0)
      setError('')
    }
  }, [open, assignment])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !dueDate) {
      setError('Título e data limite são obrigatórios.')
      return
    }
    // A regra de "mínimo um dia após hoje" só vale quando a data é alterada.
    if (dueDate !== originalDueDate && dueDate < tomorrowDateInput()) {
      setError('A data limite deve ser no mínimo um dia após hoje.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const attachment = file ? await uploadAssignmentAttachment(file, setProgress) : undefined
      await updateAssignment(assignment.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dateInputToISO(dueDate),
        attachment,
        removeAttachment: !file && removeAttachment ? true : undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) onClose() }} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface">Editar trabalho</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
          />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Data limite de entrega</span>
          {/* `min` só quando a data original já é futura: um prazo antigo no passado
              deixaria o campo nativamente inválido e bloquearia salvar outras edições. */}
          <input
            type="date"
            value={dueDate}
            min={originalDueDate >= tomorrowDateInput() ? tomorrowDateInput() : undefined}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </label>

        {/* Anexo */}
        <div className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Anexo (opcional)</span>
          {file ? (
            <div className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 22 }}>attach_file</span>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg text-on-surface truncate">{file.name}</p>
                <p className="text-label-sm text-on-surface-variant">{formatFileSize(file.size)} · substituirá o anexo atual</p>
              </div>
              <button type="button" onClick={() => setFile(null)} disabled={saving} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          ) : hasCurrentAttachment ? (
            <div className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 22 }}>attach_file</span>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg text-on-surface truncate">{assignment.attachmentName}</p>
                <p className="text-label-sm text-on-surface-variant">Anexo atual</p>
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} title="Substituir" className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
              </button>
              <button type="button" onClick={() => setRemoveAttachment(true)} title="Remover" className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setRemoveAttachment(false); fileInputRef.current?.click() }}
              className="flex items-center justify-center gap-sm border-2 border-dashed border-outline-variant rounded-lg py-md text-label-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
              {assignment.attachmentKey ? 'Anexo removido — anexar outro' : 'Anexar arquivo'}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) { setFile(f); setRemoveAttachment(false) }
            }}
          />
        </div>

        {saving && file && (
          <div className="space-y-xs">
            <div className="w-full bg-surface-container-high rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-label-sm text-on-surface-variant text-right">Enviando anexo... {progress}%</p>
          </div>
        )}

        {error && <p className="text-body-md text-error">{error}</p>}

        <div className="flex gap-sm justify-end pt-xs">
          <button type="button" onClick={onClose} disabled={saving} className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all disabled:opacity-60">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-sm px-lg py-sm rounded-lg text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-60">
            {saving && <Spinner className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
