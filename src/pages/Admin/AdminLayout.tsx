import { NavLink } from 'react-router-dom'
import AppLayout from '../../components/layouts/AppLayout'

interface AdminLayoutProps {
  children: React.ReactNode
}

const TABS = [
  { to: '/admin', label: 'Dashboard', icon: 'monitoring', end: true },
  { to: '/admin/users', label: 'Usuários', icon: 'group', end: false },
  { to: '/admin/files', label: 'Arquivos', icon: 'folder', end: false },
  { to: '/admin/reports', label: 'Denúncias', icon: 'flag', end: false },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AppLayout>
      <div className="space-y-lg">
        <div className="flex items-center gap-sm">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
          >
            admin_panel_settings
          </span>
          <h1 className="text-headline-lg text-on-surface">Administração</h1>
        </div>

        <nav className="flex gap-xs overflow-x-auto border-b border-outline-variant">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-xs px-md py-sm text-label-lg whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {children}
      </div>
    </AppLayout>
  )
}
