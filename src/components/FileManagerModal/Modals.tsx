import React, { useState } from 'react'

interface NewFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string) => void
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [folderName, setFolderName] = useState('')
  const maxLength = 255

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (folderName.trim() && folderName.length <= maxLength) {
      onConfirm(folderName.trim())
      setFolderName('')
      onClose()
    }
  }

  const handleClose = () => {
    setFolderName('')
    onClose()
  }

  return (
    <div className="fm-modal-overlay" onClick={handleClose}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-modal-header">Create New Folder</div>
        <form onSubmit={handleSubmit}>
          <div className="fm-modal-body">
            <label className="fm-label">Folder Name</label>
            <input
              className="fm-input"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              maxLength={maxLength}
              autoFocus
            />
            <div className="fm-char-counter">
              {folderName.length}/{maxLength} characters
            </div>
          </div>
          <div className="fm-modal-footer">
            <button type="button" className="fm-btn fm-btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="fm-btn fm-btn-primary" disabled={!folderName.trim() || folderName.length > maxLength}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface RenameModalProps {
  isOpen: boolean
  currentName: string
  onClose: () => void
  onConfirm: (newName: string) => void
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, currentName, onClose, onConfirm }) => {
  const [newName, setNewName] = useState(currentName)
  const maxLength = 255

  React.useEffect(() => {
    setNewName(currentName)
  }, [currentName])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim() && newName !== currentName && newName.length <= maxLength) {
      onConfirm(newName.trim())
      onClose()
    }
  }

  const handleClose = () => {
    setNewName(currentName)
    onClose()
  }

  return (
    <div className="fm-modal-overlay" onClick={handleClose}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-modal-header">Rename Item</div>
        <form onSubmit={handleSubmit}>
          <div className="fm-modal-body">
            <label className="fm-label">New Name</label>
            <input
              className="fm-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              maxLength={maxLength}
              autoFocus
            />
            <div className="fm-char-counter">
              {newName.length}/{maxLength} characters
            </div>
          </div>
          <div className="fm-modal-footer">
            <button type="button" className="fm-btn fm-btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="fm-btn fm-btn-primary" disabled={!newName.trim() || newName === currentName || newName.length > maxLength}>
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteConfirmDialogProps {
  isOpen: boolean
  itemCount: number
  onClose: () => void
  onConfirm: () => void
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ isOpen, itemCount, onClose, onConfirm }) => {
  if (!isOpen) return null

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-modal-header">Confirm Delete</div>
        <div className="fm-modal-body">
          <p>Are you sure you want to delete {itemCount} {itemCount === 1 ? 'item' : 'items'}?</p>
          <p className="fm-delete-warning">This action cannot be undone.</p>
        </div>
        <div className="fm-modal-footer">
          <button className="fm-btn fm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="fm-btn fm-btn-danger" onClick={() => { onConfirm(); onClose(); }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: FileList) => void
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files)
      onClose()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
      onClose()
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-modal-header">Upload Files</div>
        <div className="fm-modal-body">
          <div
            className={`fm-upload-area ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <svg className="fm-upload-area-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="fm-upload-text-primary">
              Drag and drop files here
            </p>
            <p className="fm-upload-text-secondary">
              or click to browse
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="fm-file-input-hidden"
          />
        </div>
        <div className="fm-modal-footer">
          <button className="fm-btn fm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
