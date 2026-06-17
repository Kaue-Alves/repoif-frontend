import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import { resetPassword } from './resetPassword.service'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (newPassword !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setError('')
    setLoading(true)

    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Link inválido">
        <div className="text-center space-y-lg py-md">
          <p className="text-body-md text-on-surface-variant">
            Token não encontrado. Solicite um novo link de redefinição.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block w-full text-center bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            Solicitar novo link
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout title="Senha redefinida!">
        <div className="text-center space-y-lg py-md">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              lock_reset
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Sua senha foi alterada com sucesso. Faça login com a nova senha.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            Ir para o Login
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Redefinir senha" subtitle="Escolha uma nova senha para sua conta">
      <form onSubmit={handleSubmit} className="space-y-md">
        <Field label="Nova senha">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
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

        <Field label="Confirmar nova senha">
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
            required
            className={inputClass}
          />
        </Field>

        {error && (
          <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </AuthLayout>
  )
}

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-xs">
      <label className="block text-label-lg text-on-surface">{label}</label>
      {children}
    </div>
  )
}
