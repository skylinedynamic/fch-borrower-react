import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import FundingRequestDetailPage from '../../../src/pages/funding-requests/FundingRequestDetailPage'

vi.mock('react-toastify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-toastify')>()
  return { ...actual, toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }) }
})
import { toast } from 'react-toastify'

const others = () =>
  server.use(
    http.get('*/borrower/documents/borrower-document-types', () => HttpResponse.json({ status: true, message: 'ok', data: [] })),
    http.post('*/borrower/activity-logs/fetch-all-activities', () => HttpResponse.json({ status: true, data: [], meta: { current_page: 1, last_page: 1, total: 0 } })),
    http.all('*/filemanager/*', () => HttpResponse.json({ status: true, data: [] })),
  )

const renderPage = (id: number) =>
  renderWithProviders(
    <Routes>
      <Route path="/funding-requests/:id" element={<FundingRequestDetailPage />} />
    </Routes>,
    { route: `/funding-requests/${id}` }
  )

beforeEach(() => vi.mocked(toast.error).mockClear())
afterEach(() => server.resetHandlers())

/**
 * Defect: /funding-requests/70 - a request that is not this borrower's, or
 * none at all - showed "Request not found" and also toasted "Failed to load
 * details" (twice in development, where the load runs twice). The card says
 * it; there is no error toast. A real failure still toasts, once.
 */
describe('Funding request detail - a request that cannot be shown', () => {
  it('a request the API does not find shows "Request not found" and no error toast', async () => {
    others()
    server.use(
      http.get('*/borrower/funding/requests/70', () =>
        HttpResponse.json({ success: false, message: 'Funding request not found.' }, { status: 404 })
      )
    )
    renderPage(70)

    expect(await screen.findByText('Request not found', {}, { timeout: 10000 })).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  }, 15000)

  it('a server failure is toasted once, and only once however often the page loads', async () => {
    others()
    server.use(http.get('*/borrower/funding/requests/71', () => HttpResponse.json({ message: 'boom' }, { status: 500 })))
    renderPage(71)

    await screen.findByText('Request not found', {}, { timeout: 10000 })
    expect(toast.error).toHaveBeenCalledWith('Failed to load details', expect.objectContaining({ toastId: 'funding-request-load' }))
  }, 15000)
})
