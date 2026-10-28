import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen, within } from '../../../test-utils'
import FundingLocked from '../../../../src/pages/funding/components/FundingLocked'

const steps = () => within(screen.getByRole('list', { name: /before funding opens/i })).getAllByRole('listitem')

/** What the borrower sees on Funding before their credit report is uploaded. */
describe('FundingLocked', () => {
  it('asks for the credit profile while the borrower has not submitted it', () => {
    renderWithProviders(<FundingLocked creditProfileSubmitted={false} />)

    expect(screen.getByRole('heading', { name: /funding opens once your credit report is uploaded/i })).toBeInTheDocument()
    expect(screen.getByText(/submit your credit profile first/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fill credit profile/i })).toHaveAttribute('href', '/profile?tab=3')
  })

  it('says the team is preparing the report once the credit profile is in', () => {
    renderWithProviders(<FundingLocked creditProfileSubmitted />)

    expect(screen.getByRole('heading', { name: /funding opens once your credit report is uploaded/i })).toBeInTheDocument()
    expect(screen.getByText(/our team is preparing your credit report/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /fill credit profile/i })).toBeNull()
  })

  it('keeps the Funding Options header, so the borrower knows where they are', () => {
    renderWithProviders(<FundingLocked creditProfileSubmitted />)

    expect(screen.getByRole('heading', { name: /^funding options$/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toHaveTextContent(/dashboard/i)
  })

  it('shows only one way to act: the Fill Credit Profile button', () => {
    renderWithProviders(<FundingLocked creditProfileSubmitted={false} />)

    expect(screen.getAllByRole('link', { name: /fill credit profile/i })).toHaveLength(1)
  })

  describe('the three steps before Funding opens', () => {
    it('puts the borrower on the credit profile while it is not submitted', () => {
      renderWithProviders(<FundingLocked creditProfileSubmitted={false} />)

      const [profile, report, funding] = steps()
      expect(steps()).toHaveLength(3)
      expect(profile).toHaveTextContent(/submit your credit profile/i)
      expect(profile).toHaveAttribute('aria-current', 'step')
      expect(profile).toHaveTextContent(/next/i)
      expect(report).toHaveTextContent(/we upload your credit report/i)
      expect(report).toHaveTextContent(/to do/i)
      expect(funding).toHaveTextContent(/funding opens/i)
      expect(funding).toHaveTextContent(/to do/i)
    })

    it('marks the credit profile done and the report in progress once it is submitted', () => {
      renderWithProviders(<FundingLocked creditProfileSubmitted />)

      const [profile, report, funding] = steps()
      expect(profile).toHaveTextContent(/done/i)
      expect(profile).not.toHaveAttribute('aria-current')
      expect(report).toHaveAttribute('aria-current', 'step')
      expect(report).toHaveTextContent(/in progress/i)
      expect(funding).toHaveTextContent(/to do/i)
    })
  })
})
