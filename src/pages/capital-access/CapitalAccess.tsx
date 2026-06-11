import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth/authStore'

export default function CapitalAccess() {
  const { user } = useAuthStore()
  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
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

          {/* Dashboard Welcome Block */}
          <div className="ca-dashboard-welcome">
            <div className="ca-welcome-header">
              <h3 className="ca-welcome-title">
                Welcome back, {firstName}!
              </h3>
              <p className="ca-welcome-subtitle">Here's your funding overview.</p>
            </div>

            {/* Metrics cards row */}
            <div className="row g-4 mb-4">
              {/* Funding Readiness Score Card */}
              <div className="col-md-6">
                <div className="ca-metric-card h-100">
                  <div className="ca-metric-header">
                    <div className="ca-metric-title-block">
                      <h6 className="ca-metric-card-label">
                        Funding Readiness Score
                      </h6>
                      <div className="ca-score-display">
                        <span className="ca-score-value animate__animated animate__fadeIn">82</span>
                        <span className="ca-score-status">Ready</span>
                      </div>
                    </div>
                    <div className="ca-metric-icon-wrapper readiness-icon">
                      <i className="ri-shield-flash-line"></i>
                    </div>
                  </div>

                  {/* Progress slider/bar with scales */}
                  <div className="ca-slider-wrapper">
                    <div className="ca-slider-labels ca-slider-labels-top">
                      <span>501</span>
                      <span>900</span>
                    </div>
                    <div className="ca-custom-progress-container">
                      <div className="progress ca-custom-progress">
                        <div
                          className="progress-bar ca-progress-bar-green"
                          role="progressbar"
                          aria-valuenow={82}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        ></div>
                      </div>
                    </div>
                    <div className="ca-slider-labels ca-slider-labels-bottom">
                      <span>300</span>
                      <span>850</span>
                    </div>
                  </div>

                  {/* Key contributing factors */}
                  <div className="ca-score-factors">
                    <span className="ca-factor-tag">
                      <i className="ri-checkbox-circle-fill"></i> Personal Credit: Excellent
                    </span>
                    <span className="ca-factor-tag">
                      <i className="ri-checkbox-circle-fill"></i> Utilization: &lt; 10%
                    </span>
                    <span className="ca-factor-tag">
                      <i className="ri-checkbox-circle-fill"></i> Biz Age: 2+ Years
                    </span>
                  </div>
                </div>
              </div>

              {/* Estimated Total Access Card */}
              <div className="col-md-6">
                <div className="ca-metric-card h-100">
                  <div className="ca-metric-header">
                    <div className="ca-metric-title-block">
                      <h6 className="ca-metric-card-label">
                        Estimated Total Access
                      </h6>
                      <div className="ca-access-value animate__animated animate__fadeIn">
                        $150,000+
                      </div>
                    </div>
                    <div className="ca-metric-icon-wrapper access-icon">
                      <i className="ri-money-dollar-box-line"></i>
                    </div>
                  </div>

                  <div className="ca-access-footer">
                    Across Eligible Plays
                  </div>

                  {/* Funding Exposure Breakdown */}
                  <div className="ca-breakdown-list">
                    <div className="ca-breakdown-item">
                      <span>Business Credit Cards</span>
                      <span className="value">$50,000+</span>
                    </div>
                    <div className="ca-breakdown-item">
                      <span>Unsecured Lines of Credit</span>
                      <span className="value">$100,000+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Next Step Section */}
            <div className="ca-next-step-card">
              <div className="ca-next-step-content">
                <h6 className="ca-next-step-label">
                  Recommended Next Step
                </h6>
                <p className="ca-next-step-desc">
                  Select your Capital Access Strategy to begin.
                </p>
              </div>
              <Link
                to="/capital-access/strategy"
                className="ca-btn ca-btn-primary"
              >
                Choose Your Strategy <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
