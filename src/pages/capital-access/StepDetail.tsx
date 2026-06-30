import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useCapitalAccessStepDetail, useSubmitCapitalAccessStep, useCapitalAccessStrategies } from '../../modules/capital-access/queries';
import CapitalAccessLoader from '../../components/Loader/CapitalAccessLoader';
import type { CapitalAccessStepDetail } from '../../modules/capital-access/types';
import { toast } from 'react-toastify';
import { CAPITAL_ACCESS_STATUS, type CapitalAccessStatus } from '../../config/capitalAccessStatusOptions';

export default function StepDetail() {
  const { id: strategyId, stepId: sequenceId } = useParams<{ id: string; stepId: string }>();

  const { data: step, isLoading: isStepLoading, isError } = useCapitalAccessStepDetail(strategyId, sequenceId);
  const { data: strategies, isLoading: isStrategiesLoading } = useCapitalAccessStrategies();

  const isLoading = isStepLoading || isStrategiesLoading;

  const recommendedPlay = strategies?.find(p => p.isRecommended) || strategies?.[0];
  const isAccessible = recommendedPlay ? String(recommendedPlay.id) === String(strategyId) : true;

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

  const validateCreditLimit = (val: string) => {
    if (!val) {
      return 'Approved Credit Limit is required.';
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      return 'Approved Credit Limit must be a number.';
    }
    if (num < 0) {
      return 'Approved Credit Limit cannot be negative.';
    }
    if (step) {
      const min = step.est_limit_min ?? 0;
      if (num < min) {
        return `Approved Credit Limit must be at least $${min.toLocaleString()}.`;
      }
      if (step.est_limit_max !== null && step.est_limit_max !== undefined) {
        const max = step.est_limit_max;
        if (num > max) {
          return `Approved Credit Limit must be at most $${max.toLocaleString()}.`;
        }
      }
    }
    return '';
  };

  if (!isLoading && (isError || !step || !isAccessible)) {
    return <Navigate to="/capital-access/strategy" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLimit = creditLimit;
    if (status === CAPITAL_ACCESS_STATUS.APPROVED) {
      const errorMsg = validateCreditLimit(creditLimit);
      if (errorMsg) {
        setValidationError(errorMsg);
        return;
      }
    } else {
      finalLimit = '';
    }
    setValidationError('');
    try {
      await submitMutation.mutateAsync({
        credit_limit: finalLimit || null,
        notes: notes || null,
        status: status,
      });
      toast.success('Application details submitted successfully!');
    } catch (err: any) {
      if (err.response?.data?.errors?.credit_limit) {
        setValidationError(err.response.data.errors.credit_limit);
      }
      toast.error(err.response?.data?.message || 'Failed to submit application details');
    }
  };

  const scheduleLabel = (s: CapitalAccessStepDetail) => {
    if (s.access_time === 'Day' && s.access_day) {
      return `Day ${s.access_day}${s.access_day_time ? ` (${s.access_day_time})` : ''}`;
    }
    return s.access_time ?? '';
  };

  const oddsNum = (step && step.approval_odds) ? parseInt(step.approval_odds, 10) : null;
  const oddsColor = oddsNum === null ? 'inherit' : oddsNum >= 70 ? 'var(--vz-success)' : oddsNum >= 45 ? '#f59e0b' : 'var(--vz-danger)';

  const statuses = [
    CAPITAL_ACCESS_STATUS.APPROVED,
    CAPITAL_ACCESS_STATUS.PENDING,
    CAPITAL_ACCESS_STATUS.DECLINED,
  ];

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-page-wrap text-start">

          {/* ── Page Header ── */}
          <div className="row pb-1 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 py-2 w-100">
                <Link
                  to={step ? `/capital-access/${step.play.id}/roadmap` : '/capital-access/strategy'}
                  className="ca-back-btn"
                  title="Back to Roadmap"
                >
                  <i className="ri-arrow-left-line fs-16"></i>
                </Link>
                <div>
                  <h4 className="fs-22 mb-1 fw-bold text-dark">
                    {isLoading || !step ? 'Card Detail' : `${step.card_name}`}
                  </h4>
                  <p className="ca-page-subtitle">
                    {isLoading || !step ? '' : `${step.play.name} · Step ${step.sequence_order}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading || !step ? (
            <CapitalAccessLoader type="checklist" />
          ) : (
            <div className="ca-hero-card-premium">
              {/* ── Card Header ── */}
              <div className="ca-hero-header-premium">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  {step.full_image_url ? (
                    <img
                      src={step.full_image_url}
                      alt={step.card_name}
                      className="rounded border bg-white"
                      style={{ width: '60px', height: '38px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="avatar-sm flex-shrink-0">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                        <i className="ri-bank-card-line"></i>
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="ca-metric-label mb-0">{step.play.name} &bull; Step {step.sequence_order}</p>
                    <h5 className="fw-bold mb-0 fs-17 text-dark">
                      {step.card_name}
                      <span className="text-muted fw-normal fs-14"> ({step.issuer})</span>
                    </h5>
                  </div>
                </div>
                <span className="ca-checklist-badge-clear flex-shrink-0">
                  <i className="ri-calendar-event-line"></i> {scheduleLabel(step)}
                </span>
              </div>

              <div className="ca-card-body p-4">
                {/* ── Metrics Row ── */}
                <div className="row g-3 mb-4">
                  {step.approval_odds && parseInt(step.approval_odds, 10) !== 0 && (
                    <div className="col-sm-4">
                      <div className="ca-metric-card-premium success-accent">
                        <div className="ca-metric-icon-wrap success-glow">
                          <i className="ri-percent-line"></i>
                        </div>
                        <span className="ca-metric-label-premium d-block mb-1">Approval Odds</span>
                        <p className="ca-metric-value-premium mb-0" style={{ color: oddsColor }}>
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
                      <span className="ca-metric-label-premium d-block mb-1">Est. Limit</span>
                      <p className="ca-metric-value-premium mb-0 text-dark">
                        {step.exposure}
                      </p>
                    </div>
                  </div>
                  <div className={step.approval_odds && parseInt(step.approval_odds, 10) !== 0 ? 'col-sm-4' : 'col-sm-6'}>
                    <div className="ca-metric-card-premium warning-accent">
                      <div className="ca-metric-icon-wrap warning-glow">
                        <i className="ri-file-search-line"></i>
                      </div>
                      <span className="ca-metric-label-premium d-block mb-1">Hard Pull</span>
                      <p className={`ca-metric-value-premium mb-0 ${step.hard_pull === 'Yes' ? 'danger' : 'success'}`}>
                        {step.hard_pull}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Why This Card & Requirements Side by Side ── */}
                <div className="row g-4 mb-4">
                  <div className={step.requirements && step.requirements.length > 0 ? "col-md-6" : "col-12"}>
                    <div className="ca-insight-box h-100 mb-0">
                      <div className="ca-insight-header">
                        <i className="ri-lightbulb-flash-line"></i>
                        <span> Why This Card?</span>
                      </div>
                      <p className="ca-insight-text">
                        {step.why_this_card}
                      </p>
                    </div>
                  </div>
                  {step.requirements && step.requirements.length > 0 && (
                    <div className="col-md-6">
                      <div className="d-flex flex-column h-100">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="ca-section-label mb-0">Requirements</span>
                          <span className="text-muted fs-12">{step.requirements.length} items</span>
                        </div>
                        <div className="row g-2">
                          {step.requirements.map((req: string, idx: number) => (
                            <div key={idx} className="col-12">
                              <div className="ca-req-card">
                                <i className="ri-checkbox-circle-fill text-success fs-16 flex-shrink-0"></i>
                                <span className="fw-semibold fs-13 text-dark">{req}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="ca-divider my-4" />

                {/* ── Outcome / Result Section ── */}
                {step.application && step.application.status === CAPITAL_ACCESS_STATUS.APPROVED ? (
                  /* ── Submitted Outcome View (read-only, approved only) ── */
                  <div className="p-4 border rounded bg-light">
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <i className="ri-checkbox-circle-line text-success fs-20"></i>
                      <h6 className="fw-bold mb-0 text-dark fs-15">Application Outcome Submitted</h6>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <span className="text-muted fs-11 fw-bold text-uppercase d-block mb-1">Status</span>
                        <span className={`badge fs-13 px-3 py-2 ${
                          step.application.status === CAPITAL_ACCESS_STATUS.APPROVED ? 'bg-success-subtle text-success' :
                          step.application.status === CAPITAL_ACCESS_STATUS.PENDING ? 'bg-warning-subtle text-warning' :
                          'bg-danger-subtle text-danger'
                        }`}>
                          {step.application.status}
                        </span>
                      </div>

                      {step.application.status === CAPITAL_ACCESS_STATUS.APPROVED && (
                        <div className="col-md-4">
                          <span className="text-muted fs-11 fw-bold text-uppercase d-block mb-1">Approved Limit</span>
                          <span className="fw-bold fs-16 text-dark d-block mt-2">
                            {step.application.credit_limit ? `$${parseFloat(step.application.credit_limit).toLocaleString()}` : '$0.00'}
                          </span>
                        </div>
                      )}

                      <div className="col-12 mt-3">
                        <span className="text-muted fs-11 fw-bold text-uppercase d-block mb-2">Submitted Notes</span>
                        {step.application.notes ? (
                          <div className="ca-outcome-notes-box p-3 bg-white border rounded">
                            "{step.application.notes}"
                          </div>
                        ) : (
                          <span className="text-muted fs-13 italic">No notes submitted.</span>
                        )}
                      </div>
                    </div>

                    <div className="col-12 mt-4 d-flex justify-content-end gap-3">
                      <Link
                        to={`/capital-access/${step.play.id}/roadmap`}
                        className="ca-btn ca-btn-outline"
                        style={{ minWidth: '160px' }}
                      >
                        <i className="ri-arrow-left-line"></i> Back to Roadmap
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* ── Form View (Before Submit) ── */
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-bold fs-14 mb-2 text-dark">What Happened?</label>
                      <div className="d-flex align-items-center gap-4 p-3 border rounded bg-white">
                        {statuses.map(st => {
                          const isSelected = status === st;
                          let iconClass = 'ri-checkbox-blank-circle-line text-muted';
                          if (isSelected) {
                            if (st === CAPITAL_ACCESS_STATUS.APPROVED) iconClass = 'ri-checkbox-circle-fill text-success';
                            else if (st === CAPITAL_ACCESS_STATUS.PENDING) iconClass = 'ri-checkbox-circle-fill text-warning';
                            else if (st === CAPITAL_ACCESS_STATUS.DECLINED) iconClass = 'ri-checkbox-circle-fill text-danger';
                          }
                          return (
                            <div
                              key={st}
                              className="d-flex align-items-center gap-2 cursor-pointer"
                              onClick={() => {
                                setStatus(st);
                                if (st !== CAPITAL_ACCESS_STATUS.APPROVED) {
                                  setValidationError('');
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <i className={`${iconClass} fs-20`}></i>
                              <span className={`fs-14 ${isSelected ? 'fw-bold text-dark' : 'text-muted'}`}>{st}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {status === CAPITAL_ACCESS_STATUS.APPROVED && (
                      <div className="mb-4">
                        <label className="form-label fw-bold fs-14 mb-2 text-dark">
                          Enter Credit Limit (if approved) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted">$</span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="e.g. 12000"
                            value={creditLimit}
                            onChange={e => {
                              const val = e.target.value;
                              setCreditLimit(val);
                              if (validationError) {
                                setValidationError(validateCreditLimit(val));
                              }
                            }}
                          />
                        </div>
                        {validationError && (
                          <div className="invalid-feedback d-block mt-1">
                            {validationError}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="form-label fw-bold fs-14 mb-2 text-dark">
                        Notes <span className="text-muted fw-normal">(optional)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Add any notes here..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Link
                        to={`/capital-access/${step.play.id}/roadmap`}
                        className="ca-btn ca-btn-sm ca-btn-outline"
                        style={{ minWidth: '130px' }}
                      >
                        Back to Roadmap
                      </Link>
                      <button
                        type="submit"
                        className="ca-btn ca-btn-sm ca-btn-primary"
                        style={{ minWidth: '130px', background: 'var(--primary-color, #405189)', borderColor: 'var(--primary-color, #405189)' }}
                        disabled={submitMutation.isPending}
                      >
                        {submitMutation.isPending ? 'Saving...' : 'Save & Continue'}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
