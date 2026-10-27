import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '../../../test-utils'
import DocumentsFundingPrompt from '../../../../src/pages/documents/components/DocumentsFundingPrompt'

/**
 * The top of Documents: the four required documents are needed to apply for
 * funding, so it pushes the borrower to upload them, then on to Funding.
 */
function renderPrompt(props: Partial<React.ComponentProps<typeof DocumentsFundingPrompt>> = {}) {
  const onUploadNext = vi.fn()
  renderWithProviders(
    <Routes>
      <Route
        path="/documents"
        element={
          <DocumentsFundingPrompt filled={1} total={4} nextMissing="Voided Business Check" onUploadNext={onUploadNext} {...props} />
        }
      />
      <Route path="/funding" element={<p>Funding page</p>} />
    </Routes>,
    { route: '/documents' }
  )
  return { onUploadNext }
}

describe('Documents: uploading the required documents to apply for funding', () => {
  it('asks for the required documents while some are missing, and says how many are in', () => {
    renderPrompt()

    const prompt = screen.getByRole('region', { name: /your next step/i })
    expect(prompt).toHaveTextContent(/upload your required documents to apply for funding/i)
    expect(prompt).toHaveTextContent(/1 of 4 required categories uploaded/i)
    expect(screen.queryByRole('link', { name: /continue to funding/i })).toBeNull()
  })

  it('takes the borrower to the next document still missing', async () => {
    const user = userEvent.setup()
    const { onUploadNext } = renderPrompt()

    await user.click(screen.getByRole('button', { name: /upload voided business check/i }))

    expect(onUploadNext).toHaveBeenCalledOnce()
  })

  it('asks for them before any is in, too', () => {
    renderPrompt({ filled: 0, nextMissing: "Driver's License" })

    expect(screen.getByRole('region', { name: /your next step/i })).toHaveTextContent(/0 of 4 required categories uploaded/i)
    expect(screen.getByRole('button', { name: /upload driver's license/i })).toBeInTheDocument()
  })

  it('sends the borrower on to Funding once every required document is in', async () => {
    const user = userEvent.setup()
    renderPrompt({ filled: 4, nextMissing: null })

    const prompt = screen.getByRole('region', { name: /your next step/i })
    expect(prompt).toHaveTextContent(/your documents are in\. you can apply for funding now/i)
    expect(screen.queryByRole('button', { name: /^upload/i })).toBeNull()

    await user.click(screen.getByRole('link', { name: /continue to funding/i }))
    expect(await screen.findByText('Funding page')).toBeInTheDocument()
  })

  it('says nothing when there are no document categories', () => {
    renderPrompt({ filled: 0, total: 0, nextMissing: null })

    expect(screen.queryByRole('region', { name: /your next step/i })).toBeNull()
  })
})
