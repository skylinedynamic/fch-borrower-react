import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategyChecklist, useCapitalAccessStrategies } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';


export default function PreFlightChecklist() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading: isPlayLoading, isError } = useCapitalAccessStrategyChecklist(id);
  const { data: strategies, isLoading: isStrategiesLoading } = useCapitalAccessStrategies();

  const isLoading = isPlayLoading || isStrategiesLoading;

  const recommendedPlay = strategies?.find(p => p.isRecommended) || strategies?.[0];
  const isAccessible = recommendedPlay ? String(recommendedPlay.id) === String(id) : true;

  if (!isLoading && (isError || !play || !isAccessible)) return <Navigate to="/capital-access/strategy" />;

  const allComplete = play?.checklist ? play.checklist.every((item: any) => item.complete !== false) : false;
  const completedCount = play?.checklist ? play.checklist.filter((item: any) => item.complete !== false).length : 0;
  const totalCount = play?.checklist ? play.checklist.length : 0;

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to={play?.id ? `/capital-access/${play.id}/overview` : "/capital-access/strategy"} className="ca-back-btn" title="Back to Overview">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                  <h4 className="fs-22 mb-1 fw-bold text-dark">Pre-Flight Checklist</h4>
                  <p className="ca-page-subtitle">
                    Confirm all requirements are completed before starting this play.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <CapitalAccessLoader type="checklist" />
          ) : play.approval_status === false ? (
            /* ── Ineligible / Locked State ── */
            <div className="ca-hero-card-premium border-danger-subtle">
              <div className="ca-hero-header-premium ca-hero-header-no-border">
                <div className="d-flex align-items-center gap-3 w-100">
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-20">
                      <i className="ri-lock-line"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 fs-17 text-dark">Play Locked</h5>
                    <p className="text-muted fs-13 mb-0">You are not eligible for the {play.name} strategy.</p>
                  </div>
                </div>
              </div>

              <div className="ca-card-body ca-card-body-locked">
                <div className="ca-checklist-locked-notice mb-4">
                  <p className="text-muted fs-13 mb-0">
                    <i className="ri-shield-cross-line text-danger me-2"></i>
                    Our scoring system indicates that your business profile does not currently satisfy the minimum qualifications required to initiate this play. Please build your readiness metrics or consult your Account Manager to unlock other eligible funding strategies.
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
            /* ── Normal Checklist State ── */
            <div className="ca-hero-card-premium">

              {/* Header */}
              <div className="ca-hero-header-premium">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                      <i className="ri-shield-star-line"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 fs-17 text-dark">Pre-Flight Checklist</h5>
                    <p className="text-muted fs-13 mb-0">Confirm you're ready before beginning {play.name}.</p>
                  </div>
                </div>
                {allComplete ? (
                  <span className="ca-checklist-badge-clear">
                    <i className="ri-verified-badge-fill"></i> All Clear
                  </span>
                ) : (
                  <span className="ca-checklist-badge-pending">
                    <i className="ri-alarm-warning-fill"></i> Checks Pending
                  </span>
                )}
              </div>

              <div className="ca-card-body p-4">

                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="ca-section-label mb-0">Required Items</span>
                  <span className="text-muted fs-12 fw-medium">{completedCount} / {totalCount} complete</span>
                </div>

                <div className="mb-4">
                  {play.checklist.map((item: any, idx: number) => (
                    <div key={idx} className={`ca-checklist-item${item.complete !== false ? '' : ' is-pending'}`}>
                      <div className="d-flex align-items-center gap-3">
                        {item.complete !== false ? (
                          <i className="ca-checklist-icon done ri-checkbox-circle-fill"></i>
                        ) : (
                          <i className="ca-checklist-icon pending ri-close-circle-fill"></i>
                        )}
                        <span className="fw-semibold fs-14 text-dark">{item.label}</span>
                      </div>
                      {item.complete !== false ? (
                        <span className="ca-badge-done">
                          <i className="ri-check-line"></i> Done
                        </span>
                      ) : (
                        <span className="ca-badge-pending">
                          <i className="ri-time-line"></i> Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Info callout */}
                {allComplete ? (
                  <div className="ca-checklist-callout-success">
                    <i className="ca-callout-icon ri-rocket-2-line"></i>
                    <p className="ca-callout-text">
                      All checks passed. You can proceed to the roadmap and start applying for cards in the correct sequence.
                    </p>
                  </div>
                ) : (
                  <div className="ca-checklist-callout-warning">
                    <div className="ca-callout-header">
                      <i className="ri-error-warning-line"></i>
                      Action Required
                    </div>
                    <p className="ca-callout-body">
                      Please ensure all pre-flight tasks are fully completed before moving forward to the sequence roadmap. Incomplete items are highlighted above.
                    </p>
                  </div>
                )}

                <hr className="ca-divider my-4" />

                <div className="d-flex align-items-center justify-content-end gap-3 w-100">
                  <Link to={`/capital-access/${play.id}/overview`} className="ca-btn ca-btn-outline">
                    <i className="ri-arrow-left-line"></i> Back
                  </Link>
                  {allComplete ? (
                    <Link to={`/capital-access/${play.id}/roadmap`} className="ca-btn ca-btn-primary">
                      View Roadmap <i className="ri-map-2-line"></i>
                    </Link>
                  ) : (
                    <button disabled className="ca-btn ca-btn-primary ca-btn-disabled">
                      View Roadmap <i className="ri-map-2-line"></i>
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
