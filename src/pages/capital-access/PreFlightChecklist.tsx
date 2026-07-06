import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategyChecklist } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';

export default function PreFlightChecklist() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading, isError } = useCapitalAccessStrategyChecklist(id);

  if (isLoading) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="ca-page-wrap text-start">
            <CapitalAccessLoader type="checklist" />
          </div>
        </div>
      </div>
    );
  }

  const isDelayLocked = play?.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' && !play?.isCompleted;

  if (isError || !play || !play.isAccessible || isDelayLocked) {
    return <Navigate to="/capital-access/strategy" />;
  }

  const allComplete = play.checklist ? play.checklist.every((item: any) => item.complete !== false) : false;
  const completedCount = play.checklist ? play.checklist.filter((item: any) => item.complete !== false).length : 0;
  const totalCount = play.checklist ? play.checklist.length : 0;

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap text-start">
          {/* ── Page Header ── */}
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to={play.id ? `/capital-access/${play.id}/overview` : "/capital-access/strategy"} className="ca-back-btn" title="Back to Overview">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                  <h4 className="fs-22 mb-1 fw-bold text-dark">Pre-Flight Checklist</h4>
                  <p className="ca-page-subtitle mb-0">
                    Confirm all requirements are completed before starting this play.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {play.approval_status === false ? (

            /* ── Ineligible / Locked State ── */
             <div className={`ca-hero-card-premium ${play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'border-warning-subtle' : 'border-danger-subtle'}`}>
              <div className="ca-hero-header-premium ca-hero-header-no-border">
                <div className="d-flex align-items-center gap-3 w-100">
                  <div className="avatar-sm flex-shrink-0">
                    <span className={`avatar-title rounded-circle fs-20 ${play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'}`}>
                      <i className={play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'ri-time-line' : 'ri-lock-line'}></i>
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
                <div className="ca-checklist-locked-notice mb-4" style={{
                  background: play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'rgba(243, 156, 18, 0.05)' : 'rgba(250, 95, 95, 0.05)',
                  border: play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? '1px solid rgba(243, 156, 18, 0.15)' : '1px solid rgba(250, 95, 95, 0.15)',
                  padding: '12px 16px',
                  borderRadius: '6px'
                }}>
                  <p className="text-muted fs-13 mb-0">
                    <i className={play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? 'ri-time-line text-warning me-2' : 'ri-shield-cross-line text-danger me-2'}></i>
                    {play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' ? (
                      'Next Play Delay Cooling Period Active. You cannot apply for any card in this play until the cooling period ends.'
                    ) : (
                      'Our scoring system indicates that your business profile does not currently satisfy the minimum qualifications required to initiate this play. Please build your readiness metrics or consult your Account Manager to unlock other eligible funding strategies.'
                    )}
                  </p>
                </div>

                <div className="d-flex align-items-center justify-content-end w-100">
                  <Link to="/capital-access/strategy" className="ca-btn ca-btn-outline" style={{ minWidth: '180px' }}>
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
                  <Link to={`/capital-access/${play.id}/overview`} className="ca-btn ca-btn-outline" style={{ minWidth: '180px' }}>
                    <i className="ri-arrow-left-line"></i> Back
                  </Link>
                  {allComplete ? (
                    <Link to={`/capital-access/${play.id}/roadmap`} className="ca-btn ca-btn-primary" style={{ minWidth: '180px' }}>
                      View Roadmap <i className="ri-map-2-line"></i>
                    </Link>
                  ) : (
                    <button disabled className="ca-btn ca-btn-primary ca-btn-disabled" style={{ minWidth: '180px' }}>
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
