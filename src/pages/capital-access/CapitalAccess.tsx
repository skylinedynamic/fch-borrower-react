import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth/authStore'
import { useCapitalAccessOverview } from '../../modules/capital-access/queries'
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader'

export default function CapitalAccess() {
  const { user } = useAuthStore()
  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  const { data: overview, isLoading, isError } = useCapitalAccessOverview()

  if (!user?.credit_profile_updated) {
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

            {/* Dashboard Locked Block */}
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

  if (isError) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="text-center py-5">
            <i className="ri-error-warning-line fs-40 text-danger mb-2"></i>
            <h5 className="fw-semibold">Error loading capital access overview</h5>
            <p className="text-muted fs-13">Please try reloading the page.</p>
          </div>
        </div>
      </div>
    )
  }

  const score = overview?.readiness_score ?? 0
  const status = overview?.readiness_status ?? 'N/A'
  const minTop = overview?.score_labels_top?.min ?? 501
  const maxTop = overview?.score_labels_top?.max ?? 900
  const minBottom = overview?.score_labels_bottom?.min ?? 300
  const maxBottom = overview?.score_labels_bottom?.max ?? 850
  const factors = overview?.contributing_factors ?? []
  const totalAccess = overview?.estimated_total_access ?? '$0'
  const breakdown = overview?.breakdown ?? []

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

            {isLoading ? (
              <CapitalAccessLoader type="detail" />
            ) : (
              <>
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
                            <span className="ca-score-value animate__animated animate__fadeIn">{score}</span>
                            <span className="ca-score-status">{status}</span>
                          </div>
                        </div>
                        <div className="ca-metric-icon-wrapper readiness-icon">
                          <i className="ri-shield-flash-line"></i>
                        </div>
                      </div>

                      {/* Progress slider/bar with scales */}
                      <div className="ca-slider-wrapper">
                        <div className="ca-slider-labels ca-slider-labels-top">
                          <span>{minTop}</span>
                          <span>{maxTop}</span>
                        </div>
                        <div className="ca-custom-progress-container">
                          <div className="progress ca-custom-progress">
                            <div
                              className="progress-bar ca-progress-bar-green"
                              role="progressbar"
                              style={{ width: `${score}%` }}
                              aria-valuenow={score}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                        </div>
                        <div className="ca-slider-labels ca-slider-labels-bottom">
                          <span>{minBottom}</span>
                          <span>{maxBottom}</span>
                        </div>
                      </div>

                      {/* Key contributing factors */}
                      <div className="ca-score-factors">
                        {factors.map((factor, idx) => (
                          <span key={idx} className="ca-factor-tag">
                            <i className="ri-checkbox-circle-fill"></i> {factor}
                          </span>
                        ))}
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
                            {totalAccess}
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
                        {breakdown.map((item, idx) => (
                          <div key={idx} className="ca-breakdown-item">
                            <span>{item.label}</span>
                            <span className="value">{item.value}</span>
                          </div>
                        ))}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
