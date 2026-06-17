import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import { requestPasswordReset } from './forgotPassword.service'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Email enviado">
        <div className="text-center space-y-lg py-md">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto">
            <span
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              forward_to_inbox
            </span>
          </div>
          <div className="space-y-sm">
            <p className="text-body-lg text-on-surface font-medium">Verifique sua caixa de entrada</p>
            <p className="text-body-md text-on-surface-variant">
              Se o email <strong className="text-on-surface">{email}</strong> estiver cadastrado,
              você receberá um link para redefinir sua senha.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-block w-full text-center border border-outline-variant text-on-surface py-sm rounded-lg text-label-lg hover:bg-surface-container-low transition-all"
          >
            Voltar ao Login
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Esqueceu a senha?"
      subtitle="Informe seu email e enviaremos um link de redefinição"
    >
      <form onSubmit={handleSubmit} className="space-y-md">
        <div className="space-y-xs">
          <label className="block text-label-lg text-on-surface">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

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
          {loading ? 'Enviando...' : 'Enviar link de redefinição'}
        </button>
      </form>

      <p className="mt-lg text-center text-body-md text-on-surface-variant">
        Lembrou a senha?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
