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
}

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

export interface ConfirmUploadBody {
  key: string
  originalName: string
  mimeType: string
  size: number
  subjectId: string
  isPublic: boolean
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export async function getSubject(id: string): Promise<Subject> {
  const { data } = await httpClient.get<Subject>(`/subjects/${id}`)
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

export async function getSubjectFiles(subjectId: string): Promise<FileRecord[]> {
  const { data } = await httpClient.get<FileRecord[]>(`/files/subject/${subjectId}`)
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
