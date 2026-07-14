import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Field from '../../components/Field'
import { resendVerification } from './resendVerification.service'

/**
 * Saída para quem não recebeu (ou deixou vencer) o link de verificação. Sem esta
 * tela a conta fica trancada: o login barra quem não verificou e o recadastro
 * esbarra no username já em uso.
 */
export default function ResendVerification() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resendVerification(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar o e-mail.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="E-mail enviado">
        <div className="text-center space-y-lg py-md">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
            >
              forward_to_inbox
            </span>
          </div>
          <div className="space-y-sm">
            <p className="text-body-lg text-on-surface font-medium">Verifique sua caixa de entrada</p>
            <p className="text-body-md text-on-surface-variant">
              Se o e-mail <strong className="text-on-surface">{email}</strong> tiver uma conta ainda
              não verificada, você receberá um novo link de verificação. O link vale 24 horas.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Não esqueça de conferir a caixa de spam.
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
      title="Reenviar verificação"
      subtitle="Informe seu e-mail e enviaremos um novo link de verificação"
    >
      <form onSubmit={handleSubmit} className="space-y-md">
        <Field label="E-mail">
          {(id) => (
            <input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          )}
        </Field>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md"
          >
            <span aria-hidden="true" className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>
              error
            </span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Reenviar link de verificação'}
        </button>
      </form>

      <p className="mt-lg text-center text-body-md text-on-surface-variant">
        Já verificou sua conta?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
