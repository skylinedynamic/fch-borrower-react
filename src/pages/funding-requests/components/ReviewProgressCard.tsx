import React from 'react';
import '../../../../assets/css/funding-requests.css';
import { 
    FUNDING_REVIEW_STATUS, 
    getFundingReviewProgress, 
    FUNDING_REVIEW_TIMELINE_STEPS, 
    FUNDING_REVIEW_GUIDELINE_CARDS,
    FUNDING_REVIEW_NEXT_STEP,
    FUNDING_REVIEW_AWAITING_APPROVAL,
    FUNDING_REVIEW_AWAITING_APPROVAL_NOTE,
} from '../../../config/funding';

interface ReviewProgressCardProps {
    status: string;
    createdAt?: string;
    updatedAt?: string;
    rejectReason?: string;
}

export default function ReviewProgressCard({
    status,
    createdAt,
    updatedAt,
    rejectReason,
}: ReviewProgressCardProps) {

    const progressPercentage = getFundingReviewProgress(status);
    const isRejected = status === FUNDING_REVIEW_STATUS.REJECTED;
    const isCanceled = status === FUNDING_REVIEW_STATUS.CANCELED;
    const isErrorState = isRejected || isCanceled;
const terminalStatuses = [FUNDING_REVIEW_STATUS.APPROVED, FUNDING_REVIEW_STATUS.REJECTED, FUNDING_REVIEW_STATUS.CANCELED];
    const isCurrentTerminal = terminalStatuses.includes(status);
    const terminalKey = isCurrentTerminal ? status : FUNDING_REVIEW_STATUS.APPROVED;

    // What the current status means for the borrower, and - until approval -
    // that the funding application opens only once the request is approved.
    const nextStep = FUNDING_REVIEW_NEXT_STEP[status];
    const awaitingApproval = FUNDING_REVIEW_AWAITING_APPROVAL.includes(status);

    const displaySteps = FUNDING_REVIEW_TIMELINE_STEPS.filter(step => {
        if (terminalStatuses.includes(step.key)) {
            return step.key === terminalKey;
        }
        // If it's an error state, we don't show Accepted or In Progress
        // because we don't know the exact history and it's confusing to see them.
        if (isErrorState && (step.key === FUNDING_REVIEW_STATUS.ACCEPTED || step.key === FUNDING_REVIEW_STATUS.IN_PROGRESS)) {
            return false;
        }
        return true;
    });

    let currentStatusIndex = displaySteps.findIndex((x) => x.key === status);
    if (currentStatusIndex === -1) {
        currentStatusIndex = 1;
    }

    const formatDateTime = (date?: string) => {
        if (!date) return null;
        const d = new Date(date);
        const datePart = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(d);
        const timePart = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
        return (
            <>
                <div className="mb-1">{datePart}</div>
                <div>{timePart}</div>
            </>
        );
    };

    return (
        <div className="card shadow-sm border-0 mb-4 rounded-3">
            <div className="card-header bg-white border-bottom border-light p-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                        <div
                            className="d-flex align-items-center justify-content-center rounded-3 fr-progress-icon-badge"
                        >
                            <i className="ri-line-chart-line fs-4"></i>
                        </div>
                        <div>
                            <h5 className="card-title mb-1 fs-16 fw-bold fr-progress-title">Review Progress</h5>
                            <p className="mb-0 text-muted fs-13">Track the progress of this funding request</p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center position-relative fr-progress-ring-wrap flex-shrink-0">
                        <svg width="76" height="76" className="fr-progress-ring-svg">
                            <circle cx="38" cy="38" r="34" stroke="#f1f5f9" strokeWidth="6" fill="none" />
                            <circle cx="38" cy="38" r="34" stroke={isErrorState ? '#ef4444' : progressPercentage === 100 ? '#22c55e' : '#2563eb'} strokeWidth="6" fill="none"
                                strokeDasharray="213" strokeDashoffset={213 - (213 * progressPercentage / 100)}
                                strokeLinecap="round" />
                        </svg>
                        <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                            <span className="fw-bolder text-dark fr-progress-pct">{progressPercentage}%</span>
                            <span className="fw-bold text-muted fr-progress-complete-label">Complete</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-body p-0 pt-4">

                {/* Timeline */}
                <div className="px-4 pb-4 overflow-x-auto">
                    <div className="d-flex w-100 position-relative fr-timeline-track align-items-start">
                        {displaySteps.map((step, idx) => {
                            const completed = idx < currentStatusIndex;
                            const current = idx === currentStatusIndex;
                            const future = idx > currentStatusIndex;

                            let iconClass = step.icon;
                            if (completed) iconClass = 'ri-check-line';
                            if (isErrorState && current) iconClass = isCanceled ? 'ri-stop-circle-line' : 'ri-close-line';

                            const lineCompleted = idx < currentStatusIndex - 1;
                            const lineActive = idx === currentStatusIndex - 1;

                            const getStatusColor = (key: string) => {
                                if (key === 'SUBMITTED') return '#16a34a';
                                if (key === FUNDING_REVIEW_STATUS.PENDING) return '#10b981';
                                if (key === FUNDING_REVIEW_STATUS.IN_PROGRESS) return '#3b82f6';
                                if (key === FUNDING_REVIEW_STATUS.ACCEPTED) return '#06B6D4';
                                if (key === FUNDING_REVIEW_STATUS.APPROVED) return '#10b981';
                                if (key === FUNDING_REVIEW_STATUS.REJECTED) return '#ef4444';
                                if (key === FUNDING_REVIEW_STATUS.CANCELED) return '#ef4444';
                                return '#3b82f6';
                            };

                            const stepColor = getStatusColor(step.key);

                            const terminalLabel = terminalKey === FUNDING_REVIEW_STATUS.REJECTED ? 'Rejected' : terminalKey === FUNDING_REVIEW_STATUS.CANCELED ? 'Canceled' : 'Approved';

                            return (
                                <React.Fragment key={step.key}>
                                    <div className="d-flex flex-column align-items-center position-relative fr-step-col">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 36,
                                                height: 36,
                                                backgroundColor: completed || current ? stepColor : '#fff',
                                                color: completed || current ? '#fff' : '#94a3b8',
                                                border: future ? '1.5px solid #cbd5e1' : 'none',
                                                zIndex: 2,
                                                boxShadow: current ? `0 0 0 4px ${stepColor}25` : 'none'
                                            }}
                                        >
                                            <i className={`${iconClass} fs-5`} />
                                        </div>

                                        <div
                                            className="mt-2 fs-13 fw-semibold text-center"
                                            style={{ color: completed || current ? stepColor : '#64748b' }}
                                        >
                                            {step.label}
                                        </div>

                                        {step.subtext && current && (
                                            <div className="text-center mt-1 fr-step-subtext">
                                                {step.subtext}
                                            </div>
                                        )}

                                        {idx === 0 && createdAt && (
                                            <div className="text-center mt-1 fw-medium fr-step-subtext">
                                                {formatDateTime(createdAt)}
                                            </div>
                                        )}
                                        {current && updatedAt && (
                                            <div className="text-center mt-1 fw-medium fr-step-subtext">
                                                {formatDateTime(updatedAt)}
                                            </div>
                                        )}
                                    </div>

                                    {idx < displaySteps.length - 1 && (
                                        <div
                                            className="flex-grow-1 fr-step-connector"
                                            style={{
                                                backgroundColor: lineCompleted || lineActive ? getStatusColor(displaySteps[idx + 1].key) : '#e2e8f0',
                                            }}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* What happens next */}
                {nextStep && (
                    <section aria-labelledby="fr-next-step-title" className="px-4 pb-4">
                        <div
                            className={`d-flex align-items-start gap-2 p-3 rounded-3 border ${isErrorState ? 'bg-danger-subtle border-danger-subtle' : status === FUNDING_REVIEW_STATUS.APPROVED ? 'bg-success-subtle border-success-subtle' : 'bg-light'}`}
                        >
                            <i className="ri-lightbulb-flash-line fs-5 fr-progress-title"></i>
                            <div>
                                <h6 id="fr-next-step-title" className="mb-1 fw-bold fs-13 fr-progress-title">What happens next</h6>
                                <p className="mb-0 fs-13 text-dark">{nextStep}</p>
                                {awaitingApproval && (
                                    <p className="mb-0 mt-1 fs-13 text-muted">
                                        <i className="ri-lock-line me-1"></i>{FUNDING_REVIEW_AWAITING_APPROVAL_NOTE}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <hr className="my-0 border-light" />

                {/* Status Guideline */}
                <section aria-labelledby="fr-status-guideline-title" className="p-4 pt-3">
                    <div className="d-flex align-items-center mb-3">
                        <i className="ri-information-line fs-5 me-2 fr-progress-title"></i>
                        <h5 id="fr-status-guideline-title" className="mb-0 fw-bold fs-15 fr-progress-title">
                            Status Guideline
                        </h5>
                    </div>
                    <p className="text-muted fs-13 mb-3">Your funding request goes through 6 stages. Here's what each status means:</p>

                    {/* One card per status, three to a row, each tinted with its status
                        colour; the request's current status is outlined and badged. */}
                    <ul className="row g-3 list-unstyled mb-0">
                        {FUNDING_REVIEW_GUIDELINE_CARDS.map((item) => {
                            const isCurrent = item.label === status;
                            return (
                                <li
                                    key={item.label}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    className="col-12 col-sm-6 col-md-4"
                                >
                                    <div
                                        className="fr-guideline-card h-100 p-3 rounded-3"
                                        style={{
                                            backgroundColor: `${item.color}${isCurrent ? '24' : '0f'}`,
                                            border: `${isCurrent ? 2 : 1}px solid ${item.color}${isCurrent ? '' : '40'}`,
                                        }}
                                    >
                                        {/* Icon and title on one row; the description uses the card's full width below. */}
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <div
                                                className="d-flex align-items-center justify-content-center rounded-circle text-white"
                                                style={{ width: 32, height: 32, background: item.color, flexShrink: 0 }}
                                            >
                                                <i className={`${item.icon} fs-16`}></i>
                                            </div>
                                            <h6 className="mb-0 fw-bold text-dark fs-14">{item.label}</h6>
                                            {isCurrent && (
                                                <span className="badge rounded-pill fs-11" style={{ backgroundColor: item.color }}>Current</span>
                                            )}
                                        </div>
                                        <p className="mb-0 fs-13 text-muted text-start">{item.desc}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>

            </div>
        </div>
    );
}
