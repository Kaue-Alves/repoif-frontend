import httpClient from '../../utils/httpClient'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ReportReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'COPYRIGHT'
  | 'HARASSMENT'
  | 'MISINFORMATION'
  | 'OTHER'

export type ReportTargetType = 'USER' | 'FILE'

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'

export interface Report {
  id: string
  reporterId: string
  targetType: ReportTargetType
  targetUserId: string | null
  targetFileId: string | null
  reason: ReportReason
  description: string | null
  status: ReportStatus
  resolvedBy: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReportBody {
  targetType: ReportTargetType
  targetUserId?: string
  targetFileId?: string
  reason: ReportReason
  description?: string
}

// ─── Rótulos de exibição ──────────────────────────────────────────────────────

export const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Conteúdo inapropriado',
  COPYRIGHT: 'Violação de direitos autorais',
  HARASSMENT: 'Assédio',
  MISINFORMATION: 'Desinformação',
  OTHER: 'Outro',
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Pendente',
  REVIEWED: 'Em análise',
  RESOLVED: 'Resolvida',
  DISMISSED: 'Descartada',
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function createReport(body: CreateReportBody): Promise<Report> {
  const { data } = await httpClient.post<Report>('/reports', body)
  return data
}

export async function getMyReports(): Promise<Report[]> {
  const { data } = await httpClient.get<Report[]>('/reports/me')
  return data
}
