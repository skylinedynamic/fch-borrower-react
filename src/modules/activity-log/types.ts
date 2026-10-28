/** One entry in a borrower's activity log, as /borrower/activity-logs/fetch-all-activities sends it. */
export interface ActivityLog {
  id: number
  event_label?: string | null
  log_type?: string | null
  log_type_raw?: string | null
  status?: string | null
  old_values?: { status?: string | null } | null
  properties?: { status?: string | null; old?: { status?: string | null } | null } | null
  /** HTML written by the server. */
  description?: string | null
  causer_name?: string | null
  created_at: string
}

export interface ActivityLogParams {
  funding_request_id?: number | string
  funding_application_id?: number | string
  pre_qualification_id?: number | string
  /** Also the client's own notes with visibility "Everyone" (BUG-103). */
  include_client_notes?: boolean
  page?: number
  limit?: number
}
