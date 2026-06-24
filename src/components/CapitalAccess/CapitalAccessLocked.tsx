import React from 'react'

export default function CapitalAccessLocked() {
  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          <div className="row pb-1 page-subheader-sticky mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-22 mb-1 fw-bold text-dark">Capital Access</h4>
                <p className="ca-page-subtitle">
                  Discover and execute structured funding plays to maximize your business credit limit.
                </p>
              </div>
            </div>
          </div>

          <div className="ca-locked-container">
            <div className="card ca-locked-card">
              <div className="card-body ca-locked-card-body">
                <div className="ca-locked-badge">
                  <i className="ri-lock-2-line"></i>
                  <span>Access Restricted</span>
                </div>
                <div className="ca-locked-icon-wrapper">
                  <i className="ri-shield-keyhole-line ca-locked-icon"></i>
                </div>
                <h3 className="ca-locked-title">Unlock Your Funding Readiness</h3>
                <p className="ca-locked-description">
                  To view your personalized **Funding Readiness Score**, explore **Estimated Total Access**, and execute strategic funding plays, your business credit profile needs to be verified and finalized.
                </p>
                <div className="ca-locked-action-box">
                  <div className="ca-locked-action-icon">
                    <i className="ri-information-line"></i>
                  </div>
                  <p className="ca-locked-action-text">
                    Verification in progress? Please contact your <span className="ca-locked-action-highlight">Account Manager</span> to complete your credit report update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
