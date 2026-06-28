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
            <img
              src="/images/repoif-app-icon.svg"
              alt="RepoIF"
              className="w-14 h-14 rounded-xl shadow-md"
            />
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
