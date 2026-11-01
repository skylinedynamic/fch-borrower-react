import React, { useState } from 'react'
import { downloadFundingApplicationDocument } from '../../../../modules/my-application'
import type { FundingApplicationDocumentGroup } from '../../../../modules/my-application/types'
import { getFileConfig, getDocumentStatusBadgeClass } from '../../../../config/fileTypeConfig'
import { downloadFileFromUrl, handleFileDownload } from '../../../../utils/fileDownload'

const formatDateTime = (d?: string | null) => {
  if (!d) return 'N/A'
  const date = new Date(d)
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

/** The documents uploaded with an application, grouped by type, each downloadable. */
export default function ApplicationDocuments({ groups }: { groups: FundingApplicationDocumentGroup[] }) {
  const [downloadingKey, setDownloadingKey] = useState<string | number | null>(null)
  const total = groups.reduce((sum, group) => sum + (group.files?.length || 0), 0)

  return (
    <section className="ma-card ma-detail-section" aria-labelledby="ma-docs-title">
      <header className="ma-card-head">
        <span className="ma-card-icon" aria-hidden="true"><i className="ri-folder-2-line"></i></span>
        <h5 id="ma-docs-title" className="ma-card-title">Uploaded Documents</h5>
        <span className="ma-card-count">{total} attached</span>
      </header>

      <div className="ma-docs">
        {groups.map((group) => (
          <div key={group.type} className="ma-doc-group">
            <div className="ma-doc-group-title">
              <i className="ri-folder-3-line" aria-hidden="true"></i>
              <span>{group.type}</span>
              <span className="ma-doc-group-count">{group.files?.length || 0} {(group.files?.length || 0) === 1 ? 'file' : 'files'}</span>
            </div>
            <ul className="ma-doc-list">
              {group.files?.map((file, i) => {
                const fileName = file.original_name || file.name || 'document'
                const config = getFileConfig(file.url || file.path || fileName)
                const key = file.id || `${group.type}-${i}`
                const download = async () => {
                  setDownloadingKey(key)
                  try {
                    if (file.id && !String(file.id).startsWith('missing_')) {
                      await handleFileDownload(() => downloadFundingApplicationDocument(file.id), fileName, file.url ?? undefined)
                    } else if (file.url) {
                      await downloadFileFromUrl(file.url, fileName)
                    }
                  } finally {
                    setDownloadingKey(null)
                  }
                }

                return (
                  <li key={key} className="ma-doc">
                    <span className={`ma-doc-icon ${config.bg} ${config.color}`} aria-hidden="true"><i className={config.icon}></i></span>
                    <span className="ma-doc-main">
                      <span className="ma-doc-name" title={fileName}>{fileName}</span>
                      <span className="ma-doc-meta">{formatDateTime(file.created_at)}</span>
                    </span>
                    <span className={`badge ${getDocumentStatusBadgeClass(file.status || 'Uploaded')}`}>{file.status || 'Uploaded'}</span>
                    <button type="button" className="ma-action" onClick={download} disabled={downloadingKey === key} aria-label={`Download ${fileName}`}>
                      {downloadingKey === key ? (
                        <span className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Downloading</span></span>
                      ) : (
                        <i className="ri-download-2-line" aria-hidden="true"></i>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
