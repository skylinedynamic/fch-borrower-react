import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import Appointments from '../../../src/pages/appointment/Appointments'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() }, ToastContainer: () => null }))
vi.mock('flatpickr', () => ({ default: () => ({ destroy: vi.fn(), setDate: vi.fn() }) }))
vi.mock('bootstrap/js/dist/modal', () => ({
  default: class {
    show = vi.fn()
    hide = vi.fn()
    dispose = vi.fn()
  },
}))
vi.mock('../../../src/hooks/useSummernote', () => ({
  useSummernote: () => ({ editorRef: { current: null } }),
}))
// FullCalendar does real layout/measurement work jsdom can't back (no
// getBoundingClientRect geometry); the calendar grid rendering itself isn't
// what Appointments.tsx's data-loading logic is testing.
vi.mock('@fullcalendar/react', () => ({ default: () => <div data-testid="calendar-stub" /> }))

afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null, rememberMe: true })
})

describe('Appointments', () => {
  it('shows the empty state when there are no upcoming appointments', async () => {
    useAuthStore.setState({ user: { id: 1, is_host: 0 } })
    server.use(
      http.post('*/common/appointments/fetch-all', () => HttpResponse.json({ status: true, data: [] }))
    )

    renderWithProviders(<Appointments />)

    expect(await screen.findByText('No Upcoming Events')).toBeInTheDocument()
  })

  it('lists upcoming appointments once loaded', async () => {
    useAuthStore.setState({ user: { id: 1, is_host: 0 } })
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    server.use(
      http.post('*/common/appointments/fetch-all', () =>
        HttpResponse.json({
          status: true,
          data: [
            { id: 1, subject: 'Kickoff Call', appointment_date: future, duration_minutes: 30, status: 'scheduled' },
          ],
        })
      )
    )

    renderWithProviders(<Appointments />)

    expect(await screen.findByText('Kickoff Call')).toBeInTheDocument()
  })
})

// BUG-004 (QA round 2): an upcoming appointment's description is stored HTML;
// it must not run script.
describe('Appointments - descriptions cannot run script (BUG-004)', () => {
  it('lists the description without the onerror handler', async () => {
    useAuthStore.setState({ user: { id: 1, is_host: 0 } })
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    server.use(
      http.post('*/common/appointments/fetch-all', () =>
        HttpResponse.json({
          status: true,
          data: [{ id: 1, subject: 'Kickoff Call', appointment_date: future, duration_minutes: 30, status: 'scheduled', description: 'Agenda <b>review</b> <img src=x onerror="window.__xss = 1">' }],
        })
      )
    )

    const view = renderWithProviders(<Appointments />)

    expect((await screen.findAllByText('review')).length).toBeGreaterThan(0)
    expect(view.container.querySelector('[onerror]')).toBeNull()
  })
})

// Calendly: the borrower books into the company Calendly when it is on, and
// sees its meetings marked, with their join and reschedule links.
describe('Appointments - Calendly', () => {
  const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  it('offers booking via Calendly when the borrower may book into it', async () => {
    useAuthStore.setState({ user: { id: 1, is_host: 0 } })
    server.use(
      http.post('*/common/appointments/fetch-all', () => HttpResponse.json({ status: true, data: [] })),
      http.get('*/common/calendly/status', () => HttpResponse.json({ status: true, data: { connected: true, can_book: true, can_manage: false } })),
    )

    renderWithProviders(<Appointments />)

    expect(await screen.findByRole('button', { name: /book via calendly/i })).toBeInTheDocument()
  })

  it('does not offer it when Calendly is off', async () => {
    useAuthStore.setState({ user: { id: 1, is_host: 0 } })
    server.use(http.post('*/common/appointments/fetch-all', () => HttpResponse.json({ status: true, data: [] })))

    renderWithProviders(<Appointments />)

    expect(await screen.findByText('No Upcoming Events')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /book via calendly/i })).not.toBeInTheDocument()
  })

  it('marks a Calendly meeting and links to join and reschedule it', async () => {
    useAuthStore.setState({ user: { id: 1, is_host: 0 } })
    server.use(
      http.post('*/common/appointments/fetch-all', () =>
        HttpResponse.json({
          status: true,
          data: [{
            id: 2, subject: '30 Minute Meeting', appointment_date: future(), duration_minutes: 30, status: 'confirmed',
            is_calendly: true, join_url: 'https://meet.google.com/abc', reschedule_url: 'https://calendly.com/reschedulings/INV1',
          }],
        })
      )
    )

    renderWithProviders(<Appointments />)

    expect(await screen.findByText('Calendly', { selector: '.calendly-badge' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /join/i })).toHaveAttribute('href', 'https://meet.google.com/abc')
    expect(screen.getByRole('link', { name: /reschedule/i })).toHaveAttribute('href', 'https://calendly.com/reschedulings/INV1')
  })
})
