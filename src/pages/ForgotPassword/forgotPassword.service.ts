import httpClient from '../../utils/httpClient'

export async function requestPasswordReset(email: string): Promise<void> {
  await httpClient.post('/auth/forgot-password', { email })
}
