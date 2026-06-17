import React from 'react'

export default function CapitalAccessLocked() {
  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-22 mb-1 fw-bold text-dark">Capital Access</h4>
                <p className="ca-page-subtitle">
                  Discover and execute structured funding plays to maximize your business credit limit.
                </p>
              </div>
            </div>
          </div>

          <div className="card border shadow-none text-center p-5 mt-4" style={{ background: 'var(--ca-card-bg)', borderRadius: 'var(--ca-radius)', border: '1px solid var(--ca-border)' }}>
            <div className="card-body py-4">
              <div className="avatar-lg mx-auto mb-4" style={{ display: 'inline-flex', width: '80px', height: '80px', background: 'rgba(247, 184, 75, 0.1)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ri-shield-keyhole-line text-warning" style={{ fontSize: '48px' }}></i>
              </div>
              <h4 className="fw-bold text-dark mb-2 mt-3">Please Update Your Credit Profile</h4>
              <p className="text-muted mx-auto fs-14" style={{ maxWidth: '600px', lineHeight: '1.6' }}>
                To unlock your personalized **Funding Readiness Score**, **Estimated Total Access**, and structured funding plays, your credit profile needs to be saved and updated.
              </p>
              <div className="mt-4 p-3 bg-light rounded d-inline-block border" style={{ maxWidth: '500px' }}>
                <span className="text-muted fs-13">
                  <i className="ri-information-line align-middle text-primary me-2 fs-15"></i>
                  Please contact your account manager to complete your credit report verification.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
