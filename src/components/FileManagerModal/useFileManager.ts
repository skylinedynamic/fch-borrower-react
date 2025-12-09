import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  fetchDocuments,
  uploadFile,
  createFolder,
  renameItem,
  deleteItems,
  pasteItems
} from '../../modules/filemanager/services'
import type { FileSystemItem } from '../../modules/filemanager/types'

export const useFileManager = (section?: string, initialPath: string = '/', config: { enabled?: boolean } = { enabled: true }) => {
  const [files, setFiles] = useState<FileSystemItem[]>([])
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [loading, setLoading] = useState(false)
  const hasLoadedRef = useRef(false)

  const loadFiles = useCallback(async (path: string) => {
    setLoading(true)
    try {
      const data = await fetchDocuments(section, path)
      setFiles(data)
      setCurrentPath(path)
    } catch (error) {
      console.error('Failed to load files', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [section])

  // Initial load - only runs once when enabled
  useEffect(() => {
    if (config.enabled && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadFiles(initialPath)
    }
  }, [config.enabled, initialPath, loadFiles])

  // Reset when modal closes
  useEffect(() => {
    if (!config.enabled) {
      hasLoadedRef.current = false
    }
  }, [config.enabled])

  const handleNavigate = useCallback((path: string) => {
    console.log('handleNavigate path:', path)
    loadFiles(path)
  }, [loadFiles])

  const handleCreateFolder = async (name: string, parentPath: string) => {
    try {
      await createFolder(name, parentPath)
      await loadFiles(parentPath)
      toast.success('Folder created')
    } catch (error) {
      console.error('Create folder failed', error)
      toast.error('Failed to create folder')
    }
  }

  const handleUploadFile = async (file: File, parentPath: string) => {
    try {
      await uploadFile(file, parentPath, section)
      await loadFiles(parentPath)
      toast.success('File uploaded')
    } catch (error) {
      console.error('Upload failed', error)
      toast.error('Failed to upload file')
    }
  }

  const handleRename = async (path: string, newName: string) => {
    try {
      await renameItem(path, newName, section)
      await loadFiles(currentPath) // Refresh current view
      toast.success('Item renamed')
    } catch (error) {
      console.error('Rename failed', error)
      toast.error('Failed to rename item')
    }
  }

  const handleDelete = async (paths: string[]) => {
    try {
      await deleteItems(paths, section)
      await loadFiles(currentPath)
      toast.success('Items deleted')
    } catch (error) {
      console.error('Delete failed', error)
      toast.error('Failed to delete items')
    }
  }

  const handlePaste = async (items: FileSystemItem[], destinationPath: string, operation: 'copy' | 'move') => {
    try {
      await pasteItems(items, destinationPath, operation, section)
      await loadFiles(destinationPath)
      toast.success('Items pasted')
    } catch (error) {
      console.error('Paste failed', error)
      toast.error('Failed to paste items')
    }
  }

  return {
    files,
    loading,
    currentPath,
    setCurrentPath,
    refresh: useCallback(() => loadFiles(currentPath), [loadFiles, currentPath]),
    handleNavigate,
    handleCreateFolder,
    handleUploadFile,
    handleRename,
    handleDelete,
    handlePaste
  }
}
