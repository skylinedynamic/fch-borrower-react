import React from 'react'
import { FILE_MANAGER_CONFIG } from '../../../modules/filemanager/config'

interface DocumentStatsProps {
  /** Files uploaded, across every category. */
  documentCount: number
  /** Required categories with at least one file. */
  filledCount: number
  /** The required categories. */
  categoryCount: number
}

/** The top of Documents: what the page is for, where things stand, and what can be uploaded. */
export const DocumentStats: React.FC<DocumentStatsProps> = ({ documentCount, filledCount, categoryCount }) => {
  const allowedExtensions = FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.map(ext => ext.toUpperCase()).join(', ')
  const maxFileSizeMB = FILE_MANAGER_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
  const percent = categoryCount ? Math.round((filledCount / categoryCount) * 100) : 0

  return (
    <div className="docs-hero">
      <div className="docs-hero-main">
        <div className="docs-hero-intro">
          <span className="docs-hero-icon" aria-hidden="true">
            <i className="ri-folder-shield-2-line"></i>
          </span>
          <div>
            <h4 className="docs-hero-title">Documents</h4>
            <p className="docs-hero-subtitle">Upload and view your documents for quick overview</p>
          </div>
        </div>

        <div className="docs-hero-stats">
          <div className="docs-stat">
            <span className="docs-stat-label">Progress</span>
            <span className="docs-stat-value">
              {filledCount} of {categoryCount} required
            </span>
            <span className="docs-stat-track" aria-hidden="true">
              <span className="docs-stat-bar" style={{ width: `${percent}%` }}></span>
            </span>
          </div>
          <div className="docs-stat">
            <span className="docs-stat-label">Files uploaded</span>
            <span className="docs-stat-value">{documentCount}</span>
          </div>
          <div className="docs-stat">
            <span className="docs-stat-label">Max file size</span>
            <span className="docs-stat-value">{maxFileSizeMB}MB per file</span>
          </div>
        </div>
      </div>

      <div className="docs-hero-rules">
        <i className="ri-information-line" aria-hidden="true"></i>
        <span>
          <span className="docs-hero-rules-label">Allowed files:</span> {allowedExtensions}
        </span>
      </div>
    </div>
  )
}
