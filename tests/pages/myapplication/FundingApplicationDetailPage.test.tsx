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

  // Status keys 1-9 are all editable; the server sends that as is_editable.
  it.each([
    FUNDING_APPLICATION_STATUS.ON_HOLD,
    FUNDING_APPLICATION_STATUS.DRAFT,
    FUNDING_APPLICATION_STATUS.PENDING,
    FUNDING_APPLICATION_STATUS.APPROVED_CONDITIONAL,
    FUNDING_APPLICATION_STATUS.APPROVED_FINAL,
  ])('offers it at %s, because the status key is 9 or below', (status) => {
    detail.application = { ...editable, status }
    renderWithProviders(<FundingApplicationDetailPage />)

    expect(editLink()).toBeInTheDocument()
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
