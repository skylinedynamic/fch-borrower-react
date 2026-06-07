import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { mockPlays, formatCurrency } from './mockPlayData';
import './PremiumDesign.css';

export default function PlayRoadmap() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const basePlay = mockPlays.find(p => p.id === id);

  const [play, setPlay] = useState(basePlay);

  useEffect(() => {
    if (location.state && location.state.updatedStep) {
      setPlay(prev => {
        if (!prev) return prev;
        const newRoadmap = [...prev.roadmap];
        const stepIndex = newRoadmap.findIndex(s => s.id === location.state.updatedStep.id);
        if (stepIndex !== -1) {
          newRoadmap[stepIndex] = location.state.updatedStep;
          if (location.state.updatedStep.status === 'Completed' && stepIndex + 1 < newRoadmap.length) {
            newRoadmap[stepIndex + 1] = { ...newRoadmap[stepIndex + 1], status: 'Active' };
          }
        }
        return { ...prev, roadmap: newRoadmap };
      });
    }
  }, [location.state]);

  if (!play) return <Navigate to="/credit-builder/strategy" />;

  const isCompleted = play.roadmap.every(s => s.status === 'Completed');
  if (isCompleted) {
    return <Navigate to={`/credit-builder/strategy/${play.id}/completion`} state={{ play }} />;
  }

  const currentExposure = (play.roadmap as any[])
    .filter((s: any) => s.status === 'Completed' && s.result?.limit)
    .reduce((sum: number, s: any) => sum + (s.result?.limit || 0), 0);

  const completedCount = (play.roadmap as any[]).filter((s: any) => s.status === 'Completed').length;
  const progressPercent = Math.round((completedCount / (play.roadmap as any[]).length) * 100);

  return (
    <div className="page-content">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">{play.name} — Roadmap</h4>
                <p className="ca-page-subtitle">
                  Follow your play roadmap in order. Apply for each card in the exact sequence shown.
                </p>
              </div>
            </div>
          </div>

          <div className="ca-card">

            {/* Card Header */}
            <div className="ca-card-header" style={{ justifyContent: 'space-between' }}>
              <div>
                <h5 className="fw-bold mb-1 fs-16">{play.name}</h5>
                <p className="text-muted fs-13 mb-0">Follow each step in sequence for best results.</p>
              </div>
              <div className="d-none d-md-block text-end flex-shrink-0 ms-4">
                <div className="ca-metric" style={{ minWidth: '148px' }}>
                  <span className="ca-metric-label">{currentExposure > 0 ? 'Secured So Far' : 'Target Exposure'}</span>
                  <p className="ca-metric-value primary mb-0" style={{ fontSize: '16px' }}>
                    {currentExposure > 0 ? formatCurrency(currentExposure) : formatCurrency(play.target_exposure_max)}
                  </p>
                </div>
              </div>
            </div>

            <div className="ca-card-body">

              {/* Stepper */}
              <div className="ca-stepper mb-4">
                <div className="ca-stepper-line"></div>

                {play.roadmap.map((step: any, idx: number) => {
                  const isActive = step.status === 'Active';
                  const isStepCompleted = step.status === 'Completed';
                  const isLocked = !isActive && !isStepCompleted;

                  return (
                    <div key={step.id} className="ca-step">
                      <div className={`ca-step-dot ${isActive ? 'active' : isStepCompleted ? 'completed' : ''}`}>
                        {isStepCompleted
                          ? <i className="ri-check-line"></i>
                          : isActive
                            ? <i className="ri-flashlight-fill fs-15"></i>
                            : <span className="fs-11 fw-bold">{idx + 1}</span>
                        }
                      </div>

                      <Link
                        to={isActive || isStepCompleted ? `/credit-builder/strategy/${play.id}/step/${step.id}` : '#'}
                        state={isActive || isStepCompleted ? { step, play } : null}
                        className={`ca-step-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                        style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-3">
                            <span className={`ca-badge ${isActive ? 'ca-badge-primary' : isStepCompleted ? 'ca-badge-success' : 'ca-badge-warning'} d-none d-sm-inline-flex`}>
                              Day {step.day}
                            </span>
                            <div>
                              <h6 className={`mb-0 fw-semibold fs-14 ${isLocked ? 'text-muted' : ''}`}>
                                {step.issuer} {step.card_name}
                              </h6>
                              {isStepCompleted && step.result?.limit ? (
                                <p className="mb-0 fs-12 fw-semibold" style={{ color: 'var(--vz-success)' }}>
                                  <i className="ri-check-double-line align-middle me-1"></i>
                                  {formatCurrency(step.result.limit)} Approved
                                </p>
                              ) : (
                                <p className="text-muted mb-0 fs-12">
                                  Est. {formatCurrency(step.exposure_min)} – {formatCurrency(step.exposure_max)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="ms-3 flex-shrink-0">
                            {isActive ? (
                              <span className="ca-btn ca-btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                                Apply <i className="ri-arrow-right-line"></i>
                              </span>
                            ) : isStepCompleted ? (
                              <i className="ri-checkbox-circle-fill fs-20" style={{ color: 'var(--vz-success)' }}></i>
                            ) : (
                              <i className="ri-lock-2-line fs-18 text-muted"></i>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Progress Summary */}
              <div className="ca-summary-box">
                <div>
                  <p className="ca-metric-label mb-1">
                    {currentExposure > 0 ? 'Secured Exposure' : 'Target Range'}
                  </p>
                  <h4 className="fw-bold mb-0" style={{ color: 'var(--vz-primary)', fontSize: '22px' }}>
                    {currentExposure > 0
                      ? formatCurrency(currentExposure)
                      : `${formatCurrency(play.target_exposure_min)} – ${formatCurrency(play.target_exposure_max)}`}
                  </h4>
                </div>
                <div className="text-end">
                  <p className="ca-metric-label mb-2">Completion</p>
                  <div style={{ width: '140px' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fs-11 text-muted">{completedCount} of {play.roadmap.length}</span>
                      <span className="fs-11 fw-bold" style={{ color: 'var(--vz-primary)' }}>{progressPercent}%</span>
                    </div>
                    <div className="ca-progress">
                      <div className="ca-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
