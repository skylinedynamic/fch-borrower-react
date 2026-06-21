import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchFundingDetail, fetchReadinessFactors } from '../../../modules/funding/services';
import { FUNDING_ICON_MAP, QUALIFY_REASONS_MAP } from '../../../config/funding';
import { getFundingColorStyles } from '../../../config/fundingColor';
import { toast } from 'react-toastify';

// ─── Icon resolver ────────────────────────────────────────────────────────────
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
    const cfg: Record<string, { icon: string; bg: string; color: string }> = {
        good:    { icon: 'ri-checkbox-circle-fill', bg: '#e8f9f0', color: '#1a7a4a' },
        strong:  { icon: 'ri-checkbox-circle-fill', bg: '#dbeafe', color: '#1d4ed8' },
        fair:    { icon: 'ri-error-warning-fill',   bg: '#fef3c7', color: '#92400e' },
        missing: { icon: 'ri-information-fill',     bg: '#fff3cd', color: '#92400e' },
        weak:    { icon: 'ri-close-circle-fill',    bg: '#fee2e2', color: '#991b1b' },
    };
    const style = cfg[s] || { icon: 'ri-question-line', bg: '#f0f3f7', color: '#4b5563' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, background: style.bg, color: style.color, padding: '3px 10px 3px 7px', borderRadius: 20 }}>
            <i className={style.icon} style={{ fontSize: 13 }} />
            {status}
        </span>
    );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const FundingDetailLoader = () => (
    <div className="page-content">
        <div className="container-fluid">
            <div className="row page-subheader-sticky bg-body">
                <div className="col-12 py-2">
                    <div className="d-flex align-items-center gap-2">
                        <div className="skeleton-line" style={{ width: 110, height: 13, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: 8, height: 13, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: 160, height: 13, borderRadius: 4 }} />
                    </div>
                </div>
            </div>
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
                <div className="card-body p-4">
                    <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="skeleton-line flex-shrink-0" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                            <div>
                                <div className="skeleton-line mb-2" style={{ width: 220, height: 20, borderRadius: 4 }} />
                                <div className="skeleton-line" style={{ width: 280, height: 13, borderRadius: 4 }} />
                            </div>
                        </div>
                        <div className="text-end flex-shrink-0">
                            <div className="skeleton-line" style={{ width: 110, height: 32, borderRadius: 20 }} />
                            <div className="skeleton-line ms-auto mt-2" style={{ width: 60, height: 10, borderRadius: 4 }} />
                        </div>
                    </div>
                    <div className="row g-0 mb-4" style={{ border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden' }}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`col-md-3 col-6 p-3`} style={{ borderRight: i < 3 ? '1px solid #e8ecf0' : 'none' }}>
                                <div className="skeleton-line mb-2" style={{ width: '60%', height: 10, borderRadius: 4 }} />
                                <div className="skeleton-line" style={{ width: '80%', height: 14, borderRadius: 4 }} />
                            </div>
                        ))}
                    </div>
                    <div className="row g-3 mb-3">
                        {[0, 1].map(i => (
                            <div key={i} className="col-md-6">
                                <div style={{ border: '1px solid #e8ecf0', borderRadius: 10, padding: '20px 22px', minHeight: 220 }}>
                                    <div className="skeleton-line mb-4" style={{ width: 140, height: 14, borderRadius: 4 }} />
                                    {[90, 80, 85, 70].map((w, j) => (
                                        <div key={j} className="d-flex align-items-center gap-2 mb-3">
                                            <div className="skeleton-line flex-shrink-0" style={{ width: 16, height: 16, borderRadius: '50%' }} />
                                            <div className="skeleton-line" style={{ width: `${w}%`, height: 12, borderRadius: 4 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ border: '1px solid #e8ecf0', borderRadius: 10, padding: '18px 22px' }}>
                        <div className="skeleton-line mb-3" style={{ width: 100, height: 14, borderRadius: 4 }} />
                        <div className="skeleton-line mb-2" style={{ width: '100%', height: 12, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: '80%', height: 12, borderRadius: 4 }} />
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #e8ecf0', background: '#fff', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div className="skeleton-line mb-2" style={{ width: 80, height: 14, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: 320, height: 12, borderRadius: 4 }} />
                    </div>
                    <div className="skeleton-line" style={{ width: 170, height: 42, borderRadius: 8 }} />
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
    const [dynamicReadiness, setDynamicReadiness] = useState<any[]>([]);
    const [dynamicQualifyReasons, setDynamicQualifyReasons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchFundingDetail(id),
            fetchReadinessFactors(id).catch(() => ({ status: false, data: [] }))
        ]).then(([detailRes, readinessRes]) => {
            if (detailRes.status) setData(detailRes.data);
            else toast.error(detailRes.message || 'Failed to load funding details');

            if (readinessRes?.status && Array.isArray(readinessRes.data)) {
                const readinessData = readinessRes.data;
                setDynamicReadiness(readinessData);
                
                // Dynamically generate "Why You May Qualify" sentences from Good/Strong readiness factors
                const generatedReasons: any[] = [];
                readinessData.forEach((r: any) => {
                    if (r.status === 'Good' || r.status === 'Strong') {
                        const l = r.label || '';
                        let text = QUALIFY_REASONS_MAP[l] || `${l} meets requirements`;
                        
                        generatedReasons.push({ label: text, status: r.status });
                    }
                });
                setDynamicQualifyReasons(generatedReasons);
            }
        }).catch(() => toast.error('Failed to load funding details'))
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
        uses = [],
        description,
        icon,
        icon_color,
        engine_status = 'Active',
        engine_status_label = 'Eligible Now',
        qualify_reasons = [],
        readiness_factors = [],
        missing_documents = [],
    } = data;

    const colors = getFundingColorStyles(icon_color);
    const iconClass = resolveIcon(icon);
    const isGreyedOut = engine_status === 'Greyed Out';



    // Meta row items
    const metaItems = [
        { label: 'Recommended Range', value: amount_range || '—' },
        { label: 'Term',              value: terms || '—' },
        { label: 'Speed to Funds',    value: speed_to_funds ? `${speed_to_funds} Days` : '—' },
        { label: 'Uses',              value: Array.isArray(uses) && uses.length > 0 ? uses.join(', ') : '—' },
    ];

    const ctaSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const hasMissingFactors = dynamicReadiness.some((r: any) => r.status === 'Missing');

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between flex-row py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">{name}</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item"><Link to="/funding">Funding Options</Link></li>
                                        <li className="breadcrumb-item active fw-medium" aria-current="page">{name}</li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="mt-0">
                                <Link to="/funding" className="btn btn-primary fw-medium">
                                    <i className="ri-arrow-left-line me-1 align-bottom"></i> Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Card ──────────────────────────────────────────────── */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden', opacity: isGreyedOut ? 0.8 : 1 }}>
                    <div className="card-body p-4">

                        {/* ── Header: Icon + Title + Eligibility Badge ──────────── */}
                        <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                {/* Icon circle */}
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%',
                                    background: isGreyedOut ? '#f0f3f7' : colors.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, filter: isGreyedOut ? 'grayscale(100%)' : 'none',
                                }}>
                                    <i className={iconClass} style={{ fontSize: 28, color: isGreyedOut ? '#6c757d' : colors.text }} />
                                </div>
                                <div>
                                    <h4 className="mb-1 fw-bold" style={{ fontSize: 20, color: '#0f1b2d' }}>{name}</h4>
                                    {subtitle && <p className="text-muted mb-0" style={{ fontSize: 13 }}>{subtitle}</p>}
                                </div>
                            </div>

                            {/* Eligibility badge — pill style matching reference */}
                            <div className="text-end flex-shrink-0">
                                <div className={`funding-detail-badge funding-detail-badge-${engine_status.toLowerCase().replace(' ', '-')}`}>
                                    {(engine_status_label === 'Eligible Now' || engine_status_label === 'Manual Review Required') ? 'Likely Eligible' : engine_status_label}
                                </div>
                                {(engine_status === 'Active' || engine_status === 'Review') && (
                                    <p className="mb-0 mt-1 text-muted" style={{ fontSize: 11, textAlign: 'right', fontWeight: 'bold' }}>High Match</p>
                                )}
                            </div>
                        </div>

                        {/* ── Meta Row: Range / Term / Speed / Uses ─────────────── */}
                        <div
                            className="row g-0 mb-4"
                            style={{ border: '1px solid #e8ecf0', borderRadius: 10, overflow: 'hidden' }}
                        >
                            {metaItems.map((m, i) => (
                                <div
                                    key={i}
                                    className="col-md-3 col-6"
                                    style={{
                                        padding: '14px 18px',
                                        borderRight: i < metaItems.length - 1 ? '1px solid #e8ecf0' : 'none',
                                    }}
                                >
                                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 5 }}>
                                        {m.label}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.4 }}>
                                        {m.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ── Two-column: Why You May Qualify + Readiness Factors ── */}
                        <div className="row g-3 mb-3">

                            {/* Why You May Qualify */}
                            <div className="col-md-6">
                                <div style={{ border: '1px solid #e8ecf0', borderRadius: 10, padding: '20px 22px', height: '100%' }}>
                                    <h6 style={{ fontWeight: 700, fontSize: 13, color: '#0f1b2d', marginBottom: 16 }}>
                                        Why You May Qualify
                                    </h6>
                                    {dynamicQualifyReasons.filter((r: any) => r.status === 'Good' || r.status === 'Strong').length > 0 ? (
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {dynamicQualifyReasons.filter((r: any) => r.status === 'Good' || r.status === 'Strong').map((r: any, i: number) => {
                                                return (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#374151' }}>
                                                        <i className="ri-checkbox-circle-fill" style={{ color: '#16a34a', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
                                                        {r.label}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No eligibility reasons available.</p>
                                    )}

                                    {/* Missing Documents section inside qualify panel */}
                                    {(() => {
                                        const docsFactor = dynamicReadiness.find((f: any) => f.label === 'Documents' && f.missing_docs && f.missing_docs.length > 0);
                                        const currentMissingDocs = docsFactor?.missing_docs || missing_documents;
                                        
                                        return currentMissingDocs.length > 0 && (
                                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f3f7' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <i className="ri-error-warning-fill" style={{ color: '#dc2626', fontSize: 16 }} />
                                                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f1b2d' }}>Missing Documents</span>
                                            </div>
                                            <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {currentMissingDocs.map((doc: string, i: number) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563' }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9ca3af', flexShrink: 0, display: 'inline-block' }} />
                                                        {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Readiness Factors */}
                            <div className="col-md-6">
                                <div style={{ border: '1px solid #e8ecf0', borderRadius: 10, padding: '20px 22px', height: '100%' }}>
                                    <h6 style={{ fontWeight: 700, fontSize: 13, color: '#0f1b2d', marginBottom: 16 }}>
                                        Readiness Factors
                                    </h6>
                                    {dynamicReadiness.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {dynamicReadiness.map((f: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{f.label}</span>
                                                    <ReadinessBadge status={f.status} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : readiness_factors.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {readiness_factors.map((f: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{f.label}</span>
                                                    <ReadinessBadge status={f.status} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No readiness factors available.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Description (if present) ──────────────────────────── */}
                        {description && (
                            <div style={{ border: '1px solid #e8ecf0', borderRadius: 10, padding: '18px 22px' }}>
                                <h6 style={{ fontWeight: 700, fontSize: 13, color: '#0f1b2d', marginBottom: 10 }}>Description</h6>
                                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: description }} />
                            </div>
                        )}

                    </div>

                    {/* ── Sticky Footer CTA ─────────────────────────────────────── */}
                    <div style={{
                        borderTop: '1px solid #e8ecf0',
                        background: '#fff',
                        padding: '18px 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        position: 'sticky',
                        bottom: 0,
                    }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#0f1b2d' }}>
                                {isGreyedOut ? 'Currently Unavailable' : 'Next Step'}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                                {isGreyedOut
                                    ? 'You do not meet the minimum requirements for this funding option at this time.'
                                    : hasMissingFactors 
                                        ? 'Please address missing readiness factors before starting your review.'
                                        : 'Start your funding review by providing a few details and uploading missing documents.'}
                            </p>
                        </div>
                        {!isGreyedOut && (
                            <Link
                                to={hasMissingFactors ? '#' : `/funding/${id}/review`}
                                className={`funding-detail-btn-review ${hasMissingFactors ? 'disabled' : ''}`}
                                style={hasMissingFactors ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
                                onClick={(e) => { if (hasMissingFactors) e.preventDefault(); }}
                            >
                                Start Funding Review
                                <i className="ri-arrow-right-line" style={{ fontSize: 15 }} />
                            </Link>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FundingDetail;