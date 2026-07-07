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
  role: 'TEACHER' | 'STUDENT'
  // A API pode omitir `subjects` (ex.: perfis de aluno), então é opcional.
  subjects?: Subject[]
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  const { data } = await httpClient.get<UserProfile>(`/users/${username}`)
  return data
}
