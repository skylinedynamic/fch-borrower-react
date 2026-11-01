import React from 'react'
import { FILE_MANAGER_CONFIG } from '../../../modules/filemanager/config'
import type { DocumentCategoryState } from '../../../utils/documentProgress'

/** A required category and where it stands, for the progress segments. */
export interface RequiredCategoryProgress {
  name: string
  state: DocumentCategoryState
}

interface DocumentStatsProps {
  /** Files uploaded, across every category. */
  documentCount: number
  /** Required categories with a usable file (accepted or pending review). */
  filledCount: number
  /** The required categories. */
  categoryCount: number
  /** Each required category's state, in page order: one progress segment each. */
  requiredCategories?: RequiredCategoryProgress[]
  /** Anything else to show in the hero, under the facts. */
  children?: React.ReactNode
}

/** How each state reads in the segments' legend. */
const STATE_LEGEND: { state: DocumentCategoryState; label: string }[] = [
  { state: 'accepted', label: 'Accepted' },
  { state: 'pending', label: 'In review' },
  { state: 'reupload', label: 'Re-upload' },
  { state: 'empty', label: 'Missing' },
]

/**
 * The top of Documents, in the portal's hero style (as My Applications), kept
 * short: the title, the files uploaded and the size limit on the left; how far
 * the required documents are - one segment per category, coloured by its
 * state - on the right; every allowed file type along the bottom.
 */
export const DocumentStats: React.FC<DocumentStatsProps> = ({
  documentCount,
  filledCount,
  categoryCount,
  requiredCategories = [],
  children,
}) => {
  const allowed = FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.map(ext => ext.toUpperCase())
  const maxFileSizeMB = FILE_MANAGER_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
  const percent = categoryCount ? Math.round((filledCount / categoryCount) * 100) : 0
  const counts = STATE_LEGEND.map(({ state, label }) => ({
    state,
    label,
    count: requiredCategories.filter((c) => c.state === state).length,
  })).filter((c) => c.count > 0)

  return (
    <section className="docs-hero" aria-label="Documents overview">
      <div className="docs-hero-main">
        <div className="docs-hero-intro">
          <span className="docs-hero-icon" aria-hidden="true">
            <i className="ri-folder-shield-2-line"></i>
          </span>
          <div className="docs-hero-heading">
            <h4 className="docs-hero-title">Documents</h4>
            <p className="docs-hero-subtitle">
              Upload the documents lenders need. We review each file and let you know if one needs replacing.
            </p>
          </div>
        </div>

        <div className="docs-hero-facts">
          <span className="docs-fact">
            <i className="ri-file-copy-2-line" aria-hidden="true"></i>
            <span className="docs-fact-value">{documentCount}</span>
            <span className="docs-fact-label">Files uploaded</span>
          </span>
          <span className="docs-fact">
            <i className="ri-upload-cloud-2-line" aria-hidden="true"></i>
            <span className="docs-fact-value">{maxFileSizeMB}MB</span>
            <span className="docs-fact-label">Max per file</span>
          </span>
        </div>
        {children}
      </div>

      <aside className="docs-hero-progress" aria-label="Progress">
        <div className="docs-progress-head">
          <span className="docs-stat-value">
            {filledCount} of {categoryCount} required
          </span>
          <span className="docs-progress-percent">{percent}%</span>
        </div>

        {requiredCategories.length > 0 ? (
          <>
            <div className="docs-progress-segments" role="list" aria-label="Required categories">
              {requiredCategories.map((c) => (
                <span
                  key={c.name}
                  role="listitem"
                  className={`docs-progress-segment is-${c.state}`}
                  title={`${c.name}: ${STATE_LEGEND.find((l) => l.state === c.state)?.label}`}
                  aria-label={`${c.name}: ${STATE_LEGEND.find((l) => l.state === c.state)?.label}`}
                ></span>
              ))}
            </div>
            <ul className="docs-progress-legend">
              {counts.map((c) => (
                <li key={c.state}>
                  <span className={`docs-progress-dot is-${c.state}`} aria-hidden="true"></span>
                  {c.count} {c.label}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <span className="docs-stat-track" aria-hidden="true">
            <span className="docs-stat-bar" style={{ width: `${percent}%` }}></span>
          </span>
        )}
      </aside>

      <div className="docs-hero-rules">
        <i className="ri-information-line" aria-hidden="true"></i>
        <span>
          <span className="docs-hero-rules-label">Allowed files:</span> {allowed.join(', ')}
        </span>
      </div>
    </section>
  )
}
