import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import AppLayout from '../../components/layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'
import { deleteSubject, getSubjects, type Subject } from './dashboard.service'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // delete modal
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    setLoading(true)
    setError('')
    try {
      const data = await getSubjects()
      setSubjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar disciplinas.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSubject(deleteTarget.id)
      setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir disciplina.')
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
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          Nova Disciplina
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-body-md">Carregando disciplinas...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-xl px-md py-sm text-body-md mb-lg">
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
          {error}
          <button onClick={fetchSubjects} className="ml-auto text-label-lg underline hover:no-underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && subjects.length === 0 && (
        <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
          <span
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Criar primeira disciplina
          </Link>
        </div>
      )}

      {/* Subject Grid */}
      {!loading && subjects.length > 0 && (
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
      {/* Color accent bar */}
      <div className={`absolute left-0 top-0 w-1 h-full ${subject.isPublic ? 'bg-primary' : 'bg-outline'}`} />

      <div className="flex items-start justify-between mb-md pl-xs">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            subject.isPublic ? 'bg-primary-container/30 text-primary' : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          <span
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
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
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
          className="flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Arquivos
        </Link>
        <button
          onClick={onEdit}
          className="flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-primary hover:bg-primary-container/20 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Editar
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-secondary hover:bg-error-container/30 transition-colors ml-auto"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          Excluir
        </button>
      </div>
    </article>
  )
}
