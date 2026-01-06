import { useState } from 'react'
import { toast } from 'react-toastify'
import type { FileEntry } from '../types'

const acceptTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx'
const maxSize = 10 * 1024 * 1024

export const useDocumentUpload = (sections: string[]) => {
  const [docUploads, setDocUploads] = useState<Record<string, FileEntry[]>>(() => {
    const init: Record<string, FileEntry[]> = {}
    sections.forEach((s) => (init[s] = []))
    return init
  })

  const [docUploading, setDocUploading] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    sections.forEach((s) => (init[s] = false))
    return init
  })

  const [docProgress, setDocProgress] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    sections.forEach((s) => (init[s] = 0))
    return init
  })

  const addDocFiles = (key: string, list: FileList | File[]) => {
    const arr = Array.from(list as FileList)
    const invalid = arr.filter(
      (f) =>
        !(
          f.type.startsWith('image/') ||
          [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ].includes(f.type)
        ) || f.size > maxSize
    )
    if (invalid.length) {
      toast.error('Unsupported file or size exceeds 10MB')
      return
    }
    setDocUploading((prev) => ({ ...prev, [key]: true }))
    setDocProgress((prev) => ({ ...prev, [key]: 0 }))
    setDocUploads((prev) => {
      const next = { ...prev }
      const mapped = arr.map<FileEntry>((f) => ({ name: f.name, size: f.size, type: f.type, file: f }))
      next[key] = [...(next[key] || []), ...mapped]
      return next
    })
    let pct = 0
    const step = 7 + Math.round(Math.random() * 12)
    const timer = setInterval(() => {
      pct = Math.min(100, pct + step)
      setDocProgress((p) => ({ ...p, [key]: pct }))
      if (pct >= 100) {
        clearInterval(timer)
        setDocUploading((u) => ({ ...u, [key]: false }))
      }
    }, 120)
  }

  const removeDocFile = (key: string, name: string) => {
    setDocUploads((prev) => {
      const next = { ...prev }
      next[key] = (next[key] || []).filter((f) => f.name !== name)
      return next
    })
  }

  const onDocDrop = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length) addDocFiles(key, e.dataTransfer.files)
  }

  return {
    docUploads,
    docUploading,
    docProgress,
    addDocFiles,
    removeDocFile,
    onDocDrop,
    acceptTypes,
  }
}
