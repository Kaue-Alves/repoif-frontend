import httpClient from '../../utils/httpClient'

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

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedClassrooms {
  data: Classroom[]
  meta: PageMeta
}

export interface PaginatedClassroomSubjects {
  data: ClassroomSubject[]
  meta: PageMeta
}

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

export async function createClassroomInvite(classroomId: string): Promise<ClassroomInvite> {
  const { data } = await httpClient.post<ClassroomInvite>(`/classrooms/${classroomId}/invites`)
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

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
