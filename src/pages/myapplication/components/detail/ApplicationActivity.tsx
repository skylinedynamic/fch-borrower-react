import React, { useMemo, useState } from 'react'
import { useBorrowerActivityLogs, type ActivityLog } from '../../../../modules/activity-log'

type Tone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'

/** The icon and tone for an activity, from its log type. */
const activityLook = (log: ActivityLog): { icon: string; tone: Tone } => {
  const type = String(log.log_type_raw || '').toLowerCase()
  const label = String(log.event_label || '').toLowerCase()

  if (type.includes('reject') || type.includes('fail') || type.includes('decline') || label.includes('denied')) return { icon: 'ri-close-circle-line', tone: 'danger' }
  if (type.includes('approve') || type.includes('accept') || label.includes('approve')) return { icon: 'ri-checkbox-circle-line', tone: 'success' }
  if (type.includes('status')) return { icon: 'ri-arrow-left-right-line', tone: 'warning' }
  if (label.includes('signature')) return { icon: 'ri-quill-pen-line', tone: 'success' }
  if (type.includes('submit') || label.includes('submitted')) return { icon: 'ri-send-plane-line', tone: 'info' }
  if (type.includes('create') || label.includes('generated') || label.includes('created')) return { icon: 'ri-file-add-line', tone: 'info' }
  if (type.includes('document') || type.includes('upload')) return { icon: 'ri-folder-upload-line', tone: 'info' }
  if (type.includes('comment')) return { icon: 'ri-chat-3-line', tone: 'neutral' }
  if (type.includes('email')) return { icon: 'ri-mail-send-line', tone: 'neutral' }
  return { icon: 'ri-time-line', tone: 'neutral' }
}

/**
 * A status change in "<prefix> Status Changed: A → B" form (or carried in the
 * log's values), split into its parts; null for any other activity.
 */
const statusChange = (log: ActivityLog): { title: string; from?: string; to: string } | null => {
  const label = log.event_label || log.log_type || ''
  const marker = label.match(/Status Changed:?/)
  if (marker && marker.index !== undefined) {
    const title = label.slice(0, marker.index + marker[0].length).replace(/:$/, '').trim()
    const rest = label.slice(marker.index + marker[0].length).trim()
    const [from, to] = rest.split(/\s*(?:→|->)\s*/)
    if (to) return { title, from, to }
    if (rest) return { title, to: rest }
  }

  const to = log.status || log.properties?.status
  const from = log.old_values?.status || log.properties?.old?.status
  if (/Status (Updated|Changed)/.test(label) && to) return { title: label, from: from || undefined, to }
  return null
}

const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

function ActivityItem({ log }: { log: ActivityLog }) {
  const [open, setOpen] = useState(false)
  const { icon, tone } = activityLook(log)
  const change = statusChange(log)
  const detailsId = `ma-activity-details-${log.id}`

  return (
    <li className="ma-activity-item">
      <span className={`ma-activity-icon is-${tone}`} aria-hidden="true"><i className={icon}></i></span>
      <div className="ma-activity-main">
        <p className="ma-activity-title">{change ? change.title : log.event_label || log.log_type || 'Activity'}</p>

        {change && (
          <span
            className="ma-activity-change"
            aria-label={change.from ? `Status changed from ${change.from} to ${change.to}` : `Status changed to ${change.to}`}
          >
            {change.from && <span className="ma-activity-status is-from">{change.from}</span>}
            {change.from && <i className="ri-arrow-right-line" aria-hidden="true"></i>}
            <span className="ma-activity-status is-to">{change.to}</span>
          </span>
        )}

        <span className="ma-activity-meta">
          <time dateTime={log.created_at}>{timeOf(log.created_at)}</time>
          {log.causer_name && <span>by {log.causer_name}</span>}
        </span>

        {log.description && (
          <>
            <button
              type="button"
              className="ma-activity-toggle"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={detailsId}
            >
              {open ? 'Hide details' : 'Show details'}
              <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line`} aria-hidden="true"></i>
            </button>
            {open && (
              // The description is HTML written by the server for this log.
              <div id={detailsId} className="ma-activity-details" dangerouslySetInnerHTML={{ __html: log.description }} />
            )}
          </>
        )}
      </div>
    </li>
  )
}

/** The Activity panel beside a funding application: a timeline, newest first, grouped by day. */
export default function ApplicationActivity({ fundingApplicationId }: { fundingApplicationId?: number | string }) {
  // include_client_notes: also the notes added on the client's own page with
  // visibility "Everyone" (BUG-103) - the server decides which.
  const { data: logs = [], isLoading } = useBorrowerActivityLogs({ funding_application_id: fundingApplicationId, include_client_notes: true, page: 1, limit: 50 })

  const days = useMemo(() => {
    const groups: { day: string; logs: ActivityLog[] }[] = []
    for (const log of logs) {
      const day = dayOf(log.created_at)
      const last = groups[groups.length - 1]
      if (last && last.day === day) last.logs.push(log)
      else groups.push({ day, logs: [log] })
    }
    return groups
  }, [logs])

  return (
    <section className="ma-card ma-activity activity-sidebar-sticky sticky-top" aria-labelledby="ma-activity-title">
      <header className="ma-card-head">
        <span className="ma-card-icon" aria-hidden="true"><i className="ri-history-line"></i></span>
        <div className="min-w-0">
          <h5 id="ma-activity-title" className="ma-card-title">Activity</h5>
          <p className="ma-card-subtitle">Every step of this application</p>
        </div>
        {!isLoading && logs.length > 0 && <span className="ma-card-count">{logs.length}</span>}
      </header>

      <div className="ma-activity-body">
        {isLoading ? (
          <ul className="ma-activity-list" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <li key={i} className="ma-activity-item">
                <span className="ma-activity-icon skeleton-shimmer"></span>
                <div className="ma-activity-main">
                  <span className="skeleton-shimmer d-block rounded mb-2" style={{ width: '80%', height: 14 }}></span>
                  <span className="skeleton-shimmer d-block rounded" style={{ width: '40%', height: 12 }}></span>
                </div>
              </li>
            ))}
          </ul>
        ) : logs.length === 0 ? (
          <div className="ma-empty">
            <span className="ma-empty-icon" aria-hidden="true"><i className="ri-history-line"></i></span>
            <p className="ma-empty-title">No activity yet</p>
            <p className="ma-empty-text">Updates to this application will appear here.</p>
          </div>
        ) : (
          days.map(({ day, logs: dayLogs }) => (
            <div key={day} className="ma-activity-day">
              <h6 className="ma-activity-day-title">{day}</h6>
              <ul className="ma-activity-list">
                {dayLogs.map((log) => <ActivityItem key={log.id} log={log} />)}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
