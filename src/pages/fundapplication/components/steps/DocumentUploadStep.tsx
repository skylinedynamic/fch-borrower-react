import React from 'react'
import { docSections, type FileEntry } from '../../types'
import StepNavigation from '../shared/StepNavigation'
import DocumentUploadSection from '../shared/DocumentUploadSection'

type DocumentUploadStepProps = {
  docUploads: Record<string, FileEntry[]>
  docUploading: Record<string, boolean>
  docProgress: Record<string, number>
  onAddFiles: (key: string, files: FileList | File[]) => void
  onRemoveFile: (key: string, name: string) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, key: string) => void
  acceptTypes: string
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export default function DocumentUploadStep({
  docUploads,
  docUploading,
  docProgress,
  onAddFiles,
  onRemoveFile,
  onDrop,
  acceptTypes,
  onNext,
  onBack,
  loading,
}: DocumentUploadStepProps) {
  if (loading) {
    return (
      <div className="row g-3">
        <div className="col-12">
          <div className="skeleton-line" style={{ height: 200, borderRadius: 6 }}></div>
        </div>
        <div className="col-12 d-flex justify-content-between mt-2">
          <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
          <div className="skeleton-line" style={{ height: 38, width: 100, borderRadius: 6 }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="accordion" id="fundDocsAccordion">
          {docSections.map((sec, sidx) => (
            <div className="accordion-item" key={sec}>
              <h2 className="accordion-header" id={`fund-heading-${sidx}`}>
                <button
                  className={`accordion-button ${sidx === 0 ? '' : 'collapsed'}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#fund-collapse-${sidx}`}
                  aria-expanded={sidx === 0 ? 'true' : 'false'}
                  aria-controls={`fund-collapse-${sidx}`}
                >
                  <span className="status-icon" style={{ marginRight: 10 }}>
                    {(docUploads[sec] || []).length ? (
                      <i className="ri-check-fill text-success fs-5 fw-bold"></i>
                    ) : null}
                  </span>
                  <span>{sec}</span>
                </button>
              </h2>
              <div
                id={`fund-collapse-${sidx}`}
                className={`accordion-collapse collapse ${sidx === 0 ? 'show' : ''}`}
                aria-labelledby={`fund-heading-${sidx}`}
                data-bs-parent="#fundDocsAccordion"
              >
                <div className="accordion-body">
                  <DocumentUploadSection
                    sectionKey={sec}
                    sectionIndex={sidx}
                    uploads={docUploads[sec] || []}
                    uploading={docUploading[sec] || false}
                    progress={docProgress[sec] || 0}
                    onAddFiles={onAddFiles}
                    onRemoveFile={onRemoveFile}
                    onDrop={onDrop}
                    acceptTypes={acceptTypes}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <StepNavigation onBack={onBack} onNext={onNext} loading={loading} />
    </div>
  )
}
