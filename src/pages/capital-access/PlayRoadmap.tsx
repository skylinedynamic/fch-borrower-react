import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStrategyRoadmap, useStartCapitalAccessPlay } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';
import type { RoadmapCard } from '../../modules/capital-access/types';
import { ACCESS_TIME, CAPITAL_ACCESS_STATUS } from '../../config/capitalAccessStatusOptions';

// ── Access time label helper ────────────────────────────────────────────────
function accessScheduleLabel(card: RoadmapCard): string {
  if (card.access_time === ACCESS_TIME.DAY && card.access_day) {
    const detail = card.access_day_time_detail;
    if (detail && detail.start != null && detail.end != null) {
      const timeStr = `${formatDecimalHour(detail.start)} – ${formatDecimalHour(detail.end)}`;
      const label = detail.label ?? card.access_day_time ?? '';
      return `Day ${card.access_day} (${label}: ${timeStr})`;
    } else if (card.access_day_time) {
      return `Day ${card.access_day} (${card.access_day_time})`;
    }
    return `Day ${card.access_day}`;
  }

  const detail = card.access_time_detail;
  if (detail && detail.start != null && detail.end != null) {
    const timeStr = `${formatDecimalHour(detail.start)} – ${formatDecimalHour(detail.end)}`;
    const label = detail.label ?? card.access_time ?? '';
    return `${label} (${timeStr})`;
  }
  return card.access_time ?? '';
}

// ── Lock reason helper ───────────────────────────────────────────────────────
function getLockReason(card: RoadmapCard): string {
  if (card.reason_code === 'FICO_BELOW_MINIMUM') {
    return `Requires a minimum FICO score of ${card.minimum_fico_requirement ?? 'N/A'}`;
  }
  if (card.reason_code === 'UTILIZATION_ABOVE_MAXIMUM') {
    return `Revolving utilization must be below ${card.maximum_utilization_threshold ?? 'N/A'}%`;
  }
  return 'Complete the previous step to unlock this card';
}

// ── Format Hour Helper ──────────────────────────────────────────────────────
function formatDecimalHour(decimalHour: number): string {
  const wholeHours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - wholeHours) * 60);

  let displayHour = wholeHours;
  let ampm = 'AM';

  if (wholeHours === 0) {
    displayHour = 12;
    ampm = 'AM';
  } else if (wholeHours === 12) {
    displayHour = 12;
    ampm = 'PM';
  } else if (wholeHours > 12) {
    displayHour = wholeHours - 12;
    ampm = 'PM';
  }

  const minutesStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
  return `${displayHour}${minutesStr} ${ampm}`;
}

// ── Time Active Checker Helper ──────────────────────────────────────────────
function isTimeActive(card: RoadmapCard, isFirstCard: boolean, playStartDate: string | null | undefined, now: Date): { active: boolean; reason: string } {
  const currentHourDecimal = now.getHours() + now.getMinutes() / 60;

  if (card.application_status) {
    return { active: true, reason: '' };
  }

  // Enforce access day delay since play started
  if (card.access_time === ACCESS_TIME.DAY && card.access_day) {
    if (playStartDate) {
      const startDate = new Date(playStartDate);
      if (!isNaN(startDate.getTime())) {
        const startCalendarDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const nowCalendarDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.floor((nowCalendarDate.getTime() - startCalendarDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < card.access_day) {
          return {
            active: false,
            reason: `Unlocks on Day ${card.access_day} (Tomorrow or later)`
          };
        }
      }
    }
  }

  // Extract time window — Day cards use access_day_time_detail, others use access_time_detail
  let detail: any = null;
  let label = '';

  if (card.access_time === ACCESS_TIME.DAY && card.access_day_time && card.access_day_time !== ACCESS_TIME.ANYTIME) {
    detail = card.access_day_time_detail;
    label = detail?.label ?? card.access_day_time;
  } else if (card.access_time && card.access_time !== ACCESS_TIME.ANYTIME && card.access_time !== ACCESS_TIME.DAY) {
    detail = card.access_time_detail;
    label = detail?.label ?? card.access_time;
  }

  if (!detail) {
    return { active: true, reason: '' };
  }

  const start = detail.start ?? detail.min_value ?? 0;
  const end = detail.end ?? detail.max_value ?? 24;

  if (currentHourDecimal < start) {
    return {
      active: false,
      reason: `Active during ${label} (${formatDecimalHour(start)} - ${formatDecimalHour(end)})`
    };
  }

  if (currentHourDecimal > end && isFirstCard) {
    return {
      active: false,
      reason: `Available next ${label} (${formatDecimalHour(start)} - ${formatDecimalHour(end)})`
    };
  }

  return { active: true, reason: '' };
}

// ── Unlock Time Remaining Helper ──────────────────────────────────────────
function getUnlockTimeRemaining(card: RoadmapCard, playStartDate: string | null | undefined, now: Date): string | null {
  if (card.application_status) return null;

  // 1. Determine target day offset
  let targetDay = 0;
  if (card.access_time === ACCESS_TIME.DAY && card.access_day) {
    targetDay = card.access_day;
  }

  // 2. Determine target start hour and end hour
  let startHour = 0;
  let endHour = 24;
  let detail: any = null;

  if (card.access_time === ACCESS_TIME.DAY && card.access_day_time && card.access_day_time !== ACCESS_TIME.ANYTIME) {
    detail = card.access_day_time_detail;
  } else if (card.access_time && card.access_time !== ACCESS_TIME.ANYTIME && card.access_time !== ACCESS_TIME.DAY) {
    detail = card.access_time_detail;
  }

  if (detail) {
    startHour = detail.start ?? detail.min_value ?? 0;
    endHour = detail.end ?? detail.max_value ?? 24;
  }

  // 3. Get base activation date
  let baseDate = new Date();
  if (playStartDate) {
    const parsed = new Date(playStartDate);
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }

  // Target date construction (midnight of target day)
  const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + targetDay);

  const startWholeHours = Math.floor(startHour);
  const startMinutes = Math.round((startHour - startWholeHours) * 60);
  targetDate.setHours(startWholeHours, startMinutes, 0, 0);

  // If the target date is today but we have already passed the end time of the window,
  // it means the next unlock will be tomorrow (targetDay + 1)
  const targetEndDate = new Date(targetDate);
  const endWholeHours = Math.floor(endHour);
  const endMinutes = Math.round((endHour - endWholeHours) * 60);
  targetEndDate.setHours(endWholeHours, endMinutes, 0, 0);

  if (now > targetEndDate) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const remainingMs = targetDate.getTime() - now.getTime();

  if (remainingMs > 0 && remainingMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Unlocks in ${hours}h ${minutes}m`;
    }
    return `Unlocks in ${minutes}m`;
  }

  return null;
}

export default function PlayRoadmap() {
  const { id } = useParams<{ id: string }>();
  const { data: play, isLoading, isError } = useCapitalAccessStrategyRoadmap(id);

  const startPlayMutation = useStartCapitalAccessPlay(id);

  const isDelayActive = play?.reason_code === 'NEXT_PLAY_DELAY_ACTIVE';

  // Separate per-minute clock for card access schedule checks
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const roadmap: RoadmapCard[] = React.useMemo(() => {
    const original = play?.roadmap ?? [];
    return [...original].sort((a, b) => {
      const dayA = a.access_time === ACCESS_TIME.DAY ? (a.access_day ?? 0) : 0;
      const dayB = b.access_time === ACCESS_TIME.DAY ? (b.access_day ?? 0) : 0;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      const timeA = a.access_time === ACCESS_TIME.DAY ? a.access_day_time : a.access_time;
      const timeB = b.access_time === ACCESS_TIME.DAY ? b.access_day_time : b.access_time;

      const getWeight = (t: string | null | undefined) => {
        const timeStr = t ? t.trim() : '';
        if (!timeStr || timeStr === ACCESS_TIME.ANYTIME) return 2;
        switch (timeStr) {
          case ACCESS_TIME.MORNING: return 1;
          case ACCESS_TIME.MIDDAY: return 3;
          case ACCESS_TIME.AFTERNOON: return 4;
          case ACCESS_TIME.EVENING: return 5;
          default: return 6;
        }
      };

      const weightA = getWeight(timeA);
      const weightB = getWeight(timeB);

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      return (a.sequence_order ?? 0) - (b.sequence_order ?? 0);
    });
  }, [play?.roadmap]);

  if (isError) {
    return <Navigate to="/credit-card-stacking/strategy" />;
  }

  if (isLoading || !play) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="ca-page-wrap">
            {/* ── Page Header (Skeleton) ── */}
            <div className="row pb-1 mb-3">
              <div className="col-12">
                <div className="d-flex align-items-center gap-3 py-2 w-100">
                  <div className="ca-back-btn disabled">
                    <i className="ri-arrow-left-line fs-16"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="skeleton-line mb-2 ca-skeleton-title" />
                    <div className="skeleton-line ca-skeleton-subtitle" />
                  </div>
                </div>
              </div>
            </div>
            <CapitalAccessLoader type="roadmap" />
          </div>
        </div>
      </div>
    );
  }

  // Also redirect if delay is active and play not yet completed (safety net for direct URL navigation)
  if (isDelayActive && !play.isCompleted) return <Navigate to="/credit-card-stacking/strategy" />;

  if (!play.isAccessible) return <Navigate to="/credit-card-stacking/strategy" />;

  // Strategy-level lock
  if (play.approval_status === false && !isDelayActive) {
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
                  <Link to={`/credit-card-stacking/${play.id}/pre-flight`} className="ca-btn ca-btn-outline">
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

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap">
          {/* ── Page Header ── */}
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link to={play?.id ? `/credit-card-stacking/${play.id}/pre-flight` : '/credit-card-stacking/strategy'} className="ca-back-btn" title="Back to Checklist">
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div className="flex-grow-1">
                  <h4 className="fs-22 mb-1 fw-bold text-dark">
                    {play.name} — Roadmap
                  </h4>
                  <p className="ca-page-subtitle">
                    Apply for each card in the exact sequence shown. Locked cards become available as you progress.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                  const hasUnsubmittedPrevious = roadmap.slice(0, idx).some(c => c.application_status !== CAPITAL_ACCESS_STATUS.APPROVED);

                  const timeCheck = isTimeActive(card, idx === 0, play.first_submitted_at, currentTime);
                  const isTimeLocked = !timeCheck.active;
                  const remainingTimeText = getUnlockTimeRemaining(card, play.first_submitted_at, currentTime);

                  const isLocked = isDelayActive || ((card.probability_status === false || hasUnsubmittedPrevious || isTimeLocked) && !card.application_status);

                  let lockReason = '';
                  if (isDelayActive) {
                    lockReason = 'Play cooling period active';
                  } else if (card.probability_status === false) {
                    lockReason = getLockReason(card);
                  } else if (hasUnsubmittedPrevious) {
                    lockReason = 'Complete the previous step to unlock this card';
                  } else if (isTimeLocked) {
                    if (remainingTimeText) {
                      lockReason = `This will Unlock in ${remainingTimeText.replace('Unlocks in ', '')}`;
                    } else {
                      lockReason = timeCheck.reason;
                    }
                  }

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

                      {/* Step card — locked: same design as active, lock icon + reason only */}
                      {isLocked ? (
                        <div className="ca-step-card locked-danger">
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
                                </div>
                                <div className="mt-2 text-danger small d-flex align-items-center gap-1 fw-medium">
                                  <i className="ri-error-warning-line"></i>
                                  <span className='ca-locked-reason'>{lockReason}</span>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-3 flex-shrink-0">
                              {card.approval_odds && parseInt(card.approval_odds, 10) !== 0 && (
                                <div className="text-end">
                                  <span className="ca-metric-label d-block">Approval Odds</span>
                                  <span className="fw-bold fs-14 ca-odds-value">{card.approval_odds}</span>
                                </div>
                              )}
                              <i className="ri-lock-2-line fs-18 text-muted ms-5"></i>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`ca-step-card active ${card.application_status ? 'submitted' : ''}`}
                          style={{ cursor: 'default' }}
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
                                </div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-3 flex-shrink-0">
                              {!card.application_status && card.approval_odds && parseInt(card.approval_odds, 10) !== 0 && (
                                <div className="text-end">
                                  <span className="ca-metric-label d-block">Approval Odds</span>
                                  <span className="fw-bold fs-14 ca-odds-value">{card.approval_odds}</span>
                                </div>
                              )}
                              <div className="d-flex align-items-center gap-2">
                                <Link
                                  to={`/credit-card-stacking/${play.id}/step/${card.id}`}
                                  className={`ca-btn ca-btn-sm ${card.application_status === CAPITAL_ACCESS_STATUS.APPROVED ? 'ca-btn-success' :
                                    card.application_status === CAPITAL_ACCESS_STATUS.PENDING ? 'ca-btn-warning' :
                                      card.application_status === CAPITAL_ACCESS_STATUS.DECLINED ? 'ca-btn-danger' :
                                        'ca-btn-outline'
                                    }`}
                                >
                                  {card.application_status || 'Manage Status'} <i className="ri-arrow-right-line"></i>
                                </Link>
                                {!card.application_status && (
                                  <a
                                    href={card.reference_url || '#'}
                                    target={card.reference_url ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    className={`ca-btn ca-btn-sm ca-btn-primary ${!card.reference_url ? 'disabled' : ''}`}
                                    onClick={(e) => {
                                      if (!card.reference_url) {
                                        e.preventDefault();
                                        return;
                                      }
                                      startPlayMutation.mutate();
                                    }}
                                  >
                                    Apply <i className="ri-external-link-line"></i>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <hr className="ca-divider mt-4 mb-3" />

              <div className="d-flex align-items-center justify-content-end gap-3 w-100">
                {play.isCompleted ? (
                  <Link to="/credit-card-stacking/strategy" className="ca-btn ca-btn-outline" style={{ minWidth: '180px' }}>
                    <i className="ri-arrow-left-line"></i> Back to Strategy List
                  </Link>
                ) : (
                  <Link to={`/credit-card-stacking/${play.id}/pre-flight`} className="ca-btn ca-btn-outline" style={{ minWidth: '180px' }}>
                    <i className="ri-arrow-left-line"></i> Back to Checklist
                  </Link>
                )}
                <Link to="/credit-card-stacking/strategy" className="ca-btn ca-btn-primary" style={{ minWidth: '180px' }}>
                  All Strategies <i className="ri-list-check-3"></i>
                </Link>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
