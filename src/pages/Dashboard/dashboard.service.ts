import httpClient from '../../utils/httpClient'

export interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedSubjects {
  data: Subject[]
  meta: PageMeta
}

/** Lista paginada das disciplinas do professor, com busca por nome. */
export async function listSubjects(page = 1, limit = 12, search?: string): Promise<PaginatedSubjects> {
  const params: Record<string, string | number> = { page, limit }
  const trimmed = search?.trim() ?? ''
  if (trimmed) params.search = trimmed
  const { data } = await httpClient.get<PaginatedSubjects>('/subjects', { params })
  return data
}

/** Todas as disciplinas do professor (para seletores), sem paginação visível. */
export async function getSubjects(): Promise<Subject[]> {
  const { data } = await httpClient.get<PaginatedSubjects>('/subjects', { params: { limit: 100 } })
  return data.data
}

export async function deleteSubject(id: string): Promise<void> {
  await httpClient.delete(`/subjects/${id}`)
}
