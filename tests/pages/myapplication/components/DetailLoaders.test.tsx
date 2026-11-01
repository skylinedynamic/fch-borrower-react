import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FundingApplicationDetailLoader from '../../../../src/pages/myapplication/components/FundingApplicationDetailLoader'
import PrequalDetailLoader from '../../../../src/pages/myapplication/components/detail/PrequalDetailLoader'

/**
 * The loaders take the shape of the redesigned views, so nothing jumps when
 * the data arrives: hero, progress, sections and activity on the funding
 * application page; hero and sections in the prequalification dialog.
 */
describe('My Applications detail loaders', () => {
  it('lays out the funding application page while it loads', () => {
    const { container } = render(<FundingApplicationDetailLoader />)

    expect(screen.getByRole('status', { name: 'Loading the funding application' })).toBeInTheDocument()
    for (const part of ['.ma-hero', '.ma-tracker', '.ma-detail-section', '.ma-activity']) {
      expect(container.querySelector(part)).not.toBeNull()
    }
    expect(container.querySelectorAll('.ma-tracker-step')).toHaveLength(6)
  })

  it('lays out the prequalification dialog while it loads', () => {
    const { container } = render(<PrequalDetailLoader />)

    expect(screen.getByRole('status', { name: 'Loading the prequalification' })).toBeInTheDocument()
    expect(container.querySelector('.ma-detail-hero')).not.toBeNull()
    expect(container.querySelectorAll('.ma-detail-section').length).toBeGreaterThanOrEqual(2)
  })
})
