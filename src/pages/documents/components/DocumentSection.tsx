import React from 'react'
import { Collapse } from 'reactstrap'
import type { FileSystemItem } from '../../../modules/filemanager/types'

interface DocumentSectionProps {
  section: string
  files: FileSystemItem[]
  isOpen: boolean
  onToggle: () => void
  onOpenFileManager: (section: string) => void
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  section,
  files,
  isOpen,
  onToggle,
  onOpenFileManager
}) => {
  const fmtSize = (n: number) => {
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${n} B`
  }

  return (
    <div className="accordion-item">
      <h2 className="accordion-header">
        <button
          className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span className="status-icon">
            {files.length ? <i className="ri-check-fill text-success"></i> : null}
          </span>
          <span>{section}</span>
        </button>
      </h2>
      <Collapse isOpen={isOpen} className="accordion-collapse">
        <div className="accordion-body">
          <div
            className="dropzone dz-clickable text-center"
            onClick={() => onOpenFileManager(section)}
            style={{ cursor: 'pointer' }}
          >
            <div className="dz-message needsclick">
              <div className="mb-3">
                <i className="display-4 text-muted ri-upload-cloud-2-fill"></i>
              </div>
              <h4>Click here to upload documents.</h4>
            </div>
          </div>
          <div className="file-list">
            {files.filter(f => !f.isDirectory).map((f) => (
              <div className="item" key={f.name}>
                <div className="d-flex flex-column">
                  <span className="name">{f.name}</span>
                  <span className="meta">{fmtSize(f.size || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Collapse>
    </div>
  )
}
