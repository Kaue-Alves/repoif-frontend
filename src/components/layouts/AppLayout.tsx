import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant shadow-sm">
        <div className="max-w-[1280px] mx-auto h-16 px-gutter flex items-center justify-between">
          {/* Logo */}
          <Link to={user?.role === 'TEACHER' ? '/dashboard' : `/profile/${user?.username}`} className="flex items-center gap-sm">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary"
                style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <span className="text-headline-sm text-primary font-black tracking-tight">RepoIF</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-xs">
            {user?.role === 'TEACHER' && (
              <Link
                to="/dashboard"
                className="flex items-center gap-xs px-md py-xs rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span>
                Disciplinas
              </Link>
            )}
            {user && (
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-xs px-md py-xs rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
                Meu Perfil
              </Link>
            )}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-sm">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-label-lg text-on-surface leading-none">@{user?.username}</span>
              <span className="text-label-sm text-on-surface-variant">
                {user?.role === 'TEACHER' ? 'Professor' : 'Aluno'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-label-lg text-primary-container font-bold text-xs">
                {user?.username?.slice(0, 2).toUpperCase()}
              </span>
              <span
                className="material-symbols-outlined text-on-primary-container"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
              >
                person
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-xs px-md py-xs rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              title="Sair"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-gutter py-xl">
          {children}
        </div>
      </main>

      <footer className="border-t border-outline-variant py-md px-gutter text-center text-label-sm text-on-surface-variant">
        RepoIF — IFPI Campus Picos
      </footer>
    </div>
  )
}
