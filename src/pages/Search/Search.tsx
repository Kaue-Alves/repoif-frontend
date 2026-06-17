import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchTeachers, type TeacherResult } from '../../api/users'
import AppLayout from '../../components/layouts/AppLayout'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TeacherResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchTeachers(query)
        setResults(data)
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-xl">
        <div className="text-center space-y-sm">
          <h1 className="text-headline-lg text-on-surface">Buscar professores</h1>
          <p className="text-body-md text-on-surface-variant">
            Encontre professores e acesse suas disciplinas e materiais.
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <span
            className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            style={{ fontSize: 20 }}
          >
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o nome de um professor..."
            autoFocus
            className="w-full pl-[44px] pr-[44px] py-md bg-surface-container-lowest border border-outline-variant rounded-xl text-body-lg text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
          />
          {loading && (
            <svg
              className="animate-spin h-5 w-5 absolute right-md top-1/2 -translate-y-1/2 text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
        </div>

        {/* Hint */}
        {!searched && query.length > 0 && query.length < 2 && (
          <p className="text-center text-label-sm text-on-surface-variant">
            Digite pelo menos 2 caracteres para buscar.
          </p>
        )}

        {/* Empty state */}
        {searched && results.length === 0 && (
          <div className="text-center py-xl">
            <span
              className="material-symbols-outlined text-outline block mb-sm"
              style={{ fontSize: 48 }}
            >
              person_search
            </span>
            <p className="text-body-md text-on-surface-variant">
              Nenhum professor encontrado para "{query}".
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ul className="space-y-sm">
            {results.map((teacher) => (
              <li key={teacher.id}>
                <Link
                  to={`/profile/${teacher.username}`}
                  className="flex items-center gap-md p-md bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container-low hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                    <span
                      className="material-symbols-outlined text-on-primary-container"
                      style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                    >
                      school
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg text-on-surface group-hover:text-primary transition-colors">
                      @{teacher.username}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">Professor</p>
                  </div>
                  <span
                    className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors"
                    style={{ fontSize: 20 }}
                  >
                    chevron_right
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}
