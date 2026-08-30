import React from 'react';
import '../../../../assets/css/funding-requests.css';
import { 
    FUNDING_REVIEW_STATUS, 
    getFundingReviewProgress, 
    FUNDING_REVIEW_TIMELINE_STEPS, 
    FUNDING_REVIEW_GUIDELINE_CARDS
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
    const guidelineCards = FUNDING_REVIEW_GUIDELINE_CARDS;
    
    const terminalStatuses = [FUNDING_REVIEW_STATUS.APPROVED, FUNDING_REVIEW_STATUS.REJECTED, FUNDING_REVIEW_STATUS.CANCELED];
    const isCurrentTerminal = terminalStatuses.includes(status);
    const terminalKey = isCurrentTerminal ? status : FUNDING_REVIEW_STATUS.APPROVED;

    const baseSteps = [
        { key: FUNDING_REVIEW_STATUS.PENDING, label: FUNDING_REVIEW_STATUS.PENDING, subtext: 'We have received your request.', icon: 'ri-file-text-line' },
        { key: FUNDING_REVIEW_STATUS.IN_PROGRESS, label: FUNDING_REVIEW_STATUS.IN_PROGRESS, subtext: 'Our team is reviewing.', icon: 'ri-search-eye-line' },
        { key: FUNDING_REVIEW_STATUS.ACCEPTED, label: FUNDING_REVIEW_STATUS.ACCEPTED, subtext: 'Request accepted, processing.', icon: 'ri-checkbox-circle-line' },
        { key: FUNDING_REVIEW_STATUS.APPROVED, label: FUNDING_REVIEW_STATUS.APPROVED, subtext: 'Application is approved.', icon: 'ri-check-double-line' }
    ];

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

                <hr className="my-0 border-light" />

                {/* Status Guideline */}
                <div className="p-4 pt-3">
                    <div className="d-flex align-items-center mb-3">
                        <i className="ri-information-line fs-5 me-2 fr-progress-title"></i>
                        <h6 className="mb-0 fw-bold fr-progress-title">
                            Status Guideline
                        </h6>
                    </div>

                    <div className="row g-2">
                        {FUNDING_REVIEW_GUIDELINE_CARDS.map((item, idx) => (
                            <div key={item.label} className="col-12 col-md-6 col-xl-4">
                                <div className="d-flex align-items-center p-2 px-xl-2 rounded-3 h-100" style={{
                                    backgroundColor: item.bg,
                                    border: `1px solid ${item.border}`
                                }}>
                                    <div className="d-flex align-items-center justify-content-center rounded-circle text-white me-2" style={{ width: 24, height: 24, background: item.iconBg, flexShrink: 0 }}>
                                        {item.icon && <i className={`${item.icon} fs-12`}></i>}
                                    </div>
                                    <div>
                                        <h6 className="mb-1 fw-bold text-dark fs-13">{item.label}</h6>
                                        <p className="mb-0 text-muted fr-step-subtext">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
