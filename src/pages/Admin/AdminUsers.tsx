import { useCallback, useEffect, useRef, useState } from 'react'
import AdminLayout from './AdminLayout'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import type { PageMeta } from '../../utils/pagination'
import { ROLE_LABELS } from '../../utils/roles'
import Field from '../../components/Field'
import {
  createUser,
  deleteUser,
  listUsers,
  restoreUser,
  updateUserRole,
  type AdminRole,
  type AdminUser,
} from './admin.service'

const ROLE_OPTIONS: AdminRole[] = ['ADMIN', 'TEACHER', 'STUDENT']
const LIMIT = 20

export default function AdminUsers() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AdminRole | ''>('')
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchUsers = useCallback(() => {
    setLoading(true)
    setError('')
    listUsers({
      page,
      limit: LIMIT,
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      includeDeleted,
    })
      .then((res) => {
        setUsers(res.data)
        setMeta(res.meta)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao carregar usuários.'))
      .finally(() => setLoading(false))
  }, [page, search, roleFilter, includeDeleted])

  // Debounce da busca; demais filtros aplicam imediatamente
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      fetchUsers()
      return
    }
    const t = setTimeout(fetchUsers, 350)
    return () => clearTimeout(t)
  }, [fetchUsers])

  // Volta para a página 1 quando um filtro muda
  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, includeDeleted])

  async function handleRoleChange(u: AdminUser, role: AdminRole) {
    if (role === u.role) return
    setRowBusy(u.id)
    setActionError('')
    try {
      const updated = await updateUserRole(u.id, role)
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: updated.role } : x)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao alterar papel.')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError('')
    try {
      await deleteUser(deleteTarget.id)
      if (includeDeleted) {
        setUsers((prev) =>
          prev.map((x) => (x.id === deleteTarget.id ? { ...x, deletedAt: new Date().toISOString() } : x))
        )
      } else {
        setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      }
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao excluir usuário.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestore(u: AdminUser) {
    setRowBusy(u.id)
    setActionError('')
    try {
      await restoreUser(u.id)
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, deletedAt: null } : x)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao restaurar usuário.')
    } finally {
      setRowBusy(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-lg">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-md">
          <div className="relative flex-1">
            <span aria-hidden="true"
              className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant"
              style={{ fontSize: 20 }}
            >
              search
            </span>
            <input aria-label="Buscar por username ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por username ou email..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-[2.5rem] pr-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <select
            aria-label="Filtrar por papel"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AdminRole | '')}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos os papéis</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>

          <label className="flex items-center gap-xs text-label-lg text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Mostrar excluídos
          </label>

          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            Novo usuário
          </button>
        </div>

        {actionError && (
          <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
            <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
            {actionError}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-xl">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
            <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-xl">
            <span aria-hidden="true" className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>group_off</span>
            <p className="text-body-md text-on-surface-variant">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <ul className="space-y-sm">
            {users.map((u) => {
              const isSelf = currentUser?.sub === u.id
              const isDeleted = !!u.deletedAt
              const busy = rowBusy === u.id
              return (
                <li
                  key={u.id}
                  className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col sm:flex-row sm:items-center gap-md ${
                    isDeleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center flex-shrink-0">
                    <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs flex-wrap">
                      <span className="text-label-lg text-on-surface truncate">@{u.username}</span>
                      {isSelf && (
                        <span className="text-label-sm px-xs rounded bg-primary-container/40 text-primary">você</span>
                      )}
                      {isDeleted && (
                        <span className="text-label-sm px-xs rounded bg-error-container text-on-error-container">excluído</span>
                      )}
                      {!u.emailVerified && !isDeleted && (
                        <span className="text-label-sm px-xs rounded bg-surface-container-high text-on-surface-variant">
                          email não verificado
                        </span>
                      )}
                    </div>
                    <p className="text-label-sm text-on-surface-variant truncate">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-sm flex-shrink-0">
                    {busy && <Spinner className="h-4 w-4 text-primary" />}

                    {/* Alterar papel — desabilitado para si mesmo ou excluídos */}
                    <select
                      aria-label={`Alterar papel de ${u.username}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value as AdminRole)}
                      disabled={busy || isSelf || isDeleted}
                      title={isSelf ? 'Você não pode alterar seu próprio papel' : 'Alterar papel'}
                      className="bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs text-label-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>

                    {isDeleted ? (
                      <button
                        onClick={() => handleRestore(u)}
                        disabled={busy}
                        title="Restaurar usuário"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-action-download hover:bg-surface-container-high transition-all disabled:opacity-40"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>restore_from_trash</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        disabled={busy || isSelf}
                        title={isSelf ? 'Você não pode excluir a si mesmo' : 'Excluir usuário'}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir usuário?"
        description={`@${deleteTarget?.username} será excluído (soft delete) e sumirá das listagens públicas. Você pode restaurá-lo depois.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          fetchUsers()
        }}
      />
    </AdminLayout>
  )
}

// ─── Modal de criação de usuário ──────────────────────────────────────────────

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminRole>('STUDENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setUsername('')
      setEmail('')
      setPassword('')
      setRole('STUDENT')
      setSubmitting(false)
      setError('')
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !submitting) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, submitting, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createUser({ username: username.trim(), email: email.trim(), password, role })
      onCreated()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário.'
      setError(/409|já|conflit/i.test(message) ? 'Username ou email já está em uso.' : message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!submitting) onClose() }} />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-lg flex flex-col gap-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start gap-md">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary-container/40">
            <span aria-hidden="true" className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>person_add</span>
          </div>
          <div className="flex-1">
            <h2 id="create-user-title" className="text-headline-sm text-on-surface">Novo usuário</h2>
            <p className="text-body-md text-on-surface-variant mt-xs">
              O usuário já entra com email verificado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose} aria-label="Fechar"
            disabled={submitting}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-40"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
            <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        <Field label="Username">
          {(id) => (
            <input id={id}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={144}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </Field>

        <Field label="Email">
          {(id) => (
            <input id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </Field>

        <Field label="Senha">
          {(id) => (
            <input id={id}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </Field>

        <Field label="Papel">
          {(id) => (
            <select id={id}
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          )}
        </Field>

        <div className="flex gap-sm justify-end pt-xs">
          <button
            type="button"
            onClick={onClose} aria-label="Fechar"
            disabled={submitting}
            className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Spinner className="h-4 w-4" />}
            Criar
          </button>
        </div>
      </form>
    </div>
  )
}

