import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { clearToken, getStoredToken, storeToken } from '../utils/httpClient'

export type UserRole = 'TEACHER' | 'STUDENT'

export interface AuthUser {
  sub: string
  username: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, expiresIn: number) => void
  logout: () => void
}

function decodeJWT(token: string): AuthUser | null {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken()
    return t ? decodeJWT(t) : null
  })

  useEffect(() => {
    const stored = getStoredToken()
    if (!stored) {
      setToken(null)
      setUser(null)
    }
  }, [])

  const login = useCallback((newToken: string, expiresIn: number) => {
    storeToken(newToken, expiresIn)
    setToken(newToken)
    setUser(decodeJWT(newToken))
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setUser(null)
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
