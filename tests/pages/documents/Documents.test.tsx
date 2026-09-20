import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
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
