import type { UserRole } from '../../contexts/AuthContext'
import httpClient from '../../utils/httpClient'

export interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

/**
 * Contadores de atividade. Só vêm no próprio perfil — o número de disciplinas
 * privadas ou de turmas de um professor não é da conta de quem o visita.
 * Discriminado por `role`, e não um saco de campos opcionais, para que o TypeScript
 * impeça de ler "entregas" num professor.
 */
export type ProfileStats =
  | { role: 'TEACHER'; subjects: number; classrooms: number; materials: number; assignments: number }
  | { role: 'STUDENT'; classrooms: number; submissions: number; pendingAssignments: number }
  | { role: 'ADMIN' }

export interface UserProfile {
  id: string
  username: string
  /** Nome de exibição. `null` enquanto a pessoa não preencher — a UI cai no @username. */
  name?: string | null
  // Os três papéis existem em perfis; um tipo binário aqui já escondeu o bug do
  // admin rotulado como "Aluno" — não estreitar de novo.
  role: UserRole
  // A API pode omitir `subjects` (ex.: perfis de aluno), então é opcional.
  subjects?: Subject[]
  /** Ausente quando não é o próprio perfil. */
  stats?: ProfileStats
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  const { data } = await httpClient.get<UserProfile>(`/users/${username}`)
  return data
}

/** Altera o próprio perfil. O `username` não é alterável — ele é a identidade. */
export async function updateProfile(name: string): Promise<UserProfile> {
  const { data } = await httpClient.patch<UserProfile>('/users/me', { name })
  return data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await httpClient.patch('/users/me/password', { currentPassword, newPassword })
}
