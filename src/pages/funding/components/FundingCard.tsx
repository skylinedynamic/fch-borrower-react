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
const Pill: React.FC<{ label: string; bg?: string; color?: string; style?: React.CSSProperties }> = ({
    label,
    bg = '#f0f3f7',
    color = '#4b5563',
    style
}) => (
    <span
        style={{
            fontSize: 11,
            fontWeight: 600,
            background: bg,
            color,
            padding: '2px 9px',
            borderRadius: 20,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...style
        }}
    >
        {label}
    </span>
);

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
    const [hovered, setHovered] = useState(false);
    const navigate = useNavigate();
    const iconClass = resolveIcon(icon);
    const colors = resolveColor(icon_color);
    
    // Ensure action_url is a valid path or external URL, otherwise fallback to default
    const isValidUrl = action_url && (action_url.startsWith('/') || action_url.startsWith('http'));
    const destination = isValidUrl ? action_url : `/funding/${id}`;

    // Status visual map
    const getStatusStyle = () => {
        switch (engine_status) {
            case 'Warning': return { bg: '#fffbeb', color: '#d97706' }; // Conditional
            case 'Review': return { bg: '#ecfdf5', color: '#10b981' };  // Review -> Likely Eligible
            case 'Greyed Out': return { bg: '#f3f4f6', color: '#4b5563' }; // Better Fit Later
            default: return { bg: '#ecfdf5', color: '#10b981' }; // Active (Likely Eligible)
        }
    };

    const statusStyle = getStatusStyle();
    const isGreyedOut = engine_status === 'Greyed Out';
    
    // Convert generic "Eligible Now" and "Manual Review Required" to the design's "Likely Eligible"
    const displayLabel = (engine_status_label === 'Eligible Now' || engine_status_label === 'Manual Review Required') 
        ? 'Likely Eligible' 
        : engine_status_label;

    return (
        <div
            onClick={() => {
                if (!isGreyedOut) {
                    if (destination.startsWith('http')) {
                        window.open(destination, '_blank');
                    } else {
                        navigate(destination);
                    }
                }
            }}
            onMouseEnter={() => !isGreyedOut && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 14,
                background: '#ffffff',
                border: `1px solid ${hovered ? '#c5d0de' : '#e8ecf0'}`,
                borderRadius: 12,
                padding: '16px 18px',
                cursor: isGreyedOut ? 'not-allowed' : 'pointer',
                transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.15s',
                boxShadow: hovered && !isGreyedOut
                    ? '0 6px 20px rgba(0,0,0,0.09)'
                    : '0 1px 4px rgba(0,0,0,0.05)',
                transform: hovered && !isGreyedOut ? 'translateY(-2px)' : 'translateY(0)',
                userSelect: 'none',
                width: '100%',
                height: '100%',
                minHeight: 110,
                opacity: isGreyedOut ? 0.6 : 1,
                position: 'relative'
            }}
        >
            {/* ── Icon Badge ─────────────────────────────────────────────── */}
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isGreyedOut ? '#f0f3f7' : colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                    flexShrink: 0,
                    marginTop: 2,
                    filter: isGreyedOut ? 'grayscale(100%)' : 'none'
                }}
            >
                <i className={iconClass} style={{ fontSize: 21, color: isGreyedOut ? '#6c757d' : colors.text }} />
            </div>

            {/* ── Text Content ───────────────────────────────────────────── */}
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                }}
            >
                {/* Name */}
                <p
                    style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 14,
                        color: '#0f1b2d',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {name}
                </p>

                {/* Subtitle — always 2-line reserved space */}
                <p
                    style={{
                        margin: 0,
                        fontSize: 12,
                        color: subtitle ? '#7a8b9a' : 'transparent',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 34,
                    } as React.CSSProperties}
                >
                    {subtitle || '\u00A0'}
                </p>

                {/* Bottom row: amount_range + status badge */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 'auto',
                        paddingTop: 8,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {amount_range && (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#2563eb',
                                    letterSpacing: '0.01em',
                                    flexShrink: 0,
                                }}
                            >
                                {amount_range}
                            </span>
                        )}

                        {terms && (
                            <Pill label={terms} bg={colors.bg} color={colors.text} />
                        )}
                    </div>

                    <div style={{ alignSelf: 'flex-start' }}>
                        <Pill label={displayLabel} bg={statusStyle.bg} color={statusStyle.color} style={{ fontSize: 11.5, padding: '4px 10px' }} />
                    </div>
                </div>
            </div>

            {/* ── Arrow Button ───────────────────────────────────────────── */}
            <div
                style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: hovered ? '#1e2b3c' : '#f0f3f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    alignSelf: 'center',
                    transition: 'background 0.18s',
                }}
            >
                <i
                    className="ri-arrow-right-s-line"
                    style={{
                        fontSize: 17,
                        color: hovered ? '#ffffff' : '#6b7e93',
                        transition: 'color 0.18s',
                    }}
                />
            </div>
        </div>
    );
};

export default FundingCard;
