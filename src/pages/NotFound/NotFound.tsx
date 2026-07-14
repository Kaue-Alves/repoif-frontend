import { Link } from 'react-router-dom'
import AppLayout from '../../components/layouts/AppLayout'

export default function NotFound() {
  return (
    <AppLayout>
      <div className="max-w-md mx-auto text-center space-y-lg py-xl">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
            <span aria-hidden="true"
              className="material-symbols-outlined text-on-primary-container"
              style={{ fontSize: 40 }}
            >
              travel_explore
            </span>
          </div>
        </div>

        <div className="space-y-sm">
          <p className="text-headline-lg text-primary font-black">404</p>
          <h1 className="text-headline-md text-on-surface">Página não encontrada</h1>
          <p className="text-body-md text-on-surface-variant">
            A página que você procura não existe, foi movida ou o endereço está incorreto.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-sm pt-sm">
          <Link
            to="/"
            className="flex items-center gap-xs px-lg py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
            Voltar ao início
          </Link>
          <Link
            to="/search"
            className="flex items-center gap-xs px-lg py-sm border border-outline-variant text-on-surface rounded-lg text-label-lg font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            Buscar professores
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
