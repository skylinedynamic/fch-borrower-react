import React from 'react'
import { Collapse } from 'reactstrap'
import type { FileSystemItem } from '../../../modules/filemanager/types'
import { isOptionalDocumentCategory } from '../../../config/documents'
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

const fileCountLabel = (count: number, optional: boolean) =>
  count ? `${count} file${count === 1 ? '' : 's'}` : optional ? 'Optional' : 'Not uploaded'

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

  return (
    <button
      className={`docs-category${isOpen ? ' is-active' : ''}`}
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className={`docs-category-status${files.length ? ' is-done' : ''}`} aria-hidden="true">
        <i className={files.length ? 'ri-check-line' : 'ri-file-upload-line'}></i>
      </span>
      <span className="docs-category-text">
        <span className="docs-category-name">{section}</span>
        <span className="docs-category-meta">{fileCountLabel(count, optional)}</span>
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
  const openFileManager = () => !isUploading && onOpenFileManager(section, true)

  return (
    <section className="docs-detail" aria-label={section}>
      {showHeader && (
      <header className="docs-detail-head">
        <div className="docs-detail-heading">
          <h5 className="docs-detail-title">{section}</h5>
          <span className={`docs-badge${uploaded.length ? ' is-done' : ''}`}>
            <i className={uploaded.length ? 'ri-checkbox-circle-fill' : 'ri-time-line'} aria-hidden="true"></i>
            {uploaded.length ? 'Uploaded' : isOptionalDocumentCategory(section) ? 'Optional' : 'Not uploaded'}
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
                  {fileExtension(f.name) && <span className="docs-file-ext">{fileExtension(f.name)}</span>}
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
