import httpClient from '../../utils/httpClient'

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await httpClient.post('/auth/reset-password', { token, newPassword })
}
