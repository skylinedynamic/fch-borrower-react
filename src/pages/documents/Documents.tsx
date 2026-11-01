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
import { DocumentCategoryButton, DocumentCategoryDetail, DocumentCategoryItem } from './components/DocumentCategory'
import { useWideScreen } from './hooks/useWideScreen'
import { isRequiredDocumentCategory } from '../../config/documents'
import { documentCategoryState, isCategoryUploaded } from '../../utils/documentProgress'
import DocumentsFundingPrompt from './components/DocumentsFundingPrompt'
import { useOnboardingPopupStore } from '../../store/onboardingPopupStore'
import { FileManagerModal } from '../../components/FileManagerModal/FileManagerModal'
import { DocumentSectionLoader } from '../../components/Loader/DocumentSectionLoader'
import DeleteConfirmationModal from '../../components/GlobalModal/DeleteConfirmModal'
import './Documents.css'


export default function Documents() {
  const [sections, setSections] = useState<string[]>([])
  const [uploads, setUploads] = useState<Record<string, FileSystemItem[]>>({})
  const [uploadingSections, setUploadingSections] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()
  // Split view (list beside the open category) on wide screens, in place on narrow ones.
  const wide = useWideScreen()

  // Uploading here moves the Getting Started walkthrough on; its next popup
  // is about another page, so it doesn't open by itself over this one (the
  // Next step button still opens it). The prompt below says what's next here.
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
    reviewStatus: doc.status,
    rejectionReason: doc.rejection_reason ?? null,
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
    // Only the required categories count (see config/documents), and only with
    // a file that isn't rejected (BUG-135).
    const required = entries.filter(([name]) => isRequiredDocumentCategory(name))
    const filled = required.filter(([, files]) => isCategoryUploaded(documentCategoryState(files))).length
    return { count, size, filled, required: required.length }
  }, [uploads])

  // The first required category still without a usable document (none, or only
  // rejected ones), for the prompt's "Upload …" button.
  const nextMissing = sections.find((sec) => isRequiredDocumentCategory(sec) && !isCategoryUploaded(documentCategoryState(uploads[sec]))) ?? null

  // Each required category and where it stands, for the hero's progress segments.
  const requiredCategories = useMemo(
    () => sections.filter(isRequiredDocumentCategory).map((name) => ({ name, state: documentCategoryState(uploads[name]) })),
    [sections, uploads]
  )

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
        <div className="docs-shell">
          {loading ? (
            <div className="docs-hero is-loading">
              <div className="docs-hero-main">
                <div className="skeleton-line" style={{ width: 200, height: 24, borderRadius: 4 }}></div>
                <div className="skeleton-line" style={{ width: 380, maxWidth: '100%', height: 14, borderRadius: 4 }}></div>
                <div className="skeleton-line" style={{ width: 300, maxWidth: '100%', height: 22, borderRadius: 4 }}></div>
              </div>
              <div className="docs-hero-progress">
                <div className="skeleton-line" style={{ width: '60%', height: 18, borderRadius: 4 }}></div>
                <div className="skeleton-line mt-3" style={{ width: '100%', height: 8, borderRadius: 4 }}></div>
              </div>
            </div>
          ) : (
            <>
              <DocumentStats
                documentCount={totals.count}
                filledCount={totals.filled}
                categoryCount={totals.required}
                requiredCategories={requiredCategories}
              />
              {/* Its own section under the hero. */}
              <DocumentsFundingPrompt
                filled={totals.filled}
                total={totals.required}
                nextMissing={nextMissing}
                categories={requiredCategories}
                onUploadNext={() => nextMissing && setOpenSection(nextMissing)}
              />
            </>
          )}

          <div className="docs-board">
            {loading ? (
              <div className="docs-board-loading">
                <DocumentSectionLoader />
              </div>
            ) : wide ? (
              <div className="docs-split">
                <nav className="docs-split-nav" aria-label="Document categories">
                  <div className="docs-split-nav-head">Categories</div>
                  {sections.map((sec) => (
                    <DocumentCategoryButton
                      key={sec}
                      section={sec}
                      files={uploads[sec] || []}
                      isOpen={openSection === sec}
                      onToggle={() => toggleSection(sec)}
                      layout="split"
                    />
                  ))}
                </nav>
                <div className="docs-split-pane">
                  {openSection && sections.includes(openSection) ? (
                    <DocumentCategoryDetail
                      section={openSection}
                      files={uploads[openSection] || []}
                      isUploading={uploadingSections[openSection] || false}
                      onOpenFileManager={toggleFileManager}
                      onRemoveFile={handleRemoveFile}
                    />
                  ) : (
                    <div className="docs-split-empty">
                      <i className="ri-folder-open-line" aria-hidden="true"></i>
                      <p>Select a category to upload or view its documents.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="docs-stacked" id="docsAccordion">
                {sections.map((sec) => (
                  <DocumentCategoryItem
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
  )
}
