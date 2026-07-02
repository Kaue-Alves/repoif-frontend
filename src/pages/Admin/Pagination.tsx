import type { PageMeta } from './admin.service'

interface PaginationProps {
  meta: PageMeta
  onPageChange: (page: number) => void
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-md pt-md">
      <p className="text-label-sm text-on-surface-variant">
        Página {meta.page} de {meta.totalPages} · {meta.total} no total
      </p>
      <div className="flex items-center gap-sm">
        <button
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevPage}
          className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          Anterior
        </button>
        <button
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
          className="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próxima
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
