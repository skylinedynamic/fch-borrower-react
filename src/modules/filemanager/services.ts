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

export const fetchDocuments = async (path: string = '/'): Promise<FileSystemItem[]> => {
  const { data } = await apiClient.get<DocumentsResponse>('/filemanager')
  return data.data
}

export const uploadFile = async (file: File, section: string, path: string): Promise<FileSystemItem> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('section', section)
  formData.append('path', path)

  const { data } = await apiClient.post<UploadFileResponse>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data.data
}

export const createFolder = async (name: string, section: string, path: string): Promise<FileSystemItem> => {
  const { data } = await apiClient.post<CreateFolderResponse>('/documents/folder', {
    name,
    section,
    path
  })
  return data.data
}

export const renameItem = async (path: string, newName: string, section: string): Promise<FileSystemItem> => {
  const { data } = await apiClient.put<RenameItemResponse>('/documents/rename', {
    path,
    newName,
    section
  })
  return data.data
}

export const deleteItems = async (paths: string[], section: string): Promise<boolean> => {
  const { data } = await apiClient.post<DeleteItemsResponse>('/documents/delete', {
    paths,
    section
  })
  return data.success
}

export const pasteItems = async (files: FileSystemItem[], destinationPath: string, operation: 'copy' | 'move', section: string): Promise<FileSystemItem[]> => {
  const { data } = await apiClient.post<PasteItemsResponse>('/documents/paste', {
    files,
    destinationPath,
    operation,
    section
  })
  return data.data
}
