import httpClient from '../../utils/httpClient'

export async function resendVerification(email: string): Promise<void> {
  await httpClient.post('/auth/resend-verification', { email })
}
