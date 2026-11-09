import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../../mocks/server'
import { createTestQueryClient } from '../../../test-utils'
import { usePreQualificationForm } from '../../../../src/pages/prequalification/hooks/usePreQualificationForm'
import { resumeStepFor } from '../../../../src/pages/prequalification/hooks/resumeStep'

afterEach(() => server.resetHandlers())

const PERSONAL = { first_name: 'Jane', last_name: 'Borrower', email: 'jane@example.com', phone_number: '(512) 555-0100', state_of_incorporation: 'Texas' }
const BUSINESS = { business_name: 'Jane Bakes LLC', industry_type: 'Food', business_structure: 'LLC' }
const FUNDING = {
  funding_requested_amount: '$75,000.00',
  funding_urgency: 'Within 30 days',
  purpose_of_funding: 'Equipment Purchase',
  personal_credit_score: 'Good (670-739)',
  estimated_business_credit_score: '60-79',
}

/**
 * Defect: R2 BUG-026 - a borrower who saved steps 1-3 and came back found the
 * wizard at Personal Info with step 3 empty. The API now returns the draft's
 * own Funding Needs; the wizard resumes at the first step not yet saved.
 */
describe('resumeStepFor', () => {
  it('starts at Personal Info when there is no draft', () => {
    expect(resumeStepFor(null)).toBe(0)
    expect(resumeStepFor({ id: null, ...PERSONAL, ...BUSINESS })).toBe(0)
  })

  it('goes to Business Details when only Personal Info was saved', () => {
    expect(resumeStepFor({ id: 161, ...PERSONAL })).toBe(1)
  })

  it('goes to Funding Needs when Business Details was saved too', () => {
    expect(resumeStepFor({ id: 161, ...PERSONAL, ...BUSINESS })).toBe(2)
    expect(resumeStepFor({ id: 161, ...PERSONAL, ...BUSINESS, funding_requested_amount: '$75,000.00' })).toBe(2)
  })

  it('goes to Review when all three were saved', () => {
    expect(resumeStepFor({ id: 161, ...PERSONAL, ...BUSINESS, ...FUNDING })).toBe(3)
  })
})

describe('usePreQualificationForm resuming a draft (R2 BUG-026)', () => {
  const render = () => {
    const queryClient = createTestQueryClient()
    return renderHook(() => usePreQualificationForm(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })
  }

  it('reopens a draft saved up to Funding Needs at Review, with the funding answers filled in', async () => {
    server.use(http.get('*/borrower/pre-qualification', () =>
      HttpResponse.json({ status: true, data: { id: 161, ...PERSONAL, ...BUSINESS, ...FUNDING } })
    ))

    const { result } = render()

    await waitFor(() => expect(result.current.step).toBe(3))
    expect(result.current.maxStepReached).toBe(3)
    expect(result.current.support.fundingUrgency).toBe('Within 30 days')
    expect(result.current.support.purposeOfFunding).toBe('Equipment Purchase')
    expect(result.current.support.personalCreditScore).toBe('Good (670-739)')
    expect(result.current.support.estimatedBusinessCreditScore).toBe('60-79')
    // The form's own money format.
    expect(result.current.support.fundingRequestedAmount).toBe('75,000.00')
  })

  it('still starts a new application at Personal Info', async () => {
    server.use(http.get('*/borrower/pre-qualification', () =>
      HttpResponse.json({ status: true, data: { id: null, ...PERSONAL } })
    ))

    const { result } = render()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.step).toBe(0)
  })
})
