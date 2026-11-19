import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import {
  bookCalendlyAppointment,
  fetchCalendlyAvailableTimes,
  fetchCalendlyEventTypes,
  fetchCalendlyStatus,
} from '../../../src/modules/calendly/services'

afterEach(() => server.resetHandlers())

/** The company Calendly account, as the borrower portal books into it. */
describe('calendly services', () => {
  it('fetchCalendlyStatus unwraps the status', async () => {
    server.use(http.get('*/common/calendly/status', () => HttpResponse.json({ status: true, data: { connected: true, can_book: true } })))

    await expect(fetchCalendlyStatus()).resolves.toEqual({ connected: true, can_book: true })
  })

  it('fetchCalendlyEventTypes unwraps the list', async () => {
    server.use(http.get('*/common/calendly/event-types', () => HttpResponse.json({ status: true, data: [{ uri: 'u1', name: '30 Minute Meeting', duration: 30 }] })))

    await expect(fetchCalendlyEventTypes()).resolves.toEqual([{ uri: 'u1', name: '30 Minute Meeting', duration: 30 }])
  })

  it('fetchCalendlyAvailableTimes posts the event type, day and zone', async () => {
    let body: unknown = null
    server.use(http.post('*/common/calendly/available-times', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ status: true, data: [] })
    }))

    await fetchCalendlyAvailableTimes({ event_type_uri: 'u1', date: '2026-11-20', timezone: 'Asia/Dhaka' })

    expect(body).toEqual({ event_type_uri: 'u1', date: '2026-11-20', timezone: 'Asia/Dhaka' })
  })

  it('bookCalendlyAppointment posts the booking', async () => {
    let body: unknown = null
    server.use(http.post('*/common/calendly/book', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ status: true, message: 'Meeting booked in Calendly.', data: { id: 9 } })
    }))

    const response = await bookCalendlyAppointment({ event_type_uri: 'u1', start_time: '2026-11-20T15:00:00Z', timezone: 'UTC' })

    expect(body).toEqual({ event_type_uri: 'u1', start_time: '2026-11-20T15:00:00Z', timezone: 'UTC' })
    expect(response.data.id).toBe(9)
  })
})
