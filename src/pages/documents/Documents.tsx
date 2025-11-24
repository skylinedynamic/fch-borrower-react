import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

type FileEntry = { name: string; size: number; type: string; file: File }

const sections = [
  "Driver's License",
  'Voided Business Check',
  'EIN / Corporation Docs',
  'Business Bank Statements',
  'Equipment Invoice / Quote',
  'A/R Aging Reposrt',
  'Business Plan',
  'Business Tax Returns',
  'Personal Tax Returns',
  'Miscellaneous Documents',
]

export default function Documents() {
  const [uploads, setUploads] = useState<Record<string, FileEntry[]>>(() => {
    const init: Record<string, FileEntry[]> = {}
    sections.forEach((s) => (init[s] = []))
    return init
  })

  const totals = useMemo(() => {
    const entries = Object.entries(uploads)
    const count = entries.reduce((acc, [, files]) => acc + files.length, 0)
    const size = entries.reduce((acc, [, files]) => acc + files.reduce((a, f) => a + f.size, 0), 0)
    return { count, size }
  }, [uploads])

  const acceptTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx'
  const maxSize = 10 * 1024 * 1024

  const addFiles = (key: string, list: FileList | File[]) => {
    const arr = Array.from(list as FileList)
    const invalid = arr.filter((f) => !(f.type.startsWith('image/') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(f.type)) || f.size > maxSize)
    if (invalid.length) {
      toast.error('Unsupported file or size exceeds 10MB')
      return
    }
    setUploads((prev) => {
      const next = { ...prev }
      const mapped = arr.map<FileEntry>((f) => ({ name: f.name, size: f.size, type: f.type, file: f }))
      next[key] = [...(next[key] || []), ...mapped]
      return next
    })
  }

  const removeFile = (key: string, name: string) => {
    setUploads((prev) => {
      const next = { ...prev }
      next[key] = (next[key] || []).filter((f) => f.name !== name)
      return next
    })
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(key, e.dataTransfer.files)
  }

  const fmtSize = (n: number) => {
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${n} B`
  }

  return (
    <div className="page-content documents-page">
      <div className="container-fluid min-vh-70 pt-2">
        <div className="text-center mb-3">
          <h4 className="mb-1">Documents</h4>
          <div className="text-muted">Upload and view your documents for quick overview</div>
          <div className="mt-1">
            <span className="text-primary">Allowed files</span>: JPG, JPEG, PNG, PDF, DOC, DOCX <span className="text-muted">Maximum file size: 10MB per file</span>
          </div>
          <div className="mt-2">
            <span className="badge bg-info-subtle text-info me-1">{totals.count} files</span>
            <span className="badge bg-secondary-subtle text-secondary">{fmtSize(totals.size)}</span>
          </div>
        </div>

        <div className="row">
          <div className="col-11 mx-auto">
            <div className="card doc-panel">
              <div className="card-body">
                <div className="accordion" id="docsAccordion">
                  {sections.map((sec, idx) => (
                    <div className={`accordion-item`} key={sec}>
                      <h2 className="accordion-header" id={`heading-${idx}`}>
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${idx}`} aria-expanded="false" aria-controls={`collapse-${idx}`}>
                          <span className="status-icon">{(uploads[sec] || []).length ? <i className="ri-check-fill text-success"></i> : null}</span>
                          <span>{sec}</span>
                        </button>
                      </h2>
                      <div id={`collapse-${idx}`} className="accordion-collapse collapse" aria-labelledby={`heading-${idx}`} data-bs-parent="#docsAccordion">
                        <div className="accordion-body">
                          <div
                            className="dropzone dz-clickable text-center"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDrop(e, sec)}
                            onClick={() => document.getElementById(`file-${idx}`)?.click()}
                          >
                            <div className="dz-message needsclick">
                              <div className="mb-3">
                                <i className="display-4 text-muted ri-upload-cloud-2-fill"></i>
                              </div>
                              <h4>Drop files here or click to upload.</h4>
                            </div>
                            <input id={`file-${idx}`} type="file" multiple accept={acceptTypes} className="d-none" onChange={(e) => e.target.files && addFiles(sec, e.target.files)} />
                          </div>
                          <div className="mt-3 file-list">
                            {(uploads[sec] || []).map((f) => (
                              <div className="item" key={f.name}>
                                <div className="d-flex flex-column">
                                  <span className="name">{f.name}</span>
                                  <span className="meta">{fmtSize(f.size)}</span>
                                </div>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeFile(sec, f.name)}>
                                  Remove
                                </button>
                              </div>
                            ))}
                            {(!uploads[sec] || uploads[sec].length === 0) && (
                              <div className="text-muted">No files added yet</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
