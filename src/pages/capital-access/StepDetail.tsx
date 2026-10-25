import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { useCapitalAccessStepDetail, useSubmitCapitalAccessStep } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';
import type { CapitalAccessStepDetail } from '../../modules/capital-access/types';
import { CAPITAL_ACCESS_STATUS, type CapitalAccessStatus } from '../../config/capitalAccessStatusOptions';

/**
 * Whether an approved credit limit can be recorded as entered.
 *
 * The figure used to be clamped to the step's own estimate (est_limit_min to
 * est_limit_max), so an approval outside that band could not be entered at all -
 * even though the band is a projection and the approval is a fact. The estimate
 * is shown beside the field as guidance now, and any amount is accepted.
 *
 * What is left is only what makes a figure an amount: present, numeric, not
 * negative. Module scope rather than inside the component because it no longer
 * reads the step, which also makes it directly testable.
 *
 * @returns the message to show, or '' when the value is fine.
 */
export const validateCreditLimit = (val: string): string => {
  if (!val) return 'Approved Credit Limit is required.';
  const num = parseFloat(val);
  if (isNaN(num)) return 'Approved Credit Limit must be a number.';
  if (num < 0) return 'Approved Credit Limit cannot be negative.';
  return '';
};

export default function StepDetail() {
  const { id: strategyId, stepId: sequenceId } = useParams<{ id: string; stepId: string }>();
  const navigate = useNavigate();

  const { data: step, isLoading, isError } = useCapitalAccessStepDetail(strategyId, sequenceId);

  const [creditLimit, setCreditLimit] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<CapitalAccessStatus>(CAPITAL_ACCESS_STATUS.APPROVED);
  const [validationError, setValidationError] = useState('');

  const submitMutation = useSubmitCapitalAccessStep(strategyId, sequenceId);

  useEffect(() => {
    if (step?.application) {
      setCreditLimit(step.application.credit_limit || '');
      setNotes(step.application.notes || '');
      const appStatus = step.application.status;
      if (appStatus === CAPITAL_ACCESS_STATUS.PENDING || appStatus === CAPITAL_ACCESS_STATUS.DECLINED) {
        setStatus(appStatus as CapitalAccessStatus);
      } else {
        setStatus(CAPITAL_ACCESS_STATUS.APPROVED);
      }
    } else {
      setCreditLimit('');
      setNotes('');
      setStatus(CAPITAL_ACCESS_STATUS.APPROVED);
    }
  }, [step]);

  if (isError) {
    return <Navigate to={`/credit-card-stacking/${strategyId}/roadmap`} />;
  }

  if (isLoading || !step) {
    return (
      <div className="page-content capital-access-page">
        <div className="container-fluid">
          <div className="ca-page-wrap text-start">
            {/* ── Page Header (Skeleton) ── */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="ca-back-btn disabled">
                <i className="ri-arrow-left-line fs-16"></i>
              </div>
              <div className="flex-grow-1">
                <div className="skeleton-line mb-2 ca-skeleton-title" />
                <div className="skeleton-line ca-skeleton-subtitle" />
              </div>
            </div>
            <CapitalAccessLoader type="checklist" />
          </div>
        </div>
      </div>
    );
  }

  // Block access to card steps during Next Play Delay period
  const isDelayLocked = step.play.reason_code === 'NEXT_PLAY_DELAY_ACTIVE' && !step.play.isCompleted;

  if (!step.play.isAccessible || isDelayLocked) {
    return <Navigate to="/credit-card-stacking/strategy" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLimit = creditLimit;
    if (status === CAPITAL_ACCESS_STATUS.APPROVED) {
      const errorMsg = validateCreditLimit(creditLimit);
      if (errorMsg) { setValidationError(errorMsg); return; }
    } else {
      finalLimit = '';
    }
    setValidationError('');
    try {
      await submitMutation.mutateAsync({
        credit_limit: finalLimit || null,
        notes: notes || null,
        status,
      });
      navigate(`/credit-card-stacking/${step.play.id}/roadmap`);
    } catch (err: any) {
      if (err.response?.data?.errors?.credit_limit) {
        setValidationError(err.response.data.errors.credit_limit);
      } else {
        setValidationError(err.response?.data?.message || 'Failed to submit application details.');
      }
    }
  };

  const scheduleLabel = (s: CapitalAccessStepDetail) => {
    if (s.access_time === 'Day' && s.access_day) {
      return `Day ${s.access_day}${s.access_day_time ? ` · ${s.access_day_time}` : ''}`;
    }
    return s.access_time ?? '';
  };

  const oddsNum = step.approval_odds ? parseInt(step.approval_odds, 10) : null;

  const statusConfig = {
    [CAPITAL_ACCESS_STATUS.APPROVED]: {
      icon: 'ri-checkbox-circle-fill',
      outlineIcon: 'ri-checkbox-circle-line',
      label: 'Approved',
      desc: 'I was approved for this card',
      colorClass: 'ca-status-card-success',
      textColor: 'text-success',
      badgeCls: 'bg-success-subtle text-success',
    },
    [CAPITAL_ACCESS_STATUS.PENDING]: {
      icon: 'ri-time-fill',
      outlineIcon: 'ri-time-line',
      label: 'Pending',
      desc: 'Application is still under review',
      colorClass: 'ca-status-card-warning',
      textColor: 'text-warning',
      badgeCls: 'bg-warning-subtle text-warning',
    },
    [CAPITAL_ACCESS_STATUS.DECLINED]: {
      icon: 'ri-close-circle-fill',
      outlineIcon: 'ri-close-circle-line',
      label: 'Declined',
      desc: 'Application was not approved',
      colorClass: 'ca-status-card-danger',
      textColor: 'text-danger',
      badgeCls: 'bg-danger-subtle text-danger',
    },
  } as const;

  const statuses = [
    CAPITAL_ACCESS_STATUS.APPROVED,
    CAPITAL_ACCESS_STATUS.PENDING,
    CAPITAL_ACCESS_STATUS.DECLINED,
  ] as CapitalAccessStatus[];

  const isSubmitted = !!(step.application && step.application.status === CAPITAL_ACCESS_STATUS.APPROVED);

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap text-start">

          {/* ── Page Header ── */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <Link
              to={`/credit-card-stacking/${step.play.id}/roadmap`}
              className="ca-back-btn"
              title="Back to Roadmap"
            >
              <i className="ri-arrow-left-line fs-16"></i>
            </Link>
            <div className="flex-grow-1">
              <h4 className="fs-20 mb-0 fw-bold text-dark">
                {step.card_name}
              </h4>
              <p className="ca-page-subtitle mb-0 mt-1">
                {step.play.name}&nbsp;&bull;&nbsp;Step {step.sequence_order}
              </p>
            </div>
          </div>

          <div className="ca-hero-card-premium">

            {/* ══════════════════════════════════
                ZONE 1 — Card Identity Header
            ══════════════════════════════════ */}
            <div className="ca-hero-header-premium">
              <div className="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
                {step.full_image_url ? (
                  <img
                    src={step.full_image_url}
                    alt={step.card_name}
                    className="rounded border bg-white flex-shrink-0 ca-card-img-thumb"
                  />
                ) : (
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                      <i className="ri-bank-card-line"></i>
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="ca-metric-label mb-0 text-truncate">
                    {step.play.name}&nbsp;&bull;&nbsp;Step {step.sequence_order}
                  </p>
                  <h5 className="fw-bold mb-0 fs-17 text-dark text-truncate">
                    {step.card_name}&nbsp;
                    <span className="text-muted fw-normal fs-14">({step.issuer})</span>
                  </h5>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                {isSubmitted && (
                  <span className="ca-outcome-badge">
                    <i className="ri-checkbox-circle-fill"></i> Submitted
                  </span>
                )}
                <span className="ca-checklist-badge-clear">
                  <i className="ri-calendar-event-line"></i>
                  {scheduleLabel(step)}
                </span>
              </div>
            </div>

            <div className="ca-card-body p-4">

              {/* ══════════════════════════════════
                  ZONE 2 — Key Metrics Row
              ══════════════════════════════════ */}
              <div className="row g-3 mb-4">
                {step.approval_odds && parseInt(step.approval_odds, 10) !== 0 && (
                  <div className="col-sm-4">
                    <div className="ca-metric-card-premium success-accent">
                      <div className="ca-metric-icon-wrap success-glow">
                        <i className="ri-percent-line"></i>
                      </div>
                      <span className="ca-metric-label-premium d-block">Approval Odds</span>
                      <p className={`ca-metric-value-premium mb-0 fs-24 ${oddsNum === null ? ''
                          : oddsNum >= 70 ? 'ca-odds-high'
                            : oddsNum >= 45 ? 'ca-odds-mid'
                              : 'ca-odds-low'
                        }`}>
                        {step.approval_odds}
                      </p>
                    </div>
                  </div>
                )}
                <div className={step.approval_odds && parseInt(step.approval_odds, 10) !== 0 ? 'col-sm-4' : 'col-sm-6'}>
                  <div className="ca-metric-card-premium">
                    <div className="ca-metric-icon-wrap primary-glow">
                      <i className="ri-money-dollar-circle-line"></i>
                    </div>
                    <span className="ca-metric-label-premium d-block">Estimated Limit</span>
                    <p className="ca-metric-value-premium mb-0 text-dark fs-24">
                      {step.exposure}
                    </p>
                  </div>
                </div>
                <div className={step.approval_odds && parseInt(step.approval_odds, 10) !== 0 ? 'col-sm-4' : 'col-sm-6'}>
                  <div className="ca-metric-card-premium warning-accent">
                    <div className="ca-metric-icon-wrap warning-glow">
                      <i className="ri-file-search-line"></i>
                    </div>
                    <span className="ca-metric-label-premium d-block">Hard Pull</span>
                    <p className={`ca-metric-value-premium mb-0 fs-24 ${step.hard_pull === 'Yes' ? 'text-danger' : 'text-success'}`}>
                      {step.hard_pull}
                    </p>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════
                  ZONE 3 — Why This Card + Requirements
              ══════════════════════════════════ */}
              <div className="row g-4 mb-4">
                <div className={step.requirements && step.requirements.length > 0 ? 'col-md-6' : 'col-12'}>
                  <div className="ca-insight-box h-100 mb-0">
                    <div className="ca-insight-header">
                      <i className="ri-lightbulb-flash-line"></i>
                      Why This Card?
                    </div>
                    <p className="ca-insight-text mb-0">{step.why_this_card}</p>
                  </div>
                </div>

                {step.requirements && step.requirements.length > 0 && (
                  <div className="col-md-6">
                    <div className="h-100">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="ca-section-label mb-0">Requirements</span>
                        <span className="badge bg-primary-subtle text-primary fs-11">
                          {step.requirements.length} items
                        </span>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {step.requirements.map((req: string, idx: number) => (
                          <div key={idx} className="ca-req-card">
                            <i className="ri-checkbox-circle-fill text-success fs-16 flex-shrink-0"></i>
                            <span className="fw-semibold fs-13 text-dark">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section Divider ── */}
              <div className="ca-section-divider">
                <span>Application Outcome</span>
              </div>

              {/* ══════════════════════════════════
                  ZONE 4A — Submitted / Read-Only View
              ══════════════════════════════════ */}
              {isSubmitted ? (
                <div className="ca-outcome-card">
                  {/* Outcome header banner */}
                  <div className="ca-outcome-header">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-success text-white ca-outcome-icon-circle"
                      >
                        <i className="ri-checkbox-circle-line fs-20"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark fs-15">Application Outcome Recorded</h6>
                        <p className="text-muted fs-12 mb-0">
                          Your result for this step has been saved and locked.
                        </p>
                      </div>
                    </div>
                    <span className={`badge fs-12 px-3 py-2 ${statusConfig[CAPITAL_ACCESS_STATUS.APPROVED].badgeCls}`}>
                      <i className="ri-checkbox-circle-fill me-1"></i>
                      {step.application!.status}
                    </span>
                  </div>

                  {/* Outcome body */}
                  <div className="p-4">
                    <div className="row g-4">
                      {/* Approved credit limit — large display */}
                      <div className="col-md-5">
                        <div className="ca-limit-display-card h-100">
                          <span
                            className="d-block fs-11 fw-bold text-uppercase mb-1 ca-label-success"
                          >
                            Approved Credit Limit
                          </span>
                          <div className="ca-limit-val">
                            {step.application!.credit_limit
                              ? `$${parseFloat(step.application!.credit_limit).toLocaleString()}`
                              : '$0.00'}
                          </div>
                          <p className="text-muted fs-12 mb-0 mt-2">
                            Within estimated range of <strong>{step.exposure}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="col-md-7">
                        <span className="d-block fs-11 fw-bold text-uppercase text-muted mb-2 ca-label-muted">
                          Submitted Notes
                        </span>
                        {step.application!.notes ? (
                          <div className="ca-outcome-notes-box">
                            <i className="ri-double-quotes-l text-muted fs-18 me-1"></i>
                            {step.application!.notes}
                          </div>
                        ) : (
                          <div className="ca-outcome-notes-box text-muted fst-italic">
                            No notes were submitted for this step.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                      <Link
                        to={`/credit-card-stacking/${step.play.id}/roadmap`}
                        className="ca-btn ca-btn-primary ca-btn-min-w"
                      >
                        <i className="ri-arrow-left-line me-1"></i> Back to Roadmap
                      </Link>
                    </div>
                  </div>
                </div>

              ) : (

                /* ══════════════════════════════════
                    ZONE 4B — Application Form
                ══════════════════════════════════ */
                <form onSubmit={handleSubmit}>
                  <div className="ca-form-card">

                    {/* Form header */}
                    <div className="ca-form-header d-flex align-items-center gap-2">
                      <i className="ri-edit-2-line text-primary fs-16"></i>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark fs-15">Record Your Outcome</h6>
                        <p className="text-muted fs-12 mb-0">
                          Tell us what happened when you applied for this card.
                        </p>
                      </div>
                    </div>

                    <div className="p-4">

                      {/* ── Status Selector Cards ── */}
                      <div className="mb-4">
                        <label className="d-block fw-bold fs-13 text-dark mb-3">
                          What was the result?
                        </label>
                        <div className="row g-3">
                          {statuses.map(st => {
                            const cfg = statusConfig[st];
                            const isSelected = status === st;
                            return (
                              <div key={st} className="col-md-4">
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setStatus(st);
                                    if (st !== CAPITAL_ACCESS_STATUS.APPROVED) setValidationError('');
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setStatus(st);
                                      if (st !== CAPITAL_ACCESS_STATUS.APPROVED) setValidationError('');
                                    }
                                  }}
                                  className={`ca-status-selector-card ${isSelected
                                      ? st === CAPITAL_ACCESS_STATUS.APPROVED
                                        ? 'selected-approved'
                                        : st === CAPITAL_ACCESS_STATUS.PENDING
                                          ? 'selected-pending'
                                          : 'selected-declined'
                                      : ''
                                    }`}
                                >
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <i className={`${isSelected ? cfg.icon : cfg.outlineIcon} fs-22 ${cfg.textColor}`}></i>
                                    <span className={`fw-bold fs-14 ${cfg.textColor}`}>{cfg.label}</span>
                                  </div>
                                  <p className="text-muted fs-12 mb-0">{cfg.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Credit Limit Input (only for APPROVED) ── */}
                      {status === CAPITAL_ACCESS_STATUS.APPROVED && (
                        <div className="mb-4">
                          <label htmlFor="creditLimitInput" className="form-label fw-semibold text-dark fs-13">
                            Approved Credit Limit ($) <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input
                              type="text"
                              id="creditLimitInput"
                              className={`form-control ${validationError ? 'is-invalid' : ''}`}
                              placeholder="e.g. 5000"
                              value={creditLimit}
                              onChange={(e) => {
                                setCreditLimit(e.target.value);
                                setValidationError(validateCreditLimit(e.target.value));
                              }}
                            />
                            {validationError && (
                              <div className="invalid-feedback">{validationError}</div>
                            )}
                          </div>
                          <span className="form-text text-muted fs-12">
                            Estimated range: <strong>{step.exposure}</strong>
                          </span>
                        </div>
                      )}

                      {/* ── Notes ── */}
                      <div className="mb-4">
                        <label htmlFor="notesInput" className="form-label fw-semibold text-dark fs-13">
                          Notes / Details
                        </label>
                        <textarea
                          id="notesInput"
                          className="form-control"
                          rows={3}
                          placeholder="Provide any application notes (e.g. key requirements checked, verification steps needed, etc.)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>

                      {/* ── Form Actions ── */}
                      <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                        <Link
                          to={`/credit-card-stacking/${step.play.id}/roadmap`}
                          className="ca-btn ca-btn-outline ca-btn-min-w"
                        >
                          Cancel
                        </Link>
                        <button
                          type="submit"
                          className="ca-btn ca-btn-primary ca-btn-min-w"
                          disabled={submitMutation.isPending}
                        >
                          {submitMutation.isPending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Saving…
                            </>
                          ) : (
                            <>
                              <i className="ri-save-3-line me-1"></i> Save & Continue
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
