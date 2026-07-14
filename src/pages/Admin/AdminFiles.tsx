import { useCallback, useEffect, useRef, useState } from 'react'
import AdminLayout from './AdminLayout'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'
import type { PageMeta } from '../../utils/pagination'
import { formatDate, formatFileSize, getMimeIcon } from '../Subjects/subjects.service'
import {
  deleteFile,
  listFiles,
  restoreFile,
  type AdminFile,
} from './admin.service'

const LIMIT = 20

interface DeleteState {
  file: AdminFile
  hard: boolean
}

export default function AdminFiles() {
  const [files, setFiles] = useState<AdminFile[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchFiles = useCallback(() => {
    setLoading(true)
    setError('')
    listFiles({ page, limit: LIMIT, search: search.trim() || undefined, includeDeleted })
      .then((res) => {
        setFiles(res.data)
        setMeta(res.meta)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao carregar arquivos.'))
      .finally(() => setLoading(false))
  }, [page, search, includeDeleted])

  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      fetchFiles()
      return
    }
    const t = setTimeout(fetchFiles, 350)
    return () => clearTimeout(t)
  }, [fetchFiles])

  useEffect(() => {
    setPage(1)
  }, [search, includeDeleted])

  async function handleDeleteConfirm() {
    if (!deleteState) return
    const { file, hard } = deleteState
    setDeleting(true)
    setActionError('')
    try {
      await deleteFile(file.id, hard)
      if (hard) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
      } else if (includeDeleted) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, deletedAt: new Date().toISOString() } : f))
        )
      } else {
        setFiles((prev) => prev.filter((f) => f.id !== file.id))
      }
      setDeleteState(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao excluir arquivo.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestore(file: AdminFile) {
    setRowBusy(file.id)
    setActionError('')
    try {
      await restoreFile(file.id)
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, deletedAt: null } : f)))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao restaurar arquivo.')
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
            <input aria-label="Buscar pelo nome do arquivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pelo nome do arquivo..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-[2.5rem] pr-md py-sm text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <label className="flex items-center gap-xs text-label-lg text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Mostrar excluídos
          </label>
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
        ) : files.length === 0 ? (
          <div className="text-center py-xl border-2 border-dashed border-outline-variant rounded-xl">
            <span aria-hidden="true" className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>folder_off</span>
            <p className="text-body-md text-on-surface-variant">Nenhum arquivo encontrado.</p>
          </div>
        ) : (
          <ul className="space-y-sm">
            {files.map((file) => {
              const isDeleted = !!file.deletedAt
              const busy = rowBusy === file.id
              return (
                <li
                  key={file.id}
                  className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md ${
                    isDeleted ? 'opacity-60' : ''
                  }`}
                >
                  <span aria-hidden="true"
                    className="material-symbols-outlined text-primary flex-shrink-0"
                    style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
                  >
                    {getMimeIcon(file.mimeType)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-xs flex-wrap">
                      <span className="text-label-lg text-on-surface truncate">{file.originalName}</span>
                      {isDeleted && (
                        <span className="text-label-sm px-xs rounded bg-error-container text-on-error-container">excluído</span>
                      )}
                      {!file.isPublic && (
                        <span className="text-label-sm text-on-surface-variant">
                          <span aria-hidden="true" className="material-symbols-outlined align-middle" style={{ fontSize: 12 }}>lock</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-sm flex-wrap mt-xs text-label-sm text-on-surface-variant">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="text-outline">·</span>
                      <span>{formatDate(file.createdAt)}</span>
                      <span className="text-outline">·</span>
                      <span>por @{file.uploaderUsername ?? 'desconhecido'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-xs flex-shrink-0">
                    {busy && <Spinner className="h-4 w-4 text-primary" />}

                    {isDeleted ? (
                      <button
                        onClick={() => handleRestore(file)}
                        disabled={busy}
                        title="Restaurar arquivo"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-action-download hover:bg-surface-container-high transition-all disabled:opacity-40"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>restore_from_trash</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteState({ file, hard: false })}
                        title="Excluir (soft delete)"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-all"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteState({ file, hard: true })}
                      title="Excluir definitivamente (irreversível)"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-error hover:bg-error hover:text-on-error transition-all"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_forever</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </div>

      <ConfirmModal
        open={!!deleteState}
        title={deleteState?.hard ? 'Excluir DEFINITIVAMENTE?' : 'Excluir arquivo?'}
        description={
          deleteState?.hard
            ? `"${deleteState?.file.originalName}" será apagado do armazenamento (R2) e do banco. Esta ação é IRREVERSÍVEL.`
            : `"${deleteState?.file.originalName}" será excluído (soft delete). O arquivo permanece no armazenamento e pode ser restaurado.`
        }
        confirmLabel={deleteState?.hard ? 'Excluir para sempre' : 'Excluir'}
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteState(null)}
      />
    </AdminLayout>
  )
}
