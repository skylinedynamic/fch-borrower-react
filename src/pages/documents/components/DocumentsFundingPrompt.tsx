import React from 'react'
import { Link } from 'react-router-dom'
import './DocumentsFundingPrompt.css'

/** Where the borrower applies once every document is in. */
const FUNDING_ROUTE = '/funding'

interface DocumentsFundingPromptProps {
  /** Required categories with at least one document. */
  filled: number
  /** The required document categories. */
  total: number
  /** The first category still without a document; null once all are in. */
  nextMissing: string | null
  /** Opens `nextMissing`, ready to upload. */
  onUploadNext: () => void
}

/**
 * The top of Documents: funding needs the required documents, so until they
 * are in it asks for them (with the way to the next one missing), then sends
 * the borrower on to apply.
 */
export default function DocumentsFundingPrompt({ filled, total, nextMissing, onUploadNext }: DocumentsFundingPromptProps) {
  if (total === 0) return null
  const allIn = filled >= total

  return (
    <section className={`docs-prompt ${allIn ? 'is-done' : 'is-pending'}`} aria-labelledby="docs-prompt-label">
      <div className="docs-prompt-text">
        <span id="docs-prompt-label" className="docs-prompt-label">
          Your next step
        </span>
        {allIn ? (
          <p className="docs-prompt-message">Your documents are in. You can apply for funding now.</p>
        ) : (
          <p className="docs-prompt-message">
            Upload your required documents to apply for funding. Lenders review them with your request.{' '}
            <strong className="docs-prompt-count">
              {filled} of {total} required categories uploaded
            </strong>
          </p>
        )}
      </div>

      {allIn ? (
        <Link to={FUNDING_ROUTE} className="docs-prompt-btn">
          Continue to Funding <i className="ri-arrow-right-line" aria-hidden="true"></i>
        </Link>
      ) : (
        nextMissing && (
          <button type="button" className="docs-prompt-btn" onClick={onUploadNext}>
            <i className="ri-upload-2-line" aria-hidden="true"></i> Upload {nextMissing}
          </button>
        )
      )}
    </section>
  )
}
