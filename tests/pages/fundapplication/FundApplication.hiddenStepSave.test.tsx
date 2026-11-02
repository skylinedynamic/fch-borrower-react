import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { fireEvent, renderWithProviders, waitFor, within } from '../../test-utils'
import { server } from '../../mocks/server'
import FundApplication from '../../../src/pages/fundapplication/FundApplication'

vi.mock('bootstrap/js/dist/modal', () => {
  class FakeModal {
    constructor(private el: HTMLElement) {}
    show() { this.el.classList.add('show') }
    hide() { this.el.classList.remove('show') }
    dispose() {}
  }
  return { default: FakeModal }
})

const desktop = (query: string) => ({
  matches: query.includes('min-width: 992px'),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}) as unknown as MediaQueryList

afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

/**
 * Defect: every step is rendered twice - the desktop pane and the mobile
 * accordion - and both registered their save, the hidden mobile copy last.
 * Moving on from the sidebar ran the hidden copy's save, so a refused save put
 * its field messages on the hidden copy: on a desktop only the toast showed.
 * Only the copy on screen registers now (same fix as the partner portal).
 */
describe('FundApplication - a refused save from the sidebar', () => {
  it('shows the field message on the desktop pane, not on the hidden mobile copy', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(desktop)
    server.use(
      http.get('*/borrower/funding-application/funding-request', () =>
        HttpResponse.json({
          status: true, message: 'ok',
          data: {
            id: 21, funding_request_id: 86, status: 'Draft', is_editable: true, is_locked: false,
            is_business_info_saved: true, is_ownership_info_saved: true, is_financial_info_saved: false,
            is_funding_request_saved: false, is_disclosures_saved: false, is_federal_compliance_saved: false,
          },
        })
      ),
      http.get('*/borrower/funding-application/business-info', () =>
        HttpResponse.json({
          status: true, message: 'ok',
          data: {
            id: 21, full_name: 'Ada Lovelace', business_name: 'Acme', business_email: 'ada@acme.test',
            business_phone_no: '(555) 010-0001', business_country: 'United States', business_address: '1 Main St',
            business_city: 'Austin', business_state: 'Texas', business_postal_code: '73301',
            industry_type: 'Retail', entity_type: 'LLC', years_in_business: '2020-01-01',
          },
        })
      ),
      http.post('*/borrower/funding-application/business-info', () =>
        HttpResponse.json({ status: false, message: 'Invalid', errors: { business_name: 'The business name is required.' } }, { status: 422 })
      ),
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, message: 'ok', data: { documents: [] } })),
      http.get('*/borrower/funding-application/*', () => HttpResponse.json({ status: true, data: null })),
      http.get('*/borrower/*', () => HttpResponse.json({ status: true, data: null })),
    )

    const { container } = renderWithProviders(
      <Routes>
        <Route path="/fund-application/:id" element={<FundApplication />} />
      </Routes>,
      { route: '/fund-application/86' }
    )
    const desktopPane = container.querySelector('.col-xl-9.col-lg-8.d-none.d-lg-block') as HTMLElement
    const sidebar = container.querySelector('.col-xl-3.col-lg-4.d-none.d-lg-block') as HTMLElement
    const ownership = await within(sidebar).findByRole('button', { name: /Ownership Information/ }, { timeout: 10000 })
    await waitFor(() => expect(ownership).toBeEnabled(), { timeout: 10000 })

    fireEvent.click(ownership)

    expect(await within(desktopPane).findByText('The business name is required.', {}, { timeout: 10000 })).toBeInTheDocument()
  }, 25000)
})
