import React from 'react';
import { Link } from 'react-router-dom';
import { useCapitalAccessStrategies, useCapitalAccessOverview } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';
import CommonErrorPage from '../../components/Common/CommonErrorPage';
import { useDelayCountdown } from '../../modules/capital-access/useDelayCountdown';

export default function StrategySelection() {
  const { data, isLoading, isError } = useCapitalAccessStrategies();
  const { data: overview, isLoading: isOverviewLoading } = useCapitalAccessOverview();

  if (isError) {
    return (
      <CommonErrorPage
        title="Error loading strategies"
        description="Please try reloading the page."
      />
    );
  }

  const strategies = data || [];

  const runningPlayId = overview?.current_play?.id;
  const hasRunningPlay = !!runningPlayId;

  // Filter completed and active plays
  const completedPlays = strategies.filter(p => p.isCompleted);
  const activePlays = strategies.filter(p => !p.isCompleted);

  // Determine the top (hero) play and other plays
  const topPlay = hasRunningPlay
    ? (activePlays.find(p => String(p.id) === String(runningPlayId)) || null)
    : (activePlays.find(p => p.isRecommended) || activePlays[0] || null);

  const otherPlays = topPlay
    ? activePlays.filter(p => String(p.id) !== String(topPlay.id))
    : activePlays;

  const delayTime = useDelayCountdown(topPlay?.unlock_at);
  const isDelayActive = topPlay?.reason_code === 'NEXT_PLAY_DELAY_ACTIVE';

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        {/* ── Page Content ── */}
        <div className="ca-page-wrap text-start">
          {/* ── Page Header ── */}
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to="/capital-access" className="ca-back-btn" title="Back to Overview">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                  <h4 className="fs-22 mb-1 fw-bold text-dark">Capital Access Strategy</h4>
                  <p className="ca-page-subtitle mb-0">
                    Choose a strategy that fits your business funding goals. Each play is a structured sequence of card applications designed to maximize your credit access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading || isOverviewLoading ? (
            <CapitalAccessLoader type="list" />
          ) : strategies.length === 0 ? (
            <div className="ca-empty-state text-center py-4">
              <div className="ca-empty-state-icon">
                <i className="ri-search-eye-line"></i>
              </div>
              <h5 className="ca-empty-state-title">No Capital Access Strategies Available</h5>
              <p className="ca-empty-state-desc mb-3">There are no funding strategies available at this time.</p>
              <Link to="/capital-access" className="ca-btn ca-btn-outline">
                <i className="ri-arrow-left-line"></i> Back to Overview
              </Link>
            </div>
          ) : (
            <>
              {/* ── Section 1: Recommended or Running Play ── */}
              {topPlay && (
                <div className="mb-4">
                  <div className={`ca-hero-card-premium${isDelayActive ? ' border-warning-subtle' : ''}`}>
                    <div
                      className="ca-hero-header-premium"
                      style={isDelayActive ? { background: 'rgba(243,156,18,0.04)' } : undefined}
                    >
                      <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <div className="avatar-sm flex-shrink-0">
                          <span className={`avatar-title rounded-circle fs-20 ${isDelayActive ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'}`}>
                            <i className={isDelayActive ? 'ri-time-line' : (hasRunningPlay ? 'ri-play-circle-line' : 'ri-rocket-2-line')}></i>
                          </span>
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1 fs-17 text-dark">
                            {topPlay.name}

                          </h5>
                          <p className="text-muted fs-13 mb-0">{topPlay.description}</p>
                        </div>
                      </div>
                      {hasRunningPlay ? (
                        <span className="flex-shrink-0 badge bg-primary text-white border border-primary fs-12 px-3 py-2 animate__animated animate__pulse animate__infinite">
                          <i className="ri-play-circle-fill me-1"></i> Running Play
                        </span>
                      ) : (
                        <span className={`flex-shrink-0 ${isDelayActive ? 'badge bg-warning-subtle text-warning border border-warning-subtle fs-12 px-3 py-2' : 'ca-badge-recommended'}`}>
                          <i className="ri-star-fill"></i> Recommended For You
                        </span>
                      )}
                    </div>

                    <div className="ca-card-body" style={{ padding: '28px' }}>
                      {isDelayActive && (
                        <div className="alert alert-warning border-warning-subtle d-flex align-items-center gap-2 p-2 px-3 mb-4 rounded-3 shadow-sm animate__animated animate__fadeIn">
                          <i className="ri-time-line text-warning fs-18"></i>
                          <span className="fs-13 text-warning-emphasis fw-medium">
                            Next Play Delay: Recommended play starts in <strong className="text-danger">{delayTime?.text || 'soon'}</strong> ({delayTime?.days || 0} days remaining).
                          </span>
                        </div>
                      )}
                      <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                          <div className="ca-metric-card-premium">
                            <span className="ca-metric-label-premium">
                              <i className="ri-money-dollar-circle-line fs-14 text-primary"></i> Target Exposure
                            </span>
                            <p className="ca-metric-value-premium primary">
                              {topPlay.target_exposure}
                            </p>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="ca-metric-card-premium" style={topPlay.isRecommended ? { textAlign: 'center' } : undefined}>
                            <span className="ca-metric-label-premium" style={topPlay.isRecommended ? { justifyContent: 'center' } : undefined}>
                              <i className="ri-percent-line fs-14 text-success"></i> Approval Probability
                            </span>
                            <p className="ca-metric-value-premium success">{topPlay.approval_probability}</p>
                            {topPlay.isRecommended && (
                              <span className="badge bg-success-subtle text-success mt-2 fs-11" style={{ width: 'fit-content', margin: '0 auto' }}>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="ca-metric-card-premium">
                            <span className="ca-metric-label-premium">
                              <i className="ri-calendar-line fs-14 text-info"></i> Est. Timeline
                            </span>
                            <p className="ca-metric-value-premium timeline">{topPlay.est_timeline}</p>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end pt-2">
                        {isDelayActive ? (
                          <button
                            className="ca-btn ca-btn-outline"
                            style={{ minWidth: '180px', cursor: 'not-allowed', opacity: 0.6 }}
                            disabled
                          >
                            <i className="ri-lock-2-line me-1"></i>
                            Locked — {delayTime?.text ?? 'soon'}
                          </button>
                        ) : (
                          <Link to={`/capital-access/${topPlay.id}/overview`} className="ca-btn ca-btn-primary" style={{ minWidth: '180px' }}>
                            View Strategy <i className="ri-arrow-right-line ms-1"></i>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section 2: Other Plays ── */}
              {otherPlays.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="ca-section-label fw-bold fs-11 text-uppercase text-muted" style={{ letterSpacing: '0.08em' }}>
                      Other Eligible Plays
                    </span>
                    <span className="badge bg-light text-muted border">{otherPlays.length} available</span>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {otherPlays.map(play => {
                      if (hasRunningPlay || isDelayActive) {
                        return (
                          <div key={play.id} className="ca-strategy-row-premium" style={{ cursor: 'not-allowed' }}>
                            <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="ca-strategy-icon-wrapper-premium flex-shrink-0" style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                                <i className="ri-flashlight-line"></i>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <h6 className="mb-1 fw-bold fs-14 text-dark">
                                  {play.name}
                                  {play.isRecommended && (
                                    <span className="badge bg-success-subtle text-success ms-2 fs-10 align-middle">
                                      <i className="ri-star-fill me-1"></i>Recommendation
                                    </span>
                                  )}
                                </h6>
                                <p className="text-muted fs-12 mb-0 text-truncate">{play.description}</p>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              <div className="ca-row-metric-badge d-none d-sm-block">
                                <span className="label">Target Exposure</span>
                                <span className="value">{play.target_exposure}</span>
                              </div>
                              <div className="ca-row-metric-badge" style={{ textAlign: 'center' }}>
                                <span className="label">Approval Probability</span>
                                <span className="value">{play.approval_probability}</span>
                              </div>
                              <div className="ps-2">
                                <i className="ri-lock-line fs-20 text-muted"></i>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <Link
                            key={play.id}
                            to={`/capital-access/${play.id}/overview`}
                            className="ca-strategy-row-premium text-decoration-none"
                          >
                            <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="ca-strategy-icon-wrapper-premium flex-shrink-0" style={{ background: 'rgba(64, 81, 137, 0.1)', color: 'var(--primary-color, #405189)' }}>
                                <i className="ri-flashlight-line"></i>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <h6 className="mb-1 fw-bold fs-14 text-dark">
                                  {play.name}
                                  {play.isRecommended && (
                                    <span className="badge bg-success-subtle text-success ms-2 fs-10 align-middle">
                                      <i className="ri-star-fill me-1"></i>Recommendation
                                    </span>
                                  )}
                                </h6>
                                <p className="text-muted fs-12 mb-0 text-truncate">{play.description}</p>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              <div className="ca-row-metric-badge d-none d-sm-block">
                                <span className="label">Target Exposure</span>
                                <span className="value">{play.target_exposure}</span>
                              </div>
                              <div className="ca-row-metric-badge" style={{ textAlign: 'center' }}>
                                <span className="label">Approval Probability</span>
                                <span className="value">{play.approval_probability}</span>
                              </div>
                              <div className="ps-2 text-primary">
                                <i className="ri-arrow-right-line fs-20"></i>
                              </div>
                            </div>
                          </Link>
                        );
                      }
                    })}
                  </div>
                </div>
              )}

              {/* ── Section 3: Completed Plays ── */}
              {completedPlays.length > 0 && (
                <div className="mt-5">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="ca-section-label fw-bold fs-11 text-uppercase text-success" style={{ letterSpacing: '0.08em' }}>
                      Completed Plays
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle">{completedPlays.length} completed</span>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {completedPlays.map(play => (
                      <Link
                        key={play.id}
                        to={`/capital-access/${play.id}/roadmap`}
                        className="ca-strategy-row-premium text-decoration-none"
                        style={{ borderLeft: '4px solid #10b981', background: '#f0fdf4' }}
                      >
                        <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="ca-strategy-icon-wrapper-premium flex-shrink-0" style={{ background: '#d1fae5', color: '#059669' }}>
                            <i className="ri-checkbox-circle-fill"></i>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h6 className="mb-1 fw-bold fs-14 text-dark">{play.name}</h6>
                            <p className="text-muted fs-12 mb-0 text-truncate">{play.description}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <div className="ca-row-metric-badge d-none d-sm-block" style={{ background: '#ffffff' }}>
                            <span className="label">Exposure Achieved</span>
                            <span className="value text-success">{play.target_exposure}</span>
                          </div>
                          <div className="ps-2 text-success">
                            <i className="ri-arrow-right-line fs-20"></i>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
