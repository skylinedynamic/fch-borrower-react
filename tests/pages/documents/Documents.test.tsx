import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import Documents from '../../../src/pages/documents/Documents'

vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

afterEach(() => server.resetHandlers())

describe('Documents page', () => {
  it('renders a section per document type once types and documents load', async () => {
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () =>
        HttpResponse.json({
          status: true,
          data: [
            { id: 1, name: 'Bank Statements', sort_order: 1 },
            { id: 2, name: 'Tax Returns', sort_order: 2 },
          ],
        })
      ),
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, data: {} }))
    )

    renderWithProviders(<Documents />)

    expect(await screen.findByText('Bank Statements')).toBeInTheDocument()
    expect(screen.getByText('Tax Returns')).toBeInTheDocument()
  })

  it('toasts an error when document data fails to load', async () => {
    const { toast } = await import('react-toastify')
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () => HttpResponse.error()),
      http.get('*/borrower/documents', () => HttpResponse.error())
    )

    renderWithProviders(<Documents />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load documents'))
  })
})

/**
 * BUG-087: the client saw the same green tick on an accepted and a rejected
 * document, and never the reason - although the rejection modal says it is
 * shared with the borrower. Each file now carries its review badge, and a
 * rejected one its reason and what to do next.
 */
describe('Documents page - review status', () => {
  const serveReviewed = () =>
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () =>
        HttpResponse.json({
          status: true,
          data: [
            { id: 1, name: 'Business Bank Statements', sort_order: 1 },
            { id: 2, name: 'Driver License', sort_order: 2 },
            { id: 3, name: 'Tax Returns', sort_order: 3 },
          ],
        })
      ),
      http.get('*/borrower/documents', () =>
        HttpResponse.json({
          status: true,
          data: {
            1: [{ id: 11, borrower_id: 5, document_type_id: 1, file_name: 'march-statement.pdf', file_path: 'a.pdf', url: '', status: 'Rejected', rejection_reason: 'Statement is older than 90 days' }],
            2: [{ id: 12, borrower_id: 5, document_type_id: 2, file_name: 'licence.jpg', file_path: 'b.jpg', url: '', status: 'Accepted', rejection_reason: null }],
            3: [{ id: 13, borrower_id: 5, document_type_id: 3, file_name: 'tax-2025.pdf', file_path: 'c.pdf', url: '', status: 'Uploaded', rejection_reason: null }],
          },
        })
      )
    )

  // The page shows one category at a time: open it from the list, then read its files.
  const openCategory = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
    await user.click(await screen.findByRole('button', { name: new RegExp(name) }))
  }
  const fileRow = (name: string) => screen.getAllByText(name)[0].closest('.docs-file') as HTMLElement

  it('shows Rejected with the reason, Accepted, and Pending review on each file', async () => {
    serveReviewed()
    const user = userEvent.setup()
    renderWithProviders(<Documents />)

    await openCategory(user, 'Business Bank Statements')
    const rejected = fileRow('march-statement.pdf')
    expect(within(rejected).getByText('Rejected')).toBeInTheDocument()
    expect(within(rejected).getByText(/Statement is older than 90 days/)).toBeInTheDocument()
    expect(within(rejected).getByText(/upload a new file/i)).toBeInTheDocument()

    await openCategory(user, 'Driver License')
    const accepted = fileRow('licence.jpg')
    expect(within(accepted).getByText('Accepted')).toBeInTheDocument()
    expect(within(accepted).queryByText(/Reason/)).not.toBeInTheDocument()

    await openCategory(user, 'Tax Returns')
    expect(within(fileRow('tax-2025.pdf')).getByText('Pending review')).toBeInTheDocument()
  })

  // The review shows on each file only: the category list and the heading keep
  // saying "Uploaded" as before.
  it('leaves the category list and heading as they were - the review is on each file', async () => {
    serveReviewed()
    renderWithProviders(<Documents />)

    const category = await screen.findByRole('button', { name: /Business Bank Statements/ })
    expect(category.querySelector('.docs-category-status.is-done .ri-check-line')).not.toBeNull()
    expect(category).not.toHaveTextContent(/Rejected|Accepted/)
  })
})
