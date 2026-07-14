import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import BackLink from '../../components/BackLink'
import ConfirmModal from '../../components/ConfirmModal'
import QrFullscreenOverlay from '../../components/QrFullscreenOverlay'
import AppLayout from '../../components/layouts/AppLayout'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { usePaginatedList } from '../../hooks/usePaginatedList'
import { getSubjects, type Subject } from '../Dashboard/dashboard.service'
import {
  acceptClassroomRequest,
  addClassroomMember,
  addClassroomSubject,
  createClassroomInvite,
  DEFAULT_INVITE_TTL_MINUTES,
  getClassroom,
  getClassroomMembers,
  getClassroomRequests,
  getClassroomSubjects,
  INVITE_TTL_OPTIONS,
  rejectClassroomRequest,
  removeClassroomMember,
  removeClassroomSubject,
  type Classroom,
  type ClassroomInvite,
  type ClassroomMember,
  type ClassroomSubject,
} from './classrooms.service'

type Tab = 'subjects' | 'members' | 'requests' | 'invite'

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // A aba vive na URL: sobrevive a F5, é compartilhável e o voltar do navegador
  // volta de aba em vez de sair da página.
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab | null) ?? 'subjects'

  const isOwner = !!classroom && !!user && classroom.teacherId === user.sub

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    getClassroom(id)
      .then(setClassroom)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao carregar turma.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
          <Spinner className="h-5 w-5" />
          <span className="text-body-md">Carregando turma...</span>
        </div>
      </AppLayout>
    )
  }

  if (error || !classroom || !id) {
    return (
      <AppLayout>
        <div className="text-center py-xl">
          <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>
            meeting_room
          </span>
          <h2 className="text-headline-sm text-on-surface mb-xs">Turma indisponível</h2>
          <p className="text-body-md text-on-surface-variant mb-lg">{error || 'Turma não encontrada.'}</p>
          <Link
            to="/classrooms"
            className="inline-flex items-center gap-sm text-label-lg text-primary hover:underline"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Voltar para turmas
          </Link>
        </div>
      </AppLayout>
    )
  }

  const tabs: { key: Tab; label: string; icon: string; ownerOnly?: boolean }[] = [
    { key: 'subjects', label: 'Disciplinas', icon: 'menu_book' },
    { key: 'members', label: 'Alunos', icon: 'group', ownerOnly: true },
    { key: 'requests', label: 'Pedidos', icon: 'how_to_reg', ownerOnly: true },
    { key: 'invite', label: 'Convidar', icon: 'link', ownerOnly: true },
  ]
  const visibleTabs = tabs.filter((t) => !t.ownerOnly || isOwner)
  const activeTab = visibleTabs.some((t) => t.key === tab) ? tab : 'subjects'

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-lg">
        <BackLink fallbackTo="/classrooms" fallbackLabel="Turmas" className="mb-md" />
        <div className="flex items-start gap-md">
          <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }}
            >
              groups
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-sm">
              <h1 className="text-headline-lg text-on-surface">{classroom.name}</h1>
              <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
                Privada
              </span>
            </div>
            {classroom.description && (
              <p className="text-body-md text-on-surface-variant mt-xs">{classroom.description}</p>
            )}
            {!isOwner && (
              <p className="text-label-sm text-on-surface-variant mt-xs">Você participa desta turma como aluno.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-xs border-b border-outline-variant mb-lg overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ tab: t.key })}
            className={`flex items-center gap-xs px-md py-sm text-label-lg whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'subjects' && <SubjectsTab classroomId={id} isOwner={isOwner} />}
      {activeTab === 'members' && isOwner && <MembersTab classroomId={id} />}
      {activeTab === 'requests' && isOwner && <RequestsTab classroomId={id} />}
      {activeTab === 'invite' && isOwner && <InviteTab classroomId={id} />}
    </AppLayout>
  )
}

// ─── Tab: Disciplinas ──────────────────────────────────────────────────────────

const SUBJECTS_PAGE_LIMIT = 9

function SubjectsTab({ classroomId, isOwner }: { classroomId: string; isOwner: boolean }) {
  const showToast = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<ClassroomSubject | null>(null)
  const [removing, setRemoving] = useState(false)

  const {
    items: subjects,
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
  } = usePaginatedList(
    (page, limit, search) => getClassroomSubjects(classroomId, page, limit, search),
    { limit: SUBJECTS_PAGE_LIMIT, deps: [classroomId] },
  )

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removeClassroomSubject(classroomId, removeTarget.id)
      setRemoveTarget(null)
      reloadAfterRemove()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover disciplina.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      {isOwner && (
        <div className="flex justify-end mb-lg">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Adicionar disciplina
          </button>
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="flex items-start gap-sm bg-error-container text-on-error-container rounded-xl px-md py-sm text-body-md mb-lg"
        >
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
          {error}
          <button onClick={reload} className="ml-auto text-label-lg underline hover:no-underline">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty: nenhuma disciplina e sem busca ativa */}
      {!loading && !error && subjects.length === 0 && !activeSearch && (
        <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>menu_book</span>
          <p className="text-body-md text-on-surface-variant">
            {isOwner ? 'Nenhuma disciplina vinculada a esta turma ainda.' : 'Nenhuma disciplina disponível ainda.'}
          </p>
        </div>
      )}

      {/* Busca + resultados */}
      {(subjects.length > 0 || activeSearch || (loading && page === 1)) && !error && (
        <>
          <div className="relative mb-lg max-w-md">
            <span
              className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              style={{ fontSize: 20 }}
            >
              search
            </span>
            <input
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
            <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
              <Spinner className="h-5 w-5" />
              <span className="text-body-md">Carregando...</span>
            </div>
          ) : subjects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {subjects.map((subject) => (
                  <article
                    key={subject.id}
                    className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden"
                  >
                    {/* Clicar no card equivale a "Arquivos". */}
                    <Link
                      to={`/subjects/${subject.id}`}
                      aria-label={`Abrir arquivos de ${subject.name}`}
                      className="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <div className="absolute left-0 top-0 w-1 h-full bg-primary pointer-events-none" />
                    <div className="flex items-start justify-between mb-md pl-xs">
                      <div className="w-10 h-10 rounded-lg bg-primary-container/30 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                          menu_book
                        </span>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => setRemoveTarget(subject)}
                          title="Remover da turma"
                          className="relative z-10 w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                        </button>
                      )}
                    </div>
                    <h3 className="text-headline-sm text-on-surface mb-xs pl-xs line-clamp-2">{subject.name}</h3>
                    {subject.description && (
                      <p className="text-body-md text-on-surface-variant pl-xs flex-1 line-clamp-3">{subject.description}</p>
                    )}
                    <div className="flex mt-lg pt-md border-t border-outline-variant pl-xs">
                      <Link
                        to={`/subjects/${subject.id}`}
                        className="relative z-10 flex items-center gap-xs px-sm py-xs rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
                        {isOwner ? 'Arquivos' : 'Ver arquivos'}
                      </Link>
                    </div>
                  </article>
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

      {isOwner && (
        <AddSubjectModal
          open={addOpen}
          classroomId={classroomId}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false)
            reload()
          }}
        />
      )}

      <ConfirmModal
        open={!!removeTarget}
        title="Remover disciplina da turma?"
        description={`"${removeTarget?.name}" deixará de aparecer para os alunos desta turma. A disciplina em si não será excluída.`}
        confirmLabel="Remover"
        danger
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

function AddSubjectModal({
  open,
  classroomId,
  onClose,
  onAdded,
}: {
  open: boolean
  classroomId: string
  onClose: () => void
  onAdded: (s: ClassroomSubject) => void
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [mySubjects, setMySubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectsError, setSubjectsError] = useState('')
  const [subjectsReload, setSubjectsReload] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedId('')
    setSubjectsError('')
    setLoadingSubjects(true)
    let cancelled = false
    // Busca TODOS os vínculos da turma (não só a página visível) para não oferecer
    // no select disciplinas que já estão vinculadas. Falha vira erro visível — uma
    // lista vazia aqui induziria o professor a recriar uma disciplina que já existe.
    Promise.all([getSubjects(), getClassroomSubjects(classroomId, 1, 100)])
      .then(([mine, linked]) => {
        if (cancelled) return
        const linkedIds = new Set(linked.data.map((s) => s.id))
        setMySubjects(mine.filter((s) => !linkedIds.has(s.id)))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setMySubjects([])
        setSubjectsError(err instanceof Error ? err.message : 'Erro ao carregar suas disciplinas.')
      })
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, classroomId, subjectsReload])

  useEffect(() => {
    if (open) {
      setMode('existing')
      setName('')
      setDescription('')
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      setSaving(true)
      let created: ClassroomSubject
      if (mode === 'existing') {
        if (!selectedId) {
          setError('Selecione uma disciplina.')
          setSaving(false)
          return
        }
        created = await addClassroomSubject(classroomId, { subjectId: selectedId })
      } else {
        if (!name.trim()) {
          setError('Informe o nome da disciplina.')
          setSaving(false)
          return
        }
        created = await addClassroomSubject(classroomId, {
          name: name.trim(),
          description: description.trim() || undefined,
        })
      }
      onAdded(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar disciplina.')
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
          <h2 className="text-headline-sm text-on-surface">Adicionar disciplina</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-xs p-xs bg-surface-container-high rounded-lg">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 py-xs rounded-md text-label-lg transition-colors ${
              mode === 'existing' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Existente
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-xs rounded-md text-label-lg transition-colors ${
              mode === 'new' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            Criar nova
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="flex flex-col gap-xs">
            <span className="text-label-lg text-on-surface-variant">Suas disciplinas</span>
            {loadingSubjects ? (
              <div className="flex items-center gap-sm text-on-surface-variant py-sm">
                <Spinner className="h-4 w-4" /> Carregando...
              </div>
            ) : subjectsError ? (
              <div role="alert" className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
                {subjectsError}
                <button
                  type="button"
                  onClick={() => setSubjectsReload((k) => k + 1)}
                  className="ml-auto text-label-lg underline hover:no-underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : mySubjects.length === 0 ? (
              <p className="text-body-md text-on-surface-variant py-sm">
                Nenhuma disciplina disponível para vincular. Use "Criar nova".
              </p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Selecione...</option>
                {mySubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-xs">
              <span className="text-label-lg text-on-surface-variant">Nome</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Estruturas de Dados"
                autoFocus
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label-lg text-on-surface-variant">Descrição (opcional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              />
            </label>
          </>
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
            Adicionar
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Tab: Alunos ────────────────────────────────────────────────────────────────

function MembersTab({ classroomId }: { classroomId: string }) {
  const showToast = useToast()
  const [members, setMembers] = useState<ClassroomMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addType, setAddType] = useState<'username' | 'email'>('username')
  const [addValue, setAddValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [removeTarget, setRemoveTarget] = useState<ClassroomMember | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      setMembers(await getClassroomMembers(classroomId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alunos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addValue.trim()) return
    setAdding(true)
    setAddError('')
    try {
      const member = await addClassroomMember(classroomId, { [addType]: addValue.trim() })
      setMembers((prev) => [...prev.filter((m) => m.studentId !== member.studentId), member])
      setAddValue('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erro ao adicionar aluno.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removeClassroomMember(classroomId, removeTarget.studentId)
      setMembers((prev) => prev.filter((m) => m.studentId !== removeTarget.studentId))
      setRemoveTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover aluno.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg">
        <p className="text-label-lg text-on-surface mb-sm">Adicionar aluno</p>
        <div className="flex flex-col sm:flex-row gap-sm">
          <div className="flex gap-xs p-xs bg-surface-container-high rounded-lg">
            <button
              type="button"
              onClick={() => setAddType('username')}
              className={`px-md py-xs rounded-md text-label-lg transition-colors ${
                addType === 'username' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              Usuário
            </button>
            <button
              type="button"
              onClick={() => setAddType('email')}
              className={`px-md py-xs rounded-md text-label-lg transition-colors ${
                addType === 'email' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              Email
            </button>
          </div>
          <input
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            type={addType === 'email' ? 'email' : 'text'}
            placeholder={addType === 'email' ? 'aluno@exemplo.com' : 'nome de usuário'}
            className="flex-1 px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={adding || !addValue.trim()}
            className="flex items-center justify-center gap-sm px-lg py-sm rounded-lg text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
          >
            {adding ? <Spinner className="h-4 w-4" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>}
            Adicionar
          </button>
        </div>
        {addError && <p className="text-body-md text-error mt-sm">{addError}</p>}
      </form>

      {loading && (
        <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
          <Spinner className="h-5 w-5" />
          <span className="text-body-md">Carregando...</span>
        </div>
      )}
      {error && !loading && <p className="text-body-md text-error text-center py-lg">{error}</p>}

      {!loading && !error && members.length === 0 && (
        <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>group</span>
          <p className="text-body-md text-on-surface-variant">Nenhum aluno na turma ainda.</p>
        </div>
      )}

      {!loading && members.length > 0 && (
        <ul className="flex flex-col gap-sm">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                <span className="text-label-lg text-on-primary-container font-bold">
                  {(m.username ?? '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg text-on-surface truncate">@{m.username ?? '—'}</p>
                {m.email && <p className="text-label-sm text-on-surface-variant truncate">{m.email}</p>}
              </div>
              {m.status === 'PENDING' && (
                <span className="flex items-center gap-xs px-sm py-xs rounded-full text-label-sm font-medium bg-tertiary-fixed/30 text-tertiary flex-shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
                  Pendente
                </span>
              )}
              <button
                onClick={() => setRemoveTarget(m)}
                title="Remover da turma"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_remove</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!removeTarget}
        title="Remover aluno?"
        description={`@${removeTarget?.username ?? ''} deixará de ter acesso a esta turma.`}
        confirmLabel="Remover"
        danger
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

// ─── Tab: Pedidos ────────────────────────────────────────────────────────────────

function RequestsTab({ classroomId }: { classroomId: string }) {
  const showToast = useToast()
  const [requests, setRequests] = useState<ClassroomMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      setRequests(await getClassroomRequests(classroomId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(studentId: string) {
    setBusyId(studentId)
    try {
      await acceptClassroomRequest(classroomId, studentId)
      setRequests((prev) => prev.filter((r) => r.studentId !== studentId))
      showToast('Aluno aceito na turma.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao aceitar pedido.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(studentId: string) {
    setBusyId(studentId)
    try {
      await rejectClassroomRequest(classroomId, studentId)
      setRequests((prev) => prev.filter((r) => r.studentId !== studentId))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao recusar pedido.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center py-xl gap-md text-on-surface-variant">
          <Spinner className="h-5 w-5" />
          <span className="text-body-md">Carregando...</span>
        </div>
      )}
      {error && !loading && <p className="text-body-md text-error text-center py-lg">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>how_to_reg</span>
          <p className="text-body-md text-on-surface-variant">
            Nenhum pedido pendente. Alunos que entrarem pelo link de convite aparecerão aqui para aprovação.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <ul className="flex flex-col gap-sm">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl"
            >
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed/40 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 20 }}>schedule</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg text-on-surface truncate">@{r.username ?? '—'}</p>
                {r.email && <p className="text-label-sm text-on-surface-variant truncate">{r.email}</p>}
              </div>
              <div className="flex gap-xs">
                <button
                  onClick={() => handleAccept(r.studentId)}
                  disabled={busyId === r.studentId}
                  className="flex items-center gap-xs px-md py-sm rounded-lg text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {busyId === r.studentId ? <Spinner className="h-4 w-4" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>}
                  Aceitar
                </button>
                <button
                  onClick={() => handleReject(r.studentId)}
                  disabled={busyId === r.studentId}
                  className="flex items-center gap-xs px-md py-sm rounded-lg text-label-lg border border-outline-variant text-on-surface-variant hover:bg-error-container/30 hover:text-on-error-container transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Tab: Convidar ───────────────────────────────────────────────────────────────

/** "6h 04min", "2d 3h", "45min 09s" — a unidade menor some quando não importa mais. */
function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(min).padStart(2, '0')}min`
  return `${min}min ${String(sec).padStart(2, '0')}s`
}

function InviteTab({ classroomId }: { classroomId: string }) {
  const [invite, setInvite] = useState<ClassroomInvite | null>(null)
  const [ttlMinutes, setTtlMinutes] = useState(DEFAULT_INVITE_TTL_MINUTES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!invite) return
    const tick = () => {
      const ms = new Date(invite.expiresAt).getTime() - Date.now()
      setRemaining(ms <= 0 ? 'expirado' : formatRemaining(ms))
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [invite])

  async function generate() {
    setLoading(true)
    setError('')
    setCopied(false)
    setFullscreen(false)
    try {
      setInvite(await createClassroomInvite(classroomId, ttlMinutes))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar convite.')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Não foi possível copiar. Copie o link manualmente.')
    }
  }

  const expired = remaining === 'expirado'

  return (
    <div className="max-w-lg">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <div className="flex items-start gap-md mb-lg">
          <div className="w-10 h-10 rounded-full bg-primary-container/40 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>link</span>
          </div>
          <div>
            <h3 className="text-headline-sm text-on-surface">Link de convite</h3>
            <p className="text-body-md text-on-surface-variant mt-xs">
              O link é temporário — escolha por quanto tempo ele vale. Ao entrar
              por ele, o aluno envia um pedido que você precisa aceitar na aba <strong>Pedidos</strong>.
            </p>
          </div>
        </div>

        {error && <p className="text-body-md text-error mb-md">{error}</p>}

        <label className="flex flex-col gap-xs mb-md max-w-xs">
          <span className="text-label-lg text-on-surface-variant">Validade do link</span>
          <select
            value={ttlMinutes}
            onChange={(e) => setTtlMinutes(Number(e.target.value))}
            disabled={loading}
            className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
          >
            {INVITE_TTL_OPTIONS.map((opt) => (
              <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
            ))}
          </select>
        </label>

        {!invite ? (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-sm px-lg py-sm rounded-xl text-label-lg font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-60"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_link</span>}
            Gerar link de convite
          </button>
        ) : (
          <div className="flex flex-col gap-md">
            <div className="flex items-center gap-sm">
              <input
                readOnly
                value={invite.inviteUrl}
                className={`flex-1 px-md py-sm bg-surface-container-high border border-outline-variant rounded-lg text-body-md text-on-surface outline-none ${expired ? 'line-through opacity-60' : ''}`}
              />
              <button
                onClick={copy}
                disabled={expired}
                className="flex items-center gap-xs px-md py-sm rounded-lg text-label-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="flex items-center gap-sm text-label-lg">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>schedule</span>
              <span className={expired ? 'text-error' : 'text-on-surface-variant'}>
                {expired ? 'Este link expirou.' : `Expira em ${remaining}`}
              </span>
            </div>

            {!expired && (
              <div className="flex flex-col items-center gap-sm pt-sm">
                <button
                  onClick={() => setFullscreen(true)}
                  title="Ampliar para tela cheia"
                  className="bg-white p-md rounded-xl hover:opacity-90 transition-all"
                >
                  <QRCodeSVG value={invite.inviteUrl} size={160} level="M" />
                </button>
                <button
                  onClick={() => setFullscreen(true)}
                  className="flex items-center gap-xs text-label-lg text-primary hover:underline"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fullscreen</span>
                  Exibir em tela cheia
                </button>
                <p className="text-label-sm text-on-surface-variant">Ou escaneie o QR code para entrar.</p>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-xs text-label-lg text-primary hover:underline self-start"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              Gerar novo link
            </button>
          </div>
        )}
      </div>

      {fullscreen && invite && !expired && (
        <QrFullscreenOverlay
          url={invite.inviteUrl}
          caption={`Expira em ${remaining}`}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  )
}
