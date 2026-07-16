import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchFundingDetail, fetchReadinessFactors } from '../../../modules/funding/services';
import { FUNDING_ICON_MAP, QUALIFY_REASONS_MAP, FUNDING_REVIEW_STATUS, ENGINE_STATUS_LABELS, MATCH_LEVEL_LABELS, ENGINE_STATUS_VALUES, READINESS_FACTOR_LABELS, FACTOR_STATUS_VALUES, BADGE_LABELS, FACTOR_ICON_STYLES, META_ITEM_LABELS, READINESS_BADGE_STYLES } from '../../../config/funding';
import { getFundingColorStyles } from '../../../config/fundingColor';
import { toast } from 'react-toastify';
import { UncontrolledTooltip } from 'reactstrap';
import '../../../../assets/css/funding.css';

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
    const style = READINESS_BADGE_STYLES[s] || { icon: 'ri-question-line', bg: '#f0f3f7', color: '#4b5563' };
    return (
        <span className="funding-readiness-badge" style={{ background: style.bg, color: style.color }}>
            <i className={style.icon} />
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
                    <div className="d-flex align-items-center justify-content-between flex-row">
                        <div className="flex-grow-1">
                            <div className="skeleton-line mb-2" style={{ width: 200, height: 24, borderRadius: 4 }} />
                            <div className="d-flex align-items-center gap-2">
                                <div className="skeleton-line m-0" style={{ width: 60, height: 13, borderRadius: 4 }} />
                                <div className="skeleton-line m-0" style={{ width: 8, height: 13, borderRadius: 4 }} />
                                <div className="skeleton-line m-0" style={{ width: 100, height: 13, borderRadius: 4 }} />
                                <div className="skeleton-line m-0" style={{ width: 8, height: 13, borderRadius: 4 }} />
                                <div className="skeleton-line m-0" style={{ width: 140, height: 13, borderRadius: 4 }} />
                            </div>
                        </div>
                        <div className="mt-0">
                            <div className="skeleton-line m-0" style={{ width: 75, height: 36, borderRadius: 4 }} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="card border-0 shadow-sm" style={{ borderRadius: 4, overflow: 'hidden' }}>
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
                    <div className="row g-0 mb-4" style={{ border: '1px solid #e8ecf0', borderRadius: 4, overflow: 'hidden' }}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`col-md-3 col-6 p-3`} style={{ borderRight: i < 3 ? '1px solid #e8ecf0' : 'none' }}>
                                <div className="skeleton-line mb-2" style={{ width: '60%', height: 10, borderRadius: 4 }} />
                                <div className="fd-skel-panel">
                                    <div className="skeleton-line mb-4" style={{ width: 140, height: 14, borderRadius: 4 }} />
                                    {[90, 80, 85, 70].map((w, j) => (
                                        <div key={j} className="d-flex align-items-center gap-2 mb-3">
                                            <div className="skeleton-line flex-shrink-0 fd-skel-circle" />
                                            <div className="skeleton-line" style={{ width: `${w}%`, height: 12, borderRadius: 4 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="row g-3 mb-3">
                        {[0, 1].map(i => (
                            <div key={i} className="col-md-6">
                                <div className="fd-skel-panel">
                                    <div className="skeleton-line mb-4" style={{ width: 140, height: 14, borderRadius: 4 }} />
                                    {[90, 80, 85, 70].map((w, j) => (
                                        <div key={j} className="d-flex align-items-center gap-2 mb-3">
                                            <div className="skeleton-line flex-shrink-0 fd-skel-circle" />
                                            <div className="skeleton-line" style={{ width: `${w}%`, height: 12, borderRadius: 4 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="fd-skel-panel-sm">
                        <div className="skeleton-line mb-3" style={{ width: 100, height: 14, borderRadius: 4 }} />
                        <div className="skeleton-line mb-2" style={{ width: '100%', height: 12, borderRadius: 4 }} />
                        <div className="skeleton-line" style={{ width: '80%', height: 12, borderRadius: 4 }} />
                    </div>
                </div>
                <div className="fd-skel-footer">
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

// ─── Readiness Item Renderer ──────────────────────────────────────────────────
const ReadinessItem: React.FC<{ factor: any, isLast: boolean }> = ({ factor, isLast }) => {
    const s = (factor.status || '').toLowerCase();
    let leftIcon = 'ri-question-line';
    let leftIconColor = '#9ca3af'; // gray

    if (FACTOR_ICON_STYLES[s]) {
        leftIcon = FACTOR_ICON_STYLES[s].icon;
        leftIconColor = FACTOR_ICON_STYLES[s].color;
    }

    let subtitle = '';
    if (factor.label === READINESS_FACTOR_LABELS.RESTRICTED_STATE) {
        subtitle = `Your business is located in ${factor.borrower_value}, which is a restricted state for this funding program.`;
    } else if (factor.label === READINESS_FACTOR_LABELS.STATE_ELIGIBILITY) {
        if (s === FACTOR_STATUS_VALUES.FAILED || s === FACTOR_STATUS_VALUES.RESTRICTED) {
            subtitle = `Your business is located in ${factor.borrower_value}. This program only allows specific states.`;
        } else {
            subtitle = `Your business location is eligible for this funding program.`;
        }
    } else if (factor.label === READINESS_FACTOR_LABELS.RESTRICTED_INDUSTRY) {
        subtitle = `Your business is in the ${factor.borrower_value} industry, which is restricted.`;
    } else if (factor.label === READINESS_FACTOR_LABELS.INDUSTRY_ELIGIBILITY) {
        if (s === FACTOR_STATUS_VALUES.FAILED || s === FACTOR_STATUS_VALUES.RESTRICTED) {
            subtitle = `Your industry (${factor.borrower_value}) is not supported.`;
        } else {
            subtitle = `Your industry is eligible for this funding program.`;
        }
    }

    let badgeText = factor.status;
    
    if ((factor.label === READINESS_FACTOR_LABELS.RESTRICTED_STATE || factor.label === READINESS_FACTOR_LABELS.RESTRICTED_INDUSTRY) && s === FACTOR_STATUS_VALUES.FAILED) {
        badgeText = BADGE_LABELS.RESTRICTED;
    } else if ((factor.label === READINESS_FACTOR_LABELS.STATE_ELIGIBILITY || factor.label === READINESS_FACTOR_LABELS.INDUSTRY_ELIGIBILITY) && (s === FACTOR_STATUS_VALUES.GOOD || s === FACTOR_STATUS_VALUES.STRONG)) {
        badgeText = BADGE_LABELS.ELIGIBLE;
    }

    return (
        <div className="funding-readiness-item">
            <div className={`funding-readiness-item-left ${subtitle ? 'align-start' : 'align-center'}`}>
                <i className={`funding-readiness-item-icon ${subtitle ? 'with-subtitle' : ''} ${leftIcon}`} style={{ color: leftIconColor }} />
                <div className="funding-readiness-item-content">
                    <span className="funding-readiness-item-title">{factor.label}</span>
                    {subtitle && (
                        <span className="funding-readiness-item-subtitle">{subtitle}</span>
                    )}
                </div>
            </div>
            <div className="funding-readiness-item-right">
                <ReadinessBadge status={badgeText} />
            </div>
        </div>
    );
};

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

                // Dynamically generate "Why You May Qualify" sentences from Good/Strong underwriting factors
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
        engine_status = ENGINE_STATUS_VALUES.ACTIVE,
        engine_status_label = ENGINE_STATUS_LABELS.ELIGIBLE_NOW,
        qualify_reasons = [],
        readiness_factors = [],
        missing_documents = [],
        latest_review_status,
    } = data;

    const colors = getFundingColorStyles(icon_color);
    const iconClass = resolveIcon(icon);

    const isGreyedOut = engine_status === ENGINE_STATUS_VALUES.GREYED_OUT || engine_status === ENGINE_STATUS_VALUES.HIDDEN;
    const finalEngineStatus = engine_status || ENGINE_STATUS_VALUES.ACTIVE;
    const displayLabel = engine_status_label || ENGINE_STATUS_LABELS.LIKELY_ELIGIBLE;

    // Meta row items
    const metaItems = [
        { label: META_ITEM_LABELS.RECOMMENDED_RANGE, value: amount_range || '—' },
        { label: META_ITEM_LABELS.TERM, value: terms || '—' },
        { label: META_ITEM_LABELS.SPEED_TO_FUNDS, value: speed_to_funds ? `${speed_to_funds} Days` : '—' },
        { label: META_ITEM_LABELS.USES, value: Array.isArray(uses) && uses.length > 0 ? uses.join(', ') : '—' },
    ];

    const ctaSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const activeFactors = dynamicReadiness.length > 0 ? dynamicReadiness : readiness_factors;
    const hasMissingFactors = activeFactors.some((r: any) => {
        const s = r.status?.toLowerCase();
        return s === FACTOR_STATUS_VALUES.FAILED || s === FACTOR_STATUS_VALUES.RESTRICTED || s === FACTOR_STATUS_VALUES.WEAK;
    });
    const isPending = latest_review_status === FUNDING_REVIEW_STATUS.PENDING;

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
                                <Link to="/funding" className="btn btn-light px-4 rounded shadow-none text-dark fw-medium text-nowrap">
                                    <i className="ri-arrow-left-line me-1 align-bottom"></i> Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Card ──────────────────────────────────────────────── */}
                <div className={`funding-detail-card card border-0 shadow-sm ${isGreyedOut ? 'greyed-out' : ''}`}>
                    <div className="card-body p-4">

                        {/* ── Header: Icon + Title + Eligibility Badge ──────────── */}
                        <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                {/* Icon circle */}
                                <div className="funding-detail-icon-circle" style={{ background: colors.bg }}>
                                    <i className={iconClass} style={{ color: colors.text }} />
                                </div>
                                <div>
                                    <h4 className="funding-detail-title mb-1 fw-bold">{name}</h4>
                                    {subtitle && <p className="funding-detail-subtitle text-muted mb-0">{subtitle}</p>}
                                </div>
                            </div>

                            {/* Eligibility badge — pill style matching reference */}
                            <div className="text-end flex-shrink-0">
                                <div className={`funding-detail-badge funding-detail-badge-${finalEngineStatus.toLowerCase().replace(' ', '-')}`}>
                                    {displayLabel}
                                </div>
                                {(finalEngineStatus === ENGINE_STATUS_VALUES.ACTIVE || finalEngineStatus === ENGINE_STATUS_VALUES.REVIEW) && (
                                    <p className="funding-detail-match-label text-muted mb-0 mt-1">{MATCH_LEVEL_LABELS.HIGH_MATCH}</p>
                                )}
                            </div>
                        </div>

                        {/* ── Meta Row: Range / Term / Speed / Uses ─────────────── */}
                        <div className="funding-detail-meta-row row g-0 mb-4">
                            {metaItems.map((m, i) => (
                                <div key={i} className="funding-detail-meta-col col-md-3 col-6">
                                    <p className="funding-detail-meta-label">{m.label}</p>
                                    <p className="funding-detail-meta-value">{m.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Two-column: Why You May Qualify + Underwriting Factors ── */}
                        <div className="row g-3 mb-3">

                            {/* Why You May Qualify */}
                            <div className="col-md-6">
                                <div className="funding-detail-panel">
                                    <h6 className="funding-detail-panel-title">
                                        Why You May Qualify
                                    </h6>
                                    {dynamicQualifyReasons.filter((r: any) => r.status === 'Good' || r.status === 'Strong').length > 0 ? (
                                        <ul className="funding-detail-list">
                                            {dynamicQualifyReasons.filter((r: any) => r.status === 'Good' || r.status === 'Strong').map((r: any, i: number) => {
                                                return (
                                                    <li key={i} className="funding-detail-list-item">
                                                        <i className="ri-checkbox-circle-fill funding-detail-list-icon success" />
                                                        {r.label}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="funding-detail-empty-text">No eligibility reasons available.</p>
                                    )}

                                    {/* Missing Documents section inside qualify panel */}
                                    {(() => {
                                        const extractedDocs = dynamicReadiness
                                            .filter((f: any) => f.missing_docs && f.missing_docs.length > 0)
                                            .flatMap((f: any) => f.missing_docs);
                                        const combinedDocs = [...extractedDocs, ...(missing_documents || [])];
                                        const currentMissingDocs = Array.from(new Set(combinedDocs));

                                        return currentMissingDocs.length > 0 && (
                                            <div className="funding-detail-missing-docs">
                                                <div className="funding-detail-missing-docs-title">
                                                    <i className="ri-error-warning-fill funding-detail-list-icon warning" />
                                                    <span>Missing Documents</span>
                                                </div>
                                                <ul className="funding-detail-missing-docs-list">
                                                    {currentMissingDocs.map((doc: string, i: number) => (
                                                        <li key={i} className="funding-detail-missing-docs-item">
                                                            <span className="funding-detail-missing-docs-dot" />
                                                            {doc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Underwriting Factors */}
                            <div className="col-md-6">
                                <div className="funding-detail-panel">
                                    <h6 className="funding-detail-panel-title">
                                        Underwriting Factors
                                    </h6>
                                    {(() => {
                                        if (activeFactors.length === 0) {
                                            return <p className="funding-detail-empty-text">No underwriting factors available.</p>;
                                        }

                                        const visibleFactors = activeFactors.filter((f: any) => {
                                            const s = (f.status || '').toLowerCase();
                                            const isStateOrIndustry = f.label === READINESS_FACTOR_LABELS.RESTRICTED_STATE || f.label === READINESS_FACTOR_LABELS.RESTRICTED_INDUSTRY || f.label === READINESS_FACTOR_LABELS.STATE_ELIGIBILITY || f.label === READINESS_FACTOR_LABELS.INDUSTRY_ELIGIBILITY;
                                            
                                            // Hide state/industry if they are Good/Strong
                                            if (isStateOrIndustry && (s === FACTOR_STATUS_VALUES.GOOD || s === FACTOR_STATUS_VALUES.STRONG)) {
                                                return false;
                                            }
                                            return true;
                                        });

                                        return (
                                            <div className="fd-factors-col">
                                                {visibleFactors.map((f: any, i: number) => (
                                                    <ReadinessItem key={i} factor={f} isLast={i === visibleFactors.length - 1} />
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* ── Description (if present) ──────────────────────────── */}
                        {description && (
                            <div className="funding-detail-panel no-full-height">
                                <h6 className="funding-detail-panel-title desc">Description</h6>
                                <div className="funding-detail-desc-content" dangerouslySetInnerHTML={{ __html: description }} />
                            </div>
                        )}

                    </div>

                    <div className="funding-detail-footer">
                        <div>
                            <p className="funding-detail-footer-title">
                                Next Step
                            </p>
                            <p className="funding-detail-footer-desc">
                                {isPending
                                    ? 'You have already applied for this funding option. Please wait for approval or rejection.'
                                    : finalEngineStatus === 'Hidden'
                                        ? 'This funding option is currently not available for your profile.'
                                        : hasMissingFactors
                                            ? 'Please address missing underwriting factors before starting your review.'
                                            : 'Start your funding request by providing a few details and uploading missing documents.'}
                            </p>
                        </div>
                        <span id="btn-start-funding-request-wrapper" className="funding-detail-btn-wrapper">
                            {(hasMissingFactors || isPending || finalEngineStatus === 'Hidden') ? (
                                <span
                                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-medium px-4 disabled fd-cta-btn-disabled"
                                >
                                    Start Funding Request
                                    <i className="ri-arrow-right-line fd-cta-arrow" />
                                </span>
                            ) : (
                                <Link
                                    to={`/funding/${id}/review`}
                                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-medium px-4 fd-cta-btn"
                                >
                                    Start Funding Request
                                    <i className="ri-arrow-right-line fd-cta-arrow" />
                                </Link>
                            )}
                        </span>
                        {(isPending || finalEngineStatus === 'Hidden') && (
                            <UncontrolledTooltip placement="top" target="btn-start-funding-request-wrapper">
                                {isPending ? 'Already applied. Please wait for approval or rejection.' : 'Not eligible for this funding option.'}
                            </UncontrolledTooltip>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FundingDetail;
