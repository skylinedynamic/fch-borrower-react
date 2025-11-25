import React from 'react'
import overviewImg from '../../../assets/images/blog/overview.jpg'

export default function CreditOverview() {
  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <div>
                <h4 className="fs-20 mb-1 align-center">Credit Building Overview</h4>
                <p className="text-muted mb-0 align-center">Tracks your business credit journey from startup to mature credit profile</p>
              </div>

            </div>
          </div>
          <div className="col-xl-9">
            <div className="card mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary-subtle text-primary">Tier 1</span>
                        <span className="badge bg-info-subtle text-info">Tier 2</span>
                        <span className="badge bg-warning-subtle text-warning">Tier 3</span>
                        <span className="badge bg-dark-subtle text-dark">Tier 4</span>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success-subtle text-success">100% Complete</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="alert alert-secondary mb-0" role="alert">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <div className="fw-semibold mb-1">Tier 1 • Initial Credit</div>
                          <div className="text-muted">Lay the groundwork for fundability. This phase ensures your business is properly formed, verified, and listed including EIN registration, business phone, 411 listing, professional email, and virtual address setup.</div>
                        </div>
                        <span className="badge bg-success-subtle text-success">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center"><h6 className="mb-0">Pending Tasks</h6><span className="text-muted">0 remaining</span></div>
                  <div className="card-body">
                    <div className="list-group">
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Apply to Tier 1 Vendors</span><span className="badge bg-danger-subtle text-danger">High Priority</span></div>
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Set up 411 Listing</span><span className="badge bg-warning-subtle text-warning">Medium Priority</span></div>
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Virtual Office Setup</span><span className="badge bg-info-subtle text-info">Low Priority</span></div>
                    </div>
                    <div className="mt-3"><button type="button" className="btn btn-primary w-100">Start Next Task</button></div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center"><h6 className="mb-0">Completed Tasks</h6><span className="text-muted">6 of 6</span></div>
                  <div className="card-body">
                    <div className="list-group">
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Business Registration</span><span className="badge bg-success-subtle text-success">Complete</span></div>
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>EIN Application</span><span className="badge bg-success-subtle text-success">Complete</span></div>
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Business Bank Account</span><span className="badge bg-success-subtle text-success">Complete</span></div>
                    </div>
                    <div className="mt-3"><div className="progress" style={{height:8}}><div className="progress-bar bg-success" style={{width:'100%'}}></div></div></div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center"><h6 className="mb-0">Credit Score Status</h6><span className="text-muted">75 D&B Score</span></div>
                  <div className="card-body">
                    <div className="list-group">
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Experian</span><span className="text-muted">Building…</span></div>
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>Equifax</span><span className="text-muted">Building…</span></div>
                      <div className="list-group-item d-flex justify-content-between align-items-center"><span>NAF</span><span className="text-muted">Pending</span></div>
                    </div>
                    <div className="alert alert-success mt-3 mb-0">Building credit profile</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3">
            <div className="card mb-3">
              <div className="card-header"><h6 className="mb-0">Recent Activity</h6></div>
              <div className="card-body">
                <div className="list-group">
                  <div className="list-group-item"><div className="d-flex justify-content-between"><span>Business Bank Account Opened</span><span className="badge bg-warning-subtle text-warning">In progress</span></div><small className="text-muted">1 day ago</small></div>
                  <div className="list-group-item"><div className="d-flex justify-content-between"><span>Vendor Application Approved</span><span className="badge bg-success-subtle text-success">Done</span></div><small className="text-muted">3 days ago</small></div>
                  <div className="list-group-item"><div className="d-flex justify-content-between"><span>Credit Report Monitoring</span><span className="badge bg-info-subtle text-info">Active</span></div><small className="text-muted">1 week ago</small></div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Recommended Actions</h6></div>
              <div className="card-body">
                <div className="list-group">
                  <div className="list-group-item d-flex justify-content-between align-items-center"><span>Apply to Tier 2 Vendors</span><button type="button" className="btn btn-sm btn-primary">Start Now</button></div>
                  <div className="list-group-item d-flex justify-content-between align-items-center"><span>Set Up Business Phone</span><button type="button" className="btn btn-sm btn-primary">Start Now</button></div>
                  <div className="list-group-item d-flex justify-content-between align-items-center"><span>Update 411 Directory</span><button type="button" className="btn btn-sm btn-primary">Start Now</button></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-xl-9">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Credit Building Introduction</h6><small className="text-muted">Essential knowledge for your business credit journey</small></div>
              <div className="card-body">
                <div className="ratio ratio-16x9 rounded overflow-hidden">
                  <img src={overviewImg} alt="Credit Overview" className="w-100 h-100 object-fit-cover" />
                </div>
                <div className="mt-2"><h6 className="mb-0">Business Credit Building Fundamentals</h6><small className="text-muted">Learn step-by-step how to establish and build your business credit.</small></div>
              </div>
            </div>
          </div>
          <div className="col-xl-3">
            <div className="card h-100">
              <div className="card-header"><h6 className="mb-0">Related Videos</h6></div>
              <div className="card-body">
                <div className="list-group">
                  <a className="list-group-item list-group-item-action" href="#">Credit Building Fundamentals</a>
                  <a className="list-group-item list-group-item-action" href="#">Vendor Accounts for Fast Credit</a>
                  <a className="list-group-item list-group-item-action" href="#">Understanding Business Credit Scores</a>
                  <a className="list-group-item list-group-item-action" href="#">Credit Monitoring Basics</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
