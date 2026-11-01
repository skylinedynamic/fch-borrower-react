import React from 'react'
import type { Meta } from '../../../modules/my-application/types'

interface SectionPaginationProps {
  meta?: Pick<Meta, 'last_page' | 'total' | 'from' | 'to'>
  page: number
  onPageChange: (page: number) => void
  /** Names the list for screen readers, e.g. "Funding applications". */
  label: string
}

/** The pages to show: the first, the last and the ones around the current page. */
const visiblePages = (page: number, last: number) =>
  Array.from({ length: last }, (_, i) => i + 1).filter((p) => p === 1 || p === last || (p >= page - 1 && p <= page + 1))

/** Pagination under a My Applications list; hidden while everything fits on one page. */
export default function SectionPagination({ meta, page, onPageChange, label }: SectionPaginationProps) {
  if (!meta || meta.last_page <= 1) return null

  const last = meta.last_page
  const pages = visiblePages(page, last)

  return (
    <nav className="ma-pagination" aria-label={`${label} pagination`}>
      <span>
        {meta.from && meta.to ? `Showing ${meta.from}–${meta.to} of ${meta.total}` : `Page ${page} of ${last}`}
      </span>
      <ul className="ma-pages">
        <li>
          <button type="button" className="ma-page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
            <i className="ri-arrow-left-s-line" aria-hidden="true"></i>
          </button>
        </li>
        {pages.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && (
              <li className="ma-page-gap" aria-hidden="true">…</li>
            )}
            <li>
              <button
                type="button"
                className={`ma-page-btn ${page === p ? 'is-active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={page === p ? 'page' : undefined}
              >
                {p}
              </button>
            </li>
          </React.Fragment>
        ))}
        <li>
          <button type="button" className="ma-page-btn" onClick={() => onPageChange(page + 1)} disabled={page === last} aria-label="Next page">
            <i className="ri-arrow-right-s-line" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    </nav>
  )
}
