import { apiClient } from '../../lib/http/apiClient'
import type {
  FileSystemItem,
  DocumentsResponse,
  UploadFileResponse,
  CreateFolderResponse,
  RenameItemResponse,
  DeleteItemsResponse,
  PasteItemsResponse,
  FolderTreeResponse
} from './types'

const BASE_URL = '/filemanager'

export const fetchDocuments = async (section?: string, path: string = '/'): Promise<FileSystemItem[]> => {
  const body: any = { path }
  if (section) body.section = section
  
  const { data } = await apiClient.post<DocumentsResponse>(`${BASE_URL}/list`, body)
  return data.data
}

export const uploadFile = async (file: File, path: string, section?: string): Promise<FileSystemItem> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', path)
  if (section) formData.append('section', section)

  const { data } = await apiClient.post<UploadFileResponse>(`${BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data.data
}

export const createFolder = async (name: string, path: string): Promise<FileSystemItem> => {
  const { data } = await apiClient.post<CreateFolderResponse>(`${BASE_URL}/folder`, {
    name,
    path: path === '/' ? null : path
  })
  return data.data
}

export const renameItem = async (path: string, newName: string, section?: string): Promise<FileSystemItem> => {
  const { data } = await apiClient.put<RenameItemResponse>(`${BASE_URL}/rename`, {
    path,
    newName,
    section
  })
  return data.data
}

export const deleteItems = async (paths: string[], section?: string): Promise<boolean> => {
  const { data } = await apiClient.post<DeleteItemsResponse>(`${BASE_URL}/delete`, {
    paths,
    section
  })
  return data.success
}

export const pasteItems = async (files: FileSystemItem[], destinationPath: string, operation: 'copy' | 'move', section?: string): Promise<FileSystemItem[]> => {
  const { data } = await apiClient.post<PasteItemsResponse>(`${BASE_URL}/paste`, {
    files,
    destinationPath,
    operation,
    section
  })
  return data.data
}

export const downloadFile = async (path: string, filename: string): Promise<void> => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/download`,
      { path },
      { responseType: 'blob' }
    )

    // Create a blob URL and trigger download
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}

export const fetchFolderTree = async (section?: string, path: string = '/'): Promise<FileSystemItem[]> => {
  const body: any = { path }
  if (section) body.section = section
  
  const { data } = await apiClient.post<FolderTreeResponse>(`${BASE_URL}/tree`, body)
  return data.data
}

export const attachFiles = async (files: string[], documentTypeId: number): Promise<any> => {
  const { data } = await apiClient.post(`${BASE_URL}/upload-file`, {
    files,
    document_type_id: documentTypeId
  })
  return data
}

export const submitFileSelection = async (files: string[], endpoint: string, payload: Record<string, any> = {}): Promise<any> => {
  const { data } = await apiClient.post(endpoint, {
    files,
    ...payload
  })
  return data
}
