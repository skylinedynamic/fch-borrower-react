import { apiClient } from '../../lib/http/apiClient'
import type { CreateAppointmentResponse } from '../appointment/types'
import type {
  CalendlyAvailableTimesPayload,
  CalendlyBookingPayload,
  CalendlyEventType,
  CalendlySlot,
  CalendlyStatus,
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
