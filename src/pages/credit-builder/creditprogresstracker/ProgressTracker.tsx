import React, { useMemo, useState } from 'react'

export default function ProgressTracker() {
  type TierCard = {
    id: number
    title: string
    tier: number
    percent: number
    items: string[]
    status: 'Completed' | 'Active' | 'Pending' | 'Locked'
    badge?: string
  }

  type Task = {
    id: number
    title: string
    desc: string
    tier: number
    priority: 'High' | 'Medium' | 'Low'
    status: 'Pending' | 'Completed'
  }

  const tierCards: TierCard[] = useMemo(() => ([
    { id: 1, title: 'Business Setup & Registration', tier: 0, percent: 100, items: ['Business Bank Account','Business Registration','Business Phone Line','EIN Application'], status: 'Completed', badge: 'Foundation' },
    { id: 2, title: 'Initial Credit Building', tier: 1, percent: 100, items: ['Business Address Verification','Tier1 Vendor Applications','Credit Monitoring Setup','Website Development'], status: 'Active', badge: 'Tier 1' },
    { id: 3, title: 'Credit Profile Enhancement', tier: 2, percent: 75, items: ['Financial Statement Preparation','Additional Vendor Applications','Business Using Optimization','Trade Reference Building'], status: 'Pending', badge: 'Tier 2' },
    { id: 4, title: 'Credit Profile Enhancement', tier: 3, percent: 25, items: ['High-Limit Credit Applications','Business Credit Cards','Equipment Financing'], status: 'Locked', badge: 'Tier 3' },
    { id: 5, title: 'Maximum Credit Potential', tier: 4, percent: 0, items: ['Investment Opportunities','Large Credit Lines','Business Loans'], status: 'Locked', badge: 'Tier 4' },
  ]), [])

  const tasks = useMemo(() => ([
    { id: 1, title: 'Register EIN with IRS', desc: 'Obtain Employer Identification Number for business', tier: 0, priority: 'High', status: 'Completed' },
    { id: 2, title: 'Open Business Bank Account', desc: 'Establish business banking relationship', tier: 0, priority: 'Low', status: 'Completed' },
    { id: 3, title: 'Set up Credit Monitoring', desc: 'Monitor credit reports from NAV, D&B, and Experian', tier: 1, priority: 'High', status: 'Pending' },
    { id: 4, title: 'Apply to Additional Tier 1 Vendors', desc: 'Submit applications to 3 more Tier 1 vendors', tier: 1, priority: 'High', status: 'Pending' },
  ]), []) as Task[]

  const [taskFilter, setTaskFilter] = useState<'All' | 'Pending' | 'Completed'>('All')
  const filteredTasks = tasks.filter(t => taskFilter === 'All' ? true : t.status === taskFilter)

  return (
    <div className="page-content progress-tracker">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="d-flex align-items-center mb-2">
              <div>
                <h4 className="fs-20 mb-1">Credit Progress Tracker</h4>
                <p className="text-muted mb-0">Clean and professional overview of your credit-building journey</p>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="card score-card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between">
                          <div className="me-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="score-icon-circle"><i className="ri-heart-2-line score-icon"></i></span>
                              <div>
                                <div className="score-title">NAV Business Score</div>
                                <div className="score-subtitle">Good Credit Rating</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="score-value">75</div>
                            <div className="score-range-mini">Range: 0–100</div>
                            {/* <div className="score-progress mt-2"><div className="score-progress-bar" style={{ width: '75%' }}></div></div> */}
                          </div>
                        </div>
                        <div className="score-divider"></div>
                        <ul className="list mt-3">
                          <li><span>Payment History</span><span>Excellent</span></li>
                          <li><span>Credit Utilization</span><span>Good</span></li>
                          <li><span>Credit Age</span><span>Fair</span></li>
                        </ul>
                        <div className="score-divider"></div>
                        <div className="score-updated"><i className="ri-checkbox-blank-circle-fill me-1"></i> Updated 2 days ago</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card score-card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between">
                          <div className="me-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="score-icon-circle"><i className="ri-line-chart-line score-icon"></i></span>
                              <div>
                                <div className="score-title">D&B PAYDEX</div>
                                <div className="score-subtitle">Fair Credit Rating</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="score-value">66</div>
                            <div className="score-range-mini">Range: 0–100</div>
                          </div>
                        </div>
                        <div className="score-divider"></div>
                        <ul className="list mt-3">
                          <li><span>Payment Experience</span><span>Good</span></li>
                          <li><span>Financial Stress</span><span>Low</span></li>
                          <li><span>Risk Indicators</span><span>Minimal</span></li>
                        </ul>
                        <div className="score-divider"></div>
                        <div className="score-updated"><i className="ri-checkbox-blank-circle-fill me-1"></i> Updated 1 week ago</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card score-card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between">
                          <div className="me-3">
                            <div className="d-flex align-items-center gap-2">
                              <span className="score-icon-circle"><i className="ri-pulse-line score-icon"></i></span>
                              <div>
                                <div className="score-title">Experian Intelliscore</div>
                                <div className="score-subtitle">Good Credit Rating</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="score-value">73</div>
                            <div className="score-range-mini">Range: 0–100</div>
                          </div>
                        </div>
                        <div className="score-divider"></div>
                        <ul className="list mt-3">
                          <li><span>Business Profile</span><span>Complete</span></li>
                          <li><span>Trade Experiences</span><span>Positive</span></li>
                          <li><span>Public Records</span><span>Clean</span></li>
                        </ul>
                        <div className="score-divider"></div>
                        <div className="score-updated"><i className="ri-checkbox-blank-circle-fill me-1"></i> Updated 3 days ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Tier Progression</h6>
              </div>
              <div className="card-body">
                <div className="progress tp-bar">
                  <div className="progress-bar tp-fill" style={{ width: '35%' }}></div>
                </div>
                <div className="d-flex justify-content-between mt-2 text-muted">
                  <span>Tier 0</span>
                  <span>Tier 1</span>
                  <span>Tier 2</span>
                  <span>Tier 3</span>
                  <span>Tier 4</span>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Tier Milestones</h6>
              </div>
              <div className="card-body">
                <div className="vendor-grid">
                  {tierCards.map((c) => (
                    <div
                      key={c.id}
                      className={`vendor-card tier-card ${c.status==='Completed'?'tier-completed':c.status==='Active'?'tier-active':c.status==='Pending'?'tier-pending':'tier-locked'}`}
                    >
                      <div className="vendor-card-header">
                        <span className="tier-badge">{c.badge || `Tier ${c.tier}`}</span>
                        <span className="percent">{c.percent}%</span>
                      </div>
                      <div className="vendor-card-body">
                        <div className="vc-title">{c.title}</div>
                        <div className="tier-progress mt-2"><div className="tier-progress-fill" style={{ width: `${c.percent}%` }}></div></div>
                        <ul className="tier-list mt-2">
                          {c.items.map((x, i) => (
                            <li key={i}><span className={`dot ${c.status==='Completed' || c.status==='Active' ? 'dot-green' : 'dot-orange'}`}></span><span>{x}</span></li>
                          ))}
                        </ul>
                        <div className={`tier-footer ${c.status==='Completed'?'footer-completed':c.status==='Active'?'footer-active':c.status==='Pending'?'footer-pending':'footer-locked'}`}>{c.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Current Tasks</h6>
                <div className="btn-group" role="group">
                  <button type="button" className={`btn btn-outline-primary ${taskFilter==='All'?'active':''}`} onClick={()=>setTaskFilter('All')}>All</button>
                  <button type="button" className={`btn btn-outline-primary ${taskFilter==='Pending'?'active':''}`} onClick={()=>setTaskFilter('Pending')}>Pending</button>
                  <button type="button" className={`btn btn-outline-primary ${taskFilter==='Completed'?'active':''}`} onClick={()=>setTaskFilter('Completed')}>Completed</button>
                </div>
              </div>
              <div className="card-body">
                <div className="tasks-grid">
                  {filteredTasks.map(t => (
                    <div key={t.id} className="task-card">
                      <div className="task-top">
                        <div className="left">
                          <div className="task-title">{t.title}</div>
                          <div className="task-desc">{t.desc}</div>
                          <div className="task-meta">
                            <span className="badge bg-light text-dark me-2">Tier {t.tier}</span>
                            <span className={`badge ${t.priority==='High'?'bg-warning text-light':'bg-info text-light'}`}>{t.priority} Priority</span>
                          </div>
                        </div>
                        <div className="right">
                          <button type="button" className="btn btn-sm btn-primary">Start</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

