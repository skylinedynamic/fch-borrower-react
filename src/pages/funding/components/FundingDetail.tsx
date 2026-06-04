import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchFundingDetail } from '../../../modules/funding/services';
import { FUNDING_ICON_MAP } from '../../../config/funding';
import { getFundingColorStyles } from '../../../config/fundingColor';
import { toast } from 'react-toastify';

// ─── Icon resolver (same as FundingCard) ──────────────────────────────────────
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

// ─── Readiness Badge ──────────────────────────────────────────────────────────
const ReadinessBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = (status || '').toLowerCase();
    const cfg: Record<string, { icon: string; label: string; bg: string; color: string }> = {
        good: { icon: 'ri-checkbox-circle-fill', label: 'Good', bg: '#e8f9f0', color: '#1a7a4a' },
        strong: { icon: 'ri-checkbox-circle-fill', label: 'Strong', bg: '#dbeafe', color: '#1d4ed8' },
        fair: { icon: 'ri-error-warning-fill', label: 'Fair', bg: '#fef3c7', color: '#92400e' },
        missing: { icon: 'ri-close-circle-fill', label: 'Missing', bg: '#fee2e2', color: '#991b1b' },
        weak: { icon: 'ri-close-circle-fill', label: 'Weak', bg: '#fee2e2', color: '#991b1b' },
    };
    const style = cfg[s] || { icon: 'ri-question-line', label: status, bg: '#f0f3f7', color: '#4b5563' };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            background: style.bg,
            color: style.color,
            padding: '3px 10px 3px 7px',
            borderRadius: 20,
        }}>
            <i className={style.icon} style={{ fontSize: 13 }} />
            {style.label}
        </span>
    );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const FundingDetailLoader = () => (
    <div className="page-content">
        <div className="container-fluid">
            {/* Breadcrumb skeleton */}
            <div className="row page-subheader-sticky bg-body">
                <div className="col-12 py-2">
                    <div className="d-flex align-items-center gap-2">
                        <div className="skeleton-line" style={{ width: 110, height: 13, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: 8, height: 13, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: 160, height: 13, borderRadius: 4 }} />
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    {/* Header skeleton */}
                    <div className="d-flex align-items-start justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="skeleton-line flex-shrink-0" style={{ width: 52, height: 52, borderRadius: '50%' }} />
                            <div>
                                <div className="skeleton-line mb-2" style={{ width: 200, height: 18, borderRadius: 4 }} />
                                <div className="skeleton-line" style={{ width: 260, height: 13, borderRadius: 4 }} />
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="skeleton-line mb-1" style={{ width: 100, height: 26, borderRadius: 6 }} />
                            <div className="skeleton-line ms-auto" style={{ width: 60, height: 11, borderRadius: 4 }} />
                        </div>
                    </div>

                    {/* Meta row skeleton */}
                    <div className="row g-0 border rounded-2 mb-4">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`col-md-3 p-3 ${i < 3 ? 'border-end' : ''}`}>
                                <div className="skeleton-line mb-2" style={{ width: '60%', height: 10, borderRadius: 4 }} />
                                <div className="skeleton-line" style={{ width: '80%', height: 14, borderRadius: 4 }} />
                            </div>
                        ))}
                    </div>

                    {/* Two-col skeleton */}
                    <div className="row g-3">
                        {[0, 1].map(i => (
                            <div key={i} className="col-md-6">
                                <div className="border rounded-2 p-3" style={{ minHeight: 200 }}>
                                    <div className="skeleton-line mb-3" style={{ width: 140, height: 14, borderRadius: 4 }} />
                                    {[90, 80, 85, 70].map((w, j) => (
                                        <div key={j} className="skeleton-line mb-2" style={{ width: `${w}%`, height: 12, borderRadius: 4 }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer skeleton */}
                <div className="card-footer bg-white border-top d-flex align-items-center justify-content-between p-3 px-4">
                    <div>
                        <div className="skeleton-line mb-1" style={{ width: 80, height: 14, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: 320, height: 12, borderRadius: 4 }} />
                    </div>
                    <div className="skeleton-line" style={{ width: 170, height: 38, borderRadius: 6 }} />
                </div>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FundingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFundingDetail(id)
            .then(res => {
                if (res.status) setData(res.data);
                else toast.error(res.message || 'Failed to load funding details');
            })
            .catch(() => toast.error('Failed to load funding details'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <FundingDetailLoader />;

    if (!data) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <i className="ri-information-line fs-1 text-muted d-block mb-3" />
                            <h6 className="fw-semibold text-dark mb-1">Funding option not found</h6>
                            <p className="text-muted fs-13 mb-3">This funding option could not be loaded.</p>
                            <button onClick={() => navigate('/funding')} className="btn btn-dark btn-sm">
                                Back to Funding Options
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const {
        name,
        subtitle,
        amount_range,
        terms,
        speed_to_funds,
        uses,
        qualify_reasons = [],
        missing_documents = [],
        readiness_factors = [],
        icon,
        icon_color,
        eligibility_status,
        eligibility_label,
    } = data;

    const colors = getFundingColorStyles(icon_color);
    const iconClass = resolveIcon(icon);

    // Eligibility badge config
    const eligible = (eligibility_status || 'likely_eligible').toLowerCase();
    const eligibleCfg: Record<string, { bg: string; color: string; label: string }> = {
        likely_eligible: { bg: '#e8f9f0', color: '#1a7a4a', label: 'Likely Eligible' },
        eligible: { bg: '#e8f9f0', color: '#1a7a4a', label: 'Eligible' },
        not_eligible: { bg: '#fee2e2', color: '#991b1b', label: 'Not Eligible' },
        review_needed: { bg: '#fef3c7', color: '#92400e', label: 'Review Needed' },
    };
    const eligBadge = eligibleCfg[eligible] || eligibleCfg['likely_eligible'];

    const metaItems = [
        { label: 'Recommended Range', value: amount_range },
        { label: 'Term', value: terms },
        { label: 'Speed to Funds', value: speed_to_funds },
        { label: 'Uses', value: uses },
    ];

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* ── Sticky Breadcrumb ──────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between py-2">
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb m-0">
                                    <li className="breadcrumb-item">
                                        <Link to="/funding">Funding Options</Link>
                                    </li>
                                    <li className="breadcrumb-item active fw-medium" aria-current="page">
                                        {name}
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* ── Main Card ─────────────────────────────────────────────── */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <div className="card-body p-4">

                        {/* ── Header: Icon + Title + Eligibility Badge ──────── */}
                        <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                {/* Icon circle */}
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: '50%',
                                    background: colors.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <i className={iconClass} style={{ fontSize: 26, color: colors.text }} />
                                </div>
                                <div>
                                    <h4 className="mb-1 fw-bold" style={{ fontSize: 18, color: '#0f1b2d' }}>{name}</h4>
                                    {subtitle && (
                                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>{subtitle}</p>
                                    )}
                                </div>
                            </div>

                            {/* Eligibility badge */}
                            <div className="text-end flex-shrink-0">
                                <span style={{
                                    display: 'inline-block',
                                    background: eligBadge.bg,
                                    color: eligBadge.color,
                                    fontWeight: 600,
                                    fontSize: 12,
                                    padding: '5px 14px',
                                    borderRadius: 6,
                                    letterSpacing: '0.01em',
                                }}>
                                    {eligibility_label || eligBadge.label}
                                </span>
                                {/* <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>High Match</p> */}
                            </div>
                        </div>

                        {/* ── 4-Column Meta Row ─────────────────────────────── */}
                        <div
                            className="row g-0 mb-4"
                            style={{
                                border: '1px solid #e8ecf0',
                                borderRadius: 8,
                                overflow: 'hidden',
                            }}
                        >
                            {metaItems.map((m, i) => (
                                <div
                                    key={i}
                                    className="col-md-3 col-sm-6"
                                    style={{
                                        padding: '14px 18px',
                                        borderRight: i < 3 ? '1px solid #e8ecf0' : 'none',
                                        borderBottom: '0',
                                    }}
                                >
                                    <p style={{
                                        margin: 0,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        color: '#9ca3af',
                                        marginBottom: 4,
                                    }}>
                                        {m.label}
                                    </p>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        lineHeight: 1.35,
                                    }}>
                                        {m.value || '—'}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ── Two-Column Body ───────────────────────────────── */}
                        <div className="row g-3">

                            {/* Left: Why You May Qualify */}
                            <div className="col-md-6">
                                <div style={{
                                    border: '1px solid #e8ecf0',
                                    borderRadius: 8,
                                    padding: '18px 20px',
                                    height: '100%',
                                }}>
                                    <h6 style={{ fontWeight: 700, fontSize: 13, color: '#0f1b2d', marginBottom: 14 }}>
                                        Why You May Qualify
                                    </h6>

                                    {/* Qualify reasons */}
                                    {qualify_reasons.length > 0 ? qualify_reasons.map((r: string, i: number) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            marginBottom: 10,
                                        }}>
                                            <span style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: '#e8f9f0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                marginTop: 1,
                                            }}>
                                                <i className="ri-check-line" style={{ fontSize: 10, color: '#1a7a4a' }} />
                                            </span>
                                            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>{r}</span>
                                        </div>
                                    )) : (
                                        <p style={{ fontSize: 13, color: '#9ca3af' }}>No qualifying reasons listed.</p>
                                    )}

                                    {/* Missing Documents */}
                                    {missing_documents.length > 0 && (
                                        <div style={{
                                            marginTop: 16,
                                            paddingTop: 16,
                                            borderTop: '1px solid #e8ecf0',
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 10,
                                            }}>
                                                <span style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    background: '#fee2e2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    <i className="ri-close-line" style={{ fontSize: 10, color: '#991b1b' }} />
                                                </span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                                                    Missing Documents
                                                </span>
                                            </div>
                                            {missing_documents.map((d: string, i: number) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 10,
                                                    paddingLeft: 4,
                                                    marginBottom: 6,
                                                }}>
                                                    <span style={{
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: '50%',
                                                        background: '#9ca3af',
                                                        flexShrink: 0,
                                                        marginTop: 6,
                                                    }} />
                                                    <span style={{ fontSize: 13, color: '#6b7280' }}>{d}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Readiness Factors */}
                            <div className="col-md-6">
                                <div style={{
                                    border: '1px solid #e8ecf0',
                                    borderRadius: 8,
                                    padding: '18px 20px',
                                    height: '100%',
                                }}>
                                    <h6 style={{ fontWeight: 700, fontSize: 13, color: '#0f1b2d', marginBottom: 14 }}>
                                        Readiness Factors
                                    </h6>

                                    {readiness_factors.length > 0 ? readiness_factors.map((f: any, i: number) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingTop: 10,
                                                paddingBottom: 10,
                                                borderBottom: i < readiness_factors.length - 1
                                                    ? '1px solid #f1f5f9'
                                                    : 'none',
                                            }}
                                        >
                                            <span style={{ fontSize: 13, color: '#374151' }}>{f.label}</span>
                                            <ReadinessBadge status={f.status} />
                                        </div>
                                    )) : (
                                        <p style={{ fontSize: 13, color: '#9ca3af' }}>No readiness factors available.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── Footer CTA ────────────────────────────────────────── */}
                    <div style={{
                        borderTop: '1px solid #e8ecf0',
                        background: '#fff',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#0f1b2d' }}>
                                Next Step
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                Start your funding review by providing a few details and uploading missing documents.
                            </p>
                        </div>
                        <Link
                            to={`/funding/${id}/review`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: '#1d4ed8',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: 13,
                                padding: '10px 20px',
                                borderRadius: 8,
                                textDecoration: 'none',
                                flexShrink: 0,
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1e40af')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#1d4ed8')}
                        >
                            Start Funding Review
                            <i className="ri-arrow-right-line" style={{ fontSize: 15 }} />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FundingDetail;