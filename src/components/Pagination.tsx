import type { PageMeta } from '../utils/pagination'

export type { PageMeta } from '../utils/pagination'

interface PaginationProps {
  meta: PageMeta
  loading?: boolean
  onPageChange: (page: number) => void
}

/** Controle de paginação reutilizável (Anterior / Próxima) com contador. */
export default function Pagination({ meta, loading, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-md pt-lg">
      <p className="text-label-sm text-on-surface-variant">
        Página {meta.page} de {meta.totalPages} · {meta.total} no total
      </p>
      <div className="flex items-center gap-sm">
        <button
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevPage || loading}
          className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          Anterior
        </button>
        <button
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage || loading}
          className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próxima
          <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
