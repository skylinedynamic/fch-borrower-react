import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FUNDING_ICON_MAP, FUNDING_REVIEW_STATUS, ENGINE_STATUS_LABELS, ENGINE_STATUS_VALUES } from '../../../config/funding';
import { getFundingColorStyles } from '../../../config/fundingColor';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReadinessFactor {
    label: string;
    status: string;
    borrower_value?: any;
    required_value?: any;
}

interface FundingCardProps {
    id: number | string;
    icon: string;
    icon_color: string;
    name: string;
    subtitle?: string;
    amount_range?: string;
    terms?: string;
    action_url?: string;
    engine_status?: string;
    engine_status_label?: string;
    latest_review_status?: string;
    readiness_factors?: ReadinessFactor[];
}

const resolveIcon = (icon: any): string => {
    const s = String(icon ?? '').trim();
    if (!s) return 'ri-file-list-3-line';
    if (s.startsWith('ri-')) return s;

    const key = s.toLowerCase();
    if (FUNDING_ICON_MAP[key]) {
        const mapped = String(FUNDING_ICON_MAP[key]).trim();
        return mapped.startsWith('ri-') ? mapped : `ri-${mapped}-line`;
    }

    const alt = key.replace(/[_\s]+/g, '-');
    if (FUNDING_ICON_MAP[alt]) {
        const mapped = String(FUNDING_ICON_MAP[alt]).trim();
        return mapped.startsWith('ri-') ? mapped : `ri-${mapped}-line`;
    }

    return `ri-${alt}-line`;
};

const resolveColor = (color: any): { bg: string; text: string } => {
    return getFundingColorStyles(color);
};

// ─── Small pill badge ─────────────────────────────────────────────────────────
const Pill: React.FC<{ label: string; bg?: string; color?: string; className?: string }> = ({
    label,
    bg = '#f0f3f7',
    color = '#4b5563',
    className = ''
}) => (
    <span
        className={`funding-pill ${className}`}
        style={{ background: bg, color }}
    >
        {label}
    </span>
);

// ─── Read a CSS variable from :root at runtime ────────────────────────────────
const getCSSVar = (name: string, fallback: string): string => {
    if (typeof window !== 'undefined') {
        const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        if (val) return val;
    }
    return fallback;
};

// Helper to format readiness comparison details professionally
const formatFactorDetail = (factor: ReadinessFactor): string => {
    const label = factor.label;
    const req = factor.required_value;
    const act = factor.borrower_value;

    if (req === undefined || req === null) {
        return label;
    }

    const lowerLabel = label.toLowerCase();

    // FICO / Credit
    if (lowerLabel.includes('credit')) {
        return `${label}: ${act ?? 0} (Required: ${req})`;
    }

    // Revenue / Balance / Deposits
    if (lowerLabel.includes('revenue') || lowerLabel.includes('deposit') || lowerLabel.includes('balance')) {
        const fmt = (val: any) => {
            const num = Number(val);
            if (isNaN(num)) return val || '0';
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
        };
        return `${label}: ${fmt(act)} (Required: ${fmt(req)})`;
    }

    // Time in Business
    if (lowerLabel.includes('time') || lowerLabel === 'time in business') {
        const fmtMonths = (months: any) => {
            const m = Number(months);
            if (isNaN(m) || m === 0) return months || '0 Months';
            const totalDays = Math.round(m * 30);
            const y = Math.floor(totalDays / 360);
            const remY = totalDays % 360;
            const mo = Math.floor(remY / 30);
            const d = remY % 30;
            const parts = [];
            if (y > 0) parts.push(`${y} Year${y > 1 ? 's' : ''}`);
            if (mo > 0) parts.push(`${mo} Month${mo > 1 ? 's' : ''}`);
            if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
            return parts.length > 0 ? parts.join(' ') : '0 Months';
        };
        return `${label}: ${fmtMonths(act)} (Required: ${fmtMonths(req)})`;
    }

    return `${label}: ${act} (Required: ${req})`;
};

// ─── Missing Factors Tooltip ──────────────────────────────────────────────────
const MissingTooltip: React.FC<{ factors: ReadinessFactor[]; visible: boolean }> = ({ factors, visible }) => {
    if (!visible || factors.length === 0) return null;
    return (
        <div className="funding-missing-tooltip">
            <div className="funding-missing-tooltip-header">
                <i className="ri-error-warning-fill" style={{ color: '#F59E0B', fontSize: 18 }} />
                <span>Missing Requirements</span>
            </div>
            
            <p className="funding-missing-tooltip-desc">
                This funding option is currently locked because the following requirement(s) are not met.
            </p>
            
            <div className="funding-missing-tooltip-divider" />
            
            <ul className="funding-missing-tooltip-list">
                {factors.map((f, i) => {
                    const label = f.label;
                    const req = f.required_value;
                    const act = f.borrower_value;
                    
                    const lowerLabel = label.toLowerCase();
                    let actVal = act;
                    let reqVal = req;
                    
                    if (req !== undefined && req !== null) {
                        if (lowerLabel.includes('revenue') || lowerLabel.includes('deposit') || lowerLabel.includes('balance')) {
                            const fmt = (val: any) => {
                                const num = Number(val);
                                if (isNaN(num)) return val || '0';
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
                            };
                            actVal = fmt(act);
                            reqVal = fmt(req);
                        } else if (lowerLabel.includes('time') || lowerLabel === 'time in business') {
                            const fmtMonths = (months: any) => {
                                const m = Number(months);
                                if (isNaN(m) || m === 0) return months || '0 Months';
                                const totalDays = Math.round(m * 30);
                                const y = Math.floor(totalDays / 360);
                                const remY = totalDays % 360;
                                const mo = Math.floor(remY / 30);
                                const d = remY % 30;
                                const parts = [];
                                if (y > 0) parts.push(`${y} Year${y > 1 ? 's' : ''}`);
                                if (mo > 0) parts.push(`${mo} Month${mo > 1 ? 's' : ''}`);
                                if (d > 0) parts.push(`${d} Day${d > 1 ? 's' : ''}`);
                                return parts.length > 0 ? parts.join(' ') : '0 Months';
                            };
                            actVal = fmtMonths(act);
                            reqVal = fmtMonths(req);
                        }
                    }

                    return (
                        <li key={i} className="funding-missing-tooltip-item">
                            <div className="d-flex align-items-start gap-2">
                                <i className="ri-close-circle-fill" style={{ color: '#EF4444', fontSize: 15, marginTop: 1 }} />
                                <div>
                                    <div className="tooltip-item-title">{label}: {actVal ?? 'Missing'}</div>
                                    {req !== undefined && req !== null && (
                                        <div className="tooltip-item-req">Required: {reqVal}</div>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            
            <div className="funding-missing-tooltip-divider" />
            
            <div className="funding-missing-tooltip-footer-info">
                <i className="ri-information-fill" style={{ color: '#3B82F6', fontSize: 16, marginTop: 1 }} />
                <span>Update the missing requirement(s) above to unlock this funding option.</span>
            </div>
        </div>
    );
};

// ─── Pending Tooltip ───────────────────────────────────────────────────────────
const PendingTooltip: React.FC<{ visible: boolean }> = ({ visible }) => {
    if (!visible) return null;
    return (
        <div className="funding-missing-tooltip">
            <div className="funding-missing-tooltip-header">
                <i className="ri-time-fill" style={{ color: '#3B82F6', fontSize: 18 }} />
                <span>Application Under Review</span>
            </div>
            
            <p className="funding-missing-tooltip-desc">
                You have already submitted an application for this funding option.
            </p>
            
            <div className="funding-missing-tooltip-divider" />
            
            <ul className="funding-missing-tooltip-list">
                <li className="funding-missing-tooltip-item">
                    <div className="d-flex align-items-start gap-2">
                        <i className="ri-information-line" style={{ color: '#3B82F6', fontSize: 15, marginTop: 1 }} />
                        <div className="tooltip-item-title">Status: Awaiting Review</div>
                    </div>
                </li>
            </ul>
            
            <div className="funding-missing-tooltip-divider" />
            
            <div className="funding-missing-tooltip-footer-info">
                <i className="ri-information-fill" style={{ color: '#3B82F6', fontSize: 16, marginTop: 1 }} />
                <span>Please wait for approval or rejection before reapplying.</span>
            </div>
        </div>
    );
};

// ─── Engine Locked Tooltip ───────────────────────────────────────────────────────
const EngineLockedTooltip: React.FC<{ visible: boolean }> = ({ visible }) => {
    if (!visible) return null;
    return (
        <div className="funding-missing-tooltip">
            <div className="funding-missing-tooltip-header">
                <i className="ri-lock-fill" style={{ color: '#6B7280', fontSize: 18 }} />
                <span>Locked</span>
            </div>
            
            <p className="funding-missing-tooltip-desc">
                This funding option is currently locked because no underwriting logic is configured.
            </p>
            
            <div className="funding-missing-tooltip-divider" />
            
            <div className="funding-missing-tooltip-footer-info">
                <i className="ri-information-fill" style={{ color: '#3B82F6', fontSize: 16, marginTop: 1 }} />
                <span>Please wait until requirements are set up.</span>
            </div>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────
const FundingCard: React.FC<FundingCardProps> = ({
    id,
    icon,
    icon_color,
    name,
    subtitle,
    amount_range,
    terms,
    action_url,
    engine_status = ENGINE_STATUS_VALUES.ACTIVE,
    engine_status_label = ENGINE_STATUS_LABELS.ELIGIBLE_NOW,
    latest_review_status,
    readiness_factors = [],
}) => {
    const navigate = useNavigate();
    const cardRef = useRef<HTMLDivElement>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);

    const iconClass = resolveIcon(icon);
    const colors = resolveColor(icon_color);

    // Detect missing underwriting factors
    const missingFactors = readiness_factors.filter(f => f.status?.toLowerCase() === 'missing');
    const hasMissing = missingFactors.length > 0;

    // Pending = already applied, awaiting review
    const isPending = latest_review_status === FUNDING_REVIEW_STATUS.PENDING;
    
    // Engine locked = no lender visibilities configured
    const isEngineLocked = engine_status === ENGINE_STATUS_VALUES.LOCKED;

    // For pending, it's fully disabled. For engine locked, it's also fully disabled.
    const isFullyDisabled = (isPending && !hasMissing) || isEngineLocked;
    const isLocked = hasMissing || isEngineLocked;

    // Pill label & color (matching mockup yellow/brown for missing)
    const sec = getCSSVar('--secondary-color', '#1cbfca');
    const displayLabel = isEngineLocked ? ENGINE_STATUS_LABELS.LOCKED : (hasMissing ? ENGINE_STATUS_LABELS.MISSING_INFO : isPending ? ENGINE_STATUS_LABELS.UNDER_REVIEW : ENGINE_STATUS_LABELS.LIKELY_ELIGIBLE);
    const pillBg    = isEngineLocked ? '#f3f4f6' : hasMissing ? '#fef3c7' : isPending ? '#f0f0ff' : `${sec}1a`;
    const pillColor = isEngineLocked ? '#4b5563' : hasMissing ? '#78350f' : isPending ? '#4f52c8' : sec;

    // Ensure action_url is a valid path or external URL, otherwise fallback to default
    const isValidUrl = action_url && (action_url.startsWith('/') || action_url.startsWith('http'));
    // If locked (missing factors), force them to the local details page to view the reason.
    // If fully disabled (pending or engine locked), the click handler will block it anyway.
    const destination = hasMissing && !isEngineLocked ? `/funding/${id}` : (isValidUrl ? action_url : `/funding/${id}`);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div
                id={`funding-card-${id}`}
                ref={cardRef}
                className={`funding-card ${isFullyDisabled ? 'funding-card-disabled' : ''} ${isLocked ? 'funding-card-locked' : ''}`}
                onMouseEnter={() => (isFullyDisabled || isLocked) && setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                onClick={(e) => {
                    // Pending/Engine Locked cards are fully disabled, cannot click
                    if (isFullyDisabled) {
                        e.preventDefault();
                        return;
                    }
                    // Locked cards allow clicking to view the details page
                    if (isLocked && destination.startsWith('http')) {
                        e.preventDefault();
                        return;
                    }
                    if (destination.startsWith('http')) {
                        window.open(destination, '_blank');
                    } else {
                        navigate(destination);
                    }
                }}
            >
                {/* ── Lock / Clock Badge (Top-Right as per Mockup) ──────────── */}
                {(hasMissing || isEngineLocked) && (
                    <div className="funding-card-missing-badge" style={{ position: 'absolute', top: '14px', right: '14px', left: 'auto' }}>
                        <i className="ri-lock-line" />
                    </div>
                )}
                {isPending && !hasMissing && !isEngineLocked && (
                    <div className="funding-card-missing-badge funding-card-pending-badge" style={{ position: 'absolute', top: '14px', right: '14px', left: 'auto' }}>
                        <i className="ri-time-line" />
                    </div>
                )}

                {/* ── Top Section: Icon & Text ───────────────────────────────── */}
                <div className="funding-card-top">
                    <div
                        className={`funding-card-icon-wrapper ${(isFullyDisabled || isLocked) ? 'disabled' : ''}`}
                        style={{ background: colors.bg }}
                    >
                        <i className={iconClass} style={{ color: colors.text }} />
                    </div>

                    <div className="funding-card-text-content">
                        <p className="funding-card-title">{name}</p>
                        <p
                            className="funding-card-subtitle"
                            style={{ color: subtitle ? '#6b7280' : 'transparent' }}
                        >
                            {subtitle || '\u00A0'}
                        </p>
                    </div>
                </div>

                {/* ── Bottom Section: Amount, Status & Arrow ────────────────── */}
                <div className="funding-card-bottom">
                    <div className="funding-card-meta">
                        {amount_range && (
                            <span className="funding-card-amount">{amount_range}</span>
                        )}
                        <div style={{ alignSelf: 'flex-start' }}>
                            <Pill
                                label={displayLabel}
                                bg={pillBg}
                                color={pillColor}
                                className="large-pill"
                            />
                        </div>
                    </div>

                    {/* Arrow Button (always right-arrow as per mockup) */}
                    <div className="funding-card-arrow">
                        <i className="ri-arrow-right-s-line" />
                    </div>
                </div>
            </div>

            {/* ── Missing Tooltip ───────────────────────────────────────────── */}
            <MissingTooltip factors={missingFactors} visible={tooltipVisible && hasMissing && !isEngineLocked} />

            {/* ── Pending Tooltip ───────────────────────────────────────────── */}
            <PendingTooltip visible={tooltipVisible && isPending && !hasMissing && !isEngineLocked} />

            {/* ── Engine Locked Tooltip ─────────────────────────────────────── */}
            <EngineLockedTooltip visible={tooltipVisible && isEngineLocked} />
        </div>
    );
};

export default FundingCard;
