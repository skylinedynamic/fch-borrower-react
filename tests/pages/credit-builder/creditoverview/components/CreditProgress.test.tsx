import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, within } from '../../../../test-utils'
import { server } from '../../../../mocks/server'
import CreditProgress from '../../../../../src/pages/credit-builder/creditoverview/components/CreditProgress'
import type { CreditProgressData } from '../../../../../src/modules/credit-builder/overview/types'

/**
 * Credit Builder › Overview: the overall progress (the Step-By-Step Guide's
 * "Overall Progress"), the tier roadmap, and the current tier's own figures.
 *
 * BUG-024: the current tier is out of the tasks it needs - all of Tier 0, one
 * from Tier 1 on (the API's task_to_complete) - so Tier 1 reads 0/1 as in the
 * Guide, not 0/8; and its estimate is the longest task still open.
 */
const tiers = [0, 1, 2, 3, 4].map((n) => ({
  id: n + 1, name: `Tier ${n}`, title: `Title ${n}`, subtitle: '', description: '', status: null, order: n,
}))

const progress = (overrides: Partial<CreditProgressData> = {}): CreditProgressData => ({
  id: 1,
  name: 'Tier 0',
  title: 'Business Foundation',
  subtitle: 'Set up the basics',
  description: '',
  current_tier_estimated_completion_days: 3,
  current_tier_tasks_remaining: 2,
  current_tier_complete_task: 6,
  current_tier_complete_percentage: 75,
  total_tasks_remaining: 10,
  total_complete_task: 6,
  total_complete_percentage: 38,
  tiers,
  ...overrides,
})

const serve = (data: CreditProgressData) =>
  server.use(http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.json({ status: true, message: 'ok', data })))

const tile = (name: string) => within(screen.getByRole('group', { name }))

afterEach(() => server.resetHandlers())

describe('Credit Builder Overview - progress', () => {
  it('headlines the overall progress the Guide shows', async () => {
    serve(progress())
    renderWithProviders(<CreditProgress />)

    const ring = await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(ring).toHaveAttribute('aria-valuenow', '38')
    expect(within(ring).getByText('38%')).toBeInTheDocument()
    expect(screen.getByText('6 of 16 tasks verified')).toBeInTheDocument()
  })

  it("shows the current tier's own figures, labelled as the tier's", async () => {
    serve(progress())
    renderWithProviders(<CreditProgress />)

    await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(tile('Tier 0 progress').getByText('75%')).toBeInTheDocument()
    expect(tile('Tasks completed in this tier').getByText('6/8')).toBeInTheDocument()
    expect(tile('Estimated completion').getByText('3 days')).toBeInTheDocument()
  })

  it('counts a tier that needs one task out of one (BUG-024)', async () => {
    serve(progress({ id: 2, name: 'Tier 1', current_tier_complete_task: 0, current_tier_tasks_remaining: 1, current_tier_complete_percentage: 0, current_tier_estimated_completion_days: 30 }))
    renderWithProviders(<CreditProgress />)

    await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(tile('Tasks completed in this tier').getByText('0/1')).toBeInTheDocument()
    expect(tile('Estimated completion').getByText('30 days')).toBeInTheDocument()
  })

  it('says the tier is complete instead of "0 days" when nothing is left', async () => {
    serve(progress({ id: 2, name: 'Tier 1', current_tier_complete_task: 1, current_tier_tasks_remaining: 0, current_tier_complete_percentage: 100, current_tier_estimated_completion_days: 0 }))
    renderWithProviders(<CreditProgress />)

    await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(tile('Estimated completion').getByText('Tier complete')).toBeInTheDocument()
    expect(screen.queryByText('0 days')).not.toBeInTheDocument()
  })

  it('shows no estimate, not "0 days", while the tier still needs a task it has not got', async () => {
    // BUG-024 retest: Tier 4 with nothing listed yet - its task comes from Tier 3.
    serve(progress({ id: 5, name: 'Tier 4', current_tier_complete_task: 0, current_tier_tasks_remaining: 1, current_tier_complete_percentage: 0, current_tier_estimated_completion_days: 0 }))
    renderWithProviders(<CreditProgress />)

    await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(tile('Tasks completed in this tier').getByText('0/1')).toBeInTheDocument()
    expect(tile('Estimated completion').getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('0 days')).not.toBeInTheDocument()
  })

  it('says every tier is complete when the last one is', async () => {
    serve(progress({ id: 5, name: 'Tier 4', current_tier_complete_task: 1, current_tier_tasks_remaining: 0, current_tier_complete_percentage: 100, current_tier_estimated_completion_days: 0 }))
    renderWithProviders(<CreditProgress />)

    await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(tile('Estimated completion').getByText('All tiers complete')).toBeInTheDocument()
  })

  it('lays out the tier roadmap: done, current and locked', async () => {
    serve(progress({ id: 3, name: 'Tier 2' }))
    renderWithProviders(<CreditProgress />)

    const roadmap = within(await screen.findByRole('list', { name: 'Tier roadmap' }))
    const steps = roadmap.getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    expect(steps[1]).toHaveTextContent('Completed')
    expect(steps[2]).toHaveAttribute('aria-current', 'step')
    expect(steps[2]).toHaveTextContent('In progress')
    expect(steps[3]).toHaveTextContent('Locked')
  })

  it('leads to the Step-By-Step Guide', async () => {
    serve(progress())
    renderWithProviders(<CreditProgress />)

    await screen.findByRole('progressbar', { name: 'Overall progress' })
    expect(screen.getByRole('link', { name: /Step-By-Step Guide/ })).toHaveAttribute('href', '/credit-builder/guide')
  })

  it('still shows the page title while the progress loads or fails', async () => {
    server.use(http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.json({ status: false }, { status: 500 })))
    renderWithProviders(<CreditProgress />)

    expect(screen.getByRole('heading', { name: 'Credit Building Overview' })).toBeInTheDocument()
    expect(await screen.findByText('Failed to load progress data')).toBeInTheDocument()
  })
})
