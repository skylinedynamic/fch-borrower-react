import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../../../test-utils'
import { server } from '../../../../mocks/server'
import CreditProgress from '../../../../../src/pages/credit-builder/creditoverview/components/CreditProgress'

/**
 * BUG-024: Credit Builder › Overview must give the same progress as the
 * Step-By-Step Guide. Its headline and bar are the overall progress (the
 * Guide's "Overall Progress"); the current tier's own figures stay, labelled
 * as the tier's.
 */
const progress = {
  id: 1,
  name: 'Tier 0',
  title: 'Foundation',
  subtitle: 'Set up the basics',
  description: '',
  current_tier_estimated_completion_days: 3,
  current_tier_tasks_remaining: 2,
  current_tier_complete_task: 6,
  current_tier_complete_percentage: 75,
  total_tasks_remaining: 10,
  total_complete_task: 6,
  total_complete_percentage: 38,
  tiers: [
    { id: 1, name: 'Tier 0', title: '', subtitle: '', description: '', status: null, order: 0 },
    { id: 2, name: 'Tier 1', title: '', subtitle: '', description: '', status: null, order: 1 },
  ],
}

const serve = (data = progress) =>
  server.use(http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.json({ status: true, message: 'ok', data })))

afterEach(() => server.resetHandlers())

describe('CreditProgress (Overview) - same progress as the Guide', () => {
  it('headlines the overall progress, as the Guide does', async () => {
    serve()
    renderWithProviders(<CreditProgress />)

    expect(await screen.findByText('38% Overall')).toBeInTheDocument()
    // The tier's 75% is not passed off as the overall progress.
    expect(screen.queryByText('75% Complete')).not.toBeInTheDocument()
  })

  it('fills the bar to the overall progress', async () => {
    serve()
    renderWithProviders(<CreditProgress />)

    const bar = await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '38')
    expect(bar).toHaveStyle({ width: '38%' })
  })

  it('labels the current tier\'s own figures as the tier\'s', async () => {
    serve()
    renderWithProviders(<CreditProgress />)

    expect(await screen.findByText('Tier 0 progress: 75%')).toBeInTheDocument()
    expect(screen.getByText('Tasks completed in this tier: 6/8')).toBeInTheDocument()
  })
})
