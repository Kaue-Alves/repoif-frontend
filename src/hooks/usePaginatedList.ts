import { useEffect, useRef, useState } from 'react'
import type { PageMeta, Paginated } from '../utils/pagination'

interface Options {
  limit?: number
  /** Termos mais curtos que isto são tratados como busca vazia (ex.: diretório exige 2). */
  minSearchLength?: number
  debounceMs?: number
  /** Valores extras que devem refazer o fetch quando mudam (ex.: classroomId). */
  deps?: readonly unknown[]
}

/**
 * Lista paginada com busca debounced, cancelamento e recarga — o padrão que antes
 * estava copiado à mão em Dashboard, ClassroomList, ClassroomDetail e TeacherDirectory.
 *
 * Erro nunca vira lista vazia silenciosa: `error` é exposto separadamente para a
 * tela distinguir "falhou" de "não tem nada".
 */
export function usePaginatedList<T>(
  fetcher: (page: number, limit: number, search: string) => Promise<Paginated<T>>,
  { limit = 12, minSearchLength = 0, debounceMs = 300, deps = [] }: Options = {},
) {
  const [items, setItems] = useState<T[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  // O fetcher costuma ser recriado a cada render; a ref evita refetch por identidade.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = search.trim()
      setActiveSearch(trimmed.length >= minSearchLength ? trimmed : '')
      setPage(1)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [search, debounceMs, minSearchLength])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetcherRef
      .current(page, limit, activeSearch)
      .then((res) => {
        if (cancelled) return
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setItems([])
        setMeta(null)
        setError(err instanceof Error ? err.message : 'Erro ao carregar a lista.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, activeSearch, reloadKey, ...deps])

  function reload() {
    setReloadKey((k) => k + 1)
  }

  /** Após excluir um item: volta uma página se ela ficou vazia, senão recarrega. */
  function reloadAfterRemove() {
    if (items.length === 1 && page > 1) setPage((p) => p - 1)
    else reload()
  }

  return {
    items,
    meta,
    loading,
    error,
    search,
    setSearch,
    activeSearch,
    page,
    setPage,
    reload,
    reloadAfterRemove,
  }
}
