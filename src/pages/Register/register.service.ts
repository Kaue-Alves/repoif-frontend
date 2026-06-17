import httpClient from '../../utils/httpClient'

export type Role = 'TEACHER' | 'STUDENT'

export interface RegisterBody {
  username: string
  email: string
  password: string
  role: Role
}

export async function registerUser(body: RegisterBody): Promise<void> {
  await httpClient.post('/users', body)
}
