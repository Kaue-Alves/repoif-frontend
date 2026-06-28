import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface AppLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  to: string
  label: string
  icon: string
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  const logoHref = !user ? '/search' : user.role === 'TEACHER' ? '/dashboard' : `/profile/${user.username}`

  const navItems: NavItem[] = [
    { to: '/search', label: 'Buscar', icon: 'search' },
    ...(user?.role === 'TEACHER' ? [{ to: '/dashboard', label: 'Disciplinas', icon: 'dashboard' }] : []),
    ...(user ? [{ to: `/profile/${user.username}`, label: 'Meu Perfil', icon: 'person' }] : []),
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant shadow-sm">
        <div className="max-w-[1280px] mx-auto h-16 px-gutter flex items-center justify-between">
          {/* Logo */}
          <Link to={logoHref} onClick={() => setMenuOpen(false)} className="flex items-center">
            <img src="/images/repoif-lockup-blue.svg" alt="RepoIF" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-xs">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-xs px-md py-xs rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-sm">
            {user ? (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-label-lg text-on-surface leading-none max-w-[120px] sm:max-w-none truncate">
                    @{user.username}
                  </span>
                  <span className="hidden sm:block text-label-sm text-on-surface-variant">
                    {user.role === 'TEACHER' ? 'Professor' : 'Aluno'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-on-primary-container"
                    style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                  >
                    person
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-xs px-md py-xs rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                  title="Sair"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                Entrar
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav className="md:hidden border-t border-outline-variant bg-surface px-gutter py-sm flex flex-col gap-xs">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-sm px-md py-sm rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="h-px bg-outline-variant my-xs" />

            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-sm px-md py-sm rounded-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                Sair
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-sm px-md py-sm bg-primary text-on-primary rounded-lg text-label-lg font-semibold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>login</span>
                Entrar
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-gutter py-xl">
          {children}
        </div>
      </main>

      <footer className="border-t border-outline-variant py-md px-gutter text-center text-label-sm text-on-surface-variant">
        RepoIF: Organize. Compartilhe. Estude. — Desenvolvido com ☕ por Kauê Alves S, 2026.
      </footer>
    </div>
  )
}
