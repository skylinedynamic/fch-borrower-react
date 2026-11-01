import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { fireEvent, renderWithProviders, screen } from '../../test-utils'
import { UploadModal } from '../../../src/components/FileManagerModal/Modals'

/**
 * Defect (BUG-044): a file of a type that is not allowed (qa-test-bad.exe) was
 * accepted into Selected Files; Upload (1) then did nothing visible. It is
 * refused when chosen, with the reason and the allowed types on screen.
 */
const renderModal = (onUpload = vi.fn()) => {
  const view = renderWithProviders(
    <UploadModal isOpen onClose={vi.fn()} onUpload={onUpload} uploadProgress={null} currentUploadingFile={null} />
  )
  const input = view.container.querySelector('input[type="file"]') as HTMLInputElement

  return { ...view, input, onUpload }
}

const choose = (input: HTMLInputElement, files: File[]) => fireEvent.change(input, { target: { files } })

describe('UploadModal', () => {
  it('refuses a file type that is not allowed, and says which types are', () => {
    const { input } = renderModal()

    choose(input, [new File(['MZ'], 'qa-test-bad.exe', { type: 'application/x-msdownload' })])

    expect(screen.queryByText(/Selected Files/)).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('"qa-test-bad.exe" is not an allowed file type (.exe).')
    for (const type of ['pdf', 'docx', 'jpg']) {
      expect(screen.getByRole('alert')).toHaveTextContent(new RegExp(`Allowed types:.*\\b${type}\\b`))
    }
    expect(screen.getByRole('button', { name: 'Upload (0)' })).toBeDisabled()
  })

  it('keeps the allowed files from the same pick and uploads them', async () => {
    const { input, onUpload } = renderModal()
    const pdf = new File(['%PDF'], 'license.pdf', { type: 'application/pdf' })

    choose(input, [pdf, new File(['MZ'], 'bad.exe')])

    expect(screen.getByText('Selected Files (1)')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Upload (1)' }))
    expect(onUpload).toHaveBeenCalledWith([pdf])
  })

  it('tells the browser which types to offer', () => {
    const { input } = renderModal()

    expect(input.accept).toContain('.pdf')
    expect(input.accept).not.toContain('.exe')
  })
})
