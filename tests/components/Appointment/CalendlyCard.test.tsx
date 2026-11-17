import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import CalendlyCard from '../../../src/components/Appointment/CalendlyCard'
import type { CalendlyStatus } from '../../../src/modules/calendly/types'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() }, ToastContainer: () => null }))
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

beforeEach(() => {
  vi.clearAllMocks()
  syncCalls = 0
  connectCalls = 0
  disconnectCalls = 0
  server.use(
    http.post('*/common/calendly/sync', () => {
      syncCalls += 1
      return HttpResponse.json({ status: true, data: { synced: 2 } })
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
    // Opening the page syncs once, quietly.
    await waitFor(() => expect(syncCalls).toBe(1))
    expect(onSynced).toHaveBeenCalled()
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
    await waitFor(() => expect(syncCalls).toBe(1))

    await user.click(screen.getByRole('button', { name: /sync now/i }))
    await waitFor(() => expect(syncCalls).toBe(2))
    expect(toast.success).toHaveBeenCalledWith('2 Calendly meeting(s) synced')

    await user.click(screen.getByRole('button', { name: /^disconnect$/i }))
    expect(disconnectCalls).toBe(0)
    // The confirmation dialog (Bootstrap, mocked) is in the page but not "shown" to role queries.
    await user.click(await screen.findByText('Yes, disconnect'))
    await waitFor(() => expect(disconnectCalls).toBe(1))
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

  it('says how connecting went when Calendly sends the borrower back', async () => {
    renderWithProviders(<CalendlyCard status={status({ connected: true, can_sync: true })} onSynced={vi.fn()} />, { route: '/appointment?calendly=connected' })

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Calendly connected'))
  })
})
