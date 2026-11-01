import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FundingApplicationDetailsModal from '../../../../src/pages/myapplication/components/FundingApplicationDetailsModal'
import type { FundingApplication } from '../../../../src/modules/my-application/types'

const baseApplication = {
  id: 1,
  status: 'submitted',
  full_name: 'Jane Borrower',
  business_name: 'Acme Corp',
  ssn: '123456789',
} as unknown as FundingApplication

describe('FundingApplicationDetailsModal', () => {
  it('renders nothing when there is no application', () => {
    const { container } = render(
      <FundingApplicationDetailsModal isOpen application={null} toggle={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the SSN masked, written XXX-XX-XXXX on the eye button - as every SSN is shown', async () => {
    const user = userEvent.setup()
    render(<FundingApplicationDetailsModal isOpen application={baseApplication} toggle={() => {}} />)

    expect(screen.getByText('***-**-6789')).toBeInTheDocument()
    expect(screen.queryByText('123-45-6789')).not.toBeInTheDocument()

    // The modal sits outside the accessibility tree until Bootstrap shows it.
    await user.click(screen.getByRole('button', { name: 'Show SSN', hidden: true }))
    expect(screen.getByText('123-45-6789')).toBeInTheDocument()
  })

  it('shows N/A when no SSN was submitted, rather than an empty/undefined value', () => {
    render(
      <FundingApplicationDetailsModal
        isOpen
        application={{ ...baseApplication, ssn: '' } as unknown as FundingApplication}
        toggle={() => {}}
      />
    )
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
  })
})

describe('FundingApplicationDetailsModal — funding types', () => {
  it('lists the additional funding types after the preferred one', () => {
    render(
      <FundingApplicationDetailsModal
        isOpen
        application={{ ...baseApplication, preferred_funding_type: 'Term Loan', additional_funding_types: ['SBA Loan', 'Line of Credit'] } as FundingApplication}
        toggle={() => {}}
      />
    )

    const preferred = screen.getByText('Preferred Funding Type')
    const additional = screen.getByText('Additional Funding Types')
    expect(preferred.compareDocumentPosition(additional) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('SBA Loan, Line of Credit')).toBeInTheDocument()
  })
})
