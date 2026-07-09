import httpClient from '../../utils/httpClient'
import type { Paginated } from '../../utils/pagination'
import type {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '../Reports/reports.service'

// ─── Paginação ────────────────────────────────────────────────────────────────

export type { PageMeta, Paginated } from '../../utils/pagination'

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: { total: number; deleted: number; byRole: { admins: number; teachers: number; students: number } }
  files: { total: number; deleted: number }
  reports: { total: number; pending: number }
}

export async function getStats(): Promise<AdminStats> {
  const { data } = await httpClient.get<AdminStats>('/admin/stats')
  return data
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

export type AdminRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface AdminUser {
  id: string
  username: string
  email: string
  role: AdminRole
  emailVerified: boolean
  deletedAt: string | null
}

export interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: AdminRole
  includeDeleted?: boolean
}

export async function listUsers(params: ListUsersParams): Promise<Paginated<AdminUser>> {
  const { data } = await httpClient.get<Paginated<AdminUser>>('/admin/users', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      role: params.role || undefined,
      includeDeleted: params.includeDeleted ? 'true' : undefined,
    },
  })
  return data
}

export interface CreateUserBody {
  username: string
  email: string
  password: string
  role: AdminRole
}

export async function createUser(body: CreateUserBody): Promise<AdminUser> {
  const { data } = await httpClient.post<AdminUser>('/admin/users', body)
  return data
}

export async function updateUserRole(id: string, role: AdminRole): Promise<AdminUser> {
  const { data } = await httpClient.patch<AdminUser>(`/admin/users/${id}/role`, { role })
  return data
}

export async function deleteUser(id: string): Promise<{ id: string; deleted: boolean }> {
  const { data } = await httpClient.delete<{ id: string; deleted: boolean }>(`/admin/users/${id}`)
  return data
}

export async function restoreUser(id: string): Promise<{ id: string; restored: boolean }> {
  const { data } = await httpClient.post<{ id: string; restored: boolean }>(`/admin/users/${id}/restore`)
  return data
}

// ─── Arquivos ─────────────────────────────────────────────────────────────────

export interface AdminFile {
  id: string
  originalName: string
  mimeType: string
  size: number
  subjectId: string
  uploadedBy: string
  uploaderUsername: string | null
  isPublic: boolean
  createdAt: string
  deletedAt: string | null
}

export interface ListFilesParams {
  page?: number
  limit?: number
  search?: string
  includeDeleted?: boolean
}

export async function listFiles(params: ListFilesParams): Promise<Paginated<AdminFile>> {
  const { data } = await httpClient.get<Paginated<AdminFile>>('/admin/files', {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      includeDeleted: params.includeDeleted ? 'true' : undefined,
    },
  })
  return data
}

export async function deleteFile(
  id: string,
  hard = false
): Promise<{ id: string; deleted: boolean; hard: boolean }> {
  const { data } = await httpClient.delete<{ id: string; deleted: boolean; hard: boolean }>(
    `/admin/files/${id}`,
    { params: hard ? { hard: 'true' } : undefined }
  )
  return data
}

export async function restoreFile(id: string): Promise<{ id: string; restored: boolean }> {
  const { data } = await httpClient.post<{ id: string; restored: boolean }>(`/admin/files/${id}/restore`)
  return data
}

/** URL assinada para o admin visualizar qualquer arquivo (privado ou excluído). */
export async function getAdminFileDownloadUrl(id: string): Promise<string> {
  const { data } = await httpClient.get<{ url: string }>(`/admin/files/${id}/download`)
  return data.url
}

// ─── Denúncias (moderação) ────────────────────────────────────────────────────

export interface AdminReport {
  id: string
  targetType: ReportTargetType
  reason: ReportReason
  description: string | null
  status: ReportStatus
  resolutionNote: string | null
  resolvedBy: string | null
  createdAt: string
  updatedAt: string
  reporter: { id: string; username: string } | null
  targetUser: { id: string; username: string; deletedAt: string | null } | null
  targetFile: {
    id: string
    originalName: string
    subjectId: string
    deletedAt: string | null
    uploader: { id: string; username: string; deletedAt: string | null } | null
  } | null
}

export interface ListReportsParams {
  page?: number
  limit?: number
  status?: ReportStatus
  targetType?: ReportTargetType
}

export async function listReports(params: ListReportsParams): Promise<Paginated<AdminReport>> {
  const { data } = await httpClient.get<Paginated<AdminReport>>('/admin/reports', {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status || undefined,
      targetType: params.targetType || undefined,
    },
  })
  return data
}

export async function updateReportStatus(
  id: string,
  body: { status: ReportStatus; resolutionNote?: string }
): Promise<AdminReport> {
  const { data } = await httpClient.patch<AdminReport>(`/admin/reports/${id}`, body)
  return data
}
