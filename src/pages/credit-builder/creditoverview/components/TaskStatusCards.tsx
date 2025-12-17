import React from 'react'

export default function TaskStatusCards() {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="panel panel--pending h-100">
              <div className="panel-header"><div className="panel-title"><span className="icon-badge icon-badge--pending"><i className="ri-time-line"></i></span><span>Pending Tasks</span></div><span className="text-muted">0 remaining</span></div>
              <div className="panel-body">
                <div className="task"><div className="title d-flex justify-content-between"><span>Apply to Tier 1 Vendors</span><span className="pill pill-high">High Priority</span></div></div>
                <div className="task"><div className="title d-flex justify-content-between"><span>Set up 411 Listing</span><span className="pill pill-medium">Medium Priority</span></div></div>
                <div className="task"><div className="title d-flex justify-content-between"><span>Virtual Office Setup</span><span className="pill pill-medium">Medium Priority</span></div></div>
                <div className="mt-3"><button type="button" className="btn btn-primary w-100">Start Next Task</button></div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel panel--completed h-100">
              <div className="panel-header"><div className="panel-title"><span className="icon-badge icon-badge--completed"><i className="ri-checkbox-circle-line"></i></span><span>Completed Tasks</span></div><span className="text-muted">6 / 6 total</span></div>
              <div className="panel-body">
                <div className="completed-scroll">
                  <div className="task">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="task-check"><span className="tick tick-complete"><i className="ri-check-line"></i></span><div><div className="title">Business Registration</div><div className="text-muted">Complete this task to advance your business credit profile</div></div></div>
                      <div className="status-complete">Complete</div>
                    </div>
                    <div className="mt-2"><span className="pill pill-foundation">Foundation</span><span className="pill pill-high">High</span></div>
                  </div>
                  <div className="task">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="task-check"><span className="tick tick-complete"><i className="ri-check-line"></i></span><div><div className="title">EIN Application</div><div className="text-muted">Complete this task to advance your business credit profile</div></div></div>
                      <div className="status-complete">Complete</div>
                    </div>
                    <div className="mt-2"><span className="pill pill-foundation">Foundation</span><span className="pill pill-medium">Medium</span></div>
                  </div>
                  <div className="task">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="task-check"><span className="tick tick-complete"><i className="ri-check-line"></i></span><div><div className="title">EIN Application</div><div className="text-muted">Complete this task to advance your business credit profile</div></div></div>
                      <div className="status-complete">Complete</div>
                    </div>
                    <div className="mt-2"><span className="pill pill-foundation">Foundation</span><span className="pill pill-medium">Medium</span></div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="progress progress-goldnavy" style={{ height: 10 }}><div className="progress-bar progress-animated" style={{ width: '60%' }}></div></div>
                  <div className="text-muted mt-1">60% of Tier 1 tasks complete</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel panel--score h-100">
              <div className="panel-header"><div className="panel-title"><span className="icon-badge icon-badge--score"><i className="ri-line-chart-line"></i></span><span>Credit Score Status</span></div><span className="text-muted">75 D&B Score</span></div>
              <div className="panel-body">
                <div className="task"><div className="d-flex justify-content-between"><span>Experian:</span><span className="text-muted">Building…</span></div></div>
                <div className="task"><div className="d-flex justify-content-between"><span>Equifax:</span><span className="text-muted">Building…</span></div></div>
                <div className="task"><div className="d-flex justify-content-between"><span>NAV:</span><span className="text-muted">Pending</span></div></div>
                <div className="alert alert-success mt-3 mb-0"><i className="ri-arrow-up-line align-middle me-1"></i>Building credit profile</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
