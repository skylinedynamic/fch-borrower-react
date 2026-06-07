import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../../store/auth/authStore'

// Dummy Data mimicking backend Capital Access Resource
const dummyCapitalPrograms = [
  {
    id: 1,
    name: 'Startup Fast Track',
    sub_title: 'Accelerate your early stage business funding',
    target_exposure_min: 5000,
    target_exposure_max: 25000,
    est_timeline_min: 7,
    est_timeline_max: 14,
    approval_probability: 85,
    status: 'Active',
    credit_accounts: [
      { id: 101, issuer: 'Chase', card_name: 'Ink Business Cash', image_url: '/assets/images/fch-logo-ver.png' },
      { id: 102, issuer: 'Amex', card_name: 'Blue Business Plus', image_url: '/assets/images/fch-logo-ver.png' },
      { id: 103, issuer: 'Capital One', card_name: 'Spark Cash Plus', image_url: null },
    ]
  },
  {
    id: 2,
    name: 'Expansion Capital Plus',
    sub_title: 'High limit funding for scaling businesses',
    target_exposure_min: 50000,
    target_exposure_max: 150000,
    est_timeline_min: 14,
    est_timeline_max: 30,
    approval_probability: 70,
    status: 'Active',
    credit_accounts: [
      { id: 201, issuer: 'Amex', card_name: 'Business Platinum', image_url: '/assets/images/fch-logo-ver.png' },
      { id: 202, issuer: 'Chase', card_name: 'Ink Business Preferred', image_url: '/assets/images/fch-logo-ver.png' },
      { id: 203, issuer: 'Bank of America', card_name: 'Business Advantage', image_url: '/assets/images/fch-logo-ver.png' },
      { id: 204, issuer: 'US Bank', card_name: 'Business Leverage', image_url: '/assets/images/fch-logo-ver.png' },
      { id: 205, issuer: 'Wells Fargo', card_name: 'Signify Business Cash', image_url: null },
    ]
  }
];

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function CapitalAccess() {
  const { user } = useAuthStore()
  const isTierLocked = (user?.current_tier ?? 0) < 2

  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch { }
      })
    }
  }, [])

  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* Header Matching Profile Page Style */}
        <div className="text-center my-4">
          <h3 className="mb-1">Capital Access</h3>
          <div className="text-muted mx-auto intro-text">
            <span className="d-block">Discover curated capital programs designed to maximize your funding.</span>
            <span className="d-block">Review target exposures, timelines, and included cards to find your match.</span>
          </div>
        </div>

        <div className="row g-4">
          {isTierLocked ? (
            <div className="col-12 mt-4">
              <div className="no-result-elegant d-flex align-items-center justify-content-center rounded-1 overflow-hidden position-relative bg-white border border-light-subtle shadow-sm" style={{ minHeight: '400px' }}>
                <div className="text-center position-relative z-1 p-4">
                  <div className="mb-4 position-relative d-inline-block">
                    <div className="floating-icon-wrapper rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center shadow-md" style={{ width: '100px', height: '100px' }}>
                      <i className="ri-lock-password-line fs-48 text-warning opacity-75"></i>
                    </div>
                  </div>
                  <h4 className="text-dark mb-2">Tier 0 Completion Required</h4>
                  <p className="text-muted fs-14 mx-auto mb-4 fw-normal lh-base" style={{ maxWidth: '550px' }}>
                    To unlock Capital Access programs, you must first complete the Foundation (Tier 0) requirements.
                    Please visit the Credit Builder guide to track your progress and unlock this feature.
                  </p>
                  <Link to="/credit-builder/guide" className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center mx-auto gap-2 fs-13" style={{ width: 'fit-content' }}>
                    <i className="ri-book-open-line fs-16"></i> Go to Guide
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            dummyCapitalPrograms.map((program) => (
              <div key={program.id} className="col-md-6 col-xl-4">
                <div className="card shadow-sm border-0 h-100 bg-white">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="card-title fw-bold text-dark mb-1 fs-16">{program.name}</h5>
                        <p className="text-muted fs-13 mb-0">{program.sub_title}</p>
                      </div>
                      <span className="badge bg-success-subtle text-success fs-11 px-2 py-1">{program.status}</span>
                    </div>

                    <hr className="border-light opacity-50 my-3" />

                    <div className="row g-2 mb-4">
                      <div className="col-12">
                        <div className="p-2 border border-light rounded-2 bg-light-subtle">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="text-muted fs-12 fw-medium d-flex align-items-center gap-1">
                              <i className="ri-money-dollar-circle-line text-success fs-14"></i> Target Exposure
                            </span>
                            <span className="fw-bold text-dark fs-13">
                              {formatCurrency(program.target_exposure_min)} - {formatCurrency(program.target_exposure_max)}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="text-muted fs-12 fw-medium d-flex align-items-center gap-1">
                              <i className="ri-calendar-todo-line text-primary fs-14"></i> Est. Timeline
                            </span>
                            <span className="fw-bold text-dark fs-13">
                              {program.est_timeline_min} - {program.est_timeline_max} days
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted fs-12 fw-medium d-flex align-items-center gap-1">
                              <i className="ri-percent-line text-warning fs-14"></i> Approval Odds
                            </span>
                            <span className="fw-bold text-dark fs-13">
                              {program.approval_probability}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <p className="text-muted fs-12 fw-medium mb-2">Included Cards ({program.credit_accounts.length})</p>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center position-relative z-1">
                          <div className="d-flex align-items-center" style={{ paddingLeft: '8px' }}>
                            {program.credit_accounts.slice(0, 4).map((acc, idx) => (
                              <div
                                key={idx}
                                className="avatar-group-item"
                                style={{
                                  marginLeft: idx > 0 ? '-14px' : '0',
                                  position: 'static',
                                  zIndex: 10 - idx
                                }}
                              >
                                {acc.image_url ? (
                                  <img
                                    src={acc.image_url}
                                    alt={acc.card_name}
                                    className="rounded border shadow-sm bg-white"
                                    style={{ width: '38px', height: '24px', objectFit: 'contain', padding: '1px', display: 'block', position: 'relative' }}
                                    title={`${acc.issuer} - ${acc.card_name}`}
                                    data-bs-toggle="tooltip"
                                  />
                                ) : (
                                  <div
                                    className="rounded border bg-light text-muted d-flex align-items-center justify-content-center"
                                    style={{ width: '38px', height: '24px', fontSize: '8px', fontWeight: 'bold', position: 'relative' }}
                                    title={`${acc.issuer} - ${acc.card_name}`}
                                    data-bs-toggle="tooltip"
                                  >
                                    Card
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {program.credit_accounts.length > 4 && (
                            <span className="badge bg-light text-muted border border-light-subtle ms-2 fs-10">+{program.credit_accounts.length - 4}</span>
                          )}
                        </div>

                        <button className="btn btn-primary btn-sm px-3 fw-medium">
                          Apply Now <i className="ri-arrow-right-line align-middle ms-1"></i>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
