import React from 'react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/**
 * The tone of a status from the Bootstrap badge classes the status maps use
 * (FUNDING_APPLICATION_STATUS_CLASS_MAP and the like), so one map keeps
 * deciding the colour.
 */
export const toneFromBadgeClass = (className: string): StatusTone => {
  if (/\bdanger\b|-danger\b/.test(className)) return 'danger'
  if (/warning/.test(className)) return 'warning'
  if (/success/.test(className)) return 'success'
  if (/info|primary/.test(className)) return 'info'
  return 'neutral'
}

/** The status on a detail hero: a coloured dot and the status. */
export default function StatusChip({ status, tone }: { status: string; tone: StatusTone }) {
  return (
    <span className={`ma-status-chip is-${tone}`} aria-label={`Status: ${status}`}>
      <span className="ma-status-dot" aria-hidden="true"></span>
      <span>{status}</span>
    </span>
  )
}
