import { Link, useLocation, useNavigate } from 'react-router-dom'

interface BackLinkProps {
  /** Rota usada quando não há histórico — link colado, F5, aba nova. */
  fallbackTo: string
  /** Rótulo do destino padrão (ex.: "Turmas"). Usado só no modo fallback. */
  fallbackLabel: string
  className?: string
}

/**
 * Botão "voltar" que respeita de onde o usuário veio: uma disciplina aberta a
 * partir de uma turma volta para a turma, não para o dashboard.
 *
 * `location.key === 'default'` é como o React Router sinaliza a primeira entrada
 * da sessão — aí não há para onde voltar e usamos o fallback. Sem essa checagem,
 * `navigate(-1)` num link de convite colado joga o usuário para fora do app.
 */
export default function BackLink({ fallbackTo, fallbackLabel, className = '' }: BackLinkProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const base =
    'inline-flex items-center gap-xs text-label-lg text-on-surface-variant hover:text-on-surface transition-colors'
  const icon = (
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
      arrow_back
    </span>
  )

  if (location.key === 'default') {
    return (
      <Link to={fallbackTo} className={`${base} ${className}`}>
        {icon}
        {fallbackLabel}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={`${base} ${className}`}>
      {icon}
      Voltar
    </button>
  )
}
