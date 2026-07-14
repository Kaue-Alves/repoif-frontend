import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import AppLayout from '../../components/layouts/AppLayout'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import {
  createClassroom,
  deleteClassroom,
  formatDate,
  listClassrooms,
  type Classroom,
} from './classrooms.service'

const PAGE_LIMIT = 9

export default function ClassroomList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const isTeacher = user?.role === 'TEACHER'

  const {
    items: classrooms,
    meta,
    loading,
    error,
    search,
    setSearch,
    activeSearch,
    page,
    setPage,
    reload,
    reloadAfterRemove,
  } = usePaginatedList((page, limit, search) => listClassrooms(page, limit, search), {
    limit: PAGE_LIMIT,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Classroom | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteClassroom(deleteTarget.id)
      setDeleteTarget(null)
      reloadAfterRemove()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir turma.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="text-headline-lg text-on-surface">Minhas Turmas</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            {isTeacher
              ? 'Crie turmas privadas e compartilhe disciplinas apenas com seus alunos.'
              : 'Turmas em que você participa.'}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold shadow-sm hover:shadow-md hover:opacity-90 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
            Nova Turma
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-sm bg-error-container text-on-error-container rounded-xl px-md py-sm text-body-md mb-lg"
        >
          <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
          {error}
          <button onClick={reload} className="ml-auto text-label-lg underline hover:no-underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state: nenhuma turma e sem busca ativa */}
      {!loading && !error && classrooms.length === 0 && !activeSearch && (
        <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
          <span aria-hidden="true"
            className="material-symbols-outlined text-outline mb-sm block"
            style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
          >
            groups
          </span>
          <h2 className="text-headline-sm text-on-surface mb-xs">Nenhuma turma ainda</h2>
          <p className="text-body-md text-on-surface-variant mb-lg max-w-sm mx-auto">
            {isTeacher
              ? 'Crie sua primeira turma para adicionar disciplinas e convidar seus alunos.'
              : 'Você ainda não participa de nenhuma turma. Peça o link de convite ao seu professor.'}
          </p>
          {isTeacher && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
            >
              <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Criar primeira turma
            </button>
          )}
        </div>
      )}

      {/* Busca + resultados (quando há turmas ou uma busca ativa) */}
      {(classrooms.length > 0 || activeSearch || (loading && page === 1)) && !error && (
        <>
          <div className="relative mb-lg max-w-md">
            <span aria-hidden="true"
              className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              style={{ fontSize: 20 }}
            >
              search
            </span>
            <input aria-label="Buscar turmas pelo nome"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar turmas pelo nome..."
              className="w-full pl-[44px] pr-[44px] py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {loading && (
              <span className="absolute right-md top-1/2 -translate-y-1/2">
                <Spinner className="h-5 w-5 text-primary" />
              </span>
            )}
          </div>

          {loading && classrooms.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[180px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : classrooms.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {classrooms.map((classroom) => (
                  <ClassroomCard
                    key={classroom.id}
                    classroom={classroom}
                    isTeacher={isTeacher}
                    onDelete={() => setDeleteTarget(classroom)}
                  />
                ))}
              </div>
              {meta && <Pagination meta={meta} loading={loading} onPageChange={setPage} />}
            </>
          ) : (
            <p className="text-center text-body-md text-on-surface-variant py-xl">
              Nenhuma turma encontrada para "{activeSearch}".
            </p>
          )}
        </>
      )}

      <CreateClassroomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false)
          navigate(`/classrooms/${created.id}`)
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir turma?"
        description={`"${deleteTarget?.name}" e todos os seus vínculos (alunos, convites e disciplinas) serão removidos.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  )
}

// ─── Classroom Card ───────────────────────────────────────────────────────────

interface ClassroomCardProps {
  classroom: Classroom
  isTeacher: boolean
  onDelete: () => void
}

function ClassroomCard({ classroom, isTeacher, onDelete }: ClassroomCardProps) {
  return (
    <article className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
      {/* Clicar no card equivale a "Abrir turma". */}
      <Link
        to={`/classrooms/${classroom.id}`}
        aria-label={`Abrir turma ${classroom.name}`}
        className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
      />

      <div className="absolute left-0 top-0 w-1 h-full bg-primary pointer-events-none" />

      <div className="flex items-start justify-between mb-md pl-xs">
        <div className="w-10 h-10 rounded-lg bg-primary-container/30 text-primary flex items-center justify-center">
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
            groups
          </span>
        </div>
        <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
          Privada
        </span>
      </div>

      <h3 className="text-headline-sm text-on-surface mb-xs pl-xs group-hover:text-primary transition-colors line-clamp-2">
        {classroom.name}
      </h3>

      {classroom.description && (
        <p className="text-body-md text-on-surface-variant pl-xs flex-1 line-clamp-3 mb-md">
          {classroom.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-sm mt-auto pt-md border-t border-outline-variant pl-xs">
        <Link
          to={`/classrooms/${classroom.id}`}
          className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>meeting_room</span>
          Abrir turma
        </Link>
        <span className="text-label-sm text-on-surface-variant ml-auto">{formatDate(classroom.createdAt)}</span>
        {isTeacher && (
          <button
            onClick={onDelete}
            className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-secondary hover:bg-error-container/30 transition-colors"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            Excluir
          </button>
        )}
      </div>
    </article>
  )
}

// ─── Create Classroom Modal ───────────────────────────────────────────────────

function CreateClassroomModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (c: Classroom) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Informe o nome da turma.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const created = await createClassroom({ name: name.trim(), description: description.trim() || undefined })
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar turma.')
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
          <h2 className="text-headline-sm text-on-surface">Nova turma</h2>
          <button
            type="button"
            onClick={onClose} aria-label="Fechar"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <label className="flex flex-col gap-xs">
          <span className="text-label-lg text-on-surface-variant">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Programação Web - 2026.1"
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
            placeholder="Sobre o que é esta turma..."
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
          />
        </label>

        {error && <p className="text-body-md text-error">{error}</p>}

        <div className="flex gap-sm justify-end pt-xs">
          <button
            type="button"
            onClick={onClose} aria-label="Fechar"
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
            Criar turma
          </button>
        </div>
      </form>
    </div>
  )
}
