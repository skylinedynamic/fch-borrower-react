import React from 'react';
import { Link } from 'react-router-dom';
import { useCapitalAccessStrategies } from '../../../modules/credit-builder/capital-access/queries';
import CapitalAccessLoader from '../../../components/Loader/CapitalAccessLoader';



export default function StrategySelection() {
  const { data, isLoading, isError } = useCapitalAccessStrategies();

  if (isError) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="text-center py-5">
            <i className="ri-error-warning-line fs-40 text-danger mb-2"></i>
            <h5 className="fw-semibold">Error loading strategies</h5>
            <p className="text-muted fs-13">Please try reloading the page.</p>
          </div>
        </div>
      </div>
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
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">Capital Access Strategy</h4>
                <p className="ca-page-subtitle">
                  Choose a strategy that fits your business funding goals. Each play is a structured sequence of card applications designed to maximize your credit access.
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <CapitalAccessLoader type="list" />
          ) : strategies.length === 0 ? (
            <div className="text-center py-5">
              <i className="ri-search-eye-line fs-40 text-muted mb-2"></i>
              <h5 className="fw-semibold">No Capital Access Strategies Available</h5>
              <p className="text-muted fs-13">There are no funding strategies available at this time.</p>
            </div>
          ) : (
            <>
              {/* Recommended Play */}
              {recommendedPlay && (
                <div className="mb-4">
                  <span className="ca-section-label">⭐ Recommended For You</span>
                  <div className="ca-hero-card">
                    <div className="ca-hero-header">
                      <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <div className="avatar-sm flex-shrink-0">
                          <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                            <i className="ri-rocket-2-line"></i>
                          </span>
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1 fs-17">{recommendedPlay.name}</h5>
                          <p className="text-muted fs-13 mb-0">{recommendedPlay.description}</p>
                        </div>
                      </div>
                      <span className="ca-badge ca-badge-primary ms-2 flex-shrink-0">
                        <i className="ri-star-fill"></i> Recommended For You
                      </span>
                    </div>

                    <div className="ca-card-body">
                      <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                          <div className="ca-metric">
                            <span className="ca-metric-label">Target Exposure</span>
                            <p className="ca-metric-value primary mb-0" style={{ fontSize: '17px' }}>
                              {recommendedPlay.target_exposure}
                            </p>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="ca-metric">
                            <span className="ca-metric-label">Approval Probability</span>
                            <p className="ca-metric-value success mb-0">{recommendedPlay.approval_probability}</p>
                          </div>
                        </div>
                        <div className="col-sm-4">
                          <div className="ca-metric">
                            <span className="ca-metric-label">Est. Timeline</span>
                            <p className="ca-metric-value mb-0">{recommendedPlay.est_timeline}</p>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end pt-2">
                        <Link to={`/credit-builder/strategy/${recommendedPlay.id}/overview`} className="ca-btn ca-btn-primary">
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
                  <span className="ca-section-label">Other Eligible Plays</span>
                  <div className="d-flex flex-column gap-2">
                    {otherPlays.map(play => (
                      <Link key={play.id} to={`/credit-builder/strategy/${play.id}/overview`} className="ca-strategy-row text-decoration-none">
                        <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="avatar-sm flex-shrink-0">
                            <span className="avatar-title bg-light text-muted rounded-circle fs-18">
                              <i className="ri-flashlight-line"></i>
                            </span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h6 className="mb-0 fw-semibold fs-14 text-truncate">{play.name}</h6>
                            <p className="text-muted fs-12 mb-0 text-truncate">{play.description}</p>
                          </div>
                        </div>
                        <div className="ca-strategy-row-metrics d-flex align-items-center gap-4">
                          <div className="text-start text-sm-end">
                            <p className="ca-metric-label mb-1">Target</p>
                            <span className="fw-semibold fs-13">{play.target_exposure}</span>
                          </div>
                          <div className="text-start text-sm-end">
                            <p className="ca-metric-label mb-1">Approval</p>
                            <span className="fw-bold fs-13" style={{ color: 'var(--vz-success)' }}>{play.approval_probability}</span>
                          </div>
                          <i className="ri-arrow-right-s-line fs-20 text-muted"></i>
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
