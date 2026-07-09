/** Fonte única do formato de paginação da API (antes duplicado em 5 arquivos). */
export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

/** Meta calculada no cliente, para listas que a API devolve inteiras (arquivos, trabalhos). */
export function clientPageMeta(page: number, limit: number, total: number): PageMeta {
  const totalPages = Math.ceil(total / limit) || 0
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
