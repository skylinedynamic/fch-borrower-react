import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen } from '../../test-utils'
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

const renderWizard = (requestId: number) =>
  renderWithProviders(
    <Routes>
      <Route path="/fund-application/:id" element={<FundApplication />} />
    </Routes>,
    { route: `/fund-application/${requestId}` }
  )

const serve = (application: Record<string, unknown>, documents: unknown[] = []) =>
  server.use(
    http.get('*/borrower/funding-application/funding-request', () =>
      HttpResponse.json({ status: true, message: 'ok', data: { funding_request_id: 86, ...application } })
    ),
    http.get('*/borrower/documents', () => HttpResponse.json({ status: true, message: 'ok', data: { documents } })),
    http.get('*/borrower/funding-application/*', () => HttpResponse.json({ status: true, data: null })),
    http.get('*/borrower/*', () => HttpResponse.json({ status: true, data: null })),
    http.post('*/borrower/*', () => HttpResponse.json({ status: true, data: null }))
  )

const locked = {
  status: 'Completed',
  is_locked: true,
  is_editable: false,
  locked_reason: 'This application has been closed and can no longer be changed.',
  // Converted or older applications carry no per-step "saved" flags.
  is_business_info_saved: false,
  is_ownership_info_saved: false,
  is_financial_info_saved: false,
  is_funding_request_saved: false,
  is_disclosures_saved: false,
  is_federal_compliance_saved: false,
  signature_data: null,
}

/**
 * BUG-071 - the step progress rule itself is covered in stepProgress.test.ts.
 *
 * A Matched to Lender application opened with editable fields; the save was
 * only refused on submit. Decision (2026-10-29, merging SCRUM-331): a locked
 * application shows the "Can't Edit Funding Application" card with the reason
 * instead of the form - no field can be typed in.
 */
describe('FundApplication - BUG-071', () => {
  it('shows a locked application as Can\'t Edit with the reason, and no form', async () => {
    serve(locked)
    renderWizard(86)

    expect(await screen.findByRole('heading', { name: /can't edit funding application/i })).toBeInTheDocument()
    expect(screen.getByText(locked.locked_reason)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    expect(document.querySelectorAll('input, select, textarea')).toHaveLength(0)
    expect(screen.queryByText(/^Step \d+ of/)).not.toBeInTheDocument()
  })
})
