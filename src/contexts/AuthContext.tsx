import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { clearToken, getStoredExpiry, getStoredToken, storeToken } from '../utils/httpClient'

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface AuthUser {
  sub: string
  username: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  /** Armazena o token e devolve o usuário decodificado (para redirecionar por papel). */
  login: (token: string, expiresIn: number) => AuthUser | null
  logout: () => void
}

export function decodeJWT(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    )
    const payload = JSON.parse(json)
    if (!payload.username || !payload.role) return null
    return { sub: payload.sub ?? '', username: payload.username, role: payload.role }
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

// setTimeout satura em ~24,8 dias; acima disso o timer de expiração não é necessário.
const MAX_TIMEOUT_MS = 2 ** 31 - 1

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken()
    return t ? decodeJWT(t) : null
  })

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setUser(null)
  }, [])

  // Desloga no instante em que o token expira, em vez de deixar a sessão apodrecer.
  useEffect(() => {
    if (!token) return
    const expiry = getStoredExpiry()
    if (!expiry) return
    const ms = expiry - Date.now()
    if (ms <= 0) {
      logout()
      return
    }
    if (ms > MAX_TIMEOUT_MS) return
    const timer = setTimeout(logout, ms)
    return () => clearTimeout(timer)
  }, [token, logout])

  const login = useCallback((newToken: string, expiresIn: number): AuthUser | null => {
    storeToken(newToken, expiresIn)
    const decoded = decodeJWT(newToken)
    setToken(newToken)
    setUser(decoded)
    return decoded
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: !!token, login, logout }),
    [user, token, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
