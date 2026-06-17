import httpClient from '../../utils/httpClient'

export interface LoginBody {
  email?: string
  username?: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
}

export async function loginUser(body: LoginBody): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', body)
  return data
}
