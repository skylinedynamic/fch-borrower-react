import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test-utils'
import EstimatedTotalAccessCard from '../../../src/components/CapitalAccess/EstimatedTotalAccessCard'

/**
 * BUG-031: the amount is the maximum of every play the client qualifies for,
 * leaving out plays already completed - so it is what is left to access, and
 * a client who has completed plays can read less than a weaker one. The card
 * says so.
 */
describe('Estimated access card', () => {
  it('says the amount is what remains, from plays not yet completed', () => {
    renderWithProviders(<EstimatedTotalAccessCard totalAccess="$1,365,000.00" />)

    expect(screen.getByRole('heading', { name: 'Estimated Remaining Access' })).toBeInTheDocument()
    expect(screen.getByText('$1,365,000.00')).toBeInTheDocument()
    expect(screen.getByText('From the plays you qualify for and have not completed yet')).toBeInTheDocument()
    expect(screen.queryByText('Estimated Total Access')).not.toBeInTheDocument()
  })

  it('shows the amount short, with the full amount on hover', () => {
    renderWithProviders(<EstimatedTotalAccessCard totalAccess="$1.37M" totalAccessFull="$1,365,000.00" />)

    expect(screen.getByText('$1.37M')).toHaveAttribute('title', '$1,365,000.00')
  })
})
