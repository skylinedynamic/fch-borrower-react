import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { http, HttpResponse } from 'msw'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../../mocks/server'
import { useAuthStore } from '../../../src/store/auth'
import AppointmentModal, { type AppointmentModalHandle } from '../../../src/pages/appointment/AppointmentModal'
import type { CalendlyStatus } from '../../../src/modules/calendly/types'
import { toast } from 'react-toastify'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('flatpickr', () => ({ default: () => ({ destroy: () => {}, setDate: () => {} }) }))
vi.mock('../../../src/utils/flatpickrPlugins', () => ({ yearDropdownPlugin: () => ({}) }))
vi.mock('bootstrap/js/dist/modal', () => ({
  default: class {
    show = vi.fn()
    hide = vi.fn()
    dispose = vi.fn()
  },
}))
vi.mock('../../../src/hooks/useSummernote', () => ({ useSummernote: () => ({ editorRef: { current: null } }) }))

const EVENT_TYPE = { uri: 'https://api.calendly.com/event_types/ET1', name: '30 Minute Meeting', duration: 30 }
const SLOT = { start_time: '2999-06-15T15:00:00Z', local_time: '2999-06-15 10:00:00', label: '10:00 AM' }
const HOST = { id: 2, name: 'Host Admin (Host)', entity_type: 'Partner', entity_id: 1 }
const CONNECTED: CalendlyStatus = { connected: true, can_book: true, can_manage: true, is_host: true }

type Seen = { calls: number; bodies: any[] }

/** The borrower's own Calendly, with one event type and one open time. */
const serve = () => {
  const times: Seen = { calls: 0, bodies: [] }
  const book: Seen = { calls: 0, bodies: [] }
  const create: Seen = { calls: 0, bodies: [] }
  server.use(
    http.post('*/common/appointments/fetch-selectable-users', () => HttpResponse.json({ status: true, data: [HOST] })),
    http.post('*/common/appointments/check-availability', () => HttpResponse.json({ status: true, data: { available: true } })),
    http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [EVENT_TYPE] })),
    http.post('*/common/calendly/available-times', async ({ request }) => {
      times.calls += 1
      times.bodies.push(await request.json())
      return HttpResponse.json({ status: true, data: [SLOT] })
    }),
    http.post('*/common/calendly/book', async ({ request }) => {
      book.calls += 1
      book.bodies.push(await request.json())
      return HttpResponse.json({ status: true, message: 'Meeting booked in Calendly.', data: { id: 9 } })
    }),
    http.post('*/common/appointments', async ({ request }) => {
      create.calls += 1
      create.bodies.push(await request.json())
      return HttpResponse.json({ status: true, message: 'ok', data: { id: 1 } })
    }),
  )
  return { times, book, create }
}

const open = async (calendlyStatus?: CalendlyStatus) => {
  const ref = createRef<AppointmentModalHandle>()
  const onSuccess = vi.fn()
  render(<AppointmentModal ref={ref} onSuccess={onSuccess} calendlyStatus={calendlyStatus} />)
  await act(async () => { ref.current!.create('2999-06-15') })
  await screen.findByPlaceholderText('Enter appointment title')
  return { onSuccess, user: userEvent.setup() }
}

// As the other PrimeReact dropdown tests: open the dropdown, click the panel item.
const pick = async (user: ReturnType<typeof userEvent.setup>, placeholder: string, label: string) => {
  const dropdown = (await screen.findAllByText(placeholder)).map((el) => el.closest('.p-dropdown')).find(Boolean) as HTMLElement
  await user.click(dropdown)
  const item = await waitFor(() => {
    const found = Array.from(dropdown.querySelectorAll('.p-dropdown-item')).find((el) => el.textContent?.trim() === label)
    if (!found) throw new Error(`no "${label}" option`)
    return found as HTMLElement
  })
  await user.click(item)
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ token: 'tok', user: { id: 1, is_host: 0 }, userSubscription: null, rememberMe: true })
})
afterEach(() => server.resetHandlers())

/**
 * The borrower's own Calendly: with it connected, "Sync with Calendly" (after
 * the description) books the appointment into it at one of its open times,
 * inviting the person picked - replacing the separate "Book via Calendly".
 */
describe('AppointmentModal - Sync with Calendly (borrower)', () => {
  it('offers no "Sync with Calendly" when the partner Calendly is not connected', async () => {
    serve()
    await open({ connected: false, can_book: false, can_manage: true })

    expect(screen.queryByLabelText(/sync with calendly/i)).not.toBeInTheDocument()
  })

  it('offers it after the description, unticked, when the partner Calendly is connected', async () => {
    serve()
    await open(CONNECTED)

    const tick = await screen.findByLabelText(/sync with calendly/i)
    expect(tick).not.toBeChecked()
    expect(screen.getByText('Description').compareDocumentPosition(tick) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('ticked, books the chosen open time with the partner Calendly, the borrower the invitee - nobody to pick', async () => {
    const { times, book, create } = serve()
    const { user, onSuccess } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(document.querySelector('.time-slot-container')).not.toBeInTheDocument()
    // The meeting is with the partner: no "Appointment With" to pick.
    expect(screen.queryByText('Select Partner')).not.toBeInTheDocument()
    await pick(user, 'Select an open time', SLOT.label)
    await user.click(screen.getByRole('button', { name: /confirm appointment/i, hidden: true }))

    await waitFor(() => expect(book.calls).toBe(1))
    expect(times.bodies[times.bodies.length - 1]).toMatchObject({ event_type_uri: EVENT_TYPE.uri, date: '2999-06-15' })
    expect(book.bodies[0]).toMatchObject({
      event_type_uri: EVENT_TYPE.uri,
      start_time: SLOT.start_time,
      subject: 'Funding review',
    })
    expect(book.bodies[0]).not.toHaveProperty('assigned_for')
    expect(create.calls).toBe(0)
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(toast.success).toHaveBeenCalledWith('Meeting booked in Calendly.')
  })

  it('cannot be confirmed until an open time is chosen', async () => {
    serve()
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))
    await screen.findAllByText('Select an open time')

    expect(screen.getByRole('button', { name: /confirm appointment/i, hidden: true })).toBeDisabled()
  })

  it('a phone-call event type asks for the number to call', async () => {
    const { book } = serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [{ ...EVENT_TYPE, location_kind: 'outbound_call', asks_invitee_location: true }] })))
    const { user } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))
    await pick(user, 'Select an open time', SLOT.label)
    await user.type(screen.getByLabelText(/phone number to call/i), '+1 312 555 0100')
    await user.click(screen.getByRole('button', { name: /confirm appointment/i, hidden: true }))

    await waitFor(() => expect(book.calls).toBe(1))
    expect(book.bodies[0]).toMatchObject({ location: '+1 312 555 0100' })
  })

  it('shows Calendly refusing the booking', async () => {
    serve()
    server.use(http.post('*/common/calendly/book', () => HttpResponse.json({ status: false, message: 'Calendly is not responding right now.' }, { status: 502 })))
    const { user, onSuccess } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))
    await pick(user, 'Select an open time', SLOT.label)
    await user.click(screen.getByRole('button', { name: /confirm appointment/i, hidden: true }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Calendly is not responding right now.'))
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('loads the open times as soon as Sync with Calendly is ticked', async () => {
    const { times } = serve()
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))

    await waitFor(() => expect(times.calls).toBeGreaterThan(0))
    expect(times.bodies[0]).toMatchObject({ event_type_uri: EVENT_TYPE.uri, date: '2999-06-15' })
    expect(times.bodies[0]).not.toHaveProperty('assigned_for')
    await pick(user, 'Select an open time', SLOT.label)
  })

  it('an event type offering several places asks which, and books the one picked', async () => {
    const { book } = serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [{
      ...EVENT_TYPE,
      location_options: [
        { kind: 'zoom_conference', label: 'Zoom', asks_invitee: false },
        { kind: 'outbound_call', label: 'Phone call (we call you)', asks_invitee: true },
      ],
    }] })))
    const { user } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))
    await pick(user, 'Select an open time', SLOT.label)
    expect(screen.queryByLabelText(/phone number to call/i)).not.toBeInTheDocument()
    await pick(user, 'Zoom', 'Phone call (we call you)')
    await user.type(screen.getByLabelText(/phone number to call/i), '+1 312 555 0100')
    await user.click(screen.getByRole('button', { name: /confirm appointment/i, hidden: true }))

    await waitFor(() => expect(book.calls).toBe(1))
    expect(book.bodies[0]).toMatchObject({ location_kind: 'outbound_call', location: '+1 312 555 0100' })
  })

  it('says so when the partner Calendly has no event types', async () => {
    serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [] })))
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(await screen.findByText(/no event types/i)).toBeInTheDocument()
  })
})
