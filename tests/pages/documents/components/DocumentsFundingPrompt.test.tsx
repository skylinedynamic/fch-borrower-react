import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { within } from '@testing-library/react'
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

  it('shows how far along as a ring, filled of total', () => {
    renderPrompt()

    expect(screen.getByRole('img', { name: '1 of 4 required categories uploaded' })).toHaveTextContent('1/4')
  })

  it('lists each required category as a step, marked by where it stands, the next one picked out', () => {
    renderPrompt({
      categories: [
        { name: "Driver's License", state: 'accepted' },
        { name: 'Voided Business Check', state: 'empty' },
        { name: 'EIN / Corporation Docs', state: 'pending' },
        { name: 'Business Bank Statements', state: 'reupload' },
      ],
    })

    const steps = within(screen.getByRole('list', { name: 'Required documents' })).getAllByRole('listitem')
    expect(steps.map((s) => s.querySelector('.docs-prompt-step-name')?.textContent)).toEqual([
      "Driver's License",
      'Voided Business Check',
      'EIN / Corporation Docs',
      'Business Bank Statements',
    ])
    expect(steps.map((s) => s.className)).toEqual([
      'docs-prompt-step is-accepted',
      'docs-prompt-step is-empty is-next',
      'docs-prompt-step is-pending',
      'docs-prompt-step is-reupload',
    ])
    expect(steps[1]).toHaveAttribute('aria-current', 'step')
    // A stepper: each step's mark, numbered while it has nothing in it.
    expect(steps.map((s) => s.querySelector('.docs-prompt-step-mark')?.textContent)).toEqual(['', '2', '', ''])
  })

  it('says nothing when there are no document categories', () => {
    renderPrompt({ filled: 0, total: 0, nextMissing: null })

    expect(screen.queryByRole('region', { name: /your next step/i })).toBeNull()
  })
})
