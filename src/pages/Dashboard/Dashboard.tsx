import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import AppLayout from '../../components/layouts/AppLayout'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { deleteSubject, listSubjects, type Subject } from './dashboard.service'

const PAGE_LIMIT = 9

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const {
    items: subjects,
    meta,
    loading,
    error,
    search,
    setSearch,
    activeSearch,
    setPage,
    reload,
    reloadAfterRemove,
    page,
  } = usePaginatedList((page, limit, search) => listSubjects(page, limit, search), {
    limit: PAGE_LIMIT,
  })

  // delete modal
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSubject(deleteTarget.id)
      setDeleteTarget(null)
      reloadAfterRemove()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir disciplina.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="text-headline-lg text-on-surface">Minhas Disciplinas</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Gerencie os materiais das suas disciplinas, @{user?.username}
          </p>
        </div>
        <Link
          to="/subjects/new"
          className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold shadow-sm hover:shadow-md hover:opacity-90 active:scale-[0.98] transition-all self-start sm:self-auto"
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          Nova Disciplina
        </Link>
      </div>

      {/* Error */}
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

      {/* Empty state: nenhuma disciplina e sem busca ativa */}
      {!loading && !error && subjects.length === 0 && !activeSearch && (
        <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
          <span aria-hidden="true"
            className="material-symbols-outlined text-outline mb-sm block"
            style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
          >
            menu_book
          </span>
          <h2 className="text-headline-sm text-on-surface mb-xs">Nenhuma disciplina ainda</h2>
          <p className="text-body-md text-on-surface-variant mb-lg max-w-xs mx-auto">
            Crie sua primeira disciplina para organizar e compartilhar materiais com seus alunos.
          </p>
          <Link
            to="/subjects/new"
            className="inline-flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Criar primeira disciplina
          </Link>
        </div>
      )}

      {/* Busca + resultados (quando há disciplinas ou uma busca ativa) */}
      {(subjects.length > 0 || activeSearch || (loading && page === 1)) && !error && (
        <>
          <div className="relative mb-lg max-w-md">
            <span aria-hidden="true"
              className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              style={{ fontSize: 20 }}
            >
              search
            </span>
            <input aria-label="Buscar disciplinas pelo nome"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar disciplinas pelo nome..."
              className="w-full pl-[44px] pr-[44px] py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {loading && (
              <span className="absolute right-md top-1/2 -translate-y-1/2">
                <Spinner className="h-5 w-5 text-primary" />
              </span>
            )}
          </div>

          {loading && subjects.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[180px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : subjects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {subjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onEdit={() => navigate(`/subjects/${subject.id}/edit`)}
                    onDelete={() => setDeleteTarget(subject)}
                    username={user?.username ?? ''}
                  />
                ))}
              </div>
              {meta && <Pagination meta={meta} loading={loading} onPageChange={setPage} />}
            </>
          ) : (
            <p className="text-center text-body-md text-on-surface-variant py-xl">
              Nenhuma disciplina encontrada para "{activeSearch}".
            </p>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir disciplina?"
        description={`"${deleteTarget?.name}" e todos os seus arquivos serão removidos permanentemente.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  )
}

// ─── Subject Card ─────────────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: Subject
  username: string
  onEdit: () => void
  onDelete: () => void
}

function SubjectCard({ subject, username, onEdit, onDelete }: SubjectCardProps) {
  return (
    <article className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
      {/* Clicar em qualquer ponto do card faz o mesmo que "Arquivos". Os botões da
          barra de ações sobem de camada (z-10) para continuarem alcançáveis. */}
      <Link
        to={`/subjects/${subject.id}`}
        state={{ subject: { ...subject, teacherUsername: username } }}
        aria-label={`Abrir arquivos de ${subject.name}`}
        className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
      />

      {/* Color accent bar */}
      <div className={`absolute left-0 top-0 w-1 h-full pointer-events-none ${subject.isPublic ? 'bg-primary' : 'bg-outline'}`} />

      <div className="flex items-start justify-between mb-md pl-xs">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            subject.isPublic ? 'bg-primary-container/30 text-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <span aria-hidden="true"
            className="material-symbols-outlined"
            style={{ fontSize: 22, fontVariationSettings: subject.isPublic ? "'FILL' 1" : "'FILL' 0" }}
          >
            {subject.isPublic ? 'menu_book' : 'lock'}
          </span>
        </div>

        <span
          className={`flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium ${
            subject.isPublic
              ? 'bg-primary-container/20 text-primary'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 12 }}>
            {subject.isPublic ? 'public' : 'lock'}
          </span>
          {subject.isPublic ? 'Pública' : 'Privada'}
        </span>
      </div>

      <h3 className="text-headline-sm text-on-surface mb-xs pl-xs group-hover:text-primary transition-colors line-clamp-2">
        {subject.name}
      </h3>

      {subject.description && (
        <p className="text-body-md text-on-surface-variant pl-xs flex-1 line-clamp-3 mb-md">
          {subject.description}
        </p>
      )}

      <div className="flex flex-wrap gap-sm mt-auto pt-md border-t border-outline-variant pl-xs">
        <Link
          to={`/subjects/${subject.id}`}
          state={{ subject: { ...subject, teacherUsername: username } }}
          className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Arquivos
        </Link>
        <button
          onClick={onEdit}
          className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-primary hover:bg-primary-container/20 transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Editar
        </button>
        <button
          onClick={onDelete}
          className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-secondary hover:bg-error-container/30 transition-colors ml-auto"
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          Excluir
        </button>
      </div>
    </article>
  )
}
