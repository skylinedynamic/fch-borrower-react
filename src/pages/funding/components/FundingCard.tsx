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
    tags?: string[];
    accounts?: string[];
    credit_accounts?: string[];
    apr?: string;
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
    console.info('FundingCard: unknown icon value, using fallback', { raw: icon, generated });
    return generated;
};

const resolveColor = (color: any): { bg: string; text: string } => {
    return getFundingColorStyles(color);
};

// ─── Small pill badge ─────────────────────────────────────────────────────────
const Pill: React.FC<{ label: string; bg?: string; color?: string }> = ({
    label,
    bg = '#f0f3f7',
    color = '#4b5563',
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
    tags = [],
    accounts = [],
    credit_accounts = [],
    apr,
}) => {
    const [hovered, setHovered] = useState(false);
    const navigate = useNavigate();
    const iconClass = resolveIcon(icon);
    const colors = resolveColor(icon_color);
    const destination = action_url || `/funding/${id}`;

    // Merge accounts + credit_accounts into one deduplicated list (max 3 shown)
    const allAccounts = Array.from(new Set([...accounts, ...credit_accounts])).slice(0, 3);

    // Tags shown as pills (max 3)
    const visibleTags = (tags ?? []).slice(0, 3);

    return (
        <div
            onClick={() => navigate(destination)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 14,
                background: '#ffffff',
                border: `1px solid ${hovered ? '#c5d0de' : '#e8ecf0'}`,
                borderRadius: 12,
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.15s',
                boxShadow: hovered
                    ? '0 6px 20px rgba(0,0,0,0.09)'
                    : '0 1px 4px rgba(0,0,0,0.05)',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                userSelect: 'none',
                width: '100%',
                height: '100%',
                minHeight: 110,
            }}
        >
            {/* ── Icon Badge ─────────────────────────────────────────────── */}
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                    flexShrink: 0,
                    marginTop: 2,
                }}
            >
                <i className={iconClass} style={{ fontSize: 21, color: colors.text }} />
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

                {/* Accounts / credit accounts */}
                {allAccounts.length > 0 && (
                    <div
                        style={{
                            fontSize: 11,
                            color: '#6b7e93',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {allAccounts.join(' · ')}
                    </div>
                )}

                {/* Bottom row: amount_range + tags/terms + apr */}
                <div
                    style={{
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: 'auto',
                        paddingTop: 4,
                    }}
                >
                    {amount_range && (
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#2563eb',
                                letterSpacing: '0.01em',
                                flexShrink: 0,
                            }}
                        >
                            {amount_range}
                        </span>
                    )}

                    {apr && (
                        <Pill label={apr} bg="#e8f5e9" color="#2e7d32" />
                    )}

                    {terms && (
                        <Pill label={terms} bg={colors.bg} color={colors.text} />
                    )}

                    {visibleTags.map((tag, idx) => (
                        <Pill key={idx} label={tag} bg="#f0f3f7" color="#4b5563" />
                    ))}
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
