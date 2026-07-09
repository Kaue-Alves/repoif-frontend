import httpClient from '../../utils/httpClient'
import type { Paginated } from '../../utils/pagination'

export interface TeacherListItem {
  id: string
  username: string
  role: 'TEACHER'
  publicSubjectsCount: number
}

export type { PageMeta as PaginationMeta } from '../../utils/pagination'

export type PaginatedTeachers = Paginated<TeacherListItem>

/**
 * Lista professores (endpoint público, paginado). `search` só é aplicado com 2+ caracteres.
 * GET /users/teachers
 */
export async function listTeachers(
  page = 1,
  limit = 12,
  search?: string,
): Promise<PaginatedTeachers> {
  const params: Record<string, string | number> = { page, limit }
  const trimmed = search?.trim() ?? ''
  if (trimmed.length >= 2) params.search = trimmed

  const { data } = await httpClient.get<PaginatedTeachers>('/users/teachers', { params })
  return data
}
