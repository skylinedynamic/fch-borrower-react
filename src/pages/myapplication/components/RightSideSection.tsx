import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdvisor } from '../../../modules/my-application'
import avatarImg from '../../../../assets/images/users/cr.jpg'

interface RightSideSectionProps {
  loading: boolean
}

export default function RightSideSection({ loading }: RightSideSectionProps) {
  const [advisorOpen, setAdvisorOpen] = useState(true)
  const { data: advisorData, isLoading: advisorLoading } = useAdvisor()
  const advisor = advisorData?.data

  const isLoading = loading || advisorLoading

  return (
    <>
      <div className="card advisor-card app-card mb-0 mb-xl-3">
        <div className="card-header d-flex align-items-center justify-content-between advisor-toggle" onClick={() => setAdvisorOpen((s) => !s)}>
          <span className="card-title fw-semibold">Your Advisor</span>
          <i className={`ri-arrow-down-s-line caret d-xl-none ${advisorOpen ? 'open' : ''}`}></i>
        </div>
        <div className={`card-body ${advisorOpen ? '' : 'd-none d-xl-block'}`}>
          {isLoading ? (
            <div>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="skeleton-circle" style={{ width: 64, height: 64 }}></div>
                <div className="flex-grow-1">
                  <div className="skeleton-line w-50 mb-1"></div>
                  <div className="skeleton-line w-75"></div>
                </div>
              </div>
              <div className="d-flex flex-column gap-2 mb-3">
                <div className="skeleton-line w-100" style={{ height: 36, borderRadius: 12 }}></div>
                <div className="skeleton-line w-100" style={{ height: 36, borderRadius: 12 }}></div>
                <div className="skeleton-line w-100" style={{ height: 36, borderRadius: 12 }}></div>
              </div>
              <div className="skeleton-line w-100" style={{ height: 38, borderRadius: 10 }}></div>
            </div>
          ) : (
            <>
              <div className="advisor-media d-flex align-items-center gap-3 mb-2">
                <img 
                  src={advisor?.avatar || avatarImg} 
                  alt="Advisor" 
                  className="advisor-avatar-lg rounded-circle" 
                />
                <div>
                  <div className="advisor-name">{advisor?.name || 'Advisor'}</div>
                  <div className="advisor-role text-muted">Financial Advisor</div>
                </div>
              </div>
              <div className="advisor-list d-flex flex-column gap-2 mb-3">
                {advisor?.phone && (
                  <div className="item d-flex align-items-center gap-2"><span className="icon-circle"><i className="ri-phone-line"></i></span><span>{advisor.phone}</span></div>
                )}
                <div className="item d-flex align-items-center gap-2"><span className="icon-circle"><i className="ri-mail-line"></i></span><span>{advisor?.email || 'N/A'}</span></div>
                <div className="item d-flex align-items-center gap-2"><span className="icon-circle"><i className="ri-time-line"></i></span><span>Available Mon-Fri 9–5 EST</span></div>
              </div>
              <div className="advisor-cta">
                <Link to="/under-construction/schedule-call" className="btn primary-btn w-100">Schedule Call</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card app-card mt-3 ad-card d-none d-xl-block">
        <div className="card-header">
          <span className="card-title fw-semibold">Advertisements</span>
        </div>
        <div className="card-body d-flex align-items-center justify-content-center">
          <div className="ad-placeholder">Ad space</div>
        </div>
      </div>
    </>
  )
}
