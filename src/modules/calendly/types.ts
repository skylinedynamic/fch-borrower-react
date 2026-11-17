/**
 * The borrower's partner's Calendly (the host's, a WLP's or a certified
 * partner's), as /common/calendly/status reports it. A borrower books with it
 * as the invitee; they never connect or manage one.
 */
export interface CalendlyStatus {
  /** FCH's Calendly app is set up on the server; false = Calendly is off. */
  configured?: boolean
  connected: boolean
  needs_reconnect?: boolean
  /** Always false for a borrower - the partner's team manages it. */
  can_manage: boolean
  is_host?: boolean
  /** The partner's Calendly is connected: the borrower may book with it. */
  can_book: boolean
  name?: string | null
  scheduling_url?: string | null
}

export interface CalendlyEventType {
  uri: string
  name: string | null
  duration: number
  kind?: string | null
  scheduling_url?: string | null
  /** Where it is held, e.g. outbound_call (a phone call the host makes). */
  location_kind?: string | null
  /** The invitee says where to meet - for a phone call, their number. */
  asks_invitee_location?: boolean
  /** Every place it offers (Calendly's "All options"), to pick from when booking. */
  location_options?: CalendlyLocationOption[]
}

export interface CalendlySlot {
  /** UTC, as sent back when booking. */
  start_time: string
  /** In the viewer's zone, Y-m-d H:i:s. */
  local_time: string
  label: string
}

export interface CalendlyAvailableTimesPayload {
  event_type_uri: string
  date: string
  timezone: string
  assigned_for?: number
}

export interface CalendlyBookingPayload {
  event_type_uri: string
  start_time: string
  timezone: string
  assigned_for?: number
  subject?: string
  description?: string
  meeting_type?: string
  /** Where to meet, when the event type asks the invitee. */
  location?: string
  /** Which of the event type's places (its first when absent). */
  location_kind?: string
}

/** One place an event type offers: Zoom, a phone call, in person, ... */
export interface CalendlyLocationOption {
  kind: string
  label: string
  /** The invitee says where - for a phone call we make, their number. */
  asks_invitee: boolean
}
