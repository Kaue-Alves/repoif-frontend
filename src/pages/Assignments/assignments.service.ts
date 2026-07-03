import httpClient from '../../utils/httpClient'
import { uploadToR2 } from '../Subjects/subjects.service'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AssignmentAttachment {
  attachmentKey: string
  attachmentName: string
  attachmentMimeType: string
  attachmentSize: number
}

export interface Assignment {
  id: string
  subjectId: string
  teacherId: string
  title: string
  description?: string
  dueDate: string
  attachmentKey?: string | null
  attachmentName?: string | null
  attachmentMimeType?: string | null
  attachmentSize?: number | null
  createdAt: string
  updatedAt: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  originalName: string
  mimeType: string
  size: number
  submittedAt: string
  resubmitAllowed: boolean
  late?: boolean
}

/** Item da lista de trabalhos na visão do professor. */
export interface TeacherAssignmentItem extends Assignment {
  submissionsCount: number
  totalStudents: number
}

/** Item da lista de trabalhos na visão do aluno. */
export interface StudentAssignmentItem extends Assignment {
  submitted: boolean
  mySubmission: Submission | null
  canSubmit: boolean
}

export interface AssignmentDetail extends Assignment {
  subjectName: string
  isOwner: boolean
  submitted?: boolean
  mySubmission?: Submission | null
  canSubmit?: boolean
}

export interface SubmittedRow extends Submission {
  username: string | null
  email: string | null
}

export interface NotSubmittedRow {
  studentId: string
  username: string
  email: string
}

export interface SubmissionsOverview {
  totalStudents: number
  submittedCount: number
  notSubmittedCount: number
  submitted: SubmittedRow[]
  notSubmitted: NotSubmittedRow[]
}

export interface CreateAssignmentBody {
  subjectId: string
  title: string
  description?: string
  dueDate: string
  attachment?: AssignmentAttachment
}

// ─── Trabalhos ─────────────────────────────────────────────────────────────────

export async function listAssignments(
  subjectId: string,
): Promise<(TeacherAssignmentItem | StudentAssignmentItem)[]> {
  const { data } = await httpClient.get(`/assignments/subject/${subjectId}`)
  return data
}

export async function getAssignment(id: string): Promise<AssignmentDetail> {
  const { data } = await httpClient.get<AssignmentDetail>(`/assignments/${id}`)
  return data
}

export async function createAssignment(body: CreateAssignmentBody): Promise<Assignment> {
  const { data } = await httpClient.post<Assignment>('/assignments', body)
  return data
}

export async function updateAssignment(
  id: string,
  body: Partial<Omit<CreateAssignmentBody, 'subjectId'>> & { removeAttachment?: boolean },
): Promise<Assignment> {
  const { data } = await httpClient.patch<Assignment>(`/assignments/${id}`, body)
  return data
}

export async function deleteAssignment(id: string): Promise<void> {
  await httpClient.delete(`/assignments/${id}`)
}

/**
 * Envia o anexo do trabalho ao R2 e retorna os metadados para incluir no
 * corpo de criação/edição do trabalho.
 */
export async function uploadAssignmentAttachment(
  file: File,
  onProgress: (pct: number) => void,
): Promise<AssignmentAttachment> {
  const contentType = file.type || 'application/octet-stream'
  const { data: presigned } = await httpClient.post<{ uploadUrl: string; key: string }>(
    '/assignments/attachment/upload-url',
    { filename: file.name, contentType },
  )
  await uploadToR2(presigned.uploadUrl, file, onProgress)
  return {
    attachmentKey: presigned.key,
    attachmentName: file.name,
    attachmentMimeType: contentType,
    attachmentSize: file.size,
  }
}

export async function getAttachmentDownloadUrl(assignmentId: string): Promise<string> {
  const { data } = await httpClient.get<{ url: string }>(`/assignments/${assignmentId}/attachment/download`)
  return data.url
}

// ─── Entregas ────────────────────────────────────────────────────────────────

export async function getMySubmission(assignmentId: string): Promise<Submission | null> {
  const { data } = await httpClient.get<Submission | null>(`/assignments/${assignmentId}/my-submission`)
  return data
}

export async function getSubmissionsOverview(assignmentId: string): Promise<SubmissionsOverview> {
  const { data } = await httpClient.get<SubmissionsOverview>(`/assignments/${assignmentId}/submissions`)
  return data
}

export async function allowResubmit(assignmentId: string, studentId: string): Promise<Submission> {
  const { data } = await httpClient.post<Submission>(
    `/assignments/${assignmentId}/submissions/${studentId}/allow-resubmit`,
  )
  return data
}

export async function getSubmissionDownloadUrl(
  assignmentId: string,
  submissionId: string,
): Promise<string> {
  const { data } = await httpClient.get<{ url: string }>(
    `/assignments/${assignmentId}/submissions/${submissionId}/download`,
  )
  return data.url
}

/**
 * Fluxo completo de entrega: pede URL presigned, envia ao R2 e confirma a entrega.
 */
export async function submitAssignment(
  assignmentId: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<Submission> {
  const contentType = file.type || 'application/octet-stream'
  const { data: presigned } = await httpClient.post<{ uploadUrl: string; key: string }>(
    `/assignments/${assignmentId}/submission/upload-url`,
    { filename: file.name, contentType },
  )

  await uploadToR2(presigned.uploadUrl, file, onProgress)

  const { data } = await httpClient.post<Submission>(`/assignments/${assignmentId}/submission`, {
    key: presigned.key,
    originalName: file.name,
    mimeType: contentType,
    size: file.size,
  })
  return data
}

// ─── Utilitários ────────────────────────────────────────────────────────────────

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Data no formato dd/mm/aaaa (sem horário). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function isPastDue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Valor "yyyy-mm-dd" para <input type="date"> a partir de um ISO. */
export function toDateInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Data mínima permitida (amanhã) no formato "yyyy-mm-dd". */
export function tomorrowDateInput(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Converte "yyyy-mm-dd" no fim do dia local para ISO (instante da data limite). */
export function dateInputToISO(value: string): string {
  return new Date(`${value}T23:59:59`).toISOString()
}
