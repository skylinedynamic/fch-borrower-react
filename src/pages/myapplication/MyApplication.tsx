import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import avatarImg from '../../../assets/images/users/cr.jpg'

export default function MyApplication() {
  const prequalRows = [
    { type: 'Working Capital', business: 'Holdings.llc', industry: 'Accounting & Finance', date: '6-Sept-25', amount: '$45,000.00', status: 'Submitted' },
    { type: 'Inventory', business: 'Four Corner', industry: 'Accounting & Finance', date: '10-Oct-25', amount: '$56,000.00', status: 'Intake Received' },
    { type: 'Marketing', business: 'Amazon', industry: 'E-Commerce/Online Retail', date: '21-Sept-25', amount: '$10,000.00', status: 'Submitted' },
    { type: 'Other', business: 'Apple', industry: 'IT & Software Development', date: '28-Nov-25', amount: '$80,000.00', status: 'Submitted' },
  ]

  const fundingRows = [
    { type: 'Working Capital', entity: 'Private Corporation', inc: 'Alabama (AL)', date: '6-Sept-25', amount: '$45,000.00', status: 'Submitted' },
    { type: 'Inventory', entity: 'Franchise', inc: 'Alaska (AK)', date: '10-Oct-25', amount: '$56,000.00', status: 'Intake Received' },
    { type: 'Marketing', entity: 'Corporation (S-Corp)', inc: 'Florida (FL)', date: '21-Sept-25', amount: '$10,000.00', status: 'Submitted' },
    { type: 'Other', entity: 'Joint venture', inc: 'Michigan (MI)', date: '28-Nov-25', amount: '$80,000.00', status: 'Submitted' },
  ]
  const [advisorOpen, setAdvisorOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  const statusClass = (s: string) =>
    s === 'Submitted' ? 'badge rounded-pill bg-success-subtle text-success' : 'badge rounded-pill bg-warning-subtle text-warning'

  return (
    <div className="page-content myapplications-page">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-1">My Applications</h4>
            <div className="text-muted">Track your funding applications and their current status</div>
          </div>
          <Link to="/pre-qualification" className="btn primary-btn">Apply New Prequalification</Link>
        </div>

        <div className="row g-4">
          <div className="col-xl-8 col-xxl-9 order-2 order-xl-1">
            <div className="card section-card app-card mb-0">
              <div className="card-header d-flex align-items-center gap-2">
                <i className="ri-flag-2-line text-warning"></i>
                <span className="card-title fw-semibold">Prequalification Requests</span>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle table-hover table-striped">
                    <thead>
                      <tr>
                        <th>Funding Type</th>
                        <th>Business Name</th>
                        <th>Industry</th>
                        <th>Date</th>
                        <th>Requested Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    {loading ? (
                      <tbody>
                        {[1,2,3,4].map((i) => (
                          <tr key={i}>
                            <td><div className="skeleton-line w-75"></div></td>
                            <td><div className="skeleton-line w-50"></div></td>
                            <td><div className="skeleton-line w-60"></div></td>
                            <td><div className="skeleton-line w-40"></div></td>
                            <td><div className="skeleton-line w-50"></div></td>
                            <td><div className="skeleton-line w-30"></div></td>
                          </tr>
                        ))}
                      </tbody>
                    ) : (
                      <tbody>
                        {prequalRows.map((r) => (
                          <tr key={`${r.type}-${r.business}-${r.date}`}>
                            <td>{r.type}</td>
                            <td className="fw-semibold">{r.business}</td>
                            <td>{r.industry}</td>
                            <td>{r.date}</td>
                            <td>{r.amount}</td>
                            <td><span className={statusClass(r.status)}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>

            <div className="card section-card app-card mt-3">
              <div className="card-header d-flex align-items-center gap-2">
                <i className="ri-bank-card-line text-warning"></i>
                <span className="card-title fw-semibold">Funding Applications</span>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle table-hover table-striped">
                    <thead>
                      <tr>
                        <th className="text-center"></th>
                        <th>Funding Type</th>
                        <th>Entity Type</th>
                        <th>Incorporation</th>
                        <th>Date</th>
                        <th>Requested Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    {loading ? (
                      <tbody>
                        {[1,2,3,4].map((i) => (
                          <tr key={i}>
                            <td className="text-center"><div className="skeleton-circle small-circle"></div></td>
                            <td><div className="skeleton-line w-75"></div></td>
                            <td><div className="skeleton-line w-60"></div></td>
                            <td><div className="skeleton-line w-50"></div></td>
                            <td><div className="skeleton-line w-40"></div></td>
                            <td><div className="skeleton-line w-50"></div></td>
                            <td><div className="skeleton-line w-30"></div></td>
                          </tr>
                        ))}
                      </tbody>
                    ) : (
                      <tbody>
                        {fundingRows.map((r) => (
                          <tr key={`${r.type}-${r.entity}-${r.date}`}>
                            <td className="text-center"><input type="checkbox" className="form-check-input" aria-label="Select row" /></td>
                            <td>{r.type}</td>
                            <td>{r.entity}</td>
                            <td>{r.inc}</td>
                            <td>{r.date}</td>
                            <td>{r.amount}</td>
                            <td><span className={statusClass(r.status)}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-xxl-3 order-1 order-xl-2">
            <div className="card advisor-card app-card mb-0 mb-xl-3">
              <div className="card-header d-flex align-items-center justify-content-between advisor-toggle" onClick={() => setAdvisorOpen((s) => !s)}>
                <span className="card-title fw-semibold">Your Advisor</span>
                <i className={`ri-arrow-down-s-line caret d-xl-none ${advisorOpen ? 'open' : ''}`}></i>
              </div>
              <div className={`card-body ${advisorOpen ? '' : 'd-none d-xl-block'}`}>
                {loading ? (
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
                      <img src={avatarImg} alt="Advisor" className="advisor-avatar-lg rounded-circle" />
                      <div>
                        <div className="advisor-name">Craig Rice</div>
                        <div className="advisor-role text-muted">Founder & Managing Partner</div>
                      </div>
                    </div>
                    <div className="advisor-list d-flex flex-column gap-2 mb-3">
                      <div className="item d-flex align-items-center gap-2"><span className="icon-circle"><i className="ri-phone-line"></i></span><span>+1 (813) 391-3333</span></div>
                      <div className="item d-flex align-items-center gap-2"><span className="icon-circle"><i className="ri-mail-line"></i></span><span>craig@fourcornerholdings.com</span></div>
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
          </div>

          <div className="col-12 d-xl-none order-3">
            <div className="card app-card mt-0 ad-card">
              <div className="card-header">
                <span className="card-title fw-semibold">Advertisements</span>
              </div>
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="ad-placeholder">Ad space</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

