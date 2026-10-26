import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, waitFor, within } from '../../test-utils'
import { server } from '../../mocks/server'
import FundingRequestDetailPage from '../../../src/pages/funding-requests/FundingRequestDetailPage'

vi.mock('bootstrap/js/dist/modal', () => {
  class FakeModal {
    constructor(private el: HTMLElement) {}
    show() {
      this.el.classList.add('show')
      this.el.style.display = 'block'
    }
    hide() {
      this.el.classList.remove('show')
      this.el.style.display = 'none'
    }
    dispose() {}
  }
  return { default: FakeModal }
})

/**
 * Defect (BUG-088): a Pending funding request's Uploaded Documents table had
 * an Action column holding only Download - documents could be added or removed
 * from the Documents page alone. While the request is Pending they can be
 * managed here too; once it is decided the table is read-only.
 */
const request = (status: string) => ({
  id: 42,
  status,
  funding_type: 'Business Line of Credit',
  funding_sequence: { id: 5, name: 'Business Line of Credit', amount_range: null },
  actual_documents: [
    { id: 301, document_name: 'Bank Statement', file_name: 'march.pdf', document_url: null, status: 'Pending', created_at: null },
    { id: 'missing_1', document_name: 'Tax Return', file_name: null, document_url: null, status: 'Pending', created_at: null },
  ],
})

let deleted: string[]

const serve = (status: string) =>
  server.use(
    http.get('*/borrower/funding/requests/42', () => HttpResponse.json({ success: true, data: request(status) })),
    http.get('*/borrower/documents/borrower-document-types', () =>
      HttpResponse.json({ status: true, message: 'ok', data: [{ id: 7, name: 'Bank Statement', sort_order: 1 }, { id: 8, name: 'Tax Return', sort_order: 2 }] })
    ),
    http.post('*/borrower/activity-logs/fetch-all-activities', () => HttpResponse.json({ status: true, data: [], meta: { current_page: 1, last_page: 1, total: 0 } })),
    http.delete('*/borrower/funding/requests/documents/:docId', ({ request: req, params }) => {
      deleted.push(`${params.docId}?${new URL(req.url).searchParams.get('funding_sequence_id')}`)
      return HttpResponse.json({ status: true, message: 'Document deleted' })
    }),
    http.all('*/filemanager/*', () => HttpResponse.json({ status: true, data: [] })),
  )

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/funding-requests/:id" element={<FundingRequestDetailPage />} />
    </Routes>,
    { route: '/funding-requests/42' }
  )

beforeEach(() => {
  deleted = []
})

afterEach(() => server.resetHandlers())

describe('FundingRequestDetailPage - documents of a pending request', () => {
  it('offers Upload for each document type and Remove for each file', async () => {
    serve('Pending')
    renderPage()

    expect(await screen.findByText('march.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload Bank Statement' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload Tax Return' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove march.pdf' })).toBeInTheDocument()
  })

  it('removes a file after confirmation', async () => {
    serve('Pending')
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Remove march.pdf' }))
    const dialog = await screen.findByText(/delete "march.pdf"/i)
    await userEvent.click(within(dialog.closest('.modal') as HTMLElement).getByRole('button', { name: /delete/i, hidden: true }))

    await waitFor(() => expect(deleted).toEqual(['301?5']))
  })

  it('is read-only once the request is decided', async () => {
    serve('Approved')
    renderPage()

    expect(await screen.findByText('march.pdf')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Upload / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument()
  })
})
