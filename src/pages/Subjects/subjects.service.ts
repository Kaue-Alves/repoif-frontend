import httpClient from '../../utils/httpClient'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

export interface SubjectWithTeacher extends Subject {
  teacherUsername: string
  /** Presente quando a resposta vem da API; permite decidir posse por id, não por username. */
  teacherId?: string
}

export interface SubjectBody {
  name: string
  description?: string
  isPublic: boolean
}

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
  /** Preenchido quando o arquivo está desabilitado. Só o dono recebe esse campo. */
  deletedAt?: string | null
}

export interface UploadUrlRequest {
  filename: string
  contentType: string
  /** Tamanho em bytes. Vira ContentLength na URL assinada; o backend rejeita se > 200 MB. */
  size: number
  subjectId: string
  isPublic: boolean
}

export interface UploadUrlResponse {
  uploadUrl: string
  key: string
}

export interface ConfirmUploadBody {
  key: string
  originalName: string
  mimeType: string
  size: number
  subjectId: string
  isPublic: boolean
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

/** A rota de leitura devolve a disciplina com o username do docente (findOneForViewer). */
export async function getSubject(id: string): Promise<SubjectWithTeacher> {
  const { data } = await httpClient.get<SubjectWithTeacher>(`/subjects/${id}`)
  return data
}

export async function createSubject(body: SubjectBody): Promise<Subject> {
  const { data } = await httpClient.post<Subject>('/subjects', body)
  return data
}

export async function updateSubject(id: string, body: Partial<SubjectBody>): Promise<Subject> {
  const { data } = await httpClient.patch<Subject>(`/subjects/${id}`, body)
  return data
}

// ─── Files ────────────────────────────────────────────────────────────────────

/** `search` filtra pelo nome do arquivo. O backend aplica o filtro depois do recorte
 *  de visibilidade — buscar nunca revela um privado que a listagem esconderia. */
export async function getSubjectFiles(subjectId: string, search?: string): Promise<FileRecord[]> {
  const term = search?.trim()
  const { data } = await httpClient.get<FileRecord[]>(`/files/subject/${subjectId}`, {
    params: term ? { search: term } : undefined,
  })
  return data
}

export async function requestUploadUrl(body: UploadUrlRequest): Promise<UploadUrlResponse> {
  const { data } = await httpClient.post<UploadUrlResponse>('/files/upload-url', body)
  return data
}

export async function confirmUpload(body: ConfirmUploadBody): Promise<FileRecord> {
  const { data } = await httpClient.post<FileRecord>('/files', body)
  return data
}

export async function getDownloadUrl(fileId: string): Promise<string> {
  const { data } = await httpClient.get<{ url: string }>(`/files/${fileId}/download`)
  return data.url
}

export async function patchFile(
  fileId: string,
  body: { originalName?: string; isPublic?: boolean }
): Promise<FileRecord> {
  const { data } = await httpClient.patch<FileRecord>(`/files/${fileId}`, body)
  return data
}

/** Desabilita (exclusão lógica): some para os alunos, mas o dono pode reabilitar. */
export async function disableFile(fileId: string): Promise<FileRecord> {
  const { data } = await httpClient.patch<FileRecord>(`/files/${fileId}/disable`)
  return data
}

export async function enableFile(fileId: string): Promise<FileRecord> {
  const { data } = await httpClient.patch<FileRecord>(`/files/${fileId}/enable`)
  return data
}

/** Exclusão definitiva: apaga o objeto no R2 e o registro. Não tem volta. */
export async function deleteFile(fileId: string): Promise<void> {
  await httpClient.delete(`/files/${fileId}`)
}

// Upload direto para o R2 via XHR (suporta progresso)
export function uploadToR2(uploadUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
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

// ─── Utilitários de exibição ──────────────────────────────────────────────────

export { formatFileSize } from '../../utils/format'

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

export { formatDate } from '../../utils/format'
