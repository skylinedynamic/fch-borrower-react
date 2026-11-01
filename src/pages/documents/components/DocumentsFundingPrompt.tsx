import React from 'react'
import { Link } from 'react-router-dom'
import type { DocumentCategoryState } from '../../../utils/documentProgress'
import type { RequiredCategoryProgress } from './DocumentStats'
import './DocumentsFundingPrompt.css'

/** Where the borrower applies once every document is in. */
const FUNDING_ROUTE = '/funding'

/** The ring's size: its radius and the length of its circle. */
const RING_RADIUS = 22
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** Each step's icon, by where its category stands. */
const STEP_ICON: Record<Exclude<DocumentCategoryState, 'empty'>, string> = {
  accepted: 'ri-check-line',
  pending: 'ri-time-line',
  reupload: 'ri-refresh-line',
}

interface DocumentsFundingPromptProps {
  /** Required categories with at least one document. */
  filled: number
  /** The required document categories. */
  total: number
  /** The first category still without a document; null once all are in. */
  nextMissing: string | null
  /** Opens `nextMissing`, ready to upload. */
  onUploadNext: () => void
  /** Each required category and where it stands, shown as the steps. */
  categories?: RequiredCategoryProgress[]
}

/**
 * Under the Documents hero: funding needs the required documents, so until
 * they are in it asks for them (with the way to the next one missing), then
 * sends the borrower on to apply. A ring says how far along, and a stepper
 * along the bottom has each required category, the next one picked out.
 */
export default function DocumentsFundingPrompt({ filled, total, nextMissing, onUploadNext, categories = [] }: DocumentsFundingPromptProps) {
  if (total === 0) return null
  const allIn = filled >= total
  const progress = Math.min(filled / total, 1)

  return (
    <section className={`docs-prompt ${allIn ? 'is-done' : 'is-pending'}`} aria-labelledby="docs-prompt-label">
      <div className="docs-prompt-ring" role="img" aria-label={`${filled} of ${total} required categories uploaded`}>
        <svg viewBox="0 0 52 52" aria-hidden="true">
          <circle className="docs-prompt-ring-track" cx="26" cy="26" r={RING_RADIUS} />
          <circle
            className="docs-prompt-ring-fill"
            cx="26"
            cy="26"
            r={RING_RADIUS}
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress)}
          />
        </svg>
        {allIn ? (
          <i className="ri-check-line docs-prompt-ring-value" aria-hidden="true"></i>
        ) : (
          <span className="docs-prompt-ring-value" aria-hidden="true">
            {filled}/{total}
          </span>
        )}
      </div>

      <div className="docs-prompt-body">
        <div className="docs-prompt-head">
          <span id="docs-prompt-label" className="docs-prompt-label">
            Your next step
          </span>
          {!allIn && (
            <strong className="docs-prompt-count">
              {filled} of {total} required categories uploaded
            </strong>
          )}
        </div>
        {allIn ? (
          <p className="docs-prompt-message">Your documents are in. You can apply for funding now.</p>
        ) : (
          <p className="docs-prompt-message">
            Upload your required documents to apply for funding. Lenders review them with your request.
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

      {categories.length > 0 && (
        <ol className="docs-prompt-steps" aria-label="Required documents">
          {categories.map((c, index) => {
            const isNext = c.name === nextMissing
            return (
              <li
                key={c.name}
                className={`docs-prompt-step is-${c.state}${isNext ? ' is-next' : ''}`}
                aria-current={isNext ? 'step' : undefined}
              >
                {/* A missing one shows its number; the others how they stand. */}
                <span className="docs-prompt-step-mark" aria-hidden="true">
                  {c.state === 'empty' ? index + 1 : <i className={STEP_ICON[c.state]}></i>}
                </span>
                <span className="docs-prompt-step-name">{c.name}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
