export const FILE_MANAGER_CONFIG = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_NAME_LENGTH: 20,
  ALLOWED_EXTENSIONS: [
    // Images
    'jpg', 'jpeg', 'png', 'svg', 'gif', 'webp', 'bmp', 'heic', 'tiff', 'tif', 'ico', 'avif',

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

/**
 * Why a file cannot be uploaded, or null when it can. Checked when the file is
 * chosen, so a refused file never sits in the list looking accepted (BUG-044).
 */
export const fileRejectionReason = (file: File): string | null => {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''

  if (!extension || !FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return `"${file.name}" is not an allowed file type${extension ? ` (.${extension})` : ''}.`
  }

  if (file.size > FILE_MANAGER_CONFIG.MAX_FILE_SIZE) {
    return `"${file.name}" exceeds the ${(FILE_MANAGER_CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit.`
  }

  return null
}
