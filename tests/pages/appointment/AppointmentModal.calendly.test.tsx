import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { http, HttpResponse } from 'msw'
import { act, render, screen, waitFor, within } from '@testing-library/react'
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
// Calendly is open at the form's default start (9:00 AM) and 10:00 AM.
const NINE = { start_time: '2999-06-15T14:00:00Z', local_time: '2999-06-15 09:00:00', label: '9:00 AM' }
const TEN = { start_time: '2999-06-15T15:00:00Z', local_time: '2999-06-15 10:00:00', label: '10:00 AM' }
const HOST = { id: 2, name: 'Host Admin (Host)', entity_type: 'Partner', entity_id: 1 }
// Booking with the partner's Calendly (their own not connected) - as the API reports it.
const CONNECTED: CalendlyStatus = { connected: false, can_book: true, can_manage: true, is_host: false, books_with_partner: true }

type Seen = { calls: number; bodies: any[] }

/** The Calendly they book with: one event type, open at 9:00 and 10:00 AM. */
const serve = (openTimes: unknown[] = [NINE, TEN]) => {
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
      return HttpResponse.json({ status: true, data: openTimes })
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

const confirm = () => screen.getByRole('button', { name: /confirm appointment/i, hidden: true })
const overlapAlert = () => waitFor(() => {
  const found = document.querySelector('.calendly-overlap') as HTMLElement | null
  if (!found) throw new Error('no overlap alert')
  return found
})

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ token: 'tok', user: { id: 1, is_host: 0 }, userSubscription: null, rememberMe: true })
})
afterEach(() => server.resetHandlers())

/**
 * Sync with Calendly in the borrower portal - as in the partner portal: the
 * usual date and time slot, checked live against Calendly (overlap message),
 * booked with the Calendly's active event type - no event type or open time
 * to choose. With their partner's Calendly the borrower is the invitee; in
 * their own they invite the person they pick.
 */
describe('AppointmentModal - Sync with Calendly (borrower)', () => {
  it('offers no "Sync with Calendly" when there is no Calendly to book with', async () => {
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

  it('ticked, keeps the date and time slot, asks for no event type or open time, and books that time with the partner Calendly', async () => {
    const { times, book, create } = serve()
    const { user, onSuccess } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(document.querySelector('.time-slot-container')).toBeInTheDocument()
    expect(screen.queryByText(/calendly event type/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/open times \*/i)).not.toBeInTheDocument()
    // The meeting is with the partner: no "Appointment With" to pick.
    expect(screen.queryByText('Select Partner')).not.toBeInTheDocument()
    expect(await screen.findByText('Calendly books 30 min (30 Minute Meeting).')).toBeInTheDocument()
    await waitFor(() => expect(confirm()).not.toBeDisabled())
    await user.click(confirm())

    await waitFor(() => expect(book.calls).toBe(1))
    expect(times.bodies[times.bodies.length - 1]).toMatchObject({ event_type_uri: EVENT_TYPE.uri, date: '2999-06-15' })
    expect(book.bodies[0]).toMatchObject({
      event_type_uri: EVENT_TYPE.uri,
      start_time: '2999-06-15 09:00:00',
      subject: 'Funding review',
    })
    expect(book.bodies[0]).not.toHaveProperty('assigned_for')
    expect(create.calls).toBe(0)
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(toast.success).toHaveBeenCalledWith('Meeting booked in Calendly.')
  })

  it("the end time follows the Calendly event type's length and is shown, not picked", async () => {
    serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [{ ...EVENT_TYPE, name: 'Long call', duration: 60 }] })))
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(await screen.findByText('Calendly books 60 min (Long call).')).toBeInTheDocument()
    const end = screen.getByLabelText('End') as HTMLInputElement
    expect(end).toHaveAttribute('readonly')
    await waitFor(() => expect(end.value).toBe('10:00 AM'))
  })

  it("a time outside Calendly's hours shows the overlap, the hours and the open times, and cannot be confirmed", async () => {
    const { book } = serve([TEN])
    const { user } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))

    const alert = await overlapAlert()
    // No red "overlap" warning: a plain list of the open times to pick from.
    expect(alert).toHaveTextContent('Pick an open time')
    expect(alert).not.toHaveTextContent('NOT AVAILABLE')
    expect(alert).toHaveTextContent("9:00 AM - 9:30 AM on 2999-06-15 is outside Calendly's hours that day (10:00 AM - 10:30 AM)")
    expect(confirm()).toBeDisabled()

    // Picking an open time clears the overlap and books it.
    await user.click(within(alert).getByRole('button', { name: '10:00 AM', hidden: true }))
    await waitFor(() => expect(document.querySelector('.calendly-overlap')).not.toBeInTheDocument())
    await waitFor(() => expect(confirm()).not.toBeDisabled())
    await user.click(confirm())

    await waitFor(() => expect(book.calls).toBe(1))
    expect(book.bodies[0].start_time).toBe('2999-06-15 10:00:00')
  })

  it('a taken time inside Calendly hours says it is already booked - no duplicate', async () => {
    const EIGHT_THIRTY = { start_time: '2999-06-15T13:30:00Z', local_time: '2999-06-15 08:30:00', label: '8:30 AM' }
    const { book } = serve([EIGHT_THIRTY, TEN])
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(await overlapAlert()).toHaveTextContent('9:00 AM - 9:30 AM on 2999-06-15 is already booked')
    expect(confirm()).toBeDisabled()
    expect(book.calls).toBe(0)
  })

  it('a day with no open times offers the next open day', async () => {
    serve()
    const NEXT_DAY = { start_time: '2999-06-16T14:30:00Z', local_time: '2999-06-16 09:30:00', label: '9:30 AM' }
    server.use(http.post('*/common/calendly/available-times', async ({ request }) => {
      const body = (await request.json()) as { date: string }
      return HttpResponse.json({ status: true, data: body.date === '2999-06-16' ? [NEXT_DAY] : [] })
    }))
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(await screen.findByText(/no open time in calendly/i)).toBeInTheDocument()
    const next = await waitFor(() => {
      const found = document.querySelector('.calendly-next-open') as HTMLElement | null
      if (!found) throw new Error('no next open day')
      return found
    })
    expect(next).toHaveTextContent('Next open day - 2999-06-16')
  })

  // Their own Calendly connected: they book in it and invite the person they pick.
  it('with their own Calendly, cannot be ticked or checked until who the meeting is with is chosen', async () => {
    const { times, book } = serve()
    await open({ connected: true, can_book: true, can_manage: true, is_host: true })

    const tick = screen.getByLabelText(/sync with calendly/i)
    expect(tick).toBeDisabled()
    expect(screen.getByText(/choose who the meeting is with \("appointment with"\) first/i)).toBeInTheDocument()
    expect(document.querySelector('.calendly-overlap')).not.toBeInTheDocument()
    expect(times.calls).toBe(0)
    expect(book.calls).toBe(0)
  })

  it('a phone-call event type asks for no number - the API uses the one in FCH', async () => {
    const { book } = serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [{ ...EVENT_TYPE, location_kind: 'outbound_call', asks_invitee_location: true }] })))
    const { user } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))
    await screen.findByText(/calendly books 30 min/i)

    expect(screen.queryByLabelText(/phone number to call/i)).not.toBeInTheDocument()
    await waitFor(() => expect(confirm()).not.toBeDisabled())
    await user.click(confirm())

    await waitFor(() => expect(book.calls).toBe(1))
    expect(book.bodies[0]).not.toHaveProperty('location')
  })

  it('asks for the number only when the API says FCH has none, then books with it', async () => {
    serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [{ ...EVENT_TYPE, location_kind: 'outbound_call', asks_invitee_location: true }] })))
    const MISSING = 'Jane has no phone number in FCH - enter the number to call.'
    const sent: any[] = []
    server.use(http.post('*/common/calendly/book', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      sent.push(body)
      return body.location
        ? HttpResponse.json({ status: true, message: 'Meeting booked in Calendly.', data: { id: 9 } })
        : HttpResponse.json({ status: false, message: MISSING, errors: { location: [MISSING] } }, { status: 422 })
    }))
    const { user } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))
    await waitFor(() => expect(confirm()).not.toBeDisabled())
    await user.click(confirm())

    expect(await screen.findByText(MISSING)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/phone number to call/i), '+1 312 555 0100')
    await user.click(confirm())

    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]).toMatchObject({ location: '+1 312 555 0100' })
  })

  it('shows Calendly refusing the booking', async () => {
    serve()
    server.use(http.post('*/common/calendly/book', () => HttpResponse.json({ status: false, message: 'Calendly is not responding right now.' }, { status: 502 })))
    const { user, onSuccess } = await open(CONNECTED)

    await user.type(screen.getByPlaceholderText('Enter appointment title'), 'Funding review')
    await user.click(screen.getByLabelText(/sync with calendly/i))
    await waitFor(() => expect(confirm()).not.toBeDisabled())
    await user.click(confirm())

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Calendly is not responding right now.'))
    expect(onSuccess).not.toHaveBeenCalled()
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
    await pick(user, 'Zoom', 'Phone call (we call you)')
    // The number comes from the borrower's FCH profile.
    expect(screen.queryByLabelText(/phone number to call/i)).not.toBeInTheDocument()
    await waitFor(() => expect(confirm()).not.toBeDisabled())
    await user.click(confirm())

    await waitFor(() => expect(book.calls).toBe(1))
    expect(book.bodies[0]).toMatchObject({ location_kind: 'outbound_call' })
  })

  it('says so when the Calendly has no event type switched on, and cannot be confirmed', async () => {
    serve()
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [] })))
    const { user } = await open(CONNECTED)

    await user.click(screen.getByLabelText(/sync with calendly/i))

    expect(await screen.findByText(/no event type switched on/i)).toBeInTheDocument()
    expect(confirm()).toBeDisabled()
  })
})
