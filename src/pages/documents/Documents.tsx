import React, { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import {
  submitFileSelection
} from '../../modules/filemanager/services'
import type { FileSystemItem } from '../../modules/filemanager/types'
import { useDocumentTypes, useBorrowerDocuments, useDeleteDocument, type BorrowerDocument } from '../../modules/documents'
import { getUser } from '../../lib/auth/auth'
import { DocumentStats } from './components/DocumentStats'
import { DocumentSection } from './components/DocumentSection'
import { FileManagerModal } from '../../components/FileManagerModal/FileManagerModal'
import { DocumentSectionLoader } from '../../components/Loader/DocumentSectionLoader'
import DeleteConfirmationModal from '../../components/GlobalModal/DeleteConfirmModal'
import { useOnboardingPopupStore } from '../../store/onboardingPopupStore'


export default function Documents() {
  const [sections, setSections] = useState<string[]>([])
  const [uploads, setUploads] = useState<Record<string, FileSystemItem[]>>({})
  const [uploadingSections, setUploadingSections] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  // Uploading here moves the Getting Started walkthrough on; its next popup is
  // about another page, so it doesn't open by itself over this one (the Next
  // step button still opens it).
  const { holdPage: holdOnboardingPopup, releasePage: releaseOnboardingPopup } = useOnboardingPopupStore()
  useEffect(() => {
    holdOnboardingPopup()
    return releaseOnboardingPopup
  }, [holdOnboardingPopup, releaseOnboardingPopup])

  const [loading, setLoading] = useState(true)
  const [showFileManager, setShowFileManager] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<string>('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: number; name: string } | null>(null)

  // Fetch document types and documents
  const { data: types, isLoading: typesLoading, error: typesError } = useDocumentTypes()
  const { data: documentsData, isLoading: docsLoading, error: docsError } = useBorrowerDocuments()
  const deleteDocumentMutation = useDeleteDocument()

  // Map BorrowerDocument to FileSystemItem for display
  const mapDocumentToFileItem = (doc: BorrowerDocument): FileSystemItem => ({
    name: doc.file_name,
    path: doc.file_path,
    url: doc.url,
    isDirectory: false,
    size: 0,
    updatedAt: new Date().toISOString(),
    documentId: doc.id, // Include document ID for deletion
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

      // Open first section by default only on initial load
      if (sectionNames.length > 0 && openSection === null) {
        setOpenSection(sectionNames[0])
      }

      setLoading(false)
    } else if (typesError || docsError) {
      console.error('Failed to load data', typesError || docsError)
      toast.error('Failed to load documents')
      setLoading(false)
    }
  }, [types, documentsData, typesError, docsError])

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
        setUploadingSections(prev => ({ ...prev, [currentSection]: true }))
        try {
          const filePaths = selectedFiles.map(f => f.path)
          await submitFileSelection(filePaths, '/borrower/documents/upload', {
            document_type_id: docType.id
          })

          await queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() })
          // Uploading documents is a Getting Started step for funding-only borrowers.
          queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion() })
          toast.success(`${selectedFiles.length} file(s) attached to ${currentSection}`)
        } catch (error) {
          console.error('Failed to attach files', error)
          toast.error('Failed to attach files')
        } finally {
          setUploadingSections(prev => ({ ...prev, [currentSection]: false }))
        }
      }
    }
  }

  const handleRemoveFile = (section: string, documentId: number) => {
    // Find document name for modal display
    const file = uploads[section]?.find(f => f.documentId === documentId)
    if (file) {
      setDocumentToDelete({ id: documentId, name: file.name })
      setShowDeleteModal(true)
    }
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    deleteDocumentMutation.mutate(documentToDelete.id, {
      onSuccess: (response) => {
        toast.success(response.message || 'Document deleted successfully')
        setShowDeleteModal(false)
        setDocumentToDelete(null)
      },
      onError: (error) => {
        console.error('Failed to delete document', error)
        toast.error('Failed to delete document')
      }
    })
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
        entityType="borrowers"
        entityId={getUser()?.entity_id}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={deleteDocumentMutation.isPending}
        text={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
      />

      <div className="container-fluid min-vh-70 pt-4">
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
          <DocumentStats />
        )}

        <div className="row">
          <div className="col-11 mx-auto">
            <div className="card doc-panel">
              <div className="card-body">
                {loading ? (
                  <DocumentSectionLoader />
                ) : (
                  <div className="accordion" id="docsAccordion">
                    {sections.map((sec) => (
                      <DocumentSection
                        key={sec}
                        section={sec}
                        files={uploads[sec] || []}
                        isOpen={openSection === sec}
                        isUploading={uploadingSections[sec] || false}
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
