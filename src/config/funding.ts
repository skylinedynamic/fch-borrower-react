export const FUNDING_ICON_MAP: Record<string, string> = {
    'credit-card': 'bank-card',
    'shopping-cart': 'shopping-cart-2',
    'star': 'star',
    'refresh-cw': 'refresh',
    'landmark': 'bank',
    'camera': 'camera',
    'trending-up': 'line-chart',
    'settings': 'settings-3',
    'file-text': 'file-text',
    'briefcase': 'briefcase',
    'truck': 'truck',
    'building': 'building-4',
    'link': 'links',
    'tool': 'tools',
    'hard-hat': 'user-settings',
    'dollar-sign': 'money-dollar-circle',
    'percent': 'percent',
    'home': 'home-4',
    'bar-chart': 'bar-chart-2',
    'pie-chart': 'pie-chart',
    'shield': 'shield-check',
    'check-circle': 'checkbox-circle',
    'users': 'team',
    'user': 'user-3',
    'globe': 'global',
    'map-pin': 'map-pin',
    'clock': 'time',
    'calendar': 'calendar-event',
    'phone': 'phone',
    'mail': 'mail',
    'award': 'award',
    'layers': 'stack',
    'package': 'archive',
    'box': 'inbox',
    'leaf': 'plant',
    'anchor': 'anchor',
    'cpu': 'cpu',
    'zap': 'flashlight',
    'cloud': 'cloud',
    'database': 'database-2',
};

export const FUNDING_COLOR_MAP: Record<string, string> = {
    'green': 'success',
    'blue': 'primary',
    'purple': 'secondary',
    'orange': 'warning',
    'red': 'danger',
    'teal': 'info',
};

export const FUNDING_REVIEW_STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    APPROVED: 'Approved',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    CANCELED: 'Canceled'
};

export const FUNDING_REVIEW_STATUS_COLORS: Record<string, string> = {
    [FUNDING_REVIEW_STATUS.PENDING]: '#F59E0B',    // Orange
    [FUNDING_REVIEW_STATUS.IN_PROGRESS]: '#3B82F6',// Blue
    [FUNDING_REVIEW_STATUS.ACCEPTED]: '#06B6D4',   // Teal/Cyan
    [FUNDING_REVIEW_STATUS.APPROVED]: '#10B981',   // Green
    [FUNDING_REVIEW_STATUS.REJECTED]: '#EF4444',   // Red
    [FUNDING_REVIEW_STATUS.CANCELED]: '#EF4444',   // Red
};

export const FUNDING_APPLICATION_STATUS = {
    PENDING: 'Pending',
    SUBMITTED: 'Submitted (Received)',
    UNDERWRITING_REVIEW: 'Underwriting Review',
    MISSING_DOCUMENTS: 'Missing Documents (Action Required)',
    IN_VERIFICATION: 'In Verification',
    APPROVED_CONDITIONAL: 'Approved (Conditional)',
    APPROVED_FINAL: 'Approved (Final)',
    MATCHED_TO_LENDER: 'Matched to Lender',
    SUBMITTED_TO_LENDER: 'Submitted to Lender',
    LENDER_REVIEWING: 'Lender Reviewing',
    OFFER_ISSUED: 'Offer Issued',
    OFFER_ACCEPTED: 'Offer Accepted',
    CONTRACTING_DOCS_OUT: 'Contracting / Docs Out',
    CLEARED_TO_FUND: 'Cleared to Fund',
    FUNDED: 'Funded',
    CLOSED: 'Closed (Completed)',
    DENIED: 'Denied'
};

export const FUNDING_APPLICATION_STATUS_OPTIONS = [
    { label: 'Pending', value: FUNDING_APPLICATION_STATUS.PENDING },
    { label: 'Submitted (Received)', value: FUNDING_APPLICATION_STATUS.SUBMITTED },
    { label: 'Underwriting Review', value: FUNDING_APPLICATION_STATUS.UNDERWRITING_REVIEW },
    { label: 'Missing Documents (Action Required)', value: FUNDING_APPLICATION_STATUS.MISSING_DOCUMENTS },
    { label: 'In Verification', value: FUNDING_APPLICATION_STATUS.IN_VERIFICATION },
    { label: 'Approved (Conditional)', value: FUNDING_APPLICATION_STATUS.APPROVED_CONDITIONAL },
    { label: 'Approved (Final)', value: FUNDING_APPLICATION_STATUS.APPROVED_FINAL },
    { label: 'Matched to Lender', value: FUNDING_APPLICATION_STATUS.MATCHED_TO_LENDER },
    { label: 'Submitted to Lender', value: FUNDING_APPLICATION_STATUS.SUBMITTED_TO_LENDER },
    { label: 'Lender Reviewing', value: FUNDING_APPLICATION_STATUS.LENDER_REVIEWING },
    { label: 'Offer Issued', value: FUNDING_APPLICATION_STATUS.OFFER_ISSUED },
    { label: 'Offer Accepted', value: FUNDING_APPLICATION_STATUS.OFFER_ACCEPTED },
    { label: 'Contracting / Docs Out', value: FUNDING_APPLICATION_STATUS.CONTRACTING_DOCS_OUT },
    { label: 'Cleared to Fund', value: FUNDING_APPLICATION_STATUS.CLEARED_TO_FUND },
    { label: 'Funded', value: FUNDING_APPLICATION_STATUS.FUNDED },
    { label: 'Closed (Completed)', value: FUNDING_APPLICATION_STATUS.CLOSED },
    { label: 'Denied', value: FUNDING_APPLICATION_STATUS.DENIED }
];

export const FUNDING_APPLICATION_STATUS_CLASS_MAP: Record<string, string> = {
    [FUNDING_APPLICATION_STATUS_OPTIONS[0].value]: 'bg-warning-subtle text-warning',
    [FUNDING_APPLICATION_STATUS_OPTIONS[1].value]: 'bg-info-subtle text-info',
    [FUNDING_APPLICATION_STATUS_OPTIONS[2].value]: 'bg-primary-subtle text-primary',
    [FUNDING_APPLICATION_STATUS_OPTIONS[3].value]: 'bg-danger-subtle text-danger',
    [FUNDING_APPLICATION_STATUS_OPTIONS[4].value]: 'bg-info-subtle text-info',
    [FUNDING_APPLICATION_STATUS_OPTIONS[5].value]: 'bg-success-subtle text-success',
    [FUNDING_APPLICATION_STATUS_OPTIONS[6].value]: 'bg-success text-white',
    [FUNDING_APPLICATION_STATUS_OPTIONS[7].value]: 'bg-primary-subtle text-primary',
    [FUNDING_APPLICATION_STATUS_OPTIONS[8].value]: 'bg-info-subtle text-info',
    [FUNDING_APPLICATION_STATUS_OPTIONS[9].value]: 'bg-primary-subtle text-primary',
    [FUNDING_APPLICATION_STATUS_OPTIONS[10].value]: 'bg-success-subtle text-success',
    [FUNDING_APPLICATION_STATUS_OPTIONS[11].value]: 'bg-success text-white',
    [FUNDING_APPLICATION_STATUS_OPTIONS[12].value]: 'bg-warning-subtle text-warning',
    [FUNDING_APPLICATION_STATUS_OPTIONS[13].value]: 'bg-success-subtle text-success',
    [FUNDING_APPLICATION_STATUS_OPTIONS[14].value]: 'bg-success text-white',
    [FUNDING_APPLICATION_STATUS_OPTIONS[16].value]: 'bg-danger-subtle text-danger',
};

export const FUNDING_WIZARD_STEPS = [
    { id: 1, label: 'Review' },
    { id: 2, label: 'Application' },
    { id: 3, label: 'Documents' },
    { id: 4, label: 'Submit' }
];

export const QUALIFY_REASONS_MAP: Record<string, string> = {
    'Business Credit': 'Business profile meets our lending standards',
    'Revenue': 'Revenue exceeds minimum threshold',
    'Time in Business': 'Time in business exceeds requirement',
    'Banking Activity': 'Banking activity shows consistent deposits',
    'Documents': 'Required documents have been provided',
    'Minimum Monthly Deposits': 'Deposit volume meets minimum requirements',
    'Monthly Deposit Count': 'Deposit frequency meets minimum requirements',
    'Minimum Average Daily Balance': 'Average daily balance meets minimum requirements',
    'Max NSF / Negative Days': 'Banking history meets minimum NSF/negative day requirements'
};

export const ENGINE_STATUS_LABELS = {
    ELIGIBLE_NOW: 'Eligible Now',
    LIKELY_ELIGIBLE: 'Likely Eligible',
    MANUAL_REVIEW: 'Manual Review Required',
    MISSING_INFO: 'Failed',
    UNDER_REVIEW: 'Under Review',
    LOCKED: 'Locked',
};

export const MATCH_LEVEL_LABELS = {
    HIGH_MATCH: 'High Match',
    MEDIUM_MATCH: 'Medium Match',
    LOW_MATCH: 'Low Match',
};

export const ENGINE_STATUS_VALUES = {
    ACTIVE: 'Active',
    REVIEW: 'Review',
    GREYED_OUT: 'Greyed Out',
    HIDDEN: 'Hidden',
    LOCKED: 'Locked'
};

export const READINESS_FACTOR_LABELS = {
    RESTRICTED_STATE: 'Restricted State',
    STATE_ELIGIBILITY: 'State Eligibility',
    RESTRICTED_INDUSTRY: 'Restricted Industry',
    INDUSTRY_ELIGIBILITY: 'Industry Eligibility',
};

export const FACTOR_STATUS_VALUES = {
    GOOD: 'good',
    STRONG: 'strong',
    ELIGIBLE: 'eligible',
    FAILED: 'failed',
    RESTRICTED: 'restricted',
    FAIR: 'fair',
    WEAK: 'weak',
};

export const BADGE_LABELS = {
    RESTRICTED: 'Restricted',
    ELIGIBLE: 'Eligible',
};

export const FACTOR_ICON_STYLES: Record<string, { icon: string, color: string }> = {
    [FACTOR_STATUS_VALUES.GOOD]: { icon: 'ri-checkbox-circle-fill', color: '#10b981' },
    [FACTOR_STATUS_VALUES.ELIGIBLE]: { icon: 'ri-checkbox-circle-fill', color: '#10b981' },
    [FACTOR_STATUS_VALUES.STRONG]: { icon: 'ri-star-fill', color: '#3b82f6' },
    [FACTOR_STATUS_VALUES.FAILED]: { icon: 'ri-close-circle-fill', color: '#ef4444' },
    [FACTOR_STATUS_VALUES.RESTRICTED]: { icon: 'ri-close-circle-fill', color: '#ef4444' },
};

export const META_ITEM_LABELS = {
    RECOMMENDED_RANGE: 'Recommended Range',
    TERM: 'Term',
    SPEED_TO_FUNDS: 'Speed to Funds',
    USES: 'Uses',
};

export const READINESS_BADGE_STYLES: Record<string, { icon: string; bg: string; color: string }> = {
    [FACTOR_STATUS_VALUES.GOOD]: { icon: 'ri-checkbox-circle-fill', bg: '#e8f9f0', color: '#1a7a4a' },
    [FACTOR_STATUS_VALUES.STRONG]: { icon: 'ri-checkbox-circle-fill', bg: '#dbeafe', color: '#1d4ed8' },
    [FACTOR_STATUS_VALUES.FAIR]: { icon: 'ri-error-warning-fill', bg: '#fef3c7', color: '#92400e' },
    [FACTOR_STATUS_VALUES.FAILED]: { icon: 'ri-close-circle-fill', bg: '#fee2e2', color: '#ef4444' },
    [FACTOR_STATUS_VALUES.WEAK]: { icon: 'ri-close-circle-fill', bg: '#fee2e2', color: '#991b1b' },
    [FACTOR_STATUS_VALUES.RESTRICTED]: { icon: 'ri-close-circle-fill', bg: '#fee2e2', color: '#ef4444' },
    [FACTOR_STATUS_VALUES.ELIGIBLE]: { icon: 'ri-checkbox-circle-fill', bg: '#e8f9f0', color: '#10b981' },
};

export const getFundingReviewProgress = (status: string) => {
    if (status === 'SUBMITTED') return 10;
    if (status === FUNDING_REVIEW_STATUS.PENDING) return 20;
    if (status === FUNDING_REVIEW_STATUS.ACCEPTED) return 40;
    if (status === FUNDING_REVIEW_STATUS.IN_PROGRESS) return 70;
    if (status === FUNDING_REVIEW_STATUS.APPROVED) return 100;
    if (status === FUNDING_REVIEW_STATUS.REJECTED) return 100;
    if (status === FUNDING_REVIEW_STATUS.CANCELED) return 100;
    return 0;
};

export const FUNDING_REVIEW_TIMELINE_STEPS = [
    {
        key: 'SUBMITTED',
        label: 'Submitted',
        icon: 'ri-file-list-3-line',
    },
    {
        key: FUNDING_REVIEW_STATUS.PENDING,
        label: 'Pending',
        icon: 'ri-time-line',
    },
    {
        key: FUNDING_REVIEW_STATUS.ACCEPTED,
        label: 'Accepted',
        icon: 'ri-checkbox-circle-line',
    },
    {
        key: FUNDING_REVIEW_STATUS.IN_PROGRESS,
        label: 'In Progress',
        subtext: 'Under Review',
        icon: 'ri-user-3-fill',
    },
    {
        key: FUNDING_REVIEW_STATUS.APPROVED,
        label: 'Approved',
        icon: 'ri-user-follow-line',
    },
    {
        key: FUNDING_REVIEW_STATUS.REJECTED,
        label: 'Rejected',
        icon: 'ri-user-unfollow-line',
    },
    {
        key: FUNDING_REVIEW_STATUS.CANCELED,
        label: 'Canceled',
        icon: 'ri-stop-circle-line',
    },
];

export const FUNDING_REVIEW_GUIDELINE_CARDS = [
    {
        label: 'Pending',
        desc: 'Request submitted and waiting for review.',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        iconBg: '#16a34a',
        icon: 'ri-time-line'
    },
    {
        label: 'Accepted',
        desc: 'Review completed successfully.',
        bg: '#fefce8',
        border: '#fef08a',
        iconBg: '#eab308',
        icon: 'ri-check-line'
    },
    {
        label: 'In Progress',
        desc: 'Admin can reviewing the request.',
        bg: '#eff6ff',
        border: '#bfdbfe',
        iconBg: '#3b82f6',
        icon: 'ri-shield-user-fill'
    },
    {
        label: 'Approved',
        desc: 'Borrower can start funding application.',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        iconBg: '#16a34a',
        icon: 'ri-check-line'
    },
    {
        label: 'Rejected',
        desc: 'Request declined missing information.',
        bg: '#fef2f2',
        border: '#fecaca',
        iconBg: '#ef4444',
        icon: 'ri-close-line'
    },
    {
        label: 'Canceled',
        desc: 'Request has been canceled.',
        bg: '#fef2f2',
        border: '#fecaca',
        iconBg: '#ef4444',
        icon: 'ri-stop-circle-line'
    }
];
