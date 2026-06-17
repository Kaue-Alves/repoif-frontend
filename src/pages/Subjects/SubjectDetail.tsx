import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  FileRecord,
  confirmUpload,
  deleteFile,
  formatDate,
  formatFileSize,
  getDownloadUrl,
  getMimeIcon,
  getSubjectFiles,
  patchFile,
  requestUploadUrl,
  uploadToR2,
} from '../../api/files'
import ConfirmModal from '../../components/ConfirmModal'
import AppLayout from '../../components/layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
  teacherUsername: string
}

// ─── upload state machine ─────────────────────────────────────────────────────
type UploadStep = 'idle' | 'picking' | 'uploading' | 'done' | 'error'

interface PendingUpload {
  file: File
  isPublic: boolean
}

// ─── inline rename state ──────────────────────────────────────────────────────
interface RenameState {
  id: string
  value: string
}

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [subject, setSubject] = useState<Subject | null>(
    (location.state as { subject?: Subject })?.subject ?? null
  )
  const [loadingSubject, setLoadingSubject] = useState(!subject)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [pageError, setPageError] = useState('')

  // upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle')
  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPublic, setUploadPublic] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // delete modal
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  // rename
  const [rename, setRename] = useState<RenameState | null>(null)
  const [renameSaving, setRenameSaving] = useState(false)

  // visibility toggle loading set
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const isOwner = !!user && subject?.teacherUsername === user.username

  // ─── load subject if not passed via state ──────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (subject) {
      setLoadingSubject(false)
      return
    }
    api
      .get<Subject>(`/subjects/${id}`, !!user)
      .then(setSubject)
      .catch((err: unknown) => {
        setPageError(err instanceof Error ? err.message : 'Disciplina não encontrada.')
      })
      .finally(() => setLoadingSubject(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── load files ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    getSubjectFiles(id)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoadingFiles(false))
  }, [id])

  // ─── upload flow ────────────────────────────────────────────────────────────
  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setPending({ file, isPublic: uploadPublic })
    setUploadStep('picking')
    setUploadError('')
  }

  async function startUpload() {
    if (!pending || !id) return
    setUploadStep('uploading')
    setUploadProgress(0)
    setUploadError('')

    try {
      const { uploadUrl, key } = await requestUploadUrl({
        filename: pending.file.name,
        contentType: pending.file.type || 'application/octet-stream',
        subjectId: id,
        isPublic: pending.isPublic,
      })

      await uploadToR2(uploadUrl, pending.file, setUploadProgress)

      const record = await confirmUpload({
        key,
        originalName: pending.file.name,
        mimeType: pending.file.type || 'application/octet-stream',
        size: pending.file.size,
        subjectId: id,
        isPublic: pending.isPublic,
      })

      setFiles((prev) => [record, ...prev])
      setUploadStep('done')
      setPending(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Falha no upload.')
      setUploadStep('error')
    }
  }

  function cancelUpload() {
    setPending(null)
    setUploadStep('idle')
    setUploadError('')
  }

  // ─── download ────────────────────────────────────────────────────────────────
  async function handleDownload(file: FileRecord) {
    try {
      const url = await getDownloadUrl(file.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao obter link de download.')
    }
  }

  // ─── visibility toggle ───────────────────────────────────────────────────────
  async function handleToggleVisibility(file: FileRecord) {
    setTogglingIds((s) => new Set(s).add(file.id))
    try {
      const updated = await patchFile(file.id, { isPublic: !file.isPublic })
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar visibilidade.')
    } finally {
      setTogglingIds((s) => {
        const next = new Set(s)
        next.delete(file.id)
        return next
      })
    }
  }

  // ─── rename ──────────────────────────────────────────────────────────────────
  async function saveRename() {
    if (!rename) return
    const trimmed = rename.value.trim()
    if (!trimmed) return
    setRenameSaving(true)
    try {
      const updated = await patchFile(rename.id, { originalName: trimmed })
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      setRename(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao renomear arquivo.')
    } finally {
      setRenameSaving(false)
    }
  }

  // ─── delete ──────────────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteFile(deleteTarget.id)
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir arquivo.')
    } finally {
      setDeleting(false)
    }
  }

  // ─── render ──────────────────────────────────────────────────────────────────
  if (loadingSubject) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-xl">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      </AppLayout>
    )
  }

  if (pageError || !subject) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center gap-lg py-xl text-center">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 64 }}>
            folder_off
          </span>
          <p className="text-body-lg text-on-surface-variant">{pageError || 'Disciplina não encontrada.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-lg py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all"
          >
            Voltar
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs text-label-sm text-on-surface-variant">
          {user?.role === 'TEACHER' && user.username === subject.teacherUsername ? (
            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          ) : (
            <Link to={`/profile/${subject.teacherUsername}`} className="hover:text-primary transition-colors">
              @{subject.teacherUsername}
            </Link>
          )}
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span className="text-on-surface truncate max-w-xs">{subject.name}</span>
        </nav>

        {/* Subject header */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex items-start justify-between gap-md">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-sm flex-wrap mb-xs">
              <h1 className="text-headline-md text-on-surface">{subject.name}</h1>
              <span className={`text-label-sm px-sm py-xs rounded-full ${
                subject.isPublic
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined align-middle" style={{ fontSize: 12 }}>
                  {subject.isPublic ? 'public' : 'lock'}
                </span>
                {' '}{subject.isPublic ? 'Pública' : 'Privada'}
              </span>
            </div>
            {subject.description && (
              <p className="text-body-md text-on-surface-variant">{subject.description}</p>
            )}
            <p className="text-label-sm text-on-surface-variant mt-xs">
              Docente: @{subject.teacherUsername}
            </p>
          </div>
          {isOwner && (
            <Link
              to={`/subjects/${subject.id}/edit`}
              className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
              Editar
            </Link>
          )}
        </div>

        {/* Upload panel (teacher owner only) */}
        {isOwner && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg space-y-md">
            <h2 className="text-headline-sm text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>upload_file</span>
              Enviar arquivo
            </h2>

            {uploadStep === 'idle' && (
              <div className="space-y-md">
                {/* Visibility for upload */}
                <div className="flex gap-sm">
                  {[
                    { value: false, icon: 'lock', label: 'Privado' },
                    { value: true, icon: 'public', label: 'Público' },
                  ].map((opt) => {
                    const active = uploadPublic === opt.value
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setUploadPublic(opt.value)}
                        className={`flex items-center gap-xs px-md py-sm rounded-lg border text-label-lg transition-all ${
                          active
                            ? 'border-primary bg-primary-container/20 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {/* Drop zone */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-outline-variant rounded-xl py-xl text-center hover:border-primary hover:bg-primary-container/5 transition-all group"
                >
                  <span
                    className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors"
                    style={{ fontSize: 40 }}
                  >
                    cloud_upload
                  </span>
                  <p className="text-body-md text-on-surface-variant mt-sm group-hover:text-primary transition-colors">
                    Clique para selecionar um arquivo
                  </p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={onFilesPicked}
                />
              </div>
            )}

            {uploadStep === 'picking' && pending && (
              <div className="space-y-md">
                <div className="flex items-center gap-md p-md bg-surface-container-low rounded-xl">
                  <span
                    className="material-symbols-outlined text-primary flex-shrink-0"
                    style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
                  >
                    {getMimeIcon(pending.file.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg text-on-surface truncate">{pending.file.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{formatFileSize(pending.file.size)}</p>
                  </div>
                </div>

                {/* Visibility for this file */}
                <div className="flex gap-sm">
                  {[
                    { value: false, icon: 'lock', label: 'Privado' },
                    { value: true, icon: 'public', label: 'Público' },
                  ].map((opt) => {
                    const active = pending.isPublic === opt.value
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setPending((p) => p ? { ...p, isPublic: opt.value } : p)}
                        className={`flex items-center gap-xs px-md py-sm rounded-lg border text-label-lg transition-all ${
                          active
                            ? 'border-primary bg-primary-container/20 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-sm justify-end">
                  <button
                    onClick={cancelUpload}
                    className="px-lg py-sm border border-outline-variant text-on-surface-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={startUpload}
                    className="flex items-center gap-sm px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span>
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'uploading' && (
              <div className="space-y-md py-sm">
                <p className="text-body-md text-on-surface-variant">Enviando arquivo...</p>
                <div className="w-full bg-surface-container-high rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-label-sm text-on-surface-variant text-right">{uploadProgress}%</p>
              </div>
            )}

            {uploadStep === 'done' && (
              <div className="flex items-center gap-md">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <p className="text-body-md text-on-surface flex-1">Arquivo enviado com sucesso!</p>
                <button
                  onClick={() => setUploadStep('idle')}
                  className="px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all"
                >
                  Enviar outro
                </button>
              </div>
            )}

            {uploadStep === 'error' && (
              <div className="space-y-md">
                <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
                  <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
                  {uploadError}
                </div>
                <button
                  onClick={cancelUpload}
                  className="px-lg py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        )}

        {/* File list */}
        <div className="space-y-md">
          <h2 className="text-headline-sm text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>folder_open</span>
            Arquivos
            {!loadingFiles && (
              <span className="text-label-sm text-on-surface-variant font-normal">
                ({files.length})
              </span>
            )}
          </h2>

          {loadingFiles ? (
            <div className="flex justify-center py-xl">
              <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center gap-md py-xl text-center border-2 border-dashed border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>
                folder_open
              </span>
              <p className="text-body-md text-on-surface-variant">Nenhum arquivo enviado ainda.</p>
            </div>
          ) : (
            <ul className="space-y-sm">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md hover:bg-surface-container-low transition-colors"
                >
                  {/* Icon */}
                  <span
                    className="material-symbols-outlined text-primary flex-shrink-0"
                    style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
                  >
                    {getMimeIcon(file.mimeType)}
                  </span>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    {rename?.id === file.id ? (
                      <div className="flex items-center gap-sm">
                        <input
                          autoFocus
                          value={rename.value}
                          onChange={(e) => setRename({ id: file.id, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename()
                            if (e.key === 'Escape') setRename(null)
                          }}
                          className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          onClick={saveRename}
                          disabled={renameSaving}
                          className="text-primary hover:opacity-70 disabled:opacity-40 transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
                        </button>
                        <button
                          onClick={() => setRename(null)}
                          className="text-on-surface-variant hover:opacity-70 transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-label-lg text-on-surface truncate">{file.originalName}</p>
                    )}

                    <div className="flex items-center gap-sm flex-wrap mt-xs">
                      <span className="text-label-sm text-on-surface-variant">{formatFileSize(file.size)}</span>
                      <span className="text-outline">·</span>
                      <span className="text-label-sm text-on-surface-variant">{formatDate(file.createdAt)}</span>
                      <span className={`text-label-sm px-xs rounded ${
                        file.isPublic
                          ? 'text-primary'
                          : 'text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined align-middle" style={{ fontSize: 12 }}>
                          {file.isPublic ? 'public' : 'lock'}
                        </span>
                        {' '}{file.isPublic ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-xs flex-shrink-0">
                    {/* Download */}
                    <button
                      onClick={() => handleDownload(file)}
                      title="Baixar arquivo"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                    </button>

                    {/* Owner-only actions */}
                    {isOwner && (
                      <>
                        {/* Toggle visibility */}
                        <button
                          onClick={() => handleToggleVisibility(file)}
                          disabled={togglingIds.has(file.id)}
                          title={file.isPublic ? 'Tornar privado' : 'Tornar público'}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {file.isPublic ? 'lock' : 'public'}
                          </span>
                        </button>

                        {/* Rename */}
                        <button
                          onClick={() => setRename({ id: file.id, value: file.originalName })}
                          title="Renomear"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(file)}
                          title="Excluir"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir arquivo?"
        description={`"${deleteTarget?.originalName}" será removido permanentemente.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  )
}
