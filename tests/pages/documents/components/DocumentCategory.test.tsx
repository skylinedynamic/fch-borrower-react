import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocumentCategoryButton, DocumentCategoryDetail } from '../../../../src/pages/documents/components/DocumentCategory'
import type { FileSystemItem } from '../../../../src/modules/filemanager/types'

const file = (id: number, reviewStatus: string) =>
  ({ id: `f${id}`, documentId: id, name: `file-${id}.pdf`, isDirectory: false, reviewStatus, size: 1000 }) as unknown as FileSystemItem

const renderDetail = (files: FileSystemItem[]) =>
  render(<DocumentCategoryDetail section="Voided Business Check" files={files} onOpenFileManager={() => {}} />)

const renderButton = (files: FileSystemItem[]) =>
  render(<DocumentCategoryButton section="Voided Business Check" files={files} isOpen={false} onToggle={() => {}} layout="split" />)

// BUG-135: the heading said "Uploaded" while the only file was rejected, and a
// file still waiting for review looked accepted (green tick, "Uploaded").
describe('DocumentCategoryDetail heading', () => {
  it('says a re-upload is needed when every file is rejected', () => {
    renderDetail([file(1, 'Rejected')])

    expect(screen.getByText('Re-upload needed')).toHaveClass('docs-badge', 'is-rejected')
    expect(screen.queryByText(/^Uploaded$/)).not.toBeInTheDocument()
  })

  it('says Pending review, not accepted, while the file waits for review', () => {
    renderDetail([file(1, 'Rejected'), file(2, 'Uploaded')])

    expect(screen.getAllByText('Pending review')[0]).toHaveClass('docs-badge', 'is-pending')
    expect(screen.queryByText(/^Accepted$/, { selector: '.docs-badge' })).not.toBeInTheDocument()
  })

  it('says Accepted once a file is accepted', () => {
    renderDetail([file(1, 'Uploaded'), file(2, 'Accepted')])

    expect(screen.getByText('Accepted', { selector: '.docs-badge' })).toHaveClass('is-done')
  })
})

describe('DocumentCategoryButton', () => {
  it('shows the green tick only for an accepted file', () => {
    const { container } = renderButton([file(1, 'Accepted')])

    expect(container.querySelector('.docs-category-status.is-done .ri-check-line')).not.toBeNull()
  })

  it('shows a pending clock, not the tick, for a file waiting for review', () => {
    const { container } = renderButton([file(1, 'Uploaded')])

    expect(container.querySelector('.docs-category-status.is-pending')).not.toBeNull()
    expect(container.querySelector('.docs-category-status.is-done')).toBeNull()
    expect(screen.getByRole('button')).toHaveTextContent('Pending review')
  })
})
