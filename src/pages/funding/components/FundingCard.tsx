import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FUNDING_ICON_MAP } from '../../../config/funding';
import { getFundingColorStyles } from '../../../config/fundingColor';

// ─── Types ────────────────────────────────────────────────────────────────────
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

    const generated = `ri-${alt}-line`;
    return generated;
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
    engine_status = 'Active',
    engine_status_label = 'Eligible Now',
}) => {
    const navigate = useNavigate();
    const iconClass = resolveIcon(icon);
    const colors = resolveColor(icon_color);

    // Ensure action_url is a valid path or external URL, otherwise fallback to default
    const isValidUrl = action_url && (action_url.startsWith('/') || action_url.startsWith('http'));
    const destination = isValidUrl ? action_url : `/funding/${id}`;

    // Status visual map — null = use secondary CSS class (.funding-pill-eligible)
    const getStatusStyle = (): { bg: string; color: string } | null => {
        switch (engine_status) {
            case 'Warning':    return { bg: '#fffbeb', color: '#d97706' }; // Conditional
            case 'Greyed Out': return { bg: '#f3f4f6', color: '#4b5563' }; // Better Fit Later
            case 'Hidden':     return { bg: '#fee2e2', color: '#ef4444' }; // Not Eligible
            default:           return null; // Active / Review → Likely Eligible = secondary color
        }
    };

    // Force all active sequences to show as Active and not greyed out per user request
    const forcedEngineStatus = 'Active';
    const isGreyedOut = false;
    const isEligible = true;

    // Convert generic "Eligible Now" and "Manual Review Required" to the design's "Likely Eligible"
    const displayLabel = 'Likely Eligible';

    return (
        <div
            className={`funding-card`}
            onClick={() => {
                if (destination.startsWith('http')) {
                    window.open(destination, '_blank');
                } else {
                    navigate(destination);
                }
            }}
        >
            {/* ── Top Section: Icon & Text ───────────────────────────────────────────── */}
            <div className="funding-card-top">
                {/* Icon Badge */}
                <div
                    className={`funding-card-icon-wrapper`}
                    style={{ background: colors.bg }}
                >
                    <i className={iconClass} style={{ color: colors.text }} />
                </div>

                {/* Text Content */}
                <div className="funding-card-text-content">
                    <p className="funding-card-title">
                        {name}
                    </p>
                    <p
                        className="funding-card-subtitle"
                        style={{ color: subtitle ? '#6b7280' : 'transparent' }}
                    >
                        {subtitle || '\u00A0'}
                    </p>
                </div>
            </div>

            {/* ── Bottom Section: Amount, Status & Arrow ────────────────────────────── */}
            <div className="funding-card-bottom">
                <div className="funding-card-meta">
                    {amount_range && (
                        <span className="funding-card-amount">
                            {amount_range}
                        </span>
                    )}
                    <div style={{ alignSelf: 'flex-start' }}>
                        {isEligible ? (() => {
                            const sec = getCSSVar('--secondary-color', '#1cbfca');
                            return (
                                <Pill
                                    label={displayLabel}
                                    bg={`${sec}1a`}
                                    color={sec}
                                    className="large-pill"
                                />
                            );
                        })() : (
                            <Pill
                                label={displayLabel}
                                bg={statusStyle!.bg}
                                color={statusStyle!.color}
                                className="large-pill"
                            />
                        )}
                    </div>
                </div>

                {/* Arrow Button */}
                <div className="funding-card-arrow">
                    <i className="ri-arrow-right-s-line" />
                </div>
            </div>
        </div>
    );
};

export default FundingCard;
