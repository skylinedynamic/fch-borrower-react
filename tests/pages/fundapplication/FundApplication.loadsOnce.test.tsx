import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
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

afterEach(() => server.resetHandlers())

/**
 * Defect: opening /fund-application/40 loaded every step twice. The request
 * id comes from the URL as "40", then the loaded application sets it again
 * as the number 40; the step queries keyed on the raw id, so "40" and 40 were
 * two different queries - each step fetched again and showed its loading
 * skeleton a second time. Each step is fetched once now.
 */
describe('FundApplication - opening an application', () => {
  it('fetches each step once, though the request id turns from "40" into 40', async () => {
    const calls: Record<string, number> = {}
    const count = (step: string) => () => {
      calls[step] = (calls[step] ?? 0) + 1
      return HttpResponse.json({ status: true, message: 'ok', data: null })
    }
    server.use(
      http.get('*/borrower/funding-application/funding-request', () =>
        HttpResponse.json({
          status: true, message: 'ok',
          data: { id: 21, funding_request_id: 40, status: 'Submitted', is_editable: true, is_locked: false },
        })
      ),
      http.get('*/borrower/funding-application/business-info', count('business-info')),
      http.get('*/borrower/funding-application/ownership-info', count('ownership-info')),
      http.get('*/borrower/funding-application/financial-info', count('financial-info')),
      http.get('*/borrower/funding-application/disclosures-and-consent', count('disclosures')),
      http.get('*/borrower/funding-application/federal-compliance-disclosures', count('federal')),
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, message: 'ok', data: { documents: [] } })),
      http.get('*/borrower/funding-application/*', () => HttpResponse.json({ status: true, data: null })),
      http.get('*/borrower/*', () => HttpResponse.json({ status: true, data: null })),
    )

    renderWithProviders(
      <Routes>
        <Route path="/fund-application/:id" element={<FundApplication />} />
      </Routes>,
      { route: '/fund-application/40' }
    )

    await screen.findAllByText(/Business Information/, {}, { timeout: 10000 })
    await waitFor(() => expect(calls['business-info']).toBeGreaterThan(0), { timeout: 10000 })
    // Let any second round of loading happen.
    await new Promise((resolve) => setTimeout(resolve, 1500))

    for (const step of ['business-info', 'ownership-info', 'financial-info', 'disclosures', 'federal']) {
      expect(calls[step] ?? 0, step).toBeLessThanOrEqual(1)
    }
  }, 25000)
})
