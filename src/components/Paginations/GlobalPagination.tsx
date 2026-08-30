import React from 'react'

export interface MetaLink {
  url: string | null
  label: string
  active: boolean
}

export interface Meta {
  current_page: number
  from: number
  to: number
  per_page: number
  total: number
  last_page: number
  next_page_url: string | null
  prev_page_url: string | null
  links: MetaLink[]
}

interface GlobalPaginationProps {
  meta: Meta | undefined
  onPageChange: (page: number) => void
}

export default function GlobalPagination({ meta, onPageChange }: GlobalPaginationProps) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div className="text-muted fs-14">
        Showing <span className="fw-semibold">{meta.from || 0}</span> to <span className="fw-semibold">{meta.to || 0}</span> of <span className="fw-semibold">{meta.total}</span> entries
      </div>
      <ul className="pagination pagination-separated pagination-sm mb-0">
        {meta.links.map((link, index) => {
          // Attempt to parse the page number from the URL
          let pageNumber: number | null = null;
          if (link.url) {
            try {
              const url = new URL(link.url);
              const pageParam = url.searchParams.get('page');
              if (pageParam) {
                pageNumber = parseInt(pageParam, 10);
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          }

          // Format labels (e.g. replace "&laquo; Previous" with icon or cleaner text)
          let label = link.label
          if (label.includes('Previous')) {
            label = '<i class="ri-arrow-left-s-line"></i>'
          } else if (label.includes('Next')) {
            label = '<i class="ri-arrow-right-s-line"></i>'
          }

          return (
            <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => link.url && pageNumber && onPageChange(pageNumber)}
                dangerouslySetInnerHTML={{ __html: label }}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
