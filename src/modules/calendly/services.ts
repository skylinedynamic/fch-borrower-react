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
 * The company Calendly account, as a borrower uses it: whether it is on, its
 * event types and open slots, and booking a slot with the host. Connecting it
 * is done in the partner portal.
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
