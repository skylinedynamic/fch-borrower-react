import React, { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  submitFileSelection
} from '../../modules/filemanager/services'
import type { FileSystemItem } from '../../modules/filemanager/types'
import { useDocumentTypes, useBorrowerDocuments, type BorrowerDocument } from '../../modules/documents'
import { DocumentStats } from './components/DocumentStats'
import { DocumentSection } from './components/DocumentSection'
import { FileManagerModal } from '../../components/FileManagerModal/FileManagerModal'


export default function Documents() {
  const [sections, setSections] = useState<string[]>([])
  const [uploads, setUploads] = useState<Record<string, FileSystemItem[]>>({})

  const [loading, setLoading] = useState(true)
  const [showFileManager, setShowFileManager] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<string>('')
  const [selectionMode, setSelectionMode] = useState(false)

  // Fetch document types and documents
  const { data: types, isLoading: typesLoading, error: typesError } = useDocumentTypes()
  const { data: documentsData, isLoading: docsLoading, error: docsError, refetch } = useBorrowerDocuments()

  // Map BorrowerDocument to FileSystemItem for display
  const mapDocumentToFileItem = (doc: BorrowerDocument): FileSystemItem => ({
    name: doc.file_name,
    path: doc.file_path,
    url: doc.url,
    isDirectory: false,
    size: 0,
    updatedAt: new Date().toISOString(),
  })

  useEffect(() => {
    if (types && documentsData) {
      const sectionNames = types.sort((a, b) => a.sort_order - b.sort_order).map(t => t.name)
      setSections(sectionNames)

      // Map document_type_id to section name and populate uploads
      const uploadsMap: Record<string, FileSystemItem[]> = {}
      sectionNames.forEach(sec => {
        uploadsMap[sec] = []
      })

      // Populate uploads based on API data
      types.forEach(docType => {
        const docsForType = documentsData[docType.id.toString()] || []
        uploadsMap[docType.name] = docsForType.map(mapDocumentToFileItem)
      })

      setUploads(uploadsMap)
      
      // Open first section by default
      if (sectionNames.length > 0) {
        setOpenSection(sectionNames[0])
      }
      
      setLoading(false)
    } else if (typesError || docsError) {
      console.error('Failed to load data', typesError || docsError)
      toast.error('Failed to load documents')
      setLoading(false)
    }
  }, [types, documentsData, typesError, docsError])

  const refreshDocuments = async () => {
    await refetch()
  }

  const totals = useMemo(() => {
    const entries = Object.entries(uploads)
    const count = entries.reduce((acc, [, files]) => acc + files.filter(f => !f.isDirectory).length, 0)
    const size = entries.reduce((acc, [, files]) => acc + files.reduce((a, f) => a + (f.size || 0), 0), 0)
    return { count, size }
  }, [uploads])

  const toggleFileManager = (section?: string, selectMode: boolean = false) => {
    if (section) {
      setCurrentSection(section)
      setSelectionMode(selectMode)
    }
    setShowFileManager(!showFileManager)
  }

  const handleFileSelection = async (selectedFiles: FileSystemItem[]) => {
    if (currentSection && types) {
      const docType = types.find(t => t.name === currentSection)
      if (docType) {
        try {
          const filePaths = selectedFiles.map(f => f.path)
          await submitFileSelection(filePaths, '/borrower/documents/upload', {
            document_type_id: docType.id
          })
          
          // Refresh all documents to show new files
          await refreshDocuments()
          
          toast.success(`${selectedFiles.length} file(s) attached to ${currentSection}`)
        } catch (error) {
          console.error('Failed to attach files', error)
          toast.error('Failed to attach files')
        }
      }
    }
  }

  const handleRemoveFile = (section: string, filePath: string) => {
    setUploads(prev => ({
      ...prev,
      [section]: prev[section].filter(f => f.path !== filePath)
    }))
    toast.info('File removed from list')
  }

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section))
  }

  return (
    <div className="page-content documents-page">
      <FileManagerModal
        isOpen={showFileManager}
        toggle={() => toggleFileManager()}
        section={currentSection}
        selectionMode={selectionMode}
        onSelectFiles={handleFileSelection}
      />
      
      <div className="container-fluid min-vh-70 pt-2">
        {loading ? (
          <div className="text-center mb-3">
            <div className="d-flex flex-column align-items-center">
              <div className="skeleton-line" style={{ width: 180, height: 24, borderRadius: 8 }}></div>
              <div className="skeleton-line mt-2" style={{ width: 480, height: 14, borderRadius: 8 }}></div>
              <div className="skeleton-line mt-2" style={{ width: 420, height: 14, borderRadius: 8 }}></div>
              <div className="d-flex gap-2 mt-2">
                <div className="skeleton-line" style={{ width: 80, height: 22, borderRadius: 10 }}></div>
                <div className="skeleton-line" style={{ width: 100, height: 22, borderRadius: 10 }}></div>
              </div>
            </div>
          </div>
        ) : (
          <DocumentStats count={totals.count} size={totals.size} />
        )}

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
                    {sections.map((sec) => (
                      <DocumentSection
                        key={sec}
                        section={sec}
                        files={uploads[sec] || []}
                        isOpen={openSection === sec}
                        onToggle={() => toggleSection(sec)}
                        onOpenFileManager={toggleFileManager}
                        onRemoveFile={handleRemoveFile}
                      />
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
