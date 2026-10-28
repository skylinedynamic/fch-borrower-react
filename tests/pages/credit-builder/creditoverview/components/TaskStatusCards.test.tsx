import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../../../test-utils'
import { server } from '../../../../mocks/server'
import TaskStatusCards from '../../../../../src/pages/credit-builder/creditoverview/components/TaskStatusCards'
import type { Task } from '../../../../../src/modules/credit-builder/overview/types'

/**
 * Credit Builder › Overview › Task activity: every task the borrower has
 * submitted in one list - what needs fixing first - filtered by where it stands.
 */
const task = (id: number, status: Task['status'], overrides: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  tier: 'Tier 0',
  subtitle: `About task ${id}`,
  description: null,
  status,
  rejection_reason: null,
  completed_at: null,
  ...overrides,
})

const overview = (verified: Task[], processing: Task[], rejected: Task[]) => ({
  tier: { id: 1, code: 'T0', name: 'Tier 0', title: '', subtitle: '', description: null, status: 'Active', order: 0, has_vendor: 0, task_to_complete: null },
  verified,
  processing,
  pending: [],
  rejected,
})

const serve = (data: ReturnType<typeof overview>) =>
  server.use(http.get('*/borrower/credit-builder/task-overview', () => HttpResponse.json({ status: true, message: 'ok', data })))

const rows = () => within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('listitem')
const tab = (name: RegExp) => screen.getByRole('tab', { name })

afterEach(() => server.resetHandlers())

describe('Credit Builder Overview - Task activity', () => {
  it('counts the tasks by where they stand', async () => {
    serve(overview([task(1, 'verified'), task(2, 'verified')], [task(3, 'processing')], [task(4, 'rejected')]))
    renderWithProviders(<TaskStatusCards />)

    expect(await screen.findByRole('tab', { name: /All\s*4/ })).toHaveAttribute('aria-selected', 'true')
    expect(tab(/Needs attention\s*1/)).toBeInTheDocument()
    expect(tab(/In review\s*1/)).toBeInTheDocument()
    expect(tab(/Verified\s*2/)).toBeInTheDocument()
  })

  it('lists what needs fixing first, with the reason and a way to fix it', async () => {
    serve(overview(
      [task(1, 'verified', { completed_at: '08 Mar 2026' })],
      [task(2, 'processing')],
      [task(3, 'rejected', { title: 'EIN Consistency', rejection_reason: 'EIN does not match the IRS letter' })],
    ))
    renderWithProviders(<TaskStatusCards />)

    await screen.findByRole('list', { name: 'Tasks' })
    const [first, second, third] = rows()
    expect(first).toHaveTextContent('EIN Consistency')
    expect(first).toHaveTextContent('EIN does not match the IRS letter')
    expect(within(first).getByRole('link', { name: /Fix in the guide/ })).toHaveAttribute('href', '/credit-builder/guide')
    expect(second).toHaveTextContent('In review')
    expect(third).toHaveTextContent('Verified')
    expect(third).toHaveTextContent('08 Mar 2026')
  })

  it('filters to one status', async () => {
    const user = userEvent.setup()
    serve(overview([task(1, 'verified'), task(2, 'verified')], [task(3, 'processing')], [task(4, 'rejected')]))
    renderWithProviders(<TaskStatusCards />)

    await user.click(await screen.findByRole('tab', { name: /Verified\s*2/ }))

    expect(tab(/Verified\s*2/)).toHaveAttribute('aria-selected', 'true')
    expect(rows()).toHaveLength(2)
    rows().forEach((row) => expect(row).toHaveTextContent('Verified'))
  })

  it('shows the first six and the rest on request', async () => {
    const user = userEvent.setup()
    serve(overview(Array.from({ length: 9 }, (_, i) => task(i + 1, 'verified')), [], []))
    renderWithProviders(<TaskStatusCards />)

    await screen.findByRole('list', { name: 'Tasks' })
    expect(rows()).toHaveLength(6)

    await user.click(screen.getByRole('button', { name: 'Show all 9' }))
    expect(rows()).toHaveLength(9)
  })

  it('says so when a filter has nothing in it', async () => {
    const user = userEvent.setup()
    serve(overview([task(1, 'verified')], [], []))
    renderWithProviders(<TaskStatusCards />)

    await user.click(await screen.findByRole('tab', { name: /Needs attention\s*0/ }))

    expect(screen.getByText('Nothing needs your attention')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Tasks' })).not.toBeInTheDocument()
  })

  it('invites the borrower to start when nothing has been submitted', async () => {
    serve(overview([], [], []))
    renderWithProviders(<TaskStatusCards />)

    expect(await screen.findByText('No tasks submitted yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start in the guide/ })).toHaveAttribute('href', '/credit-builder/guide')
  })
})
