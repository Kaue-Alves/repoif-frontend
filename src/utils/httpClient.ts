import axios from 'axios'

const TOKEN_KEY = 'repoif_token'
const EXPIRY_KEY = 'repoif_expiry'

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = getStoredExpiry()
  if (token && expiry && Date.now() < expiry) return token
  return null
}

/** Instante (epoch ms) em que o token armazenado expira, ou null se não há token. */
export function getStoredExpiry(): number | null {
  const expiry = localStorage.getItem(EXPIRY_KEY)
  return expiry ? Number(expiry) : null
}

export function storeToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

const baseURL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
  throw new Error(`VITE_API_URL deve ser uma URL absoluta (ex: https://api.exemplo.com). Valor atual: "${baseURL}"`)
}

const httpClient = axios.create({ baseURL })

httpClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sessão expirada/invalidada: um 401 com token armazenado significa que o backend
    // rejeitou a credencial. Sem isto o usuário fica preso num app "logado" onde tudo
    // falha. A checagem do pathname evita loop e não interfere no 401 de senha errada
    // do próprio formulário de login (que acontece sem token armazenado).
    if (
      error.response?.status === 401 &&
      localStorage.getItem(TOKEN_KEY) &&
      !window.location.pathname.startsWith('/login')
    ) {
      clearToken()
      window.location.assign('/login?expired=1')
    }

    const raw = error.response?.data?.message ?? error.response?.data ?? error.message ?? 'Erro desconhecido'
    const message = Array.isArray(raw) ? (raw as string[]).join('. ') : String(raw)
    return Promise.reject(new Error(message))
  }
)

export default httpClient
