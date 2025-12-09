import React, { useEffect } from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import { FileManager } from '@cubone/react-file-manager'
import '@cubone/react-file-manager/dist/style.css'
import { useFileManager } from './useFileManager'

interface FileManagerModalProps {
  isOpen: boolean
  toggle: () => void
  section?: string
  initialPath?: string
}

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  toggle,
  section,
  initialPath = '/'
}) => {
  const {
    files,
    loading,
    currentPath,
    setCurrentPath,
    refresh,
    handleNavigate,
    handleCreateFolder,
    handleUploadFile,
    handleRename,
    handleDelete,
    handlePaste
  } = useFileManager(section, initialPath, { enabled: isOpen })

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
      <ModalHeader toggle={toggle}>File Manager {section ? `- ${section}` : ''}</ModalHeader>
      <ModalBody style={{ height: '80vh', padding: 0 }}>
        <FileManager
          files={files}
          initialPath={currentPath}
          onFolderChange={(path: string) => {
            console.log('onFolderChange path:', path)
            handleNavigate(path)
          }}
          onCreateFolder={(name, parent: any) => handleCreateFolder(name, parent?.path || parent)}
          onFileUploaded={handleUploadFile}
          onRename={handleRename}
          onDelete={handleDelete}
          onPaste={handlePaste}
          permissions={{
            create: true,
            copy: true,
            move: true,
            delete: true,
            rename: true,
            upload: true,
            download: true,
          }}
        />
      </ModalBody>
    </Modal>
  )
}
