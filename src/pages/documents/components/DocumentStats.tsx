import React from 'react'
import { FILE_MANAGER_CONFIG } from '../../../modules/filemanager/config'

export const DocumentStats: React.FC = () => {
  const allowedExtensions = FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.map(ext => ext.toUpperCase()).join(', ')
  const maxFileSizeMB = FILE_MANAGER_CONFIG.MAX_FILE_SIZE / (1024 * 1024)

  return (
    <div className="text-center mb-3">
      <h4 className="mb-1">Documents</h4>
      <div className="text-muted">Upload and view your documents for quick overview</div>
      <div className="mt-1">
        <span className="text-primary">Allowed files</span>: {allowedExtensions} <span className="text-muted">Maximum file size: {maxFileSizeMB}MB per file</span>
      </div>
    </div>
  )
}
