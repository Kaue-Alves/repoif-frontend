import httpClient from '../../utils/httpClient'

export async function verifyEmail(token: string): Promise<void> {
  await httpClient.get(`/auth/verify-email?token=${token}`)
}
