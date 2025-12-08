export interface FileSystemItem {
  name: string
  isDirectory: boolean
  path: string
  updatedAt: string
  size?: number
  type?: string
  file?: File
}

export interface DocumentsResponse {
  data: FileSystemItem[]
}

export interface UploadFileResponse {
  data: FileSystemItem
}

export interface CreateFolderResponse {
  data: FileSystemItem
}

export interface RenameItemResponse {
  data: FileSystemItem
}

export interface DeleteItemsResponse {
  success: boolean
}

export interface PasteItemsResponse {
  data: FileSystemItem[]
}
