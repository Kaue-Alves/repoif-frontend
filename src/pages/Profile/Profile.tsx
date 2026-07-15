import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  changePassword,
  getUserProfile,
  updateProfile,
  type ProfileStats,
  type Subject,
  type UserProfile,
} from './profile.service'
import AppLayout from '../../components/layouts/AppLayout'
import Field from '../../components/Field'
import ReportModal from '../../components/ReportModal'
import Spinner from '../../components/Spinner'
import TeacherDirectory from '../../components/TeacherDirectory'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ROLE_BADGE_CLASSES, ROLE_ICONS, ROLE_LABELS } from '../../utils/roles'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const showToast = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

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
          <span aria-hidden="true"
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
        const visibleSubjectLabel =
          isOwner
            ? (subjects.length === 1 ? 'disciplina' : 'disciplinas')
            : (subjects.length === 1 ? 'disciplina acessível' : 'disciplinas acessíveis')
        return (
        <>
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-lg mb-xl pb-xl border-b border-outline-variant">
            <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
              <span aria-hidden="true"
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}
              >
                {ROLE_ICONS[profile.role]}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-sm mb-xs">
                {/* Sem nome preenchido, o @username assume o papel de título — a alternativa
                    seria um cabeçalho vazio. */}
                <h1 className="text-headline-lg text-on-surface">
                  {profile.name?.trim() || `@${profile.username}`}
                </h1>
                <span
                  className={`flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium ${ROLE_BADGE_CLASSES[profile.role]}`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {ROLE_ICONS[profile.role]}
                  </span>
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>

              {profile.name?.trim() && (
                <p className="text-body-md text-on-surface-variant">@{profile.username}</p>
              )}

              {profile.role === 'TEACHER' && (
                <p className="text-body-md text-on-surface-variant">
                  {subjects.length} {visibleSubjectLabel}
                  {isOwner && ' (você pode ver as privadas também)'}
                </p>
              )}
            </div>

            {isOwner && (
              <div className="flex flex-wrap gap-sm self-start">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-sm border border-outline-variant text-on-surface px-lg py-sm rounded-xl text-label-lg font-medium hover:bg-surface-container-low transition-all"
                >
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  Editar perfil
                </button>
                <button
                  onClick={() => setPasswordOpen(true)}
                  className="flex items-center gap-sm border border-outline-variant text-on-surface px-lg py-sm rounded-xl text-label-lg font-medium hover:bg-surface-container-low transition-all"
                >
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_reset</span>
                  Alterar senha
                </button>
              </div>
            )}

            {isOwner && profile.role === 'TEACHER' && (
              <Link
                to="/subjects/new"
                className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all self-start"
              >
                <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                Nova Disciplina
              </Link>
            )}

            {canReport && (
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-sm border border-outline-variant text-on-surface-variant px-lg py-sm rounded-xl text-label-lg font-medium hover:bg-error-container/40 hover:text-on-error-container hover:border-error/40 transition-all self-start"
              >
                <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
                Denunciar
              </button>
            )}
          </div>

          {profile.stats && <StatsRow stats={profile.stats} />}

          {/* Seção principal por papel. Alunos não têm disciplinas — participam de
              turmas — então o perfil deles nunca exibe uma seção de disciplinas. */}
          {profile.role === 'TEACHER' && (
            <div>
              <h2 className="text-headline-sm text-on-surface mb-lg">Disciplinas</h2>

              {subjects.length === 0 ? (
                <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
                  <span aria-hidden="true"
                    className="material-symbols-outlined text-outline block mb-sm"
                    style={{ fontSize: 48 }}
                  >
                    menu_book
                  </span>
                  <p className="text-body-md text-on-surface-variant">
                    {isOwner
                      ? 'Você ainda não criou nenhuma disciplina.'
                      : 'Este professor ainda não tem disciplinas disponíveis para você.'}
                  </p>
                  {isOwner && (
                    <Link
                      to="/subjects/new"
                      className="inline-flex items-center gap-sm mt-lg bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
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
                <span aria-hidden="true" className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>
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
                <span aria-hidden="true" className="material-symbols-outlined text-secondary" style={{ fontSize: 26 }}>
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
              <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" style={{ fontSize: 20 }}>
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

      {profile && editOpen && (
        <EditProfileModal
          currentName={profile.name ?? ''}
          username={profile.username}
          onClose={() => setEditOpen(false)}
          onSaved={(name) => {
            setProfile((p) => (p ? { ...p, name } : p))
            setEditOpen(false)
            showToast('Perfil atualizado.')
          }}
        />
      )}

      {passwordOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordOpen(false)}
          onSaved={() => {
            setPasswordOpen(false)
            showToast('Senha alterada com sucesso.')
          }}
        />
      )}
    </AppLayout>
  )
}

// ─── Contadores de atividade ──────────────────────────────────────────────────

/**
 * Exaustivo por papel: cada papel tem contadores próprios, e o `switch` sobre o tipo
 * discriminado quebra a compilação se um papel novo entrar sem tratamento.
 */
function StatsRow({ stats }: { stats: ProfileStats }) {
  const cards: { icon: string; value: number; label: string }[] = (() => {
    switch (stats.role) {
      case 'TEACHER':
        return [
          { icon: 'menu_book', value: stats.subjects, label: stats.subjects === 1 ? 'disciplina' : 'disciplinas' },
          { icon: 'groups', value: stats.classrooms, label: stats.classrooms === 1 ? 'turma' : 'turmas' },
          { icon: 'folder', value: stats.materials, label: stats.materials === 1 ? 'material' : 'materiais' },
          { icon: 'assignment', value: stats.assignments, label: stats.assignments === 1 ? 'trabalho' : 'trabalhos' },
        ]
      case 'STUDENT':
        return [
          { icon: 'groups', value: stats.classrooms, label: stats.classrooms === 1 ? 'turma' : 'turmas' },
          { icon: 'task_alt', value: stats.submissions, label: stats.submissions === 1 ? 'entrega' : 'entregas' },
          {
            icon: 'pending_actions',
            value: stats.pendingAssignments,
            label: stats.pendingAssignments === 1 ? 'trabalho pendente' : 'trabalhos pendentes',
          },
        ]
      case 'ADMIN':
        // O admin não tem disciplina nem turma; contadores aqui seriam sempre zero.
        return []
    }
  })()

  if (cards.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex items-center gap-md"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-container/30 text-primary flex items-center justify-center flex-shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {card.icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-headline-sm text-on-surface">{card.value}</p>
            <p className="text-label-sm text-on-surface-variant truncate">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Modais do próprio perfil ─────────────────────────────────────────────────

const inputClass =
  'w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

function ModalShell({
  title,
  onClose,
  disabled,
  children,
  onSubmit,
}: {
  title: string
  onClose: () => void
  disabled: boolean
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!disabled) onClose()
        }}
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            disabled={disabled}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-60"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        {children}
      </form>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md"
    >
      <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
      {message}
    </div>
  )
}

function EditProfileModal({
  currentName,
  username,
  onClose,
  onSaved,
}: {
  currentName: string
  username: string
  onClose: () => void
  onSaved: (name: string | null) => void
}) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const atualizado = await updateProfile(name.trim())
      onSaved(atualizado.name ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Editar perfil" onClose={onClose} disabled={saving} onSubmit={handleSubmit}>
      <Field label="Nome de exibição" hint="Opcional">
        {(id) => (
          <>
            <input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Kauê Alves S."
              maxLength={120}
              autoFocus
              className={inputClass}
            />
            <p className="text-label-sm text-on-surface-variant mt-xs">
              Deixe em branco para exibir apenas @{username}.
            </p>
          </>
        )}
      </Field>

      {/* Explicita por que o @ não está aqui — senão parece esquecimento. */}
      <p className="text-label-sm text-on-surface-variant">
        O nome de usuário <strong className="text-on-surface">@{username}</strong> identifica sua conta
        e não pode ser alterado: ele está no endereço do seu perfil.
      </p>

      {error && <ErrorBox message={error} />}

      <div className="flex justify-end gap-sm">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-lg py-sm rounded-xl text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-sm px-lg py-sm rounded-xl text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-60"
        >
          {saving && <Spinner className="h-4 w-4" />}
          Salvar
        </button>
      </div>
    </ModalShell>
  )
}

function ChangePasswordModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Conferir aqui evita uma ida ao servidor para um erro que o cliente já enxerga.
    if (next !== confirm) {
      setError('A confirmação não confere com a nova senha.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await changePassword(current, next)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar a senha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Alterar senha" onClose={onClose} disabled={saving} onSubmit={handleSubmit}>
      <Field label="Senha atual">
        {(id) => (
          <input
            id={id}
            type={show ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
            autoFocus
            className={inputClass}
          />
        )}
      </Field>

      <Field label="Nova senha">
        {(id) => (
          <input
            id={id}
            type={show ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            autoComplete="new-password"
            required
            className={inputClass}
          />
        )}
      </Field>

      <Field label="Confirmar nova senha">
        {(id) => (
          <input
            id={id}
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            className={inputClass}
          />
        )}
      </Field>

      <label className="flex items-center gap-xs text-label-lg text-on-surface-variant cursor-pointer select-none">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        Mostrar senhas
      </label>

      {error && <ErrorBox message={error} />}

      <div className="flex justify-end gap-sm">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-lg py-sm rounded-xl text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-sm px-lg py-sm rounded-xl text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-60"
        >
          {saving && <Spinner className="h-4 w-4" />}
          Salvar nova senha
        </button>
      </div>
    </ModalShell>
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
          <span aria-hidden="true"
            className="material-symbols-outlined"
            style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
          >
            menu_book
          </span>
        </div>

        {!subject.isPublic && (
          <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
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
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Ver arquivos
        </Link>
        {isOwner && (
          <Link
            to={`/subjects/${subject.id}/edit`}
            className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-primary hover:bg-primary-container/20 transition-colors"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            Editar
          </Link>
        )}
      </div>
    </article>
  )
}
