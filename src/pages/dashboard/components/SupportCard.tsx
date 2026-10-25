import React from 'react'

/** Full-width call to action at the foot of the dashboard: book time with the team. */
export default function SupportCard({ onContact }: { onContact: () => void }) {
  return (
    <section className="db-support" data-widget="support" aria-labelledby="db-support-title">
      <span className="db-support-icon" aria-hidden="true">
        <i className="ri-customer-service-2-line"></i>
      </span>
      <div className="db-support-text-wrap">
        <h2 id="db-support-title" className="db-support-title">
          Need Help?
        </h2>
        <p className="db-support-text">Contact our support team for any queries regarding your applications.</p>
      </div>
      <button type="button" className="db-support-btn" onClick={onContact}>
        <i className="ri-calendar-event-line" aria-hidden="true"></i>
        Make an Appointment
      </button>
    </section>
  )
}
