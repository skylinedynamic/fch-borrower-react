import React from 'react'
import { Collapse } from 'reactstrap'
import type { FileSystemItem } from '../../../modules/filemanager/types'
import { isOptionalDocumentCategory } from '../../../config/documents'
import { DOCUMENT_STATUS, getDocumentStatusBadgeClass } from '../../../config/fileTypeConfig'
import {
  DOCUMENT_ACCEPTED_LABEL,
  DOCUMENT_PENDING_LABEL,
  DOCUMENT_REUPLOAD_LABEL,
  documentCategoryState,
  type DocumentCategoryState,
} from '../../../utils/documentProgress'
import {
  PdfIcon,
  WordIcon,
  ExcelIcon,
  PowerPointIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  ArchiveIcon,
  CodeIcon,
  TextIcon,
  FileIcon,
  getFileIcon
} from '../../../components/FileManagerModal/Icons'

interface DocumentCategoryProps {
  section: string
  files: FileSystemItem[]
  isOpen: boolean
  isUploading?: boolean
  onToggle: () => void
  onOpenFileManager: (section: string, selectionMode: boolean) => void
  onRemoveFile?: (section: string, documentId: number) => void
}

const renderFileIcon = (file: FileSystemItem) => {
  const iconType = getFileIcon(file.name, file.type)
  const iconClass = "file-type-icon"

  switch (iconType) {
    case 'pdf':
      return <PdfIcon className={iconClass} />
    case 'word':
      return <WordIcon className={iconClass} />
    case 'excel':
      return <ExcelIcon className={iconClass} />
    case 'powerpoint':
      return <PowerPointIcon className={iconClass} />
    case 'video':
      return <VideoIcon className={iconClass} />
    case 'audio':
      return <AudioIcon className={iconClass} />
    case 'archive':
      return <ArchiveIcon className={iconClass} />
    case 'code':
      return <CodeIcon className={iconClass} />
    case 'text':
      return <TextIcon className={iconClass} />
    case 'image':
      return <ImageIcon className={iconClass} />
    default:
      return <FileIcon className={iconClass} />
  }
}

const uploadedFiles = (files: FileSystemItem[]) => files.filter(f => !f.isDirectory)

/**
 * One file's review badge (BUG-087): the client used to see no difference
 * between an accepted and a rejected document. Shown on each file only.
 */
const fileReviewBadge = (status?: string) => {
  if (status === DOCUMENT_STATUS.ACCEPTED) return { label: 'Accepted', className: getDocumentStatusBadgeClass(status) }
  if (status === DOCUMENT_STATUS.REJECTED) return { label: 'Rejected', className: getDocumentStatusBadgeClass(status) }
  return { label: 'Pending review', className: getDocumentStatusBadgeClass(DOCUMENT_STATUS.PENDING) }
}

/**
 * A category's look for each state (BUG-135): the green tick only once a file
 * is accepted, a clock while one waits for review, red when only rejected
 * files are left.
 */
const CATEGORY_LOOK: Record<DocumentCategoryState, { className: string; icon: string; badgeIcon: string }> = {
  empty: { className: '', icon: 'ri-file-upload-line', badgeIcon: 'ri-time-line' },
  reupload: { className: ' is-rejected', icon: 'ri-error-warning-line', badgeIcon: 'ri-error-warning-fill' },
  pending: { className: ' is-pending', icon: 'ri-time-line', badgeIcon: 'ri-time-line' },
  accepted: { className: ' is-done', icon: 'ri-check-line', badgeIcon: 'ri-checkbox-circle-fill' },
}

const fileCountLabel = (count: number, optional: boolean, state: DocumentCategoryState) => {
  if (state === 'reupload') return DOCUMENT_REUPLOAD_LABEL
  if (!count) return optional ? 'Optional' : 'Not uploaded'
  const files = `${count} file${count === 1 ? '' : 's'}`
  return state === 'pending' ? `${files} · ${DOCUMENT_PENDING_LABEL}` : files
}

const headingLabel = (state: DocumentCategoryState, optional: boolean) => {
  if (state === 'accepted') return DOCUMENT_ACCEPTED_LABEL
  if (state === 'pending') return DOCUMENT_PENDING_LABEL
  if (state === 'reupload') return DOCUMENT_REUPLOAD_LABEL
  return optional ? 'Optional' : 'Not uploaded'
}

/** The file's extension, as a short tag next to its name. */
const fileExtension = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : ''
}

type CategoryButtonProps = Pick<DocumentCategoryProps, 'section' | 'files' | 'isOpen' | 'onToggle'> & {
  /** Points right in the split view (the category opens beside the list), down when it opens in place. */
  layout: 'split' | 'stacked'
}

/** A category in the list: its status, name and how many files it has. */
export const DocumentCategoryButton: React.FC<CategoryButtonProps> = ({ section, files, isOpen, onToggle, layout }) => {
  const count = uploadedFiles(files).length
  const optional = isOptionalDocumentCategory(section)
  const state = documentCategoryState(files)
  const look = CATEGORY_LOOK[state]

  return (
    <button
      className={`docs-category${isOpen ? ' is-active' : ''}`}
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className={`docs-category-status${look.className}`} aria-hidden="true">
        <i className={look.icon}></i>
      </span>
      <span className="docs-category-text">
        <span className="docs-category-name">{section}</span>
        <span className="docs-category-meta">{fileCountLabel(count, optional, state)}</span>
      </span>
      <i
        className={`docs-category-chevron ${layout === 'split' ? 'ri-arrow-right-s-line' : 'ri-arrow-down-s-line'}`}
        aria-hidden="true"
      ></i>
    </button>
  )
}

type DetailProps = Omit<DocumentCategoryProps, 'isOpen' | 'onToggle'> & {
  /** Off when the category opens in place: its button above already names it. */
  showHeader?: boolean
}

/** A category's own view: the way to upload more, and the files already in it. */
export const DocumentCategoryDetail: React.FC<DetailProps> = ({
  section,
  files,
  isUploading = false,
  onOpenFileManager,
  onRemoveFile,
  showHeader = true
}) => {
  const uploaded = uploadedFiles(files)
  const state = documentCategoryState(files)
  const openFileManager = () => !isUploading && onOpenFileManager(section, true)

  return (
    <section className="docs-detail" aria-label={section}>
      {showHeader && (
      <header className="docs-detail-head">
        <div className="docs-detail-heading">
          <h5 className="docs-detail-title">{section}</h5>
          <span className={`docs-badge${CATEGORY_LOOK[state].className}`}>
            <i className={CATEGORY_LOOK[state].badgeIcon} aria-hidden="true"></i>
            {headingLabel(state, isOptionalDocumentCategory(section))}
          </span>
        </div>
      </header>
      )}

      <div
        className={`docs-dropzone${isUploading ? ' is-uploading' : ''}`}
        onClick={openFileManager}
      >
        {isUploading ? (
          <>
            <div className="spinner-border text-primary" role="status" style={{ borderWidth: '0.1rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="docs-dropzone-title">Uploading documents...</p>
          </>
        ) : (
          <>
            <span className="docs-dropzone-icon" aria-hidden="true">
              <i className="ri-upload-cloud-2-line"></i>
            </span>
            <p className="docs-dropzone-title">Click here to upload documents.</p>
          </>
        )}
      </div>

      {uploaded.length > 0 && (
        <div className="docs-files">
          <div className="docs-files-head">
            <span>Uploaded files</span>
            <span className="docs-files-count">{uploaded.length}</span>
          </div>
          <ul className="docs-files-list">
            {uploaded.map((f) => (
              <li className="docs-file" key={f.path}>
                <span className="docs-file-icon">{renderFileIcon(f)}</span>
                <span className="docs-file-text">
                  <span className="docs-file-name" title={f.name}>{f.name}</span>
                  <span className="docs-file-review">
                    {fileExtension(f.name) && <span className="docs-file-ext">{fileExtension(f.name)}</span>}
                    <span className={`badge ${fileReviewBadge(f.reviewStatus).className}`}>{fileReviewBadge(f.reviewStatus).label}</span>
                  </span>
                  {f.reviewStatus === DOCUMENT_STATUS.REJECTED && (
                    <span className="docs-file-reason">
                      {f.rejectionReason ? <>Reason: {f.rejectionReason}. </> : null}
                      Please upload a new file for this document.
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="docs-file-remove"
                  onClick={() => onRemoveFile && f.documentId && onRemoveFile(section, f.documentId)}
                  title="Remove file"
                >
                  <i className="ri-delete-bin-line" aria-hidden="true"></i>
                  <span>Remove</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** A category that opens in place: the narrow-screen layout. */
export const DocumentCategoryItem: React.FC<DocumentCategoryProps> = ({
  isOpen,
  onToggle,
  ...detail
}) => (
  <div className={`docs-stacked-item${isOpen ? ' is-open' : ''}`}>
    <DocumentCategoryButton
      section={detail.section}
      files={detail.files}
      isOpen={isOpen}
      onToggle={onToggle}
      layout="stacked"
    />
    <Collapse isOpen={isOpen}>
      <div className="docs-stacked-body">
        <DocumentCategoryDetail {...detail} showHeader={false} />
      </div>
    </Collapse>
  </div>
)
