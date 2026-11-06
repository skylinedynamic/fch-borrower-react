import React from 'react'

interface CreditAccountsPaginationProps {
  page: number
  lastPage: number
  onPage: (page: number) => void
}

/** The first, the last, and the pages around the current one, with gaps between. */
export const visiblePages = (page: number, lastPage: number): number[] =>
  Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === lastPage || (p >= page - 1 && p <= page + 1))

export default function CreditAccountsPagination({ page, lastPage, onPage }: CreditAccountsPaginationProps) {
  if (lastPage <= 1) return null
  const pages = visiblePages(page, lastPage)

  return (
    <nav className="ca-pagination" aria-label="Credit account pages">
      <button type="button" className="ca-pg-btn" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <i className="ri-arrow-left-s-line" aria-hidden="true"></i>
      </button>
      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && pages[i - 1] !== p - 1 && <span className="ca-page-gap" aria-hidden="true">…</span>}
          <button
            type="button"
            className={`ca-pg-btn${p === page ? ' is-current' : ''}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        </React.Fragment>
      ))}
      <button type="button" className="ca-pg-btn" aria-label="Next page" disabled={page === lastPage} onClick={() => onPage(page + 1)}>
        <i className="ri-arrow-right-s-line" aria-hidden="true"></i>
      </button>
    </nav>
  )
}
