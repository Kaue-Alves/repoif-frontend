import { Link } from 'react-router-dom'
import { listTeachers, type TeacherListItem } from '../pages/Search/search.service'
import { useAuth } from '../contexts/AuthContext'
import { usePaginatedList } from '../hooks/usePaginatedList'
import Spinner from './Spinner'

const PAGE_LIMIT = 12

/**
 * Diretório público de professores: campo de busca, grade de cards e paginação.
 * Auto-suficiente (faz o próprio fetch); reutilizável na home e no perfil do aluno.
 */
export default function TeacherDirectory() {
  const { user } = useAuth()
  const isStudent = user?.role === 'STUDENT'

  const {
    items: teachers,
    meta,
    loading,
    error,
    search: query,
    setSearch: setQuery,
    activeSearch,
    setPage,
  } = usePaginatedList((page, limit, search) => listTeachers(page, limit, search), {
    limit: PAGE_LIMIT,
    minSearchLength: 2,
  })

  const hasResults = teachers.length > 0

  return (
    <div className="space-y-xl">
      {/* Search input */}
      <div className="relative max-w-xl mx-auto">
        <span aria-hidden="true"
          className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          style={{ fontSize: 20 }}
        >
          search
        </span>
        <input aria-label="Buscar professor pelo nome"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar professor pelo nome..."
          className="w-full pl-[44px] pr-[44px] py-md bg-surface-container-lowest border border-outline-variant rounded-xl text-body-lg text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
        />
        {loading && (
          <span className="absolute right-md top-1/2 -translate-y-1/2">
            <Spinner className="h-5 w-5 text-primary" />
          </span>
        )}
      </div>

      {query.trim().length === 1 && (
        <p className="text-center text-label-sm text-on-surface-variant">
          Digite pelo menos 2 caracteres para filtrar pelo nome.
        </p>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-xl">
          <span aria-hidden="true" className="material-symbols-outlined text-error block mb-sm" style={{ fontSize: 48 }}>
            error
          </span>
          <p className="text-body-md text-on-surface-variant">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !hasResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[92px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && !hasResults && (
        <div className="text-center py-xl">
          <span aria-hidden="true" className="material-symbols-outlined text-outline block mb-sm" style={{ fontSize: 48 }}>
            person_search
          </span>
          <p className="text-body-md text-on-surface-variant">
            {activeSearch
              ? `Nenhum professor encontrado para "${activeSearch}".`
              : isStudent
                ? 'Você ainda não tem vínculo com nenhum professor. Entre em uma turma para vê-los aqui.'
                : 'Nenhum professor cadastrado ainda.'}
          </p>
        </div>
      )}

      {/* Results grid */}
      {hasResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-md pt-sm">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!meta.hasPrevPage || loading}
            className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant text-label-lg text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            Anterior
          </button>

          <span className="text-label-lg text-on-surface-variant">
            Página {meta.page} de {meta.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
            className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant text-label-lg text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próximo
            <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  )
}

function TeacherCard({ teacher }: { teacher: TeacherListItem }) {
  const initial = teacher.username.trim().charAt(0).toUpperCase() || '?'
  const count = teacher.publicSubjectsCount

  return (
    <Link
      to={`/profile/${teacher.username}`}
      className="flex items-center gap-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container-low hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
        <span className="text-headline-sm text-on-primary-container font-bold leading-none">{initial}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-lg text-on-surface group-hover:text-primary transition-colors truncate">
          @{teacher.username}
        </p>
        <p className="text-label-sm text-on-surface-variant">
          {count} {count === 1 ? 'disciplina pública' : 'disciplinas públicas'}
        </p>
      </div>
      <span aria-hidden="true"
        className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors flex-shrink-0"
        style={{ fontSize: 20 }}
      >
        chevron_right
      </span>
    </Link>
  )
}
