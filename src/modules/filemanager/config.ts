export const FILE_MANAGER_CONFIG = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  // A picture may be up to 5 MB - the API's limit (config/uploads.php, BUG-014).
  MAX_PICTURE_SIZE: 5 * 1024 * 1024,
  PICTURE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'tiff', 'tif', 'ico', 'avif', 'svg'],
  MAX_NAME_LENGTH: 20,
  ALLOWED_EXTENSIONS: [
    // Images
    // No SVG: it can carry a script, and the API refuses it (BUG-015).
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'tiff', 'tif', 'ico', 'avif',

    // Documents
    'doc', 'docx', 'pdf', 'txt', 'rtf', 'odt',

    // Data
    'xls', 'xlsx', 'csv', 'ods',

    // Archives
    'zip', 'rar', '7z',

    // Videos
    'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v'
  ]
}

/** For the file input's accept attribute, so the picker offers only these. */
export const FILE_MANAGER_ACCEPT = FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')

/** The largest file of this name the API takes: 5 MB for a picture, else 20 MB. */
export const maxUploadSizeFor = (fileName: string): number => {
  const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : ''
  return FILE_MANAGER_CONFIG.PICTURE_EXTENSIONS.includes(extension)
    ? FILE_MANAGER_CONFIG.MAX_PICTURE_SIZE
    : FILE_MANAGER_CONFIG.MAX_FILE_SIZE
}

/**
 * Why a file cannot be uploaded, or null when it can. Checked when the file is
 * chosen, so a refused file never sits in the list looking accepted (BUG-044).
 */
export const fileRejectionReason = (file: File): string | null => {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''

  if (!extension || !FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return `"${file.name}" is not an allowed file type${extension ? ` (.${extension})` : ''}.`
  }

  const maxSize = maxUploadSizeFor(file.name)
  if (file.size > maxSize) {
    return `"${file.name}" exceeds the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit.`
  }

  return null
}
