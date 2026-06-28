import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserProfile, type Subject, type UserProfile } from './profile.service'
import AppLayout from '../../components/layouts/AppLayout'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwner = authUser?.username === username

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError('')
    getUserProfile(username)
      .then(setProfile)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao carregar perfil.'))
      .finally(() => setLoading(false))
  }, [username])

  return (
    <AppLayout>
      {loading && (
        <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
          <Spinner className="h-5 w-5" />
          <span className="text-body-md">Carregando perfil...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-xl">
          <span
            className="material-symbols-outlined text-outline block mb-sm"
            style={{ fontSize: 48 }}
          >
            person_off
          </span>
          <h2 className="text-headline-sm text-on-surface mb-xs">Perfil não encontrado</h2>
          <p className="text-body-md text-on-surface-variant">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <>
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-lg mb-xl pb-xl border-b border-outline-variant">
            <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}
              >
                {profile.role === 'TEACHER' ? 'school' : 'person'}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-sm mb-xs">
                <h1 className="text-headline-lg text-on-surface">@{profile.username}</h1>
                <span
                  className={`flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium ${
                    profile.role === 'TEACHER'
                      ? 'bg-primary-container/30 text-primary'
                      : 'bg-tertiary-fixed/30 text-tertiary'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {profile.role === 'TEACHER' ? 'school' : 'person'}
                  </span>
                  {profile.role === 'TEACHER' ? 'Professor' : 'Aluno'}
                </span>
              </div>

              <p className="text-body-md text-on-surface-variant">
                {profile.subjects.length}{' '}
                {profile.subjects.length === 1 ? 'disciplina pública' : 'disciplinas públicas'}
                {isOwner && ' (você pode ver as privadas também)'}
              </p>
            </div>

            {isOwner && profile.role === 'TEACHER' && (
              <Link
                to="/subjects/new"
                className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all self-start"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                Nova Disciplina
              </Link>
            )}
          </div>

          {/* Subjects */}
          <div>
            <h2 className="text-headline-sm text-on-surface mb-lg">
              {profile.role === 'TEACHER' ? 'Disciplinas' : 'Informações'}
            </h2>

            {profile.subjects.length === 0 ? (
              <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
                <span
                  className="material-symbols-outlined text-outline block mb-sm"
                  style={{ fontSize: 48 }}
                >
                  menu_book
                </span>
                <p className="text-body-md text-on-surface-variant">
                  {isOwner
                    ? profile.role === 'TEACHER'
                      ? 'Você ainda não criou nenhuma disciplina.'
                      : 'Você ainda não tem disciplinas públicas.'
                    : 'Este professor não tem disciplinas públicas.'}
                </p>
                {isOwner && profile.role === 'TEACHER' && (
                  <Link
                    to="/subjects/new"
                    className="inline-flex items-center gap-sm mt-lg bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    Criar disciplina
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {profile.subjects.map((subject) => (
                  <PublicSubjectCard key={subject.id} subject={subject} isOwner={isOwner} ownerUsername={profile.username} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}

// ─── Public Subject Card ──────────────────────────────────────────────────────

function PublicSubjectCard({
  subject,
  isOwner,
  ownerUsername,
}: {
  subject: Subject
  isOwner: boolean
  ownerUsername: string
}) {
  return (
    <article className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
      <div className={`absolute left-0 top-0 w-1 h-full ${subject.isPublic ? 'bg-primary' : 'bg-outline'}`} />

      <div className="flex items-start justify-between mb-md pl-xs">
        <div className="w-10 h-10 rounded-lg bg-primary-container/30 text-primary flex items-center justify-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
          >
            menu_book
          </span>
        </div>

        {!subject.isPublic && isOwner && (
          <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
            Privada
          </span>
        )}
      </div>

      <h3 className="text-headline-sm text-on-surface mb-xs pl-xs group-hover:text-primary transition-colors line-clamp-2">
        {subject.name}
      </h3>

      {subject.description && (
        <p className="text-body-md text-on-surface-variant pl-xs flex-1 line-clamp-3">
          {subject.description}
        </p>
      )}

      <div className="flex flex-wrap gap-sm mt-lg pt-md border-t border-outline-variant pl-xs">
        <Link
          to={`/subjects/${subject.id}`}
          state={{ subject: { ...subject, teacherUsername: ownerUsername } }}
          className="flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Ver arquivos
        </Link>
        {isOwner && (
          <Link
            to={`/subjects/${subject.id}/edit`}
            className="flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-primary hover:bg-primary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            Editar
          </Link>
        )}
      </div>
    </article>
  )
}
