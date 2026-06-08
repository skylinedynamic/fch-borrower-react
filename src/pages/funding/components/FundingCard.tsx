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
                flexDirection: 'column',
                background: '#ffffff',
                border: `1.5px solid ${hovered && !isGreyedOut ? '#3b82f6' : '#e8ecf0'}`,
                borderRadius: 4,
                padding: '16px',
                cursor: isGreyedOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: hovered && !isGreyedOut
                    ? '0 8px 20px rgba(59, 130, 246, 0.08)'
                    : '0 2px 4px rgba(0,0,0,0.02)',
                transform: hovered && !isGreyedOut ? 'translateY(-2px)' : 'translateY(0)',
                userSelect: 'none',
                width: '100%',
                height: '100%',
                minHeight: 150,
                opacity: isGreyedOut ? 0.6 : 1,
                position: 'relative'
            }}
        >
            {/* ── Top Section: Icon & Text ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                {/* Icon Badge */}
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: isGreyedOut ? '#f0f3f7' : colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        filter: isGreyedOut ? 'grayscale(100%)' : 'none'
                    }}
                >
                    <i className={iconClass} style={{ fontSize: 22, color: isGreyedOut ? '#6c757d' : colors.text }} />
                </div>

                {/* Text Content */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                    <p
                        style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 15,
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
                    <p
                        style={{
                            margin: 0,
                            fontSize: 13,
                            color: subtitle ? '#6b7280' : 'transparent',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {subtitle || '\u00A0'}
                    </p>
                </div>
            </div>

            {/* ── Bottom Section: Amount, Status & Arrow ────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {amount_range && (
                        <span
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#1d4ed8',
                                letterSpacing: '0.01em',
                            }}
                        >
                            {amount_range}
                        </span>
                    )}
                    <div style={{ alignSelf: 'flex-start' }}>
                        <Pill label={displayLabel} bg={statusStyle.bg} color={statusStyle.color} style={{ fontSize: 12, padding: '5px 12px' }} />
                    </div>
                </div>

                {/* Arrow Button */}
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1.5px solid #e5e7eb',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        borderColor: hovered && !isGreyedOut ? '#3b82f6' : '#e5e7eb',
                    }}
                >
                    <i
                        className="ri-arrow-right-s-line"
                        style={{
                            fontSize: 18,
                            color: hovered && !isGreyedOut ? '#3b82f6' : '#9ca3af',
                            transition: 'color 0.2s',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default FundingCard;
