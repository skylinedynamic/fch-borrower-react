import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '../../test-utils'
import FundingCard from '../../../src/pages/funding/components/FundingCard'

const card = {
  id: 7,
  icon: 'settings',
  icon_color: 'green',
  name: 'Equipment Loans',
  subtitle: 'Finance new or used equipment',
  amount_range: '$10,000 - $2,000,000',
  engine_status: 'Active',
}

const failedDeposits = {
  label: 'Minimum Monthly Deposits',
  status: 'Failed',
  group: 'banking',
  borrower_value: 5000,
  required_value: 60000,
  message: 'Bank statements failed. Please upload proper bank statements.',
  action: { label: 'Upload Bank Statements', path: '/documents' },
}

/**
 * Defect: a card blocked by the borrower's bank statements listed only raw
 * figures ("Minimum Monthly Deposits: $5,000, Required: $60,000"); nothing said
 * the bank statements were the problem. The hover card now leads with it.
 */
describe('FundingCard bank statement message', () => {
  it('leads the missing-requirements card with the bank statement message', async () => {
    renderWithProviders(<FundingCard {...card} readiness_factors={[failedDeposits]} />)

    await userEvent.hover(screen.getByText('Equipment Loans'))

    expect(await screen.findByText('Bank statements failed. Please upload proper bank statements.')).toBeInTheDocument()
    expect(screen.getByText(/Minimum Monthly Deposits/)).toBeInTheDocument()
  })

  it('shows no bank statement message for a requirement outside banking', async () => {
    renderWithProviders(
      <FundingCard {...card} readiness_factors={[{ label: 'Personal Credit', status: 'Failed', borrower_value: 550, required_value: 700 }]} />
    )

    await userEvent.hover(screen.getByText('Equipment Loans'))

    expect(await screen.findByText(/Personal Credit/)).toBeInTheDocument()
    expect(screen.queryByText(/bank statements failed/i)).not.toBeInTheDocument()
  })
})

/**
 * Defect: Banking Activity read "Banking Activity: Failed / Required: Uploaded",
 * which said neither what was missing nor why. The API's reason and
 * requirement are shown instead.
 */
describe('FundingCard Banking Activity reason', () => {
  it('says why Banking Activity failed and what is required', async () => {
    renderWithProviders(
      <FundingCard
        {...card}
        readiness_factors={[{
          label: 'Banking Activity',
          status: 'Failed',
          group: 'banking',
          borrower_value: 'Missing',
          required_value: 'Uploaded',
          reason_code: 'rejected',
          reason: 'Your Business Bank Statements were rejected.',
          requirement: 'Upload your Business Bank Statements on the Documents page.',
          message: 'Bank statements rejected. Please upload new business bank statements.',
          action: { label: 'Upload Bank Statements', path: '/documents' },
        }]}
      />
    )

    await userEvent.hover(screen.getByText('Equipment Loans'))

    expect(await screen.findByText('Banking Activity: Your Business Bank Statements were rejected.')).toBeInTheDocument()
    // One message, not two: the factor line already says why and what to do,
    // so the headline message is not repeated above it.
    expect(screen.queryByText('Bank statements rejected. Please upload new business bank statements.')).not.toBeInTheDocument()
    expect(screen.getByText('Required: Upload your Business Bank Statements on the Documents page.')).toBeInTheDocument()
    expect(screen.queryByText('Banking Activity: Failed')).not.toBeInTheDocument()
    expect(screen.queryByText('Required: Uploaded')).not.toBeInTheDocument()
  })
})
