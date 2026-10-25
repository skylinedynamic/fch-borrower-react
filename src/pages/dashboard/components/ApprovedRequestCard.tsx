import React from 'react'
import type { ActiveFundingRequest } from '../../../modules/dashboard/types'

interface ApprovedRequestCardProps {
  request: ActiveFundingRequest
  index: number
  count: number
  onPrev: () => void
  onNext: () => void
  onProcess: () => void
}

/**
 * Full-width "Next Step" banner for an approved funding request waiting on the
 * borrower's funding application, with paging when there are several.
 */
export default function ApprovedRequestCard({ request, index, count, onPrev, onNext, onProcess }: ApprovedRequestCardProps) {
  const atFirst = index === 0
  const atLast = index === count - 1

  return (
    <section className="db-approved" data-widget="approved-request" aria-labelledby="db-approved-title">
      <div className="db-approved-head">
        <span className="db-approved-icon" aria-hidden="true">
          <i className="ri-checkbox-circle-line"></i>
        </span>
        <div className="min-w-0">
          <h2 id="db-approved-title" className="db-approved-eyebrow">
            Next Step
          </h2>
          <p className="db-approved-title">
            {count > 1 ? `${count} Applications Ready to Process` : 'Application Ready to Process'}
          </p>
          <p className="db-approved-text">Complete your Funding Application to continue.</p>
        </div>
      </div>

      <dl className="db-approved-facts">
        <div>
          <dt>Funding Type</dt>
          <dd>{request.funding_type || 'N/A'}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>${Number(request.requested_amount || 0).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="db-approved-actions">
        <button type="button" className="db-approved-btn" onClick={onProcess}>
          Process Funding Application
          <i className="ri-arrow-right-line ms-1" aria-hidden="true"></i>
        </button>

        {count > 1 && (
          <div className="db-pager">
            <button type="button" className="db-pager-btn" onClick={onPrev} disabled={atFirst}>
              <i className="ri-arrow-left-s-line" aria-hidden="true"></i> Prev
            </button>
            <span className="db-pager-count">
              {index + 1} / {count}
            </span>
            <button type="button" className="db-pager-btn" onClick={onNext} disabled={atLast}>
              Next <i className="ri-arrow-right-s-line" aria-hidden="true"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
