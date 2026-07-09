import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import { useToast } from '../../contexts/ToastContext'
import { useNow } from '../../hooks/useNow'
import { clientPageMeta } from '../../utils/pagination'
import { formatFileSize } from './subjects.service'
import {
  createAssignment,
  dateInputToISO,
  deleteAssignment,
  formatDate,
  isPastDue,
  listAssignments,
  tomorrowDateInput,
  uploadAssignmentAttachment,
  type Assignment,
  type StudentAssignmentItem,
  type TeacherAssignmentItem,
} from '../Assignments/assignments.service'

type Item = TeacherAssignmentItem | StudentAssignmentItem

const ASSIGNMENTS_PAGE_LIMIT = 10

export default function AssignmentsTab({ subjectId, isOwner }: { subjectId: string; isOwner: boolean }) {
  const showToast = useToast()
  const now = useNow()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  // Paginação client-side: a API devolve a lista inteira de trabalhos.
  const totalPages = Math.max(1, Math.ceil(items.length / ASSIGNMENTS_PAGE_LIMIT))
  const safePage = Math.min(page, totalPages)
  const pagedItems = items.slice((safePage - 1) * ASSIGNMENTS_PAGE_LIMIT, safePage * ASSIGNMENTS_PAGE_LIMIT)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await listAssignments(subjectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar trabalhos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAssignment(deleteTarget.id)
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir trabalho.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm text-on-surface flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>assignment</span>
          Trabalhos
          {!loading && <span className="text-label-sm text-on-surface-variant font-normal">({items.length})</span>}
        </h2>
        {isOwner && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-sm bg-primary text-on-primary px-md py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Novo trabalho
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-xl">
          <Spinner className="h-6 w-6 text-primary" />
        </div>
      )}

      {error && !loading && <p className="text-body-md text-error text-center py-lg">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-md py-xl text-center border-2 border-dashed border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>assignment</span>
          <p className="text-body-md text-on-surface-variant">
            {isOwner ? 'Nenhum trabalho criado ainda.' : 'Nenhum trabalho disponível ainda.'}
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <ul className="space-y-sm">
            {pagedItems.map((a) => (
              <AssignmentRow
                key={a.id}
                item={a}
                isOwner={isOwner}
                now={now}
                onDelete={() => setDeleteTarget(a)}
              />
            ))}
          </ul>
          {items.length > ASSIGNMENTS_PAGE_LIMIT && (
            <Pagination
              meta={clientPageMeta(safePage, ASSIGNMENTS_PAGE_LIMIT, items.length)}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {isOwner && (
        <CreateAssignmentModal
          open={createOpen}
          subjectId={subjectId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir trabalho?"
        description={`"${deleteTarget?.title}" e todas as entregas dos alunos serão removidos permanentemente.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({
  item,
  isOwner,
  now,
  onDelete,
}: {
  item: Item
  isOwner: boolean
  now: number
  onDelete: () => void
}) {
  const past = isPastDue(item.dueDate, now)

  return (
    <li className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-start gap-md hover:bg-surface-container-low transition-colors">
      <span
        className="material-symbols-outlined text-primary flex-shrink-0 mt-xs"
        style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}
      >
        assignment
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm flex-wrap">
          <Link to={`/assignments/${item.id}`} className="text-label-lg text-on-surface hover:text-primary transition-colors truncate">
            {item.title}
          </Link>
          <StatusBadge item={item} isOwner={isOwner} past={past} />
        </div>

        {item.description && (
          <p className="text-body-md text-on-surface-variant mt-xs line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center gap-sm flex-wrap mt-xs">
          <span className={`flex items-center gap-xs text-label-sm ${past ? 'text-error' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event</span>
            {past ? 'Encerrado em ' : 'Entrega até '}{formatDate(item.dueDate)}
          </span>
          {isOwner && 'submissionsCount' in item && (
            <span className="flex items-center gap-xs text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>
              {item.submissionsCount}/{item.totalStudents} entregaram
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-xs flex-shrink-0">
        <Link
          to={`/assignments/${item.id}`}
          className="flex items-center gap-xs px-md py-sm rounded-lg text-label-lg text-primary hover:bg-primary-container/20 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {isOwner ? 'grading' : 'open_in_new'}
          </span>
          {isOwner ? 'Entregas' : 'Abrir'}
        </Link>
        {isOwner && (
          <button
            onClick={onDelete}
            title="Excluir trabalho"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
          </button>
        )}
      </div>
    </li>
  )
}

function StatusBadge({ item, isOwner, past }: { item: Item; isOwner: boolean; past: boolean }) {
  if (isOwner) return null
  const student = item as StudentAssignmentItem
  if (student.submitted) {
    return (
      <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-primary-container/30 text-primary">
        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>
        Entregue
      </span>
    )
  }
  // Após o prazo não há mais como entregar: "Pendente" sugeriria ação possível.
  if (past) {
    return (
      <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-error-container text-on-error-container">
        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>event_busy</span>
        Não entregue
      </span>
    )
  }
  return (
    <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>pending</span>
      Pendente
    </span>
  )
}

// ─── Create Assignment Modal ──────────────────────────────────────────────────

function CreateAssignmentModal({
  open,
  subjectId,
  onClose,
  onCreated,
}: {
  open: boolean
  subjectId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setDueDate('')
      setFile(null)
      setProgress(0)
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Informe o título do trabalho.')
      return
    }
    if (!dueDate) {
      setError('Informe a data limite de entrega.')
      return
    }
    if (dueDate < tomorrowDateInput()) {
      setError('A data limite deve ser no mínimo um dia após hoje.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const attachment = file ? await uploadAssignmentAttachment(file, setProgress) : undefined
      await createAssignment({
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dateInputToISO(dueDate),
        attachment,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar trabalho.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!saving) onClose() }} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface">Novo trabalho</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Lista de exercícios 1"
            autoFocus
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </label>

        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Instruções do trabalho..."
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
          />
        </label>

        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Data limite de entrega</span>
          <input
            type="date"
            value={dueDate}
            min={tomorrowDateInput()}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <span className="text-label-sm text-on-surface-variant">Mínimo: um dia após hoje.</span>
        </label>

        {/* Anexo opcional */}
        <div className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Anexo (opcional)</span>
          {file ? (
            <div className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: 22 }}>attach_file</span>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg text-on-surface truncate">{file.name}</p>
                <p className="text-label-sm text-on-surface-variant">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={saving}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-sm border-2 border-dashed border-outline-variant rounded-lg py-md text-label-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
              Anexar arquivo (ex: enunciado)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) setFile(f)
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
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-sm px-lg py-sm rounded-lg text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-60"
          >
            {saving && <Spinner className="h-4 w-4" />}
            Criar trabalho
          </button>
        </div>
      </form>
    </div>
  )
}
