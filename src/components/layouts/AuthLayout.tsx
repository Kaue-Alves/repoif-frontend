import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-md py-xl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-xl">
          <Link to="/" className="inline-flex flex-col items-center gap-xs">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span
                className="material-symbols-outlined text-on-primary"
                style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <span className="text-headline-sm text-primary font-black tracking-tight">RepoIF</span>
            <span className="text-label-sm text-on-surface-variant">Organize. Compartilhe. Estude.</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
          <div className="mb-lg">
            <h1 className="text-headline-sm text-on-surface">{title}</h1>
            {subtitle && <p className="text-body-md text-on-surface-variant mt-xs">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
