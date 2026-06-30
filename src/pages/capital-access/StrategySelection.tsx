import React from 'react';
import { Link } from 'react-router-dom';
import { useCapitalAccessStrategies } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';
import CommonErrorPage from '../../components/Common/CommonErrorPage';



export default function StrategySelection() {
  const { data, isLoading, isError } = useCapitalAccessStrategies();

  if (isError) {
    return (
      <CommonErrorPage
        title="Error loading strategies"
        description="Please try reloading the page."
      />
    );
  }

  const strategies = data || [];
  const recommendedPlay = strategies.find(p => p.isRecommended) || strategies[0];
  const otherPlays = recommendedPlay
    ? strategies.filter(p => String(p.id) !== String(recommendedPlay.id))
    : [];

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        {/* ── Content ── */}
        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to="/capital-access" className="ca-back-btn" title="Back to Overview">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                    <h4 className="fs-22 mb-1 fw-bold text-dark">Capital Access Strategy</h4>
                    <p className="ca-page-subtitle">
                      Choose a strategy that fits your business funding goals. Each play is a structured sequence of card applications designed to maximize your credit access.
                    </p>
                  </div>
              </div>
            </div>
          </div>

          {isLoading ? (
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
              {/* Recommended Play */}
              {recommendedPlay && (
                <div className="mb-4">
                  <div className="ca-hero-card-premium">
                    <div className="ca-hero-header-premium">
                      <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <div className="avatar-sm flex-shrink-0">
                          <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                            <i className="ri-rocket-2-line"></i>
                          </span>
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1 fs-17 text-dark">{recommendedPlay.name}</h5>
                          <p className="text-muted fs-13 mb-0">{recommendedPlay.description}</p>
                        </div>
                      </div>
                      <span className="ca-badge-recommended flex-shrink-0">
                        <i className="ri-star-fill"></i> Recommended For You
                      </span>
                    </div>

                    <div className="ca-card-body" style={{ padding: '28px' }}>
                      <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                          <div className="ca-metric-card-premium">
                            <span className="ca-metric-label-premium">
                              <i className="ri-money-dollar-circle-line fs-14" style={{ color: '#60a5fa' }}></i> Target Exposure
                            </span>
                            <p className="ca-metric-value-premium primary">
                              {recommendedPlay.target_exposure}
                            </p>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="ca-metric-card-premium">
                            <span className="ca-metric-label-premium">
                              <i className="ri-percent-line fs-14" style={{ color: '#34d399' }}></i> Approval Probability
                            </span>
                            <p className="ca-metric-value-premium success">{recommendedPlay.approval_probability}</p>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="ca-metric-card-premium">
                            <span className="ca-metric-label-premium">
                              <i className="ri-calendar-line fs-14" style={{ color: '#38bdf8' }}></i> Est. Timeline
                            </span>
                            <p className="ca-metric-value-premium timeline">{recommendedPlay.est_timeline}</p>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end pt-2">
                        <Link to={`/capital-access/${recommendedPlay.id}/overview`} className="ca-btn ca-btn-primary">
                          View Strategy <i className="ri-arrow-right-line"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Plays */}
              {otherPlays.length > 0 && (
                <div>
                  <span className="ca-section-label" style={{ fontWeight: 700, fontSize: '11px', color: '#94a3b8' }}>Other Eligible Plays</span>
                  <div className="d-flex flex-column gap-3">
                    {otherPlays.map(play => (
                      <div key={play.id} className="ca-strategy-row-premium text-decoration-none">
                        <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="ca-strategy-icon-wrapper-premium flex-shrink-0">
                            <i className="ri-flashlight-line"></i>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h6 className="mb-1 fw-bold fs-14 text-dark">{play.name}</h6>
                            <p className="text-muted fs-12 mb-0 text-truncate">{play.description}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <div className="ca-row-metric-badge d-none d-sm-block">
                            <span className="label">Target Exposure</span>
                            <span className="value">{play.target_exposure}</span>
                          </div>
                          <div className="ca-row-metric-badge">
                            <span className="label">Probability</span>
                            <span className="value success">{play.approval_probability}</span>
                          </div>
                          <div className="ps-2">
                            <i className="ri-lock-line fs-20 text-muted"></i>
                          </div>
                        </div>
                      </div>
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
