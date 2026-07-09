import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import Pagination from '../../components/Pagination'
import QrCodeModal from '../../components/QrCodeModal'
import ReportModal from '../../components/ReportModal'
import AppLayout from '../../components/layouts/AppLayout'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { clientPageMeta } from '../../utils/pagination'
import AssignmentsTab from './AssignmentsTab'
import {
  type FileRecord,
  type SubjectWithTeacher,
  confirmUpload,
  deleteFile,
  formatDate,
  formatFileSize,
  getDownloadUrl,
  getMimeIcon,
  getSubject,
  getSubjectFiles,
  patchFile,
  requestUploadUrl,
  uploadToR2,
} from './subjects.service'

type UploadStep = 'idle' | 'picking' | 'uploading' | 'done' | 'error'

interface PendingUpload {
  file: File
  isPublic: boolean
}

interface RenameState {
  id: string
  value: string
}

const FILES_PAGE_LIMIT = 10

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const showToast = useToast()

  // O subject do location.state é só cache otimista de exibição; a versão da API
  // (buscada sempre) é quem manda, inclusive para decidir posse.
  const [subject, setSubject] = useState<SubjectWithTeacher | null>(
    (location.state as { subject?: SubjectWithTeacher })?.subject ?? null
  )
  const [loadingSubject, setLoadingSubject] = useState(!subject)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [filesError, setFilesError] = useState('')
  const [filesReload, setFilesReload] = useState(0)
  const [filesPage, setFilesPage] = useState(1)
  const [pageError, setPageError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle')
  const [pending, setPending] = useState<PendingUpload | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPublic, setUploadPublic] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [rename, setRename] = useState<RenameState | null>(null)
  const [renameSaving, setRenameSaving] = useState(false)

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const [qrTarget, setQrTarget] = useState<FileRecord | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')
  const [qrConfirm, setQrConfirm] = useState<FileRecord | null>(null)

  const [reportTarget, setReportTarget] = useState<FileRecord | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()
  const tab: 'materials' | 'assignments' =
    searchParams.get('tab') === 'assignments' ? 'assignments' : 'materials'

  // Posse decidida preferencialmente pelo id do docente vindo da API — o username do
  // location.state é controlado pelo cliente e serve só de fallback de exibição.
  const isOwner =
    !!user &&
    !!subject &&
    (subject.teacherId ? subject.teacherId === user.sub : subject.teacherUsername === user.username)

  // Paginação client-side: a API devolve a lista inteira de arquivos.
  const filesTotalPages = Math.max(1, Math.ceil(files.length / FILES_PAGE_LIMIT))
  const safeFilesPage = Math.min(filesPage, filesTotalPages)
  const pagedFiles = files.slice((safeFilesPage - 1) * FILES_PAGE_LIMIT, safeFilesPage * FILES_PAGE_LIMIT)

  useEffect(() => {
    if (!id) return
    const hadSeed = !!(location.state as { subject?: SubjectWithTeacher } | null)?.subject
    let cancelled = false
    getSubject(id)
      .then((data) => {
        if (!cancelled) setSubject(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        // Com cache otimista, mantém a exibição; sem ele, é erro de página mesmo.
        if (!hadSeed) {
          setPageError(err instanceof Error ? err.message : 'Disciplina não encontrada.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSubject(false)
      })
    return () => {
      cancelled = true
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoadingFiles(true)
    setFilesError('')
    getSubjectFiles(id)
      .then((data) => {
        if (!cancelled) setFiles(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        // Falha não pode virar "nenhum arquivo": o professor acharia que perdeu tudo.
        setFiles([])
        setFilesError(err instanceof Error ? err.message : 'Erro ao carregar os arquivos.')
      })
      .finally(() => {
        if (!cancelled) setLoadingFiles(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, filesReload])

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

  async function handleView(file: FileRecord) {
    try {
      const url = await getDownloadUrl(file.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao abrir o arquivo.')
    }
  }

  async function openQr(file: FileRecord) {
    setQrTarget(file)
    setQrUrl(null)
    setQrError('')
    setQrLoading(true)
    try {
      const url = await getDownloadUrl(file.id)
      setQrUrl(url)
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'Erro ao gerar o QR code.')
    } finally {
      setQrLoading(false)
    }
  }

  function handleShowQr(file: FileRecord) {
    if (file.isPublic) {
      openQr(file)
    } else {
      setQrConfirm(file)
    }
  }

  function confirmQrShare() {
    const file = qrConfirm
    setQrConfirm(null)
    if (file) openQr(file)
  }

  function closeQr() {
    setQrTarget(null)
    setQrUrl(null)
    setQrError('')
  }

  async function handleDownload(file: FileRecord) {
    try {
      const url = await getDownloadUrl(file.id)
      const res = await fetch(url)
      if (!res.ok) throw new Error('Falha ao baixar o arquivo.')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao baixar o arquivo.')
    }
  }

  async function handleToggleVisibility(file: FileRecord) {
    setTogglingIds((s) => new Set(s).add(file.id))
    try {
      const updated = await patchFile(file.id, { isPublic: !file.isPublic })
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar visibilidade.')
    } finally {
      setTogglingIds((s) => {
        const next = new Set(s)
        next.delete(file.id)
        return next
      })
    }
  }

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
      showToast(err instanceof Error ? err.message : 'Erro ao renomear arquivo.')
    } finally {
      setRenameSaving(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteFile(deleteTarget.id)
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir arquivo.')
    } finally {
      setDeleting(false)
    }
  }

  if (loadingSubject) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-xl">
          <Spinner className="h-8 w-8 text-primary" />
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

        {/* Tabs: Materiais de aula / Trabalhos */}
        <div className="flex gap-xs border-b border-outline-variant">
          {[
            { key: 'materials' as const, label: 'Materiais de aula', icon: 'folder' },
            { key: 'assignments' as const, label: 'Trabalhos', icon: 'assignment' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSearchParams({ tab: t.key })}
              className={`flex items-center gap-xs px-md py-sm text-label-lg whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'assignments' && id && <AssignmentsTab subjectId={id} isOwner={isOwner} />}

        {/* Upload panel (teacher owner only) */}
        {tab === 'materials' && isOwner && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg space-y-md">
            <h2 className="text-headline-sm text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>upload_file</span>
              Enviar arquivo
            </h2>

            {uploadStep === 'idle' && (
              <div className="space-y-md">
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
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFilesPicked} />
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

        {/* Materiais de aula (lista de arquivos) */}
        {tab === 'materials' && (
        <div className="space-y-md">
          <h2 className="text-headline-sm text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>folder_open</span>
            Materiais de aula
            {!loadingFiles && (
              <span className="text-label-sm text-on-surface-variant font-normal">({files.length})</span>
            )}
          </h2>

          {loadingFiles ? (
            <div className="flex justify-center py-xl">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : filesError ? (
            <div
              role="alert"
              className="flex items-start gap-sm bg-error-container text-on-error-container rounded-xl px-md py-sm text-body-md"
            >
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
              {filesError}
              <button
                onClick={() => setFilesReload((k) => k + 1)}
                className="ml-auto text-label-lg underline hover:no-underline"
              >
                Tentar novamente
              </button>
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
              {pagedFiles.map((file) => (
                <li
                  key={file.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-md hover:bg-surface-container-low transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-primary flex-shrink-0"
                    style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
                  >
                    {getMimeIcon(file.mimeType)}
                  </span>

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
                      <span className={`text-label-sm px-xs rounded ${file.isPublic ? 'text-primary' : 'text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined align-middle" style={{ fontSize: 12 }}>
                          {file.isPublic ? 'public' : 'lock'}
                        </span>
                        {' '}{file.isPublic ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-xs flex-shrink-0">
                    <button
                      onClick={() => handleView(file)}
                      title="Visualizar arquivo"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-action-view hover:bg-surface-container-high transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
                    </button>

                    <button
                      onClick={() => handleDownload(file)}
                      title="Baixar arquivo"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-action-download hover:bg-surface-container-high transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                    </button>

                    {user?.role !== 'STUDENT' && (
                      <button
                        onClick={() => handleShowQr(file)}
                        title="Compartilhar via QR code"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high transition-all"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>qr_code_2</span>
                      </button>
                    )}

                    {user && !isOwner && (
                      <button
                        onClick={() => setReportTarget(file)}
                        title="Denunciar arquivo"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>flag</span>
                      </button>
                    )}

                    {isOwner && (
                      <>
                        <button
                          onClick={() => handleToggleVisibility(file)}
                          disabled={togglingIds.has(file.id)}
                          title={file.isPublic ? 'Tornar privado' : 'Tornar público'}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-action-visibility hover:bg-surface-container-high transition-all disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {file.isPublic ? 'lock' : 'public'}
                          </span>
                        </button>

                        <button
                          onClick={() => setRename({ id: file.id, value: file.originalName })}
                          title="Renomear"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-action-rename hover:bg-surface-container-high transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                        </button>

                        <button
                          onClick={() => setDeleteTarget(file)}
                          title="Excluir"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-all"
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

          {!loadingFiles && !filesError && files.length > FILES_PAGE_LIMIT && (
            <Pagination
              meta={clientPageMeta(safeFilesPage, FILES_PAGE_LIMIT, files.length)}
              onPageChange={setFilesPage}
            />
          )}
        </div>
        )}
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

      <ConfirmModal
        open={!!qrConfirm}
        title="Compartilhar arquivo privado?"
        description={`"${qrConfirm?.originalName}" é privado. Qualquer pessoa que escanear o QR code poderá acessá-lo. Deseja continuar?`}
        confirmLabel="Compartilhar"
        onConfirm={confirmQrShare}
        onCancel={() => setQrConfirm(null)}
      />

      <QrCodeModal
        open={!!qrTarget}
        fileName={qrTarget?.originalName ?? ''}
        url={qrUrl}
        loading={qrLoading}
        error={qrError}
        onClose={closeQr}
      />

      <ReportModal
        open={!!reportTarget}
        targetType="FILE"
        targetFileId={reportTarget?.id}
        targetLabel={reportTarget?.originalName ?? ''}
        onClose={() => setReportTarget(null)}
      />
    </AppLayout>
  )
}
