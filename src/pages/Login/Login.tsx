import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { loginUser } from './login.service'

function decodeRole(token: string): { role: string; username: string } {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    )
    const payload = JSON.parse(json)
    return { role: payload.role ?? '', username: payload.username ?? '' }
  } catch {
    return { role: '', username: '' }
  }
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !password) return
    setError('')
    setLoading(true)

    try {
      const isEmail = identifier.includes('@')
      const body = isEmail
        ? { email: identifier.trim(), password }
        : { username: identifier.trim(), password }

      const { token, expiresIn } = await loginUser(body)
      login(token, expiresIn)

      const { role, username } = decodeRole(token)
      navigate(role === 'TEACHER' ? '/dashboard' : `/profile/${username}`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(translateError(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Entrar na conta" subtitle="Acesse com username ou email">
      <form onSubmit={handleSubmit} className="space-y-md">
        <Field label="Username ou email">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Ex: joaosilva ou joao@email.com"
            autoComplete="username"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Senha">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </Field>

        {error && <ErrorBox message={error} />}

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-label-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={primaryBtn}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-sm">
              <Spinner className="h-4 w-4" /> Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <p className="mt-lg text-center text-body-md text-on-surface-variant">
        Não tem conta?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

const primaryBtn =
  'w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-xs">
      <label className="block text-label-lg text-on-surface">{label}</label>
      {children}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
      <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>
        error
      </span>
      {message}
    </div>
  )
}

function translateError(msg: string): string {
  const map: Record<string, string> = {
    Unauthorized: 'Credenciais inválidas. Verifique username/email e senha.',
    'Invalid credentials': 'Credenciais inválidas.',
    'Email not verified': 'Email não verificado. Acesse sua caixa de entrada e confirme o email.',
    'User not found': 'Usuário não encontrado.',
  }
  return map[msg] ?? msg
}
