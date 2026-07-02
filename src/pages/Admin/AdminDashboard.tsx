import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import Spinner from '../../components/Spinner'
import { getStats, type AdminStats } from './admin.service'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex justify-center py-xl">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-sm bg-error-container text-on-error-container rounded-lg px-md py-sm text-body-md">
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 18 }}>error</span>
          {error}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {/* Usuários */}
          <StatCard icon="group" title="Usuários" to="/admin/users">
            <BigNumber value={stats.users.total} label="ativos" />
            <div className="flex flex-wrap gap-x-lg gap-y-xs text-label-sm text-on-surface-variant mt-md">
              <span>{stats.users.byRole.admins} admins</span>
              <span>{stats.users.byRole.teachers} professores</span>
              <span>{stats.users.byRole.students} alunos</span>
              {stats.users.deleted > 0 && (
                <span className="text-error">{stats.users.deleted} excluídos</span>
              )}
            </div>
          </StatCard>

          {/* Arquivos */}
          <StatCard icon="folder" title="Arquivos" to="/admin/files">
            <BigNumber value={stats.files.total} label="ativos" />
            <div className="flex flex-wrap gap-x-lg gap-y-xs text-label-sm text-on-surface-variant mt-md">
              {stats.files.deleted > 0 ? (
                <span className="text-error">{stats.files.deleted} excluídos</span>
              ) : (
                <span>Nenhum excluído</span>
              )}
            </div>
          </StatCard>

          {/* Denúncias */}
          <StatCard icon="flag" title="Denúncias" to="/admin/reports">
            <BigNumber value={stats.reports.total} label="no total" />
            <div className="flex flex-wrap gap-x-lg gap-y-xs text-label-sm mt-md">
              {stats.reports.pending > 0 ? (
                <span className="text-error font-medium">{stats.reports.pending} pendentes</span>
              ) : (
                <span className="text-on-surface-variant">Nenhuma pendente</span>
              )}
            </div>
          </StatCard>
        </div>
      ) : null}
    </AdminLayout>
  )
}

function StatCard({
  icon,
  title,
  to,
  children,
}: {
  icon: string
  title: string
  to: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex items-center gap-sm mb-md">
        <div className="w-10 h-10 rounded-lg bg-primary-container/30 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <h2 className="text-headline-sm text-on-surface">{title}</h2>
      </div>
      {children}
    </Link>
  )
}

function BigNumber({ value, label }: { value: number; label: string }) {
  return (
    <p className="text-on-surface">
      <span className="text-headline-lg">{value}</span>{' '}
      <span className="text-body-md text-on-surface-variant">{label}</span>
    </p>
  )
}
