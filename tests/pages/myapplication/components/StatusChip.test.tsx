import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusChip, { toneFromBadgeClass } from '../../../../src/pages/myapplication/components/detail/StatusChip'

/** The status on the detail heroes: a dot and the status, coloured by its tone. */
describe('StatusChip', () => {
  it.each([
    ['bg-success-subtle text-success', 'success'],
    ['bg-warning-subtle text-warning', 'warning'],
    ['bg-danger-subtle text-danger', 'danger'],
    ['bg-info-subtle text-info', 'info'],
    ['bg-primary-subtle text-primary', 'info'],
    ['bg-secondary-subtle text-secondary', 'neutral'],
    ['', 'neutral'],
  ])('reads %s as %s', (cls, tone) => {
    expect(toneFromBadgeClass(cls)).toBe(tone)
  })

  it('shows the status, labelled for screen readers, in its tone', () => {
    render(<StatusChip status="Approved" tone="success" />)

    const chip = screen.getByText('Approved').closest('.ma-status-chip')
    expect(chip).toHaveClass('is-success')
    expect(chip).toHaveAttribute('aria-label', 'Status: Approved')
  })
})
