import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, within } from '../../../test-utils'
import FundingHowItWorks, { FundingArrivalNote } from '../../../../src/pages/funding/components/FundingHowItWorks'

/**
 * The top of the Funding page: the stages a funding request goes through,
 * said before the borrower starts one, and - for a borrower the walkthrough
 * just brought here - that they are in the right place.
 */
describe('Funding: how funding works', () => {
  it('lists the stages in order', () => {
    renderWithProviders(<FundingHowItWorks />)

    const stages = within(screen.getByRole('list', { name: /how funding works/i })).getAllByRole('listitem')
    expect(stages.map((stage) => stage.textContent)).toEqual([
      '1Choose a program',
      '2Submit a funding request',
      '3Underwriting reviews the request',
      '4Complete the funding application',
      '5Underwriting processes the application',
      '6Lender decision and funding, if approved',
    ])
  })

  it('offers pre-qualification as optional, never as a step', () => {
    renderWithProviders(<FundingHowItWorks />)

    expect(screen.getByRole('link', { name: /see if you pre-qualify/i })).toHaveAttribute('href', '/pre-qualification')
    expect(screen.getByText(/optional/i)).toBeInTheDocument()
  })
})

describe('Funding: arriving from the walkthrough', () => {
  const renderAt = (state?: unknown) =>
    renderWithProviders(
      <Routes>
        <Route path="/funding" element={<FundingArrivalNote />} />
      </Routes>,
      { route: { pathname: '/funding', state } as never }
    )

  it('tells a borrower the walkthrough brought here that they are in the right place', () => {
    renderAt({ fromWalkthrough: true })

    expect(screen.getByRole('status')).toHaveTextContent(/you're in the right place/i)
    expect(screen.getByRole('status')).toHaveTextContent(/pick a program below to start a funding request/i)
  })

  it('says nothing to a borrower who simply opened the page', () => {
    renderAt()

    expect(screen.queryByRole('status')).toBeNull()
  })
})
