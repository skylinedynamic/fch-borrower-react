import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() }, ToastContainer: () => null }))

import { toast } from 'react-toastify'
import CalendlyBookingModal from '../../../src/pages/appointment/CalendlyBookingModal'

const EVENT_TYPE = { uri: 'https://api.calendly.com/event_types/ET1', name: '30 Minute Meeting', duration: 30 }
const SLOT = { start_time: '2999-06-15T15:00:00Z', local_time: '2999-06-15 10:00:00', label: '10:00 AM' }

let timesBodies: unknown[] = []
let bookBodies: unknown[] = []

const serve = (book: { body: unknown; status?: number } = { body: { status: true, message: 'Meeting booked in Calendly.', data: { id: 9 } } }, slots = [SLOT]) => {
  timesBodies = []
  bookBodies = []
  server.use(
    http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [EVENT_TYPE] })),
    http.post('*/common/calendly/available-times', async ({ request }) => {
      timesBodies.push(await request.json())
      return HttpResponse.json({ status: true, data: slots })
    }),
    http.post('*/common/calendly/book', async ({ request }) => {
      bookBodies.push(await request.json())
      return HttpResponse.json(book.body as never, { status: book.status ?? 200 })
    }),
  )
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => server.resetHandlers())

/** A borrower booking a slot with their host in the company Calendly. */
describe('CalendlyBookingModal', () => {
  it('books the chosen open slot in Calendly, with the borrower as the invitee', async () => {
    const user = userEvent.setup()
    const onBooked = vi.fn()
    serve()

    renderWithProviders(<CalendlyBookingModal show onClose={vi.fn()} onBooked={onBooked} timezone="Asia/Dhaka" />)

    await user.type(await screen.findByLabelText(/^date/i), '2999-06-15')
    await user.click(await screen.findByRole('button', { name: '10:00 AM' }))
    await user.type(screen.getByLabelText(/subject/i), 'Funding questions')
    await user.click(screen.getByRole('button', { name: /book in calendly/i }))

    await waitFor(() => expect(bookBodies).toHaveLength(1))
    expect(timesBodies[timesBodies.length - 1]).toEqual({ event_type_uri: EVENT_TYPE.uri, date: '2999-06-15', timezone: 'Asia/Dhaka' })
    expect(bookBodies[0]).toEqual({
      event_type_uri: EVENT_TYPE.uri,
      start_time: SLOT.start_time,
      timezone: 'Asia/Dhaka',
      subject: 'Funding questions',
    })
    await waitFor(() => expect(onBooked).toHaveBeenCalled())
    expect(toast.success).toHaveBeenCalledWith('Meeting booked in Calendly.')
  })

  it('cannot book until a slot is chosen', async () => {
    serve()

    renderWithProviders(<CalendlyBookingModal show onClose={vi.fn()} onBooked={vi.fn()} timezone="UTC" />)

    expect(await screen.findByRole('button', { name: /book in calendly/i })).toBeDisabled()
  })

  it('shows Calendly refusing the booking', async () => {
    const user = userEvent.setup()
    serve({ body: { status: false, message: 'The selected time is no longer available.' }, status: 422 })

    renderWithProviders(<CalendlyBookingModal show onClose={vi.fn()} onBooked={vi.fn()} timezone="UTC" />)

    await user.type(await screen.findByLabelText(/^date/i), '2999-06-15')
    await user.click(await screen.findByRole('button', { name: '10:00 AM' }))
    await user.click(screen.getByRole('button', { name: /book in calendly/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('The selected time is no longer available.'))
  })

  it('says so when the day has no open slots', async () => {
    const user = userEvent.setup()
    serve(undefined, [])

    renderWithProviders(<CalendlyBookingModal show onClose={vi.fn()} onBooked={vi.fn()} timezone="UTC" />)

    await user.type(await screen.findByLabelText(/^date/i), '2999-06-15')
    expect(await screen.findByText(/no open times/i)).toBeInTheDocument()
  })
})

// Defect: when Calendly could not be asked for open times (the connection had
// expired), the form said "No open times on this day" - hiding the reason.
describe('CalendlyBookingModal - open times cannot be loaded', () => {
  it('shows why instead of "no open times"', async () => {
    const user = userEvent.setup()
    serve()
    server.use(http.post('*/common/calendly/available-times', () =>
      HttpResponse.json({ status: false, message: 'The Calendly connection has expired. An administrator needs to connect Calendly again.' }, { status: 422 })))

    renderWithProviders(<CalendlyBookingModal show onClose={vi.fn()} onBooked={vi.fn()} timezone="UTC" />)

    await user.type(await screen.findByLabelText(/^date/i), '2999-06-15')
    expect(await screen.findByText(/connection has expired/i)).toBeInTheDocument()
    expect(screen.queryByText(/no open times/i)).not.toBeInTheDocument()
  })
})
