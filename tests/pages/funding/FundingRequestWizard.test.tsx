import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import FundingRequestWizard from '../../../src/pages/funding/FundingRequestWizard'

// jsdom never fires CSS transitions, so the real bootstrap Modal is swapped for
// a synchronous fake that flips the same classes/attributes it would.
vi.mock('bootstrap/js/dist/modal', () => {
  class FakeModal {
    private el: HTMLElement
    constructor(el: HTMLElement) {
      this.el = el
    }
    show() {
      this.el.classList.add('show')
      this.el.style.display = 'block'
      this.el.removeAttribute('aria-hidden')
      this.el.setAttribute('aria-modal', 'true')
    }
    hide() {
      this.el.classList.remove('show')
      this.el.style.display = 'none'
      this.el.setAttribute('aria-hidden', 'true')
      this.el.removeAttribute('aria-modal')
    }
    dispose() {}
  }
  return { default: FakeModal }
})

afterEach(() => server.resetHandlers())

/**
 * The /funding/:id/review wizard always starts a new funding request.
 *
 * Whatever the borrower already has for this option - a pending request, an
 * approved one, an application On Hold - the wizard neither redirects them nor
 * fills the form from it. "Submit for Underwriting" asks for confirmation, and
 * the request is only sent once the borrower confirms.
 */

const detail = (overrides: Record<string, unknown> = {}) => ({
  id: 8,
  name: 'Revenue Based Financing',
  funding_type_name: 'Revenue-Based Financing',
  amount_range: '10000 - 3000000',
  speed_to_funds: '3-7',
  uses: ['Working Capital', 'Payroll'],
  engine_status: 'Active',
  readiness_factors: [],
  missing_documents: [],
  require_documents_uploaded: false,
  allowed_documents: [],
  latest_review_status: 'Approved',
  latest_review_id: 7,
  latest_requested_amount: 450000,
  latest_use_of_funds: 'Inventory',
  has_funding_application: true,
  can_start_new_funding_request: false,
  funding_application_status: 'On Hold',
  funding_application_is_editable: true,
  ...overrides,
})

const renderWizard = (
  overrides: Record<string, unknown> = {},
  routerState?: Record<string, unknown>,
  documents: { types?: unknown[]; byType?: Record<number, unknown[]> } = {},
  path = '/funding/8/review'
) => {
  const submitted: any[] = []
  server.use(
    http.get('*/borrower/funding/8', () => HttpResponse.json({ status: true, data: detail(overrides) })),
    http.get('*/common/funding-qualification/*/readiness-factors', () => HttpResponse.json({ status: true, data: [] })),
    http.get('*/borrower/documents/borrower-document-types', () => HttpResponse.json({ status: true, data: documents.types ?? [] })),
    http.get('*/borrower/documents', () => HttpResponse.json({ status: true, data: documents.byType ?? [] })),
    http.get('*/borrower/profile/business-info', () => HttpResponse.json({ status: true, data: {} })),
    http.get('*/borrower/profile/financial-info', () => HttpResponse.json({ status: true, data: {} })),
    http.post('*/borrower/funding/requests', async ({ request }) => {
      submitted.push(await request.json())
      return HttpResponse.json(
        { status: true, data: { id: 99, created_at: '2026-10-20 10:00:00', reviewer: { name: 'Host Admin' } } },
        { status: 201 }
      )
    })
  )

  const view = renderWithProviders(
    <Routes>
      <Route path="/funding/:id/review" element={<FundingRequestWizard />} />
      <Route path="/funding/:id" element={<p>Funding detail page</p>} />
      <Route path="/fund-application" element={<p>Fund application page</p>} />
    </Routes>,
    { route: routerState ? { pathname: path, state: routerState } : path }
  )

  return { ...view, submitted }
}

const amountInput = () => screen.findByPlaceholderText('200,000')

describe('FundingRequestWizard', () => {
  /**
   * Defect: the wizard filled Requested Amount and Use of Funds from the
   * borrower's last request for this option.
   */
  it('starts with an empty form, not the earlier request\'s amount or purpose', async () => {
    renderWizard()

    expect(await amountInput()).toHaveValue('')
    expect(screen.queryByText(/inventory/i)).not.toBeInTheDocument()
  })

  /** Defect: an approved earlier request redirected the borrower to /fund-application. */
  it('stays on the wizard when an earlier request is approved', async () => {
    renderWizard()

    expect(await screen.findByText('Funding Request Summary')).toBeInTheDocument()
    expect(screen.queryByText('Fund application page')).not.toBeInTheDocument()
  })

  /** Defect: a pending earlier request sent the borrower back with "Already applied". */
  it('stays on the wizard when an earlier request is pending', async () => {
    renderWizard({ latest_review_status: 'Pending', has_funding_application: false })

    expect(await screen.findByText('Funding Request Summary')).toBeInTheDocument()
    expect(screen.queryByText('Funding detail page')).not.toBeInTheDocument()
  })

  it('asks for confirmation before submitting for underwriting, and submits once confirmed', async () => {
    const user = userEvent.setup()
    const { submitted } = renderWizard()

    await user.type(await amountInput(), '50000')
    await user.click(screen.getByRole('button', { name: /continue to funding request/i }))
    await user.click(await screen.findByRole('button', { name: /continue to documents/i }))
    await user.click(await screen.findByRole('button', { name: /submit for underwriting/i }))

    // The modal is open and nothing has been sent yet.
    const confirm = await screen.findByRole('button', { name: /yes, submit/i })
    expect(screen.getByText(/submit this funding request for underwriting/i)).toBeInTheDocument()
    expect(submitted).toHaveLength(0)

    // A confirmation (question) icon, not the celebration animation.
    const modal = confirm.closest('.modal') as HTMLElement
    expect(modal.querySelector('i.ri-question-line')).not.toBeNull()
    expect(modal.querySelector('lord-icon')).toBeNull()

    await user.click(confirm)

    await waitFor(() => expect(submitted).toHaveLength(1))
    expect(submitted[0]).toMatchObject({ funding_sequence_id: 8, requested_amount: '50000' })
  })

  it('sends nothing when the borrower cancels the confirmation', async () => {
    const user = userEvent.setup()
    const { submitted } = renderWizard()

    await user.type(await amountInput(), '50000')
    await user.click(screen.getByRole('button', { name: /continue to funding request/i }))
    await user.click(await screen.findByRole('button', { name: /continue to documents/i }))
    await user.click(await screen.findByRole('button', { name: /submit for underwriting/i }))
    await screen.findByRole('button', { name: /yes, submit/i })

    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    await waitFor(() => expect(screen.queryByRole('button', { name: /yes, submit/i })).not.toBeInTheDocument())
    expect(submitted).toHaveLength(0)
  })

  it('sends no funding_request_id on a fresh request, so the API creates a new one', async () => {
    const user = userEvent.setup()
    const { submitted } = renderWizard()

    await user.type(await amountInput(), '50000')
    await user.click(screen.getByRole('button', { name: /continue to funding request/i }))
    await user.click(await screen.findByRole('button', { name: /continue to documents/i }))
    await user.click(await screen.findByRole('button', { name: /submit for underwriting/i }))
    await user.click(await screen.findByRole('button', { name: /yes, submit/i }))

    await waitFor(() => expect(submitted).toHaveLength(1))
    expect(submitted[0]).not.toHaveProperty('funding_request_id')
  })

  /**
   * Defect: "Update Application" on a rejected request inserted a new funding
   * request on every submit instead of resubmitting the rejected one.
   */
  it('resubmits the rejected request when updating it, instead of creating a new one', async () => {
    const user = userEvent.setup()
    const { submitted } = renderWizard({}, { amount: 230000, purpose: 'Working Capital', fromRejectedRequestId: 7 })

    expect(await amountInput()).toHaveValue('230,000')
    await user.click(screen.getByRole('button', { name: /continue to funding request/i }))
    await user.click(await screen.findByRole('button', { name: /continue to documents/i }))
    await user.click(await screen.findByRole('button', { name: /submit for underwriting/i }))
    await user.click(await screen.findByRole('button', { name: /yes, submit/i }))

    await waitFor(() => expect(submitted).toHaveLength(1))
    expect(submitted[0]).toMatchObject({ funding_request_id: 7, funding_sequence_id: 8 })
  })

  /**
   * Defect: the rejected request's id travelled only in router state, which a
   * wizard tab opened earlier (or reopened from its URL) does not have - the
   * submit then inserted yet another request. The id is in the URL now.
   */
  it('resubmits the rejected request named in the URL, and says so on screen', async () => {
    const user = userEvent.setup()
    const { submitted } = renderWizard({}, undefined, {}, '/funding/8/review?resubmit=7&amount=230000')

    expect(await screen.findByText(/you are updating your rejected funding request/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continue to funding request/i }))
    await user.click(await screen.findByRole('button', { name: /continue to documents/i }))
    await user.click(await screen.findByRole('button', { name: /resubmit for underwriting/i }))
    await user.click(await screen.findByRole('button', { name: /yes, submit/i }))

    await waitFor(() => expect(submitted).toHaveLength(1))
    expect(submitted[0]).toMatchObject({ funding_request_id: 7, funding_sequence_id: 8 })
  })

  it('shows no update banner on a fresh request', async () => {
    renderWizard()

    expect(await screen.findByText('Funding Request Summary')).toBeInTheDocument()
    expect(screen.queryByText(/you are updating your rejected funding request/i)).not.toBeInTheDocument()
  })

  describe('documents step', () => {
    const licence = { id: 3, name: "Driver's License" }
    const statements = { id: 5, name: 'Business Bank Statements' }
    const docs = {
      types: [licence, statements],
      byType: {
        3: [{ id: 31, file_name: 'licence.pdf' }],
        5: [{ id: 51, file_name: 'statement.pdf' }],
      },
    }
    const requiresDocs = { require_documents_uploaded: true, allowed_documents: [3, 5], missing_documents: [] }

    const openDocumentsStep = async () => {
      const user = userEvent.setup()
      await user.type(await amountInput(), '50000')
      await user.click(screen.getByRole('button', { name: /continue to funding request/i }))
      await user.click(await screen.findByRole('button', { name: /continue to documents/i }))
      await screen.findByText(licence.name)
    }

    /**
     * Defect: "Update Application" on a rejected request opened the wizard
     * without the optional "Upload Again" button on documents already uploaded:
     * the button only checked whether the *latest* request on the option was
     * rejected, and after any later request that was Pending.
     */
    it('offers an optional upload on uploaded documents when updating a rejected request', async () => {
      renderWizard(
        { ...requiresDocs, latest_review_status: 'Pending' },
        { purpose: 'Working Capital', fromRejectedRequestId: 7 },
        docs
      )
      await openDocumentsStep()

      expect(await screen.findAllByRole('button', { name: /upload again/i })).toHaveLength(2)
      // The borrower is told plainly that the extra upload is optional.
      screen.getAllByRole('button', { name: /upload again/i }).forEach(button =>
        expect(button).toHaveTextContent(/\(optional\)/i)
      )
      expect(screen.getByText(/your previous request was rejected/i)).toBeInTheDocument()
      expect(screen.getByText(/uploading more is optional/i)).toBeInTheDocument()
      // Optional: the request can still be submitted without uploading more.
      expect(screen.getByRole('button', { name: /submit for underwriting/i })).toBeEnabled()
    })

    it('does not offer it on a fresh request', async () => {
      renderWizard({ ...requiresDocs, latest_review_status: 'Pending' }, undefined, docs)
      await openDocumentsStep()

      expect(screen.queryByRole('button', { name: /upload again/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/your previous request was rejected/i)).not.toBeInTheDocument()
    })
  })
})
