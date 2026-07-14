import httpClient from '../../utils/httpClient'
import type { Paginated } from '../../utils/pagination'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Classroom {
  id: string
  name: string
  description?: string
  teacherId: string
  createdAt: string
  updatedAt: string
}

export interface ClassroomSubject {
  id: string
  name: string
  description?: string
}

export type MemberStatus = 'ACTIVE' | 'PENDING'

export interface ClassroomMember {
  id: string
  studentId: string
  username: string | null
  email: string | null
  status: MemberStatus
  createdAt: string
}

export interface ClassroomInvite {
  token: string
  expiresAt: string
  inviteUrl: string
}

export interface JoinResult {
  status: MemberStatus
  classroom: { id: string; name: string }
  message: string
}

export interface CreateClassroomBody {
  name: string
  description?: string
}

export type PaginatedClassrooms = Paginated<Classroom>

export type PaginatedClassroomSubjects = Paginated<ClassroomSubject>

// ─── Turmas ─────────────────────────────────────────────────────────────────

/** Lista paginada das turmas do usuário, com busca por nome. */
export async function listClassrooms(page = 1, limit = 12, search?: string): Promise<PaginatedClassrooms> {
  const params: Record<string, string | number> = { page, limit }
  const trimmed = search?.trim() ?? ''
  if (trimmed) params.search = trimmed
  const { data } = await httpClient.get<PaginatedClassrooms>('/classrooms', { params })
  return data
}

export async function getClassroom(id: string): Promise<Classroom> {
  const { data } = await httpClient.get<Classroom>(`/classrooms/${id}`)
  return data
}

export async function createClassroom(body: CreateClassroomBody): Promise<Classroom> {
  const { data } = await httpClient.post<Classroom>('/classrooms', body)
  return data
}

export async function updateClassroom(
  id: string,
  body: Partial<CreateClassroomBody>,
): Promise<Classroom> {
  const { data } = await httpClient.patch<Classroom>(`/classrooms/${id}`, body)
  return data
}

export async function deleteClassroom(id: string): Promise<void> {
  await httpClient.delete(`/classrooms/${id}`)
}

// ─── Disciplinas da turma ──────────────────────────────────────────────────────

/** Lista paginada das disciplinas da turma, com busca por nome. */
export async function getClassroomSubjects(
  classroomId: string,
  page = 1,
  limit = 12,
  search?: string,
): Promise<PaginatedClassroomSubjects> {
  const params: Record<string, string | number> = { page, limit }
  const trimmed = search?.trim() ?? ''
  if (trimmed) params.search = trimmed
  const { data } = await httpClient.get<PaginatedClassroomSubjects>(
    `/classrooms/${classroomId}/subjects`,
    { params },
  )
  return data
}

/** Vincula uma disciplina existente (subjectId) ou cria uma nova (name/description). */
export async function addClassroomSubject(
  classroomId: string,
  body: { subjectId?: string; name?: string; description?: string },
): Promise<ClassroomSubject> {
  const { data } = await httpClient.post<ClassroomSubject>(`/classrooms/${classroomId}/subjects`, body)
  return data
}

export async function removeClassroomSubject(classroomId: string, subjectId: string): Promise<void> {
  await httpClient.delete(`/classrooms/${classroomId}/subjects/${subjectId}`)
}

// ─── Membros (alunos) ──────────────────────────────────────────────────────────

export async function getClassroomMembers(classroomId: string): Promise<ClassroomMember[]> {
  const { data } = await httpClient.get<ClassroomMember[]>(`/classrooms/${classroomId}/members`)
  return data
}

export async function addClassroomMember(
  classroomId: string,
  body: { username?: string; email?: string },
): Promise<ClassroomMember> {
  const { data } = await httpClient.post<ClassroomMember>(`/classrooms/${classroomId}/members`, body)
  return data
}

export async function removeClassroomMember(classroomId: string, studentId: string): Promise<void> {
  await httpClient.delete(`/classrooms/${classroomId}/members/${studentId}`)
}

// ─── Convites e pedidos ────────────────────────────────────────────────────────

/**
 * Validades aceitas pelo backend (`INVITE_TTL_OPTIONS_MINUTES`). Enviar um valor
 * fora desta lista devolve 400.
 */
export const INVITE_TTL_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15 minutos' },
  { minutes: 30, label: '30 minutos' },
  { minutes: 60, label: '1 hora' },
  { minutes: 360, label: '6 horas' },
  { minutes: 1440, label: '1 dia' },
  { minutes: 10080, label: '7 dias' },
]

export const DEFAULT_INVITE_TTL_MINUTES = 30

export async function createClassroomInvite(
  classroomId: string,
  expiresInMinutes: number = DEFAULT_INVITE_TTL_MINUTES,
): Promise<ClassroomInvite> {
  const { data } = await httpClient.post<ClassroomInvite>(
    `/classrooms/${classroomId}/invites`,
    { expiresInMinutes },
  )
  return data
}

export async function getClassroomRequests(classroomId: string): Promise<ClassroomMember[]> {
  const { data } = await httpClient.get<ClassroomMember[]>(`/classrooms/${classroomId}/requests`)
  return data
}

export async function acceptClassroomRequest(
  classroomId: string,
  studentId: string,
): Promise<ClassroomMember> {
  const { data } = await httpClient.post<ClassroomMember>(
    `/classrooms/${classroomId}/requests/${studentId}/accept`,
  )
  return data
}

export async function rejectClassroomRequest(classroomId: string, studentId: string): Promise<void> {
  await httpClient.post(`/classrooms/${classroomId}/requests/${studentId}/reject`)
}

export async function joinClassroomByInvite(token: string): Promise<JoinResult> {
  const { data } = await httpClient.post<JoinResult>(`/classrooms/join/${token}`)
  return data
}

// ─── Utilitários ────────────────────────────────────────────────────────────────

export { formatDate } from '../../utils/format'
