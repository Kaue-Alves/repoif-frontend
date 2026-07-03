import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/layouts/AppLayout'
import Spinner from '../../components/Spinner'
import { joinClassroomByInvite, type JoinResult } from './classrooms.service'

export default function JoinClassroom() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<JoinResult | null>(null)
  const [error, setError] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (!token || done.current) return
    done.current = true
    joinClassroomByInvite(token)
      .then(setResult)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao entrar na turma.'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <AppLayout>
      <div className="max-w-md mx-auto text-center py-xl">
        {loading && (
          <div className="flex flex-col items-center gap-md text-on-surface-variant">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-body-md">Processando seu convite...</p>
          </div>
        )}

        {!loading && error && (
          <div>
            <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-md">
              <span
                className="material-symbols-outlined text-on-error-container"
                style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
              >
                link_off
              </span>
            </div>
            <h1 className="text-headline-sm text-on-surface mb-xs">Não foi possível entrar</h1>
            <p className="text-body-md text-on-surface-variant mb-lg">{error}</p>
            <Link
              to="/classrooms"
              className="inline-flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>groups</span>
              Ir para minhas turmas
            </Link>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-md">
              <span
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
              >
                hourglass_top
              </span>
            </div>
            <h1 className="text-headline-sm text-on-surface mb-xs">Pedido enviado!</h1>
            <p className="text-body-md text-on-surface-variant mb-xs">
              Você pediu para entrar na turma <strong>{result.classroom.name}</strong>.
            </p>
            <p className="text-body-md text-on-surface-variant mb-lg">{result.message}</p>
            <Link
              to="/classrooms"
              className="inline-flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-xl text-label-lg font-semibold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>groups</span>
              Ir para minhas turmas
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
