const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const TOKEN_KEY = 'repoif_token'
const EXPIRY_KEY = 'repoif_expiry'

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(EXPIRY_KEY)
  if (token && expiry && Date.now() < Number(expiry)) return token
  return null
}

export function storeToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

function extractMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Erro desconhecido'
  const d = data as Record<string, unknown>
  if (Array.isArray(d.message)) return (d.message as string[]).join('. ')
  if (typeof d.message === 'string') return d.message
  return 'Erro desconhecido'
}

interface ApiError extends Error {
  status: number
}

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown
    auth?: boolean
    multipart?: boolean
  } = {}
): Promise<T> {
  const { body, auth = true, multipart = false } = options

  const headers: Record<string, string> = {}
  if (!multipart) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getStoredToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? (multipart ? (body as FormData) : JSON.stringify(body)) : undefined,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(extractMessage(data)) as ApiError
    err.status = res.status
    throw err
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, auth = true) =>
    request<T>('GET', path, { auth }),

  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>('POST', path, { body, auth }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>('PATCH', path, { body, auth: true }),

  delete: <T>(path: string) =>
    request<T>('DELETE', path, { auth: true }),

  upload: <T>(path: string, formData: FormData, auth = false) =>
    request<T>('POST', path, { body: formData, auth, multipart: true }),
}
