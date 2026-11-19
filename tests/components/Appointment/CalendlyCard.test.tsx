import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor, within } from '../../test-utils'
import { server } from '../../mocks/server'
import CalendlyCard from '../../../src/components/Appointment/CalendlyCard'
import type { CalendlyStatus } from '../../../src/modules/calendly/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }, ToastContainer: () => null }))
vi.mock('bootstrap/js/dist/modal', () => ({
  default: class {
    show = vi.fn()
    hide = vi.fn()
    dispose = vi.fn()
    static getInstance = vi.fn(() => null)
    static getOrCreateInstance = vi.fn(() => ({ show: vi.fn(), hide: vi.fn(), dispose: vi.fn() }))
  },
}))

import { toast } from 'react-toastify'

const status = (data: Partial<CalendlyStatus>): CalendlyStatus => ({
  configured: true,
  connected: false,
  can_manage: true,
  can_book: false,
  can_sync: false,
  ...data,
})

let syncCalls = 0
let connectCalls = 0
let disconnectCalls = 0
/** What each sync asked for (the quiet one on opening sends nothing). */
let syncBodies: Record<string, unknown>[] = []

beforeEach(() => {
  vi.clearAllMocks()
  syncCalls = 0
  connectCalls = 0
  disconnectCalls = 0
  syncBodies = []
  server.use(
    http.post('*/common/calendly/sync', async ({ request }) => {
      syncCalls += 1
      const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>
      syncBodies.push(body)
      return HttpResponse.json({
        status: true,
        data: body.direction
          ? { direction: body.direction, from: body.from ?? '2026-11-01', to: body.to ?? '2026-11-30', synced: 3, pulled: 2, pushed: 1, failed: 0, errors: [] }
          : { synced: 2 },
      })
    }),
    http.post('*/common/calendly/connect', () => {
      connectCalls += 1
      return HttpResponse.json({ status: true, data: { url: 'https://auth.calendly.com/oauth/authorize?state=abc' } })
    }),
    http.delete('*/common/calendly/connection', () => {
      disconnectCalls += 1
      return HttpResponse.json({ status: true })
    }),
  )
})
afterEach(() => server.resetHandlers())

/**
 * The borrower's Calendly card on the Appointments page - the partner portal's
 * design: they connect their own Calendly (through their partner's app), sync
 * and disconnect it; until then they book with, and sync, their partner's.
 */
describe('CalendlyCard (borrower)', () => {
  it('Connect goes straight to Calendly sign-in', async () => {
    const user = userEvent.setup()
    const go = vi.fn()

    renderWithProviders(<CalendlyCard status={status({})} onSynced={vi.fn()} redirect={go} />)

    await user.click(screen.getByRole('button', { name: /connect calendly/i }))

    await waitFor(() => expect(go).toHaveBeenCalledWith('https://auth.calendly.com/oauth/authorize?state=abc'))
    expect(connectCalls).toBe(1)
  })

  it('booking with the advisor\'s Calendly, offers Connect your own and Sync now', async () => {
    const onSynced = vi.fn()

    renderWithProviders(<CalendlyCard status={status({ books_with_partner: true, can_book: true, can_sync: true, partner_name: 'Kazi Arafat Mia' })} onSynced={onSynced} />)

    expect(screen.getByText(/you book with your advisor's calendly/i)).toBeInTheDocument()
    expect(screen.getByText('Kazi Arafat Mia')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect calendly/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^disconnect$/i })).not.toBeInTheDocument()
    // Nothing is synced by itself on opening the page - only with Sync now.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(syncCalls).toBe(0)
    expect(onSynced).not.toHaveBeenCalled()
  })

  it('connected: shows the account, syncs on demand and disconnects after asking', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CalendlyCard
        status={status({ connected: true, can_book: true, can_sync: true, is_host: true, name: 'Jane Calendly', email: 'jane@example.test', last_synced_at: '2026-11-17T08:00:00Z' })}
        onSynced={vi.fn()}
      />,
    )

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText(/Jane Calendly · jane@example.test/)).toBeInTheDocument()
    expect(syncCalls).toBe(0)

    // Sync now asks which way first - nothing is synced until Sync is pressed.
    await user.click(screen.getByRole('button', { name: /sync now/i }))
    const dialog = await screen.findByRole('dialog', { name: /sync with calendly/i })
    expect(syncCalls).toBe(0)
    await user.click(within(dialog).getByRole('button', { name: /^sync$/i }))
    await waitFor(() => expect(syncCalls).toBe(1))
    expect(syncBodies[0].direction).toBe('pull')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Calendly synced: 2 brought in from Calendly · 1 sent to Calendly'))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /sync with calendly/i })).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /^disconnect$/i }))
    expect(disconnectCalls).toBe(0)
    // The confirmation dialog (Bootstrap, mocked) is in the page but not "shown" to role queries.
    // Its icon: Calendly's logo - not the default animated one.
    const confirm = (await screen.findByText('Disconnect Calendly?')).closest('.modal') as HTMLElement
    expect(confirm.querySelector('img')).not.toBeNull()
    expect(confirm.querySelector('lord-icon')).toBeNull()
    await user.click(await screen.findByText('Yes, disconnect'))
    await waitFor(() => expect(disconnectCalls).toBe(1))
  })

  it('Sync now: one way picked - two-way - for the dates the calendar shows', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CalendlyCard
        status={status({ connected: true, can_book: true, can_sync: true, name: 'Jane Calendly' })}
        onSynced={vi.fn()}
        getSyncDates={() => ({ from: '2026-11-15', to: '2026-11-21', label: 'Nov 15 – Nov 21, 2026', view: 'Week view' })}
      />,
    )

    await user.click(screen.getByRole('button', { name: /sync now/i }))
    const dialog = await screen.findByRole('dialog', { name: /sync with calendly/i })
    expect(within(dialog).getByText('Nov 15 – Nov 21, 2026')).toBeInTheDocument()
    expect(within(dialog).getByText('Week view')).toBeInTheDocument()

    // One choice at a time: Pull to start with, then Two-way.
    const pull = within(dialog).getByRole('radio', { name: /pull from calendly/i })
    const both = within(dialog).getByRole('radio', { name: /two-way sync/i })
    expect(pull).toBeChecked()
    await user.click(both)
    expect(both).toBeChecked()
    expect(pull).not.toBeChecked()

    await user.click(within(dialog).getByRole('button', { name: /^sync$/i }))
    await waitFor(() => expect(syncCalls).toBe(1))
    expect(syncBodies[0]).toMatchObject({ direction: 'both', from: '2026-11-15', to: '2026-11-21' })
  })

  it('Sync now without their own Calendly: pull only', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CalendlyCard status={status({ books_with_partner: true, can_book: true, can_sync: true })} onSynced={vi.fn()} />,
    )

    await user.click(await screen.findByRole('button', { name: /sync now/i }))
    const dialog = await screen.findByRole('dialog', { name: /sync with calendly/i })
    expect(within(dialog).getByRole('radio', { name: /push to calendly/i })).toBeDisabled()
    expect(within(dialog).getByRole('radio', { name: /two-way sync/i })).toBeDisabled()
    expect(within(dialog).getAllByText(/connect your own calendly to send your meetings/i).length).toBeGreaterThan(0)
    // No calendar to read: this month.
    expect(within(dialog).getByText('This month')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: /^sync$/i }))
    await waitFor(() => expect(syncBodies[syncBodies.length - 1]).toMatchObject({ direction: 'pull' }))
    expect(syncBodies[syncBodies.length - 1]).not.toHaveProperty('from')
  })

  it('asks to reconnect when their Calendly sign-in expired', () => {
    renderWithProviders(<CalendlyCard status={status({ needs_reconnect: true })} onSynced={vi.fn()} />)

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reconnect calendly/i })).toBeInTheDocument()
  })

  it('shows nothing while the advisor has not set up Calendly', () => {
    const { container } = renderWithProviders(<CalendlyCard status={status({ configured: false, can_manage: false })} onSynced={vi.fn()} />)

    expect(container.textContent).toBe('')
  })

  it('says the account is already connected in the portal when Calendly sends back in_use', async () => {
    renderWithProviders(<CalendlyCard status={status({})} onSynced={vi.fn()} />, { route: '/appointment?calendly=in_use' })

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('already connected in the portal')))
  })

  it('says how connecting went when Calendly sends the borrower back', async () => {
    renderWithProviders(<CalendlyCard status={status({ connected: true, can_sync: true })} onSynced={vi.fn()} />, { route: '/appointment?calendly=connected' })

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Calendly connected'))
    // Connecting only signs in: no sync, so no appointment is made from its Calendly meetings.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(syncCalls).toBe(0)
  })
})
