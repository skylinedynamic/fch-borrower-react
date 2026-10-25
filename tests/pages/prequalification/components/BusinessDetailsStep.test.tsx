import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../test-utils'
import BusinessDetailsStep from '../../../../src/pages/prequalification/components/BusinessDetailsStep'

const business = (overrides = {}) => ({
  businessName: 'Bo Co',
  industryType: 'Retail',
  businessStructure: 'LLC',
  yearsInBusiness: '',
  businessStartDate: '',
  annualRevenue: '120,000',
  monthlyRevenue: '10,000',
  ...overrides,
})

const support = {
  fundingRequestedAmount: '', fundingUrgency: '', purposeOfFunding: '', purposeNote: '',
  personalCreditScore: '', estimatedBusinessCreditScore: '', existingBusinessDebt: false, debtBalance: '', notes: '',
}

const renderStep = (props: Record<string, unknown> = {}) =>
  renderWithProviders(
    <BusinessDetailsStep
      business={business()}
      support={support as any}
      setBusiness={vi.fn()}
      setSupport={vi.fn()}
      onNext={vi.fn()}
      onPrevious={vi.fn()}
      {...props}
    />
  )

/**
 * Defect (BUG-037, CP-PREQ-04): with no business start date in the profile,
 * Time in Business was a read-only "Please set business start date in profile"
 * with no way to set it from the step.
 */
describe('BusinessDetailsStep time in business', () => {
  it('lets a borrower with no start date on file pick one here', () => {
    renderStep({ startDateOnFile: false })

    expect(screen.getAllByPlaceholderText(/select business start date/i).length).toBeGreaterThan(0)
    expect(screen.queryByDisplayValue(/please set business start date in profile/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile?tab=1')
  })

  it('shows the time in business worked out from the saved start date', () => {
    renderStep({ startDateOnFile: true, business: business({ yearsInBusiness: '10 Years', businessStartDate: '2015-01-01' }) })

    expect(screen.getByDisplayValue('10 Years')).toBeDisabled()
    expect(screen.queryByPlaceholderText(/select business start date/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile?tab=1')
  })

  it('shows a start date error under the picker', () => {
    renderStep({ startDateOnFile: false, errors: { businessStartDate: 'Business start date cannot be in the future' } })

    expect(screen.getByText('Business start date cannot be in the future')).toBeInTheDocument()
  })
})
