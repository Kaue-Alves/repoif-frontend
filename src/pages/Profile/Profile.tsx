import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserProfile, type Subject, type UserProfile } from './profile.service'
import AppLayout from '../../components/layouts/AppLayout'
import ReportModal from '../../components/ReportModal'
import Spinner from '../../components/Spinner'
import TeacherDirectory from '../../components/TeacherDirectory'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_BADGE_CLASSES, ROLE_ICONS, ROLE_LABELS } from '../../utils/roles'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportOpen, setReportOpen] = useState(false)

  const isOwner = authUser?.username === username
  const canReport = !!authUser && !isOwner

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

      {!loading && profile && (() => {
        // A API pode não retornar `subjects` (ex.: perfis de aluno); normaliza para lista vazia.
        const subjects = profile.subjects ?? []
        return (
        <>
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-lg mb-xl pb-xl border-b border-outline-variant">
            <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}
              >
                {ROLE_ICONS[profile.role]}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-sm mb-xs">
                <h1 className="text-headline-lg text-on-surface">@{profile.username}</h1>
                <span
                  className={`flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium ${ROLE_BADGE_CLASSES[profile.role]}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {ROLE_ICONS[profile.role]}
                  </span>
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>

              {profile.role === 'TEACHER' && (
                <p className="text-body-md text-on-surface-variant">
                  {subjects.length}{' '}
                  {subjects.length === 1 ? 'disciplina pública' : 'disciplinas públicas'}
                  {isOwner && ' (você pode ver as privadas também)'}
                </p>
              )}
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

            {canReport && (
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-sm border border-outline-variant text-on-surface-variant px-lg py-sm rounded-xl text-label-lg font-medium hover:bg-error-container/40 hover:text-on-error-container hover:border-error/40 transition-all self-start"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
                Denunciar
              </button>
            )}
          </div>

          {/* Seção principal por papel. Alunos não têm disciplinas — participam de
              turmas — então o perfil deles nunca exibe uma seção de disciplinas. */}
          {profile.role === 'TEACHER' && (
            <div>
              <h2 className="text-headline-sm text-on-surface mb-lg">Disciplinas</h2>

              {subjects.length === 0 ? (
                <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
                  <span
                    className="material-symbols-outlined text-outline block mb-sm"
                    style={{ fontSize: 48 }}
                  >
                    menu_book
                  </span>
                  <p className="text-body-md text-on-surface-variant">
                    {isOwner
                      ? 'Você ainda não criou nenhuma disciplina.'
                      : 'Este professor ainda não tem disciplinas públicas.'}
                  </p>
                  {isOwner && (
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
                  {subjects.map((subject) => (
                    <PublicSubjectCard key={subject.id} subject={subject} isOwner={isOwner} ownerUsername={profile.username} />
                  ))}
                </div>
              )}
            </div>
          )}

          {profile.role === 'STUDENT' &&
            (isOwner ? (
              <div>
                <h2 className="text-headline-sm text-on-surface mb-lg">Encontre professores</h2>
                <TeacherDirectory />
              </div>
            ) : (
              <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
                <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>
                  school
                </span>
                <p className="text-body-md text-on-surface-variant">
                  @{profile.username} é aluno e participa de turmas por convite dos professores.
                </p>
              </div>
            ))}

          {profile.role === 'ADMIN' && isOwner && (
            <Link
              to="/admin"
              className="flex items-center gap-md p-lg bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container-low hover:border-primary/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: 26 }}>
                  admin_panel_settings
                </span>
              </div>
              <div className="flex-1">
                <p className="text-label-lg text-on-surface group-hover:text-primary transition-colors">
                  Painel de administração
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Gerencie usuários, arquivos e denúncias.
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" style={{ fontSize: 20 }}>
                chevron_right
              </span>
            </Link>
          )}
        </>
        )
      })()}

      {profile && (
        <ReportModal
          open={reportOpen}
          targetType="USER"
          targetUserId={profile.id}
          targetLabel={`@${profile.username}`}
          onClose={() => setReportOpen(false)}
        />
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
      {/* Clicar no card equivale a "Ver arquivos". */}
      <Link
        to={`/subjects/${subject.id}`}
        state={{ subject: { ...subject, teacherUsername: ownerUsername } }}
        aria-label={`Ver arquivos de ${subject.name}`}
        className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
      />

      <div className={`absolute left-0 top-0 w-1 h-full pointer-events-none ${subject.isPublic ? 'bg-primary' : 'bg-outline'}`} />

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
          className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Ver arquivos
        </Link>
        {isOwner && (
          <Link
            to={`/subjects/${subject.id}/edit`}
            className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-primary hover:bg-primary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            Editar
          </Link>
        )}
      </div>
    </article>
  )
}
