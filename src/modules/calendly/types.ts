/**
 * The borrower's Calendly, as /common/calendly/status reports it: their own -
 * connected through their partner's Calendly app - and the one they book with
 * (their own once connected, else their partner's, as the invitee).
 */
export interface CalendlyStatus {
  /** Their partner's Calendly app is set up: they may connect their own through it. */
  configured?: boolean
  /** Their own Calendly is connected. */
  connected: boolean
  /** Their own Calendly's sign-in expired - connect again. */
  needs_reconnect?: boolean
  /** May connect / disconnect their own Calendly. */
  can_manage: boolean
  /** Books in their own Calendly, inviting the person they pick. */
  is_host?: boolean
  /** The partner's Calendly is connected: the borrower may book with it. */
  can_book: boolean
  /** Connected: the borrower may bring in its meetings now (Sync now). */
  can_sync?: boolean
  /** Not connected themselves: they book with their partner's Calendly, as the invitee. */
  books_with_partner?: boolean
  /** Their partner's Calendly is connected. */
  partner_connected?: boolean
  /** The advisor's Calendly account they book with until they connect their own. */
  partner_name?: string | null
  /** Their own Calendly account. */
  name?: string | null
  email?: string | null
  scheduling_url?: string | null
  webhooks_active?: boolean
  last_synced_at?: string | null
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
