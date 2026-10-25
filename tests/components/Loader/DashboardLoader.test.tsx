import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLoader from '../../../src/components/Loader/DashboardLoader'

/**
 * The dashboard skeleton has to be the dashboard's own shape, so nothing jumps
 * when the data arrives: the same hero, four KPI cards, the score / meetings /
 * invoices row, two tables side by side, and the support strip.
 */
describe('DashboardLoader', () => {
  it('announces itself to assistive technology while the page loads', () => {
    render(<DashboardLoader />)

    const status = screen.getByRole('status', { name: /loading dashboard/i })
    expect(status).toHaveAttribute('aria-busy', 'true')
  })

  it('mirrors the dashboard layout', () => {
    const { container } = render(<DashboardLoader />)

    expect(container.querySelector('.db-page .db-hero')).not.toBeNull()
    expect(container.querySelectorAll('.db-kpis > .db-kpi')).toHaveLength(4)
    expect(container.querySelector('.db-profile')).not.toBeNull()
    expect(container.querySelector('[data-skeleton="meetings"]')).not.toBeNull()
    expect(container.querySelector('[data-skeleton="invoices"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-skeleton="table"]')).toHaveLength(2)
    expect(container.querySelector('.db-support')).not.toBeNull()
  })

  it('shows placeholders, not real content', () => {
    const { container } = render(<DashboardLoader />)

    expect(container.querySelectorAll('.db-sk').length).toBeGreaterThan(30)
    expect(screen.queryByText(/welcome back/i)).toBeNull()
  })
})
