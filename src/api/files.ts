import { getStoredToken } from './client'

const BASE = 'http://localhost:3001'

export interface FileRecord {
  id: string
  originalName: string
  key: string
  mimeType: string
  size: number
  subjectId: string
  uploadedBy: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const t = getStoredToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({})) as { message?: string | string[] }
  if (Array.isArray(data.message)) return data.message[0]
  return data.message ?? `Erro ${res.status}`
}

// ─── Etapa 1: pedir presigned URL de upload ──────────────────────────────────

export interface UploadUrlRequest {
  filename: string
  contentType: string
  subjectId: string
  isPublic: boolean
}

export interface UploadUrlResponse {
  uploadUrl: string
  key: string
}

export async function requestUploadUrl(body: UploadUrlRequest): Promise<UploadUrlResponse> {
  const res = await fetch(`${BASE}/files/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

// ─── Etapa 2: upload direto para o R2 via XHR (suporta progresso) ────────────

export function uploadToR2(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload falhou: HTTP ${xhr.status}`))
    }

    xhr.onerror = () => reject(new Error('Erro de rede durante o upload'))
    xhr.send(file)
  })
}

// ─── Etapa 3: confirmar upload (salvar metadados no banco) ───────────────────

export interface ConfirmUploadBody {
  key: string
  originalName: string
  mimeType: string
  size: number
  subjectId: string
  isPublic: boolean
}

export async function confirmUpload(body: ConfirmUploadBody): Promise<FileRecord> {
  const res = await fetch(`${BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

// ─── Listagem ─────────────────────────────────────────────────────────────────

export async function getSubjectFiles(subjectId: string): Promise<FileRecord[]> {
  const res = await fetch(`${BASE}/files/subject/${subjectId}`, {
    headers: authHeader(),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

// ─── Download (retorna URL assinada) ─────────────────────────────────────────

export async function getDownloadUrl(fileId: string): Promise<string> {
  const res = await fetch(`${BASE}/files/${fileId}/download`, {
    headers: authHeader(),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const { url } = (await res.json()) as { url: string }
  return url
}

// ─── Editar metadados ─────────────────────────────────────────────────────────

export async function patchFile(
  fileId: string,
  body: { originalName?: string; isPublic?: boolean }
): Promise<FileRecord> {
  const res = await fetch(`${BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

// ─── Excluir ──────────────────────────────────────────────────────────────────

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!res.ok && res.status !== 204) throw new Error(await parseError(res))
}

// ─── Utilitários de exibição ──────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getMimeIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slideshow'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'description'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'table_chart'
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('video')) return 'movie'
  if (mimeType.includes('audio')) return 'audio_file'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'folder_zip'
  return 'insert_drive_file'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
