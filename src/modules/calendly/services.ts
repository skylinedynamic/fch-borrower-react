import { apiClient } from '../../lib/http/apiClient'
import type { CreateAppointmentResponse } from '../appointment/types'
import type {
  CalendlyAvailableTimesPayload,
  CalendlyBookingPayload,
  CalendlyEventType,
  CalendlySlot,
  CalendlyStatus,
  CalendlySyncDates,
  CalendlySyncDirection,
  CalendlySyncResult,
} from './types'

/**
 * The borrower's partner's Calendly (the host's, a WLP's or a certified
 * partner's): whether it is on, its event types and open slots, and booking
 * with it as the invitee. The partner's team connects it in the partner portal.
 */
export const fetchCalendlyStatus = async (): Promise<CalendlyStatus> => {
  const { data } = await apiClient.get('/common/calendly/status')
  return data.data
}

/** Connect Calendly: the Calendly sign-in page for the borrower's own Calendly (through their partner's app). */
export const connectCalendly = async (): Promise<string> => {
  const { data } = await apiClient.post('/common/calendly/connect')
  return data.data.url
}

/** Ends the sign-in of the borrower's own Calendly; meetings already brought in stay. */
export const disconnectCalendly = async (): Promise<void> => {
  await apiClient.delete('/common/calendly/connection')
}

/** Brings in the meetings of the Calendly they book with (their own, else their partner's); returns how many. */
export const syncCalendly = async (): Promise<number> => {
  const { data } = await apiClient.post('/common/calendly/sync')
  return data.data?.synced ?? 0
}

/**
 * Sync now, the way picked - pull (Calendly into FCH, and meetings set with
 * them into their Calendly), push (the meetings they set into Calendly) or
 * both - for the dates the calendar shows (none = this month).
 */
export const syncCalendlyDirected = async (direction: CalendlySyncDirection, dates?: CalendlySyncDates | null): Promise<CalendlySyncResult> => {
  const { data } = await apiClient.post('/common/calendly/sync', {
    direction,
    ...(dates ? { from: dates.from, to: dates.to } : {}),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  return data.data
}

export const fetchCalendlyEventTypes = async (): Promise<CalendlyEventType[]> => {
  const { data } = await apiClient.get('/common/calendly/event-types')
  return data.data ?? []
}

export const fetchCalendlyAvailableTimes = async (payload: CalendlyAvailableTimesPayload): Promise<CalendlySlot[]> => {
  const { data } = await apiClient.post('/common/calendly/available-times', payload)
  return data.data ?? []
}

export const bookCalendlyAppointment = async (payload: CalendlyBookingPayload): Promise<CreateAppointmentResponse> => {
  const { data } = await apiClient.post('/common/calendly/book', payload)
  return data
}
