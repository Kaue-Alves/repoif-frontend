import axios from 'axios'

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

const baseURL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

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
    const raw = error.response?.data?.message ?? error.response?.data ?? error.message ?? 'Erro desconhecido'
    const message = Array.isArray(raw) ? (raw as string[]).join('. ') : String(raw)
    return Promise.reject(new Error(message))
  }
)

export default httpClient
