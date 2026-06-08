import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';



export default function StepDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state || !location.state.step || !location.state.play) {
    return <Navigate to="/credit-builder/strategy" />;
  }

  const { step, play } = location.state;
  const isCompleted = step.status === 'Completed';

  const [entryMode, setEntryMode] = useState(isCompleted);
  const [resultStatus, setResultStatus] = useState(step.result?.status || 'Approved');
  const [creditLimit, setCreditLimit] = useState(step.result?.limit ? step.result.limit.toString() : '');
  const [notes, setNotes] = useState(step.result?.notes || '');

  const handleSave = () => {
    const updatedStep = {
      ...step,
      status: 'Completed',
      result: {
        status: resultStatus,
        limit: resultStatus === 'Approved' ? Number(creditLimit) : 0,
        notes,
      },
    };
    navigate(`/credit-builder/strategy/${play.id}/roadmap`, { state: { updatedStep } });
  };

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">

        <div className="ca-page-wrap" style={{ maxWidth: '680px' }}>
          {/* ── Page Header ── */}
          <div className="row pb-1 page-subheader-sticky bg-body mb-3">
            <div className="col-12">
              <div className="text-center py-2 w-100">
                <h4 className="fs-20 mb-1 fw-bold">{step.issuer} — {step.card_name}</h4>
                <p className="ca-page-subtitle">
                  Review details, eligibility criteria, and submit your application limit status.
                </p>
              </div>
            </div>
          </div>

          <div className="ca-card">

            {/* Card Header */}
            <div className="ca-card-header">
              <div className="avatar-sm flex-shrink-0">
                <span className={`avatar-title ${isCompleted ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} rounded-circle fs-20`}>
                  <i className={isCompleted ? 'ri-checkbox-circle-line' : 'ri-bank-card-line'}></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <p className="ca-metric-label mb-0">Day {step.day} · {play.name}</p>
                <h5 className="fw-bold mb-0 fs-16">{step.issuer} — {step.card_name}</h5>
              </div>
            </div>

            <div className="ca-card-body">

              {!entryMode ? (
                <>
                  {/* Why box */}
                  <div className="ca-why-box mb-4">
                    <p className="fw-semibold fs-13 mb-1" style={{ color: 'var(--vz-primary)' }}>
                      <i className="ri-lightbulb-line me-1"></i> Why This Card?
                    </p>
                    <p className="mb-0">{step.why}</p>
                  </div>

                  {/* Metrics */}
                  <div className="row g-3 mb-4">
                    <div className="col-3">
                      <div className="ca-metric">
                        <span className="ca-metric-label">Approval Odds</span>
                        <p className="ca-metric-value success mb-0">{step.approval_odds}</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="ca-metric">
                        <span className="ca-metric-label">Est. Limit</span>
                        <p className="ca-metric-value mb-0" style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {step.exposure}
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="ca-metric">
                        <span className="ca-metric-label">Hard Pull</span>
                        <p className="ca-metric-value mb-0" style={{ fontSize: '15px' }}>{step.hard_pull}</p>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <h6 className="fw-semibold fs-14 mb-3">Requirements</h6>
                  <div className="mb-4">
                    {step.requirements.map((req: string, idx: number) => (
                      <div key={idx} className="ca-req-item">
                        <i className="ri-check-line"></i>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="ca-divider" />

                  <button
                    onClick={() => setEntryMode(true)}
                    className="ca-btn ca-btn-primary w-100 justify-content-center"
                    style={{ fontSize: '15px', padding: '13px 24px' }}
                  >
                    <i className="ri-external-link-line"></i> Apply Now
                  </button>
                  <p className="text-center text-muted fs-12 mt-2 mb-0">
                    Opens in a new tab — come back here to log your result.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="avatar-sm mx-auto mb-3">
                      <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                        <i className="ri-survey-line"></i>
                      </span>
                    </div>
                    <h5 className="fw-bold mb-1 fs-16">Log Your Result</h5>
                    <p className="text-muted fs-13 mb-0">What was the outcome of your application?</p>
                  </div>

                  {/* Radio options */}
                  <div className="ca-option-group mb-4">
                    <div className="ca-option ca-option-success">
                      <input type="radio" name="resultStatus" id="resApproved"
                        checked={resultStatus === 'Approved'} onChange={() => setResultStatus('Approved')} />
                      <label htmlFor="resApproved">
                        <i className="ri-checkbox-circle-line"></i>
                        Approved
                      </label>
                    </div>
                    <div className="ca-option">
                      <input type="radio" name="resultStatus" id="resPending"
                        checked={resultStatus === 'Pending'} onChange={() => setResultStatus('Pending')} />
                      <label htmlFor="resPending">
                        <i className="ri-time-line"></i>
                        Pending
                      </label>
                    </div>
                    <div className="ca-option ca-option-danger">
                      <input type="radio" name="resultStatus" id="resDeclined"
                        checked={resultStatus === 'Declined'} onChange={() => setResultStatus('Declined')} />
                      <label htmlFor="resDeclined">
                        <i className="ri-close-circle-line"></i>
                        Declined
                      </label>
                    </div>
                  </div>

                  {resultStatus === 'Approved' && (
                    <div className="mb-4 p-3 rounded-3"
                      style={{ background: 'rgba(10, 179, 156, 0.05)', border: '1px solid rgba(10, 179, 156, 0.2)' }}>
                      <label className="form-label fw-semibold fs-13 mb-2" style={{ color: 'var(--vz-success)' }}>
                        <i className="ri-money-dollar-circle-line me-1"></i> Approved Credit Limit
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"
                          style={{ border: '1px solid var(--vz-border-color)', borderRight: 0 }}>$</span>
                        <input
                          type="number"
                          className="form-control fw-semibold"
                          placeholder="e.g. 12000"
                          value={creditLimit}
                          onChange={e => setCreditLimit(e.target.value)}
                          style={{ border: '1px solid var(--vz-border-color)' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="form-label fw-semibold fs-13 mb-2">
                      Notes <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <textarea
                      className="form-control fs-13"
                      rows={3}
                      placeholder="Reference numbers, follow-ups, observations..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      style={{ border: '1px solid var(--vz-border-color)', borderRadius: '8px' }}
                    ></textarea>
                  </div>

                  <hr className="ca-divider" />

                  <div className="d-flex gap-3">
                    <button onClick={() => setEntryMode(false)} className="ca-btn ca-btn-outline flex-fill">
                      <i className="ri-arrow-left-line"></i> Back
                    </button>
                    <button onClick={handleSave} className="ca-btn ca-btn-primary flex-fill justify-content-center">
                      Save & Continue <i className="ri-check-line"></i>
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
