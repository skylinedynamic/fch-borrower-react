import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdvisor } from '../../../modules/my-application'
import AdvisorLoader from '../../../components/Loader/AdvisorLoader'
import avatarImg from '../../../../assets/images/users/user-dummy-img.jpg'

/**
 * The client's advisor beside the lists: who they are, how to reach them and
 * a way to book a meeting. Collapsible below 1400px, where it sits above the
 * lists as a one-row strip. (The "Ad space" placeholder that sat under it is gone - BUG-086.)
 */
export default function RightSideSection() {
  const [open, setOpen] = useState(true)
  const { data: advisorData, isLoading } = useAdvisor()
  const advisor = advisorData?.data

  return (
    <section className="ma-card ma-advisor" aria-labelledby="ma-advisor-title">
      <button
        type="button"
        className="ma-card-head ma-advisor-toggle"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls="ma-advisor-body"
      >
        <span className="ma-card-icon" aria-hidden="true"><i className="ri-user-star-line"></i></span>
        <span className="min-w-0">
          <span id="ma-advisor-title" className="ma-card-title d-block">Your Advisor</span>
          <span className="ma-card-subtitle d-block">Here to guide your funding plan</span>
        </span>
        <i className={`ri-arrow-down-s-line ma-advisor-caret d-xxl-none ${open ? 'is-open' : ''}`} aria-hidden="true"></i>
      </button>

      <div id="ma-advisor-body" className={`ma-advisor-body ${open ? '' : 'd-none d-xxl-block'}`}>
        {isLoading ? (
          <AdvisorLoader />
        ) : !advisor ? (
          <p className="ma-advisor-empty mb-0">No advisor has been assigned yet.</p>
        ) : (
          <>
            <div className="ma-advisor-person">
              <img src={advisor.avatar || avatarImg} alt="" className="ma-advisor-avatar" />
              <div className="min-w-0">
                <div className="ma-advisor-name">{advisor.name || 'Advisor'}</div>
                <div className="ma-advisor-role">Funding Strategy Advisor</div>
              </div>
            </div>
            <ul className="ma-advisor-contacts">
              {advisor.phone && (
                <li><span><i className="ri-phone-line" aria-hidden="true"></i><span className="ma-advisor-contact-text">{advisor.phone}</span></span></li>
              )}
              {advisor.email && (
                <li><span title={advisor.email}><i className="ri-mail-line" aria-hidden="true"></i><span className="ma-advisor-contact-text">{advisor.email}</span></span></li>
              )}
            </ul>
            <Link to="/appointment" className="btn primary-btn ma-advisor-cta d-flex align-items-center justify-content-center gap-2">
              <i className="ri-calendar-event-line" aria-hidden="true"></i>Schedule a Meeting
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
