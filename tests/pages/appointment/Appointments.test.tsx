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
