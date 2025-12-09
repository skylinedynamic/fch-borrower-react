import { apiClient } from '../../lib/http/apiClient'
import type {
  FileSystemItem,
  DocumentsResponse,
  UploadFileResponse,
  CreateFolderResponse,
  RenameItemResponse,
  DeleteItemsResponse,
  PasteItemsResponse
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
    path
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
