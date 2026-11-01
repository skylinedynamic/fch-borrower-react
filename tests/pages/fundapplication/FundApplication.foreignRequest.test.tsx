import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import FundApplication from '../../../src/pages/fundapplication/FundApplication'

afterEach(() => server.resetHandlers())

const renderWizard = (requestId: number) =>
  renderWithProviders(
    <Routes>
      <Route path="/fund-application/:id" element={<FundApplication />} />
    </Routes>,
    { route: `/fund-application/${requestId}` }
  )

// Defect: BUG-082. /fund-application/40 opened the wizard for another
// borrower's funding request, with its funding option in the title. The API
// now answers 404 for it, and the page shows "Request not found" instead.
describe('FundApplication - another borrower\'s funding request', () => {
  it('shows Request not found and no wizard when the API answers 404', async () => {
    server.use(
      http.get('*/borrower/funding-application/funding-request', () =>
        HttpResponse.json({ status: false, message: 'Funding request information not found' }, { status: 404 })
      ),
      // The other steps load lazily; anything else under the wizard is empty.
      http.get('*/borrower/funding-application/*', () => HttpResponse.json({ status: true, data: null })),
      http.get('*/borrower/*', () => HttpResponse.json({ status: true, data: null }))
    )

    renderWizard(40)

    expect(await screen.findByText('Request not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to Funding Requests/i })).toBeInTheDocument()
    expect(screen.queryByText(/Your Business Funding Application/i)).not.toBeInTheDocument()
  })
})

// Defect: R2 BUG-027. /fund-application/86 (an application id typed where a
// request id goes) opened a blank 0/8 wizard for the borrower's own request
// 86, which was never approved. The API now answers 404 for a request no
// application can be started on, and the page shows "Request not found".
describe('FundApplication - a request that was not approved (R2 BUG-027)', () => {
  it('shows Request not found, not an empty wizard', async () => {
    server.use(
      http.get('*/borrower/funding-application/funding-request', () =>
        HttpResponse.json({ status: false, message: 'No funding application can be started for this request: it has not been approved.' }, { status: 404 })
      ),
      http.get('*/borrower/funding-application/*', () => HttpResponse.json({ status: true, data: null })),
      http.get('*/borrower/*', () => HttpResponse.json({ status: true, data: null }))
    )

    renderWizard(86)

    expect(await screen.findByText('Request not found')).toBeInTheDocument()
    expect(screen.queryByText(/Start Your Business Funding Application/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Your Business Funding Application/i)).not.toBeInTheDocument()
  })
})
