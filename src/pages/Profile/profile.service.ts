import type { UserRole } from '../../contexts/AuthContext'
import httpClient from '../../utils/httpClient'

export interface Subject {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

export interface UserProfile {
  id: string
  username: string
  // Os três papéis existem em perfis; um tipo binário aqui já escondeu o bug do
  // admin rotulado como "Aluno" — não estreitar de novo.
  role: UserRole
  // A API pode omitir `subjects` (ex.: perfis de aluno), então é opcional.
  subjects?: Subject[]
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  const { data } = await httpClient.get<UserProfile>(`/users/${username}`)
  return data
}
