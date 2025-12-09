import React, { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  fetchDocuments
} from '../../modules/filemanager/services'
import type { FileSystemItem } from '../../modules/filemanager/types'
import { useDocumentTypes } from '../../modules/documents'
import { DocumentStats } from './components/DocumentStats'
import { DocumentSection } from './components/DocumentSection'
import { FileManagerModal } from '../../components/FileManagerModal/FileManagerModal'

export default function Documents() {
  const [sections, setSections] = useState<string[]>([])
  const [uploads, setUploads] = useState<Record<string, FileSystemItem[]>>({})

  const [loading, setLoading] = useState(true)
  const [showFileManager, setShowFileManager] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)

  // Fetch documents on mount (once)
  // Fetch document types on mount
  const { data: types, isLoading: typesLoading, error: typesError } = useDocumentTypes()

  useEffect(() => {
    if (types) {
      const sectionNames = types.sort((a, b) => a.sort_order - b.sort_order).map(t => t.name)
      setSections(sectionNames)

      // Initialize uploads with empty arrays for each section
      setUploads(prev => {
        const next: Record<string, FileSystemItem[]> = {}
        sectionNames.forEach(sec => {
          next[sec] = []
        })
        return next
      })
      
      // Open first section by default
      if (sectionNames.length > 0) {
        setOpenSection(sectionNames[0])
      }
      
      setLoading(false)
    } else if (typesError) {
      console.error('Failed to load data', typesError)
      toast.error('Failed to load documents')
      setLoading(false)
    }
  }, [types, typesError])

  const refreshSection = async (section: string) => {
    try {
      const files = await fetchDocuments(section)
      setUploads(prev => ({
        ...prev,
        [section]: files
      }))
    } catch (error) {
      console.error(`Failed to refresh section ${section}`, error)
      toast.error('Failed to refresh documents')
    }
  }

  const totals = useMemo(() => {
    const entries = Object.entries(uploads)
    const count = entries.reduce((acc, [, files]) => acc + files.filter(f => !f.isDirectory).length, 0)
    const size = entries.reduce((acc, [, files]) => acc + files.reduce((a, f) => a + (f.size || 0), 0), 0)
    return { count, size }
  }, [uploads])

  const toggleFileManager = () => {
    setShowFileManager(!showFileManager)
  }

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section))
  }

  return (
    <div className="page-content documents-page">
      <FileManagerModal
        isOpen={showFileManager}
        toggle={() => toggleFileManager()}
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
