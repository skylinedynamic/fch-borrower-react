import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategyOverview } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';

export default function PlayOverview() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading, isError } = useCapitalAccessStrategyOverview(id);

  if (isLoading) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="ca-page-wrap text-start">
            {/* ── Page Header (Skeleton) ── */}
            <div className="row pb-1 mb-3">
              <div className="col-12">
                <div className="d-flex align-items-center gap-3 py-2 w-100">
                  <div className="ca-back-btn disabled">
                    <i className="ri-arrow-left-line fs-16"></i>
                  </div>
                  <div className="w-100">
                    <div className="skeleton-line mb-2 ca-skeleton-title" />
                    <div className="skeleton-line ca-skeleton-subtitle" />
                  </div>
                </div>
              </div>
            </div>
            <CapitalAccessLoader type="overview" />
          </div>
        </div>
      </div>
    );
  }

  // Hard block: if the recommended play is under cooling delay, redirect back.
  // We use play.reason_code (from the per-page API) so it is always fresh.
  const isDelayLocked = play?.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' && !play?.isCompleted;

  if (isError || !play || !play.isAccessible || isDelayLocked) {
    return <Navigate to="/capital-access/strategy" />;
  }

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap text-start">
          {/* ── Page Header ── */}
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to="/capital-access/strategy" className="ca-back-btn" title="Back to Strategies">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                  <h4 className="fs-22 mb-1 fw-bold text-dark">
                    {play.name}
                  </h4>
                  <p className="ca-page-subtitle mb-0">
                    Review the target exposure, approval probability, and benefits of this play.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {play.approval_status === false ? (

            <div className={`ca-hero-card-premium ${play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'border-warning-subtle' : 'border-danger-subtle'}`}>
              <div className="ca-hero-header-premium ca-hero-header-no-border">
                <div className="d-flex align-items-center gap-3 w-100">
                  <div className="avatar-sm flex-shrink-0">
                    <span className={`avatar-title rounded-circle fs-20 ${play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'}`}>
                      <i className={play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'ri-time-line' : 'ri-error-warning-line'}></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 fs-17 text-dark">{play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'Play Cooling Active' : 'Play Locked'}</h5>
                    <p className="text-muted fs-13 mb-0">
                      {play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE'
                        ? 'This recommended play is cooling down after completing a previous play.'
                        : `You are not eligible for the ${play.name} strategy.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ca-card-body ca-card-body-locked">
                <div className={`ca-checklist-locked-notice mb-4 ${play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'is-warning' : 'is-danger'}`}>
                  <p className="text-muted fs-13 mb-0 leading-relaxed">
                    <i className={play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'ri-time-line text-warning me-1' : 'ri-information-fill text-danger me-1'}></i>
                    {play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? (
                      'Next Play Delay Cooling Period Active. You cannot apply for any card in this play until the cooling period ends.'
                    ) : (
                      'Our scoring system indicates that your business profile does not currently satisfy the minimum qualifications required to initiate this play. Please build your readiness metrics or consult your Account Manager to unlock other eligible funding strategies.'
                    )}
                  </p>
                </div>

                <div className="d-flex align-items-center justify-content-end w-100">
                  <Link to="/capital-access/strategy" className="ca-btn ca-btn-outline">
                    <i className="ri-arrow-left-line"></i> Back to Strategies
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="ca-hero-card-premium">

              {/* Header */}
              <div className="ca-hero-header-premium">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                      <i className="ri-rocket-2-line"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 fs-17 text-dark">{play?.name}</h5>
                    <p className="text-muted fs-13 mb-0">{play?.description}</p>
                  </div>
                </div>
                {play?.isRecommended && (
                  <span className="ca-badge-recommended flex-shrink-0">
                    <i className="ri-star-fill"></i> Recommended For You
                  </span>
                )}
              </div>

              <div className="ca-card-body ca-card-body-padding">
                {/* Key Metrics */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="ca-metric-card-premium">
                      <span className="ca-metric-label-premium">
                        <i className="ri-money-dollar-circle-line fs-14 text-exposure"></i> Target Exposure
                      </span>
                      <p className="ca-metric-value-premium primary">
                        {play?.target_exposure}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="ca-metric-card-premium">
                      <span className="ca-metric-label-premium">
                        <i className="ri-percent-line fs-14 text-probability"></i> Approval Probability
                      </span>
                      <p className="ca-metric-value-premium success">{play?.approval_probability}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="ca-metric-card-premium">
                      <span className="ca-metric-label-premium">
                        <i className="ri-calendar-line fs-14 text-timeline"></i> Est. Timeline
                      </span>
                      <p className="ca-metric-value-premium timeline">{play?.est_timeline}</p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                {play?.benefits && play.benefits.length > 0 && (
                  <div className="mb-4">
                    <span className="ca-section-label mb-3 d-block">What You'll Get</span>
                    <div className="row g-2">
                      {play.benefits.map((benefit: string, idx: number) => (
                        <div key={idx} className="col-12 mt-0">
                          <div className="d-flex align-items-start gap-2 p-2 rounded-3 ca-benefit-item">
                            <i className="ri-check-line fs-16 flex-shrink-0 ca-benefit-icon"></i>
                            <span className="text-muted fs-13">{benefit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr className="ca-divider my-4" />

                <div className="d-flex align-items-center justify-content-end gap-3 w-100">
                  <Link to="/capital-access/strategy" className="ca-btn ca-btn-outline ca-btn-min-w">
                    <i className="ri-arrow-left-line"></i> Back
                  </Link>
                  <Link to={`/capital-access/${play?.id}/pre-flight`} className="ca-btn ca-btn-primary ca-btn-min-w">
                    Start This Play <i className="ri-arrow-right-line"></i>
                  </Link>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
