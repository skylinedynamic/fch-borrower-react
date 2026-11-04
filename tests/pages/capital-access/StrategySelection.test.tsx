import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, waitFor, within } from '../../test-utils'
import { server } from '../../mocks/server'
import StrategySelection from '../../../src/pages/capital-access/StrategySelection'
import PlayOverview from '../../../src/pages/capital-access/PlayOverview'

const toastInfo = vi.hoisted(() => vi.fn())
vi.mock('react-toastify', () => ({ toast: { info: toastInfo, success: vi.fn(), error: vi.fn() }, ToastContainer: () => null }))

/**
 * BUG-044 (R2-CP-CAP-03): one play runs at a time (the API's PlayAccessGuard),
 * but the other plays only showed a padlock - no reason, a count that said
 * "available", and opening one by URL bounced back without a word. The rule
 * stays; the page now says it.
 */
const play = (id: number, name: string) => ({
  id, name, description: `${name} description`, target_exposure: '$10K - $50K',
  approval_probability: '80%', est_timeline: '30 - 60 days', isCompleted: false, isRecommended: false, isAccessible: true,
})

const serve = (currentPlay: { id: number; name: string } | null) => {
  server.use(
    http.get('*/borrower/capital-access/strategies-list', () =>
      HttpResponse.json({ status: true, data: [play(1, 'Foundation 100 Play'), play(2, 'Growth Stack'), play(3, 'Prime Stack')] })
    ),
    http.get('*/borrower/capital-access/overview', () =>
      HttpResponse.json({ status: true, data: { readiness_score: 80, readiness_status: 'Good', factors: [], estimated_total_access: '$0.00', current_play: currentPlay } })
    ),
  )
}

beforeEach(() => toastInfo.mockClear())
afterEach(() => server.resetHandlers())

describe('StrategySelection while a play is running', () => {
  it('says why the other plays are locked and links to the running play', async () => {
    serve({ id: 1, name: 'Foundation 100 Play' })
    renderWithProviders(<StrategySelection />)

    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent('You can run one play at a time. Finish Foundation 100 Play to start another.')
    expect(within(notice).getByRole('link', { name: /Continue Foundation 100 Play/i })).toHaveAttribute('href', '/credit-card-stacking/1/roadmap')
    expect(screen.getByText('2 locked while a play is running')).toBeInTheDocument()
    expect(screen.queryByText(/available/)).not.toBeInTheDocument()
  })

  it('gives each locked play the reason on hover', async () => {
    serve({ id: 1, name: 'Foundation 100 Play' })
    renderWithProviders(<StrategySelection />)

    const locks = await screen.findAllByLabelText('You can run one play at a time. Finish Foundation 100 Play to start another.')
    expect(locks).toHaveLength(2)
    locks.forEach(lock => expect(lock).toHaveAttribute('title', 'You can run one play at a time. Finish Foundation 100 Play to start another.'))
  })

  it('says it in a toast when the borrower was sent back from a locked play', async () => {
    serve({ id: 1, name: 'Foundation 100 Play' })
    renderWithProviders(
      <Routes>
        <Route path="/credit-card-stacking/:id/overview" element={<PlayOverview />} />
        <Route path="/credit-card-stacking/strategy" element={<StrategySelection />} />
      </Routes>,
      { route: '/credit-card-stacking/2/overview' }
    )
    server.use(
      http.get('*/borrower/capital-access/strategies/2/overview', () =>
        HttpResponse.json({ status: true, data: { id: 2, name: 'Growth Stack', isAccessible: false } })
      ),
    )

    expect(await screen.findByRole('status')).toBeInTheDocument()
    await waitFor(() =>
      expect(toastInfo).toHaveBeenCalledWith('You can run one play at a time. Finish Foundation 100 Play to start another.', expect.anything())
    )
  })

  it('does not toast on an ordinary visit', async () => {
    serve({ id: 1, name: 'Foundation 100 Play' })
    renderWithProviders(<StrategySelection />)

    await screen.findByRole('status')
    expect(toastInfo).not.toHaveBeenCalled()
  })
})

describe('StrategySelection with no running play', () => {
  it('offers the other plays with no notice', async () => {
    serve(null)
    renderWithProviders(<StrategySelection />)

    expect(await screen.findByText('2 available')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Growth Stack/ })).toHaveAttribute('href', '/credit-card-stacking/2/overview')
  })
})
