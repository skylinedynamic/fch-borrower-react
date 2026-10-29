import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test-utils'
import FundingApplicationDetailPage from '../../../src/pages/myapplication/FundingApplicationDetailPage'
import { FUNDING_APPLICATION_STATUS, FUNDING_REVIEW_STATUS } from '../../../src/config/funding'

const detail = vi.hoisted(() => ({ application: {} as Record<string, unknown> }))

vi.mock('../../../src/modules/my-application', async (original) => ({
  ...(await original<typeof import('../../../src/modules/my-application')>()),
  useFundingApplicationDetail: () => ({ data: { data: detail.application }, isLoading: false }),
}))

vi.mock('../../../src/components/Common/BorrowerActivitySidebar', () => ({ default: () => null }))

// A submitted application on an approved request that the server still allows to be edited.
const editable = {
  id: 56,
  status: FUNDING_APPLICATION_STATUS.PENDING,
  funding_request_id: 17,
  funding_request_status: FUNDING_REVIEW_STATUS.APPROVED,
  is_editable: true,
  full_name: 'Michael Chen',
  business_name: 'Alpha Tech Solutions',
  co_borrowers: [],
  documents: [],
}

const editLink = () => screen.queryByRole('link', { name: /edit application/i })

describe('FundingApplicationDetailPage — Edit Application', () => {
  beforeEach(() => {
    detail.application = { ...editable }
  })

  it('offers Edit Application, opening the edit form on the funding request', () => {
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).toHaveAttribute('href', '/fund-application/17')
  })

  it('hides it once the server says the application can no longer be edited', () => {
    detail.application = { ...editable, status: FUNDING_APPLICATION_STATUS.MATCHED_TO_LENDER, is_editable: false }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).not.toBeInTheDocument()
  })

  // The 11 editable statuses (API config `statuses.editable`); the server sends that as is_editable.
  it.each([
    FUNDING_APPLICATION_STATUS.ON_HOLD,
    FUNDING_APPLICATION_STATUS.DRAFT,
    FUNDING_APPLICATION_STATUS.PENDING,
    FUNDING_APPLICATION_STATUS.APPROVED_CONDITIONAL,
    FUNDING_APPLICATION_STATUS.APPROVED_FINAL,
    FUNDING_APPLICATION_STATUS.PENDING_CLARIFICATION,
    FUNDING_APPLICATION_STATUS.READY_FOR_SUBMISSION,
  ])('offers it at %s, an editable status', (status) => {
    detail.application = { ...editable, status }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).toBeInTheDocument()
  })

  it.each([
    FUNDING_APPLICATION_STATUS.WITHDRAWN,
    FUNDING_APPLICATION_STATUS.OFFER_DECLINED_BY_BORROWER,
    FUNDING_APPLICATION_STATUS.CLOSED_NO_RESPONSE,
    FUNDING_APPLICATION_STATUS.CLOSED_INCOMPLETE_APPLICATION,
    FUNDING_APPLICATION_STATUS.CLOSED_ERROR,
  ])('hides it at %s, a new closing status', (status) => {
    detail.application = { ...editable, status, is_editable: false }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).not.toBeInTheDocument()
  })

  it('hides it when the funding request is not approved', () => {
    detail.application = { ...editable, funding_request_status: FUNDING_REVIEW_STATUS.PENDING }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).not.toBeInTheDocument()
  })

  it('hides it when the application has no funding request to open the form on', () => {
    detail.application = { ...editable, funding_request_id: null }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).not.toBeInTheDocument()
  })
})

describe('FundingApplicationDetailPage — funding types', () => {
  it('lists the additional funding types after the funding type', () => {
    detail.application = { ...editable, preferred_funding_type: 'Term Loan', additional_funding_types: ['SBA Loan', 'Line of Credit'] }
    renderWithProviders(<FundingApplicationDetailPage />)

    const preferred = screen.getByText('Funding Type')
    const additional = screen.getByText('Additional Funding Types')
    expect(preferred.compareDocumentPosition(additional) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('SBA Loan, Line of Credit')).toBeInTheDocument()
  })

  it('shows N/A when none were chosen', () => {
    detail.application = { ...editable, preferred_funding_type: 'Term Loan', additional_funding_types: [] }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(screen.getByText('Additional Funding Types').parentElement).toHaveTextContent('N/A')
  })
})

describe("FundingApplicationDetailPage — Can't edit a locked application", () => {
  const reason = 'This application can no longer be edited because it is "Withdrawn". Contact your funding advisor if something needs to change.'
  const cantEdit = () => screen.queryByRole('button', { name: /can't edit application/i })

  it('tells the borrower it can no longer be edited, and why', () => {
    detail.application = { ...editable, status: FUNDING_APPLICATION_STATUS.WITHDRAWN, is_editable: false, locked_reason: reason }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).not.toBeInTheDocument()
    expect(cantEdit()).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(reason)
  })

  it.each([
    FUNDING_APPLICATION_STATUS.MATCHED_TO_LENDER,
    FUNDING_APPLICATION_STATUS.FUNDED,
    FUNDING_APPLICATION_STATUS.OFFER_DECLINED_BY_BORROWER,
    FUNDING_APPLICATION_STATUS.CLOSED_NO_RESPONSE,
    FUNDING_APPLICATION_STATUS.CLOSED_INCOMPLETE_APPLICATION,
    FUNDING_APPLICATION_STATUS.CLOSED_ERROR,
  ])('says so at %s, naming the status when the server sends no reason', (status) => {
    detail.application = { ...editable, status, is_editable: false }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(cantEdit()).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(`because it is "${status}"`)
  })

  it('says nothing of the kind while the application is editable', () => {
    detail.application = { ...editable, status: FUNDING_APPLICATION_STATUS.PENDING_CLARIFICATION }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(cantEdit()).not.toBeInTheDocument()
    expect(screen.queryByText(/can no longer be edited/i)).not.toBeInTheDocument()
  })
})
