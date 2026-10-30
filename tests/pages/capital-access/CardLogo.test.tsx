import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import CardLogo from '../../../src/pages/capital-access/components/CardLogo'

/**
 * Defect (BUG-148, CP-CAP-06): on a Credit Card Stacking play step (e.g. Step 1,
 * Lowe's Commercial Account) the card logo failed to load (naturalWidth 0) and
 * the browser drew its alt text, "Lowe's Commercial...", in a small box at the
 * top-left of the step card. A logo that cannot be loaded now shows the same
 * neutral card placeholder as a card with no logo.
 */
describe('CardLogo (BUG-148)', () => {
  it('shows the card logo when it loads', () => {
    render(<CardLogo src="/storage/credit-accounts/lowes.png" name="Lowe's Commercial Account" />)

    expect(screen.getByRole('img', { name: "Lowe's Commercial Account" })).toHaveAttribute('src', '/storage/credit-accounts/lowes.png')
  })

  it('swaps a logo that fails to load for the placeholder, not its alt text', () => {
    render(<CardLogo src="/storage/credit-accounts/missing.png" name="Lowe's Commercial Account" />)

    fireEvent.error(screen.getByRole('img', { name: "Lowe's Commercial Account" }))

    expect(screen.queryByRole('img', { name: "Lowe's Commercial Account" })).toBeNull()
    expect(screen.getByTestId('card-logo-placeholder')).toBeInTheDocument()
    expect(screen.queryByText("Lowe's Commercial Account")).toBeNull()
  })

  it('shows the placeholder when the card has no logo', () => {
    render(<CardLogo src={null} name="Lowe's Commercial Account" />)

    expect(screen.queryByRole('img', { name: "Lowe's Commercial Account" })).toBeNull()
    expect(screen.getByTestId('card-logo-placeholder')).toBeInTheDocument()
  })

  it('tries again when the step gives a new logo', () => {
    const { rerender } = render(<CardLogo src="/missing.png" name="Card" />)
    fireEvent.error(screen.getByRole('img', { name: 'Card' }))
    expect(screen.getByTestId('card-logo-placeholder')).toBeInTheDocument()

    rerender(<CardLogo src="/fixed.png" name="Card" />)

    expect(screen.getByRole('img', { name: 'Card' })).toHaveAttribute('src', '/fixed.png')
  })
})
