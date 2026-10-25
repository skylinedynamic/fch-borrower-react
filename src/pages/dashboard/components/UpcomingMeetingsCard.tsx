import React from 'react'
import DashboardCard, { EmptyState } from './DashboardCard'
import type { MeetingView } from '../dashboardMappers'

interface UpcomingMeetingsCardProps {
  meetings: MeetingView[]
  onSchedule: () => void
}

export default function UpcomingMeetingsCard({ meetings, onSchedule }: UpcomingMeetingsCardProps) {
  const scheduleButton = (
    <button type="button" className="db-outline-btn" onClick={onSchedule}>
      <i className="ri-calendar-event-line me-1" aria-hidden="true"></i>
      Schedule Meeting
    </button>
  )

  return (
    <DashboardCard widget="meetings" title="Upcoming Meetings" icon="ri-calendar-2-line" tone="info">
      {meetings.length > 0 ? (
        <ul className="db-meetings">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="db-meeting">
              <div className="db-date-tile" aria-hidden="true">
                <span className="db-date-month">{meeting.month}</span>
                <span className="db-date-day">{meeting.date}</span>
              </div>
              <div className="min-w-0 flex-grow-1">
                <div className="db-meeting-title" title={meeting.title}>
                  {meeting.title}
                </div>
                <div className="db-meeting-meta">
                  <i className="ri-time-line" aria-hidden="true"></i> {meeting.day} · {meeting.time} ·{' '}
                  <span className="db-meeting-type">{meeting.type}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="ri-calendar-line"
          title="No Upcoming Meetings"
          message="You don't have any scheduled meetings at the moment."
        />
      )}
      {/* Outside the empty state, so it sits at the card's foot either way. */}
      {scheduleButton}
    </DashboardCard>
  )
}
