import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategyRoadmap, useCapitalAccessStrategies } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';
import type { RoadmapCard } from '../../modules/capital-access/types';

// ── Access time label helper ────────────────────────────────────────────────
function accessScheduleLabel(card: RoadmapCard): string {
  if (card.access_time === 'Day' && card.access_day) {
    const sub = card.access_day_time ? ` (${card.access_day_time})` : '';
    return `Day ${card.access_day}${sub}`;
  }
  return card.access_time ?? '';
}

export default function PlayRoadmap() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading: isPlayLoading, isError } = useCapitalAccessStrategyRoadmap(id);
  const { data: strategies, isLoading: isStrategiesLoading } = useCapitalAccessStrategies();

  const isLoading = isPlayLoading || isStrategiesLoading;

  const recommendedPlay = strategies?.find(p => p.isRecommended) || strategies?.[0];
  const isAccessible = recommendedPlay ? String(recommendedPlay.id) === String(id) : true;

  if (!isLoading && (isError || !play || !isAccessible)) return <Navigate to="/capital-access/strategy" />;

  // Strategy-level lock
  if (!isLoading && play && play.approval_status === false) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="ca-page-wrap">
            <div className="row pb-1 page-subheader-sticky bg-body mb-3">
              <div className="col-12">
                <div className="text-center py-2 w-100">
                  <h4 className="fs-22 mb-1 fw-bold text-dark">Strategy Roadmap</h4>
                  <p className="ca-page-subtitle">Follow your play roadmap in order.</p>
                </div>
              </div>
            </div>
            <div className="ca-hero-card-premium border-danger-subtle">
              <div className="ca-hero-header-premium ca-hero-header-no-border">
                <div className="d-flex align-items-center gap-3 w-100">
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-20">
                      <i className="ri-lock-line"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 fs-17 text-dark">Roadmap Locked</h5>
                    <p className="text-muted fs-13 mb-0">You are not currently eligible for the {play.name} strategy.</p>
                  </div>
                </div>
              </div>
              <div className="ca-card-body ca-card-body-locked">
                <div className="ca-checklist-locked-notice mb-4">
                  <p className="text-muted fs-13 mb-0">
                    <i className="ri-shield-cross-line text-danger me-2"></i>
                    Your profile does not meet the minimum qualifications required to access this play's roadmap. Please complete pre-flight requirements or consult your Account Manager.
                  </p>
                </div>
                <div className="d-flex justify-content-end">
                  <Link to={`/capital-access/${play.id}/checklist`} className="ca-btn ca-btn-outline">
                    <i className="ri-arrow-left-line"></i> Back to Checklist
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roadmap: RoadmapCard[] = play?.roadmap ?? [];

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to={play?.id ? `/capital-access/${play.id}/checklist` : '/capital-access/strategy'} className="ca-back-btn" title="Back to Checklist">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                  <h4 className="fs-22 mb-1 fw-bold text-dark">
                    {isLoading || !play ? 'Strategy Roadmap' : `${play.name} — Roadmap`}
                  </h4>
                  <p className="ca-page-subtitle">
                    Apply for each card in the exact sequence shown. Locked cards become available as you progress.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading || !play ? (
            <CapitalAccessLoader type="roadmap" />
          ) : (
            <div className="ca-hero-card-premium">

              {/* Card Header */}
              <div className="ca-hero-header-premium">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                      <i className="ri-map-2-line"></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 fs-17 text-dark">{play.name}</h5>
                    <p className="text-muted fs-13 mb-0">
                      {play.target_exposure} &bull; {play.est_timeline}
                    </p>
                  </div>
                </div>
                <span className="ca-checklist-badge-clear flex-shrink-0">
                  <i className="ri-list-ordered-2"></i> {roadmap.length} Cards
                </span>
              </div>

              <div className="ca-card-body p-4">

                {/* Stepper */}
                <div className="ca-stepper mb-4">
                  <div className="ca-stepper-line"></div>

                  {roadmap.map((card: RoadmapCard, idx: number) => {
                    const isLocked = card.probability_status === false;

                    return (
                      <div key={card.id} className="ca-step">
                        {/* Step dot */}
                        <div className={`ca-step-dot ${isLocked ? '' : card.application_status ? 'completed' : 'active'}`}>
                          {isLocked ? (
                            <i className="ri-lock-line fs-14"></i>
                          ) : card.application_status ? (
                            <i className="ri-check-line fs-14"></i>
                          ) : (
                            <span className="fs-11 fw-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Step card — clickable only when active */}
                        {isLocked ? (
                          <div className="ca-step-card locked">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <div className="d-flex align-items-center gap-3">
                                <div>
                                  <h6 className="mb-1 fw-semibold fs-14 text-muted">
                                    {card.card_name} ( {card.issuer} )
                                  </h6>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="ca-badge ca-badge-primary">
                                      <i className="ri-calendar-event-line me-1"></i>
                                      {accessScheduleLabel(card)}
                                    </span>
                                    <span className="text-muted fs-12">Est. {card.exposure}</span>
                                    {card.hard_pull === 'Yes' && (
                                      <span className="ca-badge ca-badge-warning">Hard Pull</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                <div className="text-end">
                                  <span className="ca-metric-label d-block">Approval Odds</span>
                                  <span className="fw-bold fs-14 text-muted">{card.approval_odds}</span>
                                </div>
                                <i className="ri-lock-2-line fs-18 text-muted"></i>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={`/capital-access/${play.id}/step/${card.id}`}
                            state={{
                              play,
                              step: {
                                id: card.id,
                                day: card.sequence_order,
                                issuer: card.issuer,
                                card_name: card.card_name,
                                exposure: card.exposure,
                                hard_pull: card.hard_pull,
                                why: card.why_this_card,
                                approval_odds: card.approval_odds,
                                requirements: card.requirements ?? [],
                                status: 'Active',
                                result: null,
                              },
                            }}
                            className={`ca-step-card active text-decoration-none ${card.application_status ? 'submitted' : ''}`}
                          >
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <div className="d-flex align-items-center gap-3">
                                <div>
                                  <h6 className="mb-1 fw-semibold fs-14">
                                    {card.card_name} ( {card.issuer} )
                                  </h6>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="ca-badge ca-badge-primary">
                                      <i className="ri-calendar-event-line me-1"></i>
                                      {accessScheduleLabel(card)}
                                    </span>
                                    <span className="text-muted fs-12">Est. {card.exposure}</span>
                                    {card.hard_pull === 'Yes' && (
                                      <span className="ca-badge ca-badge-warning">Hard Pull</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                <div className="text-end">
                                  <span className="ca-metric-label d-block">Approval Odds</span>
                                  <span className="fw-bold fs-14 ca-odds-value">{card.approval_odds}</span>
                                </div>
                                <span className={`ca-btn ca-btn-sm ${card.application_status ? 'ca-btn-success' : 'ca-btn-primary'}`}>
                                  {card.application_status ? 'Submitted' : 'Apply'} <i className="ri-arrow-right-line"></i>
                                </span>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>

                <hr className="ca-divider mt-4 mb-3" />

                <div className="d-flex gap-3 justify-content-center">
                  <Link to={`/capital-access/${play.id}/checklist`} className="ca-btn ca-btn-outline flex-fill justify-content-center">
                    <i className="ri-arrow-left-line"></i> Back to Checklist
                  </Link>
                  <Link to="/capital-access/strategy" className="ca-btn ca-btn-primary flex-fill justify-content-center">
                    All Strategies <i className="ri-list-check-3"></i>
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
