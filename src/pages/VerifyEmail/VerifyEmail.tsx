import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/layouts/AuthLayout'
import Spinner from '../../components/Spinner'
import { verifyEmail } from './verifyEmail.service'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Token não encontrado na URL.')
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Token inválido ou expirado.')
      })
  }, [token])

  return (
    <AuthLayout title="Verificação de email">
      <div className="text-center space-y-lg py-md">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mx-auto">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
            <p className="text-body-md text-on-surface-variant">Verificando seu email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto">
              <span aria-hidden="true"
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
            <div className="space-y-sm">
              <p className="text-body-lg text-on-surface font-medium">Email verificado com sucesso!</p>
              <p className="text-body-md text-on-surface-variant">
                Agora você pode fazer login na plataforma.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all text-center"
            >
              Ir para o Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto">
              <span aria-hidden="true"
                className="material-symbols-outlined text-on-error-container"
                style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
            </div>
            <div className="space-y-sm">
              <p className="text-body-lg text-on-surface font-medium">Não foi possível verificar</p>
              <p className="text-body-md text-on-surface-variant">{errorMsg}</p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-primary text-on-primary py-sm rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all text-center"
            >
              Voltar ao Login
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
