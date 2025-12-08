import React, { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import { FileManager } from '@cubone/react-file-manager'
import '@cubone/react-file-manager/dist/style.css'
import {
  fetchDocuments,
  uploadFile,
  createFolder,
  renameItem,
  deleteItems,
  pasteItems
} from '../../modules/filemanager/services'
import type { FileSystemItem } from '../../modules/filemanager/types'

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
  const [uploads, setUploads] = useState<Record<string, FileSystemItem[]>>(() => {
    const init: Record<string, FileSystemItem[]> = {}
    sections.forEach((s) => (init[s] = []))
    return init
  })

  const [loading, setLoading] = useState(true)
  const [showFileManager, setShowFileManager] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Fetch documents on mount (once)
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true)
      try {
        const docs = await fetchDocuments()
        setUploads(prev => {
          const next = { ...prev }
          sections.forEach(sec => {
            next[sec] = docs
          })
          return next
        })
      } catch (error) {
        console.error('Failed to load documents', error)
      } finally {
        setLoading(false)
      }
    }
    loadDocuments()
  }, [])

  const refreshSection = async (section: string) => {
    try {
      // Refreshing a section now means refreshing everything since we don't filter by section
      const docs = await fetchDocuments()
      setUploads(prev => {
        const next = { ...prev }
        sections.forEach(sec => {
          next[sec] = docs
        })
        return next
      })
    } catch (error) {
      console.error(`Failed to refresh documents`, error)
    }
  }

  const totals = useMemo(() => {
    const entries = Object.entries(uploads)
    const count = entries.reduce((acc, [, files]) => acc + files.filter(f => !f.isDirectory).length, 0)
    const size = entries.reduce((acc, [, files]) => acc + files.reduce((a, f) => a + (f.size || 0), 0), 0)
    return { count, size }
  }, [uploads])

  const acceptTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx'
  const maxSize = 10 * 1024 * 1024

  const addFiles = async (key: string, list: FileList | File[]) => {
    const arr = Array.from(list as FileList)
    const invalid = arr.filter((f) => !(f.type.startsWith('image/') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(f.type)) || f.size > maxSize)
    if (invalid.length) {
      toast.error('Unsupported file or size exceeds 10MB')
      return
    }
    
    // Upload each file
    for (const file of arr) {
      try {
        await uploadFile(file, key, '/')
      } catch (error) {
        console.error('Upload failed', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    await refreshSection(key)
  }

  const removeFile = async (key: string, name: string) => {
    try {
      // Find the file path
      const file = uploads[key]?.find(f => f.name === name)
      if (file) {
        await deleteItems([file.path], key)
        await refreshSection(key)
        toast.success('File removed')
      }
    } catch (error) {
      console.error('Delete failed', error)
      toast.error('Failed to remove file')
    }
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

  const toggleFileManager = (section?: string) => {
    if (section) {
      setActiveSection(section)
      refreshSection(section) // Refresh when opening
    }
    setShowFileManager(!showFileManager)
  }

  // File Manager Handlers
  const handleCreateFolder = async (name: string, parentPath: string) => {
    if (!activeSection) return
    try {
      await createFolder(name, activeSection, parentPath)
      await refreshSection(activeSection)
    } catch (error) {
      console.error('Create folder failed', error)
      toast.error('Failed to create folder')
    }
  }

  const handleFileUploaded = async (file: File, parentPath: string) => {
    if (!activeSection) return
    try {
      await uploadFile(file, activeSection, parentPath)
      await refreshSection(activeSection)
    } catch (error) {
      console.error('Upload failed', error)
      toast.error('Failed to upload file')
    }
  }

  const handleRename = async (path: string, newName: string) => {
    if (!activeSection) return
    try {
      await renameItem(path, newName, activeSection)
      await refreshSection(activeSection)
    } catch (error) {
      console.error('Rename failed', error)
      toast.error('Failed to rename item')
    }
  }

  const handleDelete = async (paths: string[]) => {
    if (!activeSection) return
    try {
      await deleteItems(paths, activeSection)
      await refreshSection(activeSection)
    } catch (error) {
      console.error('Delete failed', error)
      toast.error('Failed to delete items')
    }
  }

  const handlePaste = async (files: FileSystemItem[], destinationPath: string, operation: 'copy' | 'move') => {
      if (!activeSection) return
      try {
        await pasteItems(files, destinationPath, operation, activeSection)
        await refreshSection(activeSection)
      } catch (error) {
        console.error('Paste failed', error)
        toast.error('Failed to paste items')
      }
  }

  return (
    <div className="page-content documents-page">
      <Modal isOpen={showFileManager} toggle={() => toggleFileManager()} size="xl" centered>
        <ModalHeader toggle={() => toggleFileManager()}>File Manager - {activeSection}</ModalHeader>
        <ModalBody style={{ height: '80vh', padding: 0 }}>
          {activeSection && (
            <FileManager
              files={uploads[activeSection] || []}
              onCreateFolder={handleCreateFolder}
              onFileUploaded={handleFileUploaded}
              onRename={handleRename}
              onDelete={handleDelete}
              onPaste={handlePaste}
              permissions={{
                  create: true,
                  copy: true,
                  move: true,
                  delete: true,
                  rename: true,
                  upload: true,
                  download: true,
              }}
            />
          )}
        </ModalBody>
      </Modal>
      <div className="container-fluid min-vh-70 pt-2">
        <div className="text-center mb-3">
          {loading ? (
            <div className="d-flex flex-column align-items-center">
              <div className="skeleton-line" style={{ width: 180, height: 24, borderRadius: 8 }}></div>
              <div className="skeleton-line mt-2" style={{ width: 480, height: 14, borderRadius: 8 }}></div>
              <div className="skeleton-line mt-2" style={{ width: 420, height: 14, borderRadius: 8 }}></div>
              <div className="d-flex gap-2 mt-2">
                <div className="skeleton-line" style={{ width: 80, height: 22, borderRadius: 10 }}></div>
                <div className="skeleton-line" style={{ width: 100, height: 22, borderRadius: 10 }}></div>
              </div>
            </div>
          ) : (
            <>
              <h4 className="mb-1">Documents</h4>
              <div className="text-muted">Upload and view your documents for quick overview</div>
              <div className="mt-1">
                <span className="text-primary">Allowed files</span>: JPG, JPEG, PNG, PDF, DOC, DOCX <span className="text-muted">Maximum file size: 10MB per file</span>
              </div>
              <div className="mt-2">
                <span className="badge bg-info-subtle text-info me-1">{totals.count} files</span>
                <span className="badge bg-secondary-subtle text-secondary">{fmtSize(totals.size)}</span>
              </div>
            </>
          )}
        </div>

        <div className="row">
          <div className="col-11 mx-auto">
            <div className="card doc-panel">
              <div className="card-body">
                {loading ? (
                  <div>
                    {[1,2,3,4].map((i) => (
                      <div className="mb-3" key={i}>
                        <div className="skeleton-line w-50" style={{ height: 22, borderRadius: 6 }}></div>
                        <div className="skeleton-line w-100 mt-2" style={{ height: 120, borderRadius: 8 }}></div>
                        <div className="d-flex gap-2 mt-2">
                          <div className="skeleton-line" style={{ width: 160, height: 14, borderRadius: 6 }}></div>
                          <div className="skeleton-line" style={{ width: 90, height: 14, borderRadius: 6 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="accordion" id="docsAccordion">
                    {sections.map((sec, idx) => (
                      <div className={`accordion-item`} key={sec}>
                        <h2 className="accordion-header" id={`heading-${idx}`}>
                          <button className={`accordion-button ${idx===0 ? '' : 'collapsed'}`} type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${idx}`} aria-expanded={idx===0 ? 'true' : 'false'} aria-controls={`collapse-${idx}`}>
                            <span className="status-icon">{(uploads[sec] || []).length ? <i className="ri-check-fill text-success"></i> : null}</span>
                            <span>{sec}</span>
                          </button>
                        </h2>
                        <div id={`collapse-${idx}`} className={`accordion-collapse collapse ${idx===0 ? 'show' : ''}`} aria-labelledby={`heading-${idx}`} data-bs-parent="#docsAccordion">
                          <div className="accordion-body">
                            {/* Removed progress bar for simplicity as uploads are now async per file or handled by FileManager */}
                            <div
                              className="dropzone dz-clickable text-center"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => onDrop(e, sec)}
                              onClick={() => toggleFileManager(sec)}
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
                              {(uploads[sec] || []).filter(f => !f.isDirectory).map((f) => (
                                <div className="item" key={f.name}>
                                  <div className="d-flex flex-column">
                                    <span className="name">{f.name}</span>
                                    <span className="meta">{fmtSize(f.size || 0)}</span>
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
