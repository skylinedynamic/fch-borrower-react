import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import GlobalFundingBanner from '../../../src/components/Layout/GlobalFundingBanner'

/**
 * The banner under the topbar on every page while an approved funding request
 * waits for its application. It has to be noticed without shouting: a light
 * green strip with a solid green icon, its own headline and a solid button,
 * not Bootstrap's pale alert.
 */
// The option's full range comes along as estimated_funding_range; the banner must not show it.
const request = { id: 7, requested_amount: '50000.00', estimated_funding_range: '$25,000 - $5,000,000', funding_type: 'Term Loan' }

function renderBanner(count: number, path = '/') {
  return renderWithProviders(
    <Routes>
      <Route path="*" element={<GlobalFundingBanner activeRequest={count ? request : null} count={count} />} />
      <Route path="/fund-application/:id" element={<div>Fund Application page</div>} />
    </Routes>,
    { route: path }
  )
}

describe('GlobalFundingBanner', () => {
  it('announces several approved requests in its own headline', () => {
    renderBanner(2)

    const banner = screen.getByRole('alert')
    expect(within(banner).getByText('You have 2 Funding Requests Approved!')).toHaveClass('gfb-title')
    expect(banner).toHaveTextContent('You’re ready to start your applications.')
  })

  /**
   * Defect (BUG-068): the banner read "Estimated Funding: $25,000 - $5,000,000",
   * the funding option's full range, as if it were this client's estimate. It
   * shows the amount the client requested.
   */
  it('gives the requested amount for a single approved request, not the option range', () => {
    renderBanner(1)

    const banner = screen.getByRole('alert')
    expect(within(banner).getByText('Your Funding Request has been Approved!')).toHaveClass('gfb-title')
    expect(banner).toHaveTextContent('Requested Amount: $50,000')
    expect(banner).not.toHaveTextContent('Estimated Funding')
    expect(banner).not.toHaveTextContent('$5,000,000')
  })

  it('stands out: its own tinted strip with an icon, not the pale alert', () => {
    renderBanner(2)

    const banner = screen.getByRole('alert')
    expect(banner).toHaveClass('gfb')
    expect(banner).not.toHaveClass('alert-success')
    expect(banner.querySelector('.gfb-icon i')).not.toBeNull()
  })

  it('starts the funding application for the request', async () => {
    const user = userEvent.setup()
    renderBanner(2)

    await user.click(screen.getByRole('button', { name: /start funding application/i }))

    expect(await screen.findByText('Fund Application page')).toBeInTheDocument()
  })

  it('is not shown with nothing approved, or on the funding application itself', () => {
    const { unmount } = renderBanner(0)
    expect(screen.queryByRole('alert')).toBeNull()
    unmount()

    renderBanner(2, '/fund-application/7')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
