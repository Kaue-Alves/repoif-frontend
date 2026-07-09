import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Sem isto, qualquer exceção durante o render desmonta a árvore inteira e o usuário
 * vê uma página em branco, sem nenhuma pista do que aconteceu.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na interface:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-lg">
        <div className="max-w-md w-full text-center space-y-lg">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-error-container" style={{ fontSize: 40 }}>
                error
              </span>
            </div>
          </div>

          <div className="space-y-sm">
            <h1 className="text-headline-md text-on-surface">Algo deu errado</h1>
            <p className="text-body-md text-on-surface-variant">
              Não foi possível exibir esta página. Tente recarregar; se o problema continuar, avise o suporte.
            </p>
          </div>

          <p className="text-label-sm text-on-surface-variant font-mono bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm break-words text-left">
            {error.message}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-sm pt-sm">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-xs px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              Recarregar página
            </button>
            <a
              href="/"
              className="flex items-center gap-xs px-lg py-sm border border-outline-variant text-on-surface rounded-lg text-label-lg font-semibold hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    )
  }
}
