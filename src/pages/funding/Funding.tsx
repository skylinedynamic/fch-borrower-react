import React, { useEffect, useState } from 'react';
import '../../../assets/css/funding.css';
import '../../../assets/css/responsive.css';
import { Link } from 'react-router-dom';
import { fetchBorrowerFunding } from '../../modules/funding/services';
import FundingCard from './components/FundingCard';
import FundingLoader from '../../components/Loader/FundingLoader';
import CustomDropdown from '../../components/Common/CustomDropdown';
import { toast } from 'react-toastify';
import FundingHowItWorks, { FundingArrivalNote } from './components/FundingHowItWorks';
import { ficoBand, ficoRatio, readinessRatio } from './fundingStats';
import './Funding.css';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    icon: string;
    label: string;
    value: string;
    color: string;
    subValue?: string;
    /** What the figure means, under it. */
    caption?: string | null;
    /** Where the figure sits on its range, shown as a meter. */
    meter?: { ratio: number; now: number; min: number; max: number } | null;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, subValue, caption, meter }) => (
    <div className={`fp-stat tone-${color}`}>
        <div className="fp-stat-head">
            <p className="fp-stat-label">
                {label} {subValue && <span className="fp-stat-sub">{subValue}</span>}
            </p>
            <span className="fp-stat-icon" aria-hidden="true">
                <i className={icon}></i>
            </span>
        </div>
        <p className="fp-stat-value">{value}</p>
        <div className="fp-stat-foot">
            {meter ? (
                <div
                    className="fp-stat-meter"
                    role="meter"
                    aria-label={label}
                    aria-valuenow={meter.now}
                    aria-valuemin={meter.min}
                    aria-valuemax={meter.max}
                >
                    <span style={{ width: `${Math.round(meter.ratio * 100)}%` }}></span>
                </div>
            ) : (
                <span className="fp-stat-meter is-empty" aria-hidden="true"></span>
            )}
            {caption && <span className="fp-stat-caption">{caption}</span>}
        </div>
    </div>
);

// ─── Stat config ──────────────────────────────────────────────────────────────
const formatReadiness = (v: any) => v === 'N/A' || v == null || v === '' ? '0' : `${v}`;
const formatFico = (v: any) => v === 'N/A' || !v || v === '0' || v === '0.00' ? 'N/A' : `${v}`;
const formatRevenue = (v: any) => v === 'N/A' || !v || v === '0' || v === '0.00' ? 'N/A' : `${v}`;
const formatTimeInBusiness = (v: any) => v === 'N/A' || !v || v === '0' ? 'N/A' : `${v}`;

interface StatConfig {
    key: string;
    label: string;
    labelKey?: string;
    icon: string;
    color: string;
    format: (v: any) => string;
    subValue?: string;
    caption: (v: any) => string | null;
    meter?: (v: any) => StatCardProps['meter'];
}

const STAT_CONFIG: StatConfig[] = [
    {
        key: 'funding_readiness_score', label: 'Funding Readiness Score', icon: 'ri-bar-chart-fill', color: 'primary', format: formatReadiness,
        caption: () => 'Out of 100',
        meter: (v) => {
            const ratio = readinessRatio(v);
            return { ratio, now: Math.round(ratio * 100), min: 0, max: 100 };
        },
    },
    {
        key: 'fico_score', label: 'Personal Credit Score', subValue: '(FICO)', icon: 'ri-dashboard-3-line', color: 'info', format: formatFico,
        caption: (v) => ficoBand(v),
        meter: (v) => {
            const ratio = ficoRatio(v);
            return ratio === null ? null : { ratio, now: Number(v), min: 300, max: 850 };
        },
    },
    { key: 'monthly_revenue', label: 'Monthly Revenue', icon: 'ri-money-dollar-circle-line', color: 'success', format: formatRevenue, caption: () => 'Per month' },
    { key: 'time_in_business', label: 'Time in Business', icon: 'ri-calendar-check-line', color: 'warning', format: formatTimeInBusiness, caption: () => 'In business' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
const Funding = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeType, setActiveType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [appliedType, setAppliedType] = useState<string>('all');

    useEffect(() => {
        loadData('');
    }, []);

    const loadData = async (search: string = '') => {
        setLoading(true);
        try {
            const res = await fetchBorrowerFunding({ search });
            if (res.status) {
                setData(res.data);
            } else {
                toast.error(res.message || 'Failed to load funding options');
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred while loading funding options');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <FundingLoader />;

    const { groups = [], types = [], stats = {} } = data || {};

    const allTypes = [{ id: 'all', name: 'All Product Categories' }, ...types];
    const hasFilter = searchQuery.trim() !== '' || appliedType !== 'all';

    const filteredGroups = groups.map((group: any) => {
        if (appliedType === 'all') return group;
        const filteredSequencings = group.sequencings.filter((seq: any) => seq.funding_type_id?.toString() === appliedType);
        return { ...group, sequencings: filteredSequencings };
    }).filter((g: any) => g.sequencings && g.sequencings.length > 0);

    const applyFilters = () => {
        setAppliedType(activeType);
        loadData(searchQuery.trim());
    };

    const clearAll = () => {
        setSearchQuery('');
        setActiveType('all');
        setAppliedType('all');
        loadData('');
    };

    return (
        <div className="page-content funding-page">
            <div className="container-fluid">
                <div className="fp-shell">

                    <FundingArrivalNote />

                    {/* ── Header, with the overview figures under it ──────────── */}
                    <header className="fp-hero">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb fp-breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Funding Options</li>
                            </ol>
                        </nav>
                        <h4 className="fp-title">Funding Options</h4>
                        <p className="fp-lead">Compare the programs open to your business and start a funding request.</p>
                    </header>

                    <section className="fp-stats" aria-label="Your funding overview">
                        {STAT_CONFIG.map((cfg) => (
                            <StatCard
                                key={cfg.key}
                                icon={cfg.icon}
                                color={cfg.color}
                                label={cfg.labelKey && stats[cfg.labelKey] ? stats[cfg.labelKey] : cfg.label}
                                value={cfg.format(stats[cfg.key])}
                                subValue={cfg.subValue}
                                caption={cfg.caption(stats[cfg.key])}
                                meter={cfg.meter?.(stats[cfg.key])}
                            />
                        ))}
                    </section>

                    {/* ── The stages of a request ─────────────────────────────── */}
                    <FundingHowItWorks />

                    {/* ── Search & Filter ─────────────────────────────────────── */}
                    <div className="fp-toolbar">
                        <div className="fp-search">
                            <i className="ri-search-line" aria-hidden="true"></i>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search here..."
                                aria-label="Search funding options"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="fp-category">
                            <CustomDropdown
                                options={allTypes.map(t => ({ id: t.id.toString(), name: t.name }))}
                                value={activeType}
                                onChange={(val) => { setActiveType(val.toString()); }}
                                optionLabel="name"
                                optionValue="id"
                                placeholder="All Product Categories"
                                className="rounded-2 fs-13 w-100"
                                searchable={true}
                            />
                        </div>

                        <div className="fp-actions">
                            <button type="button" className="fp-btn fp-btn-primary" onClick={applyFilters}>
                                <i className="ri-equalizer-line" aria-hidden="true"></i> Filters
                            </button>
                            {hasFilter && (
                                <button type="button" className="fp-btn fp-btn-ghost" onClick={clearAll}>
                                    <i className="ri-close-line" aria-hidden="true"></i> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Programs ────────────────────────────────────────────── */}
                    {filteredGroups.length === 0 ? (
                        <div className="fp-empty">
                            <span className="fp-empty-icon" aria-hidden="true">
                                <i className="ri-search-eye-line" />
                            </span>
                            <h4 className="fp-empty-title">No funding options found</h4>
                            <p className="fp-empty-text">Try adjusting your search or filter to see more results.</p>
                            <button type="button" onClick={clearAll} className="fp-btn fp-btn-primary">Reset Filters</button>
                        </div>
                    ) : (
                        filteredGroups.map((group: any) => (
                            <section key={group.id} className="fp-group" aria-labelledby={`fp-group-${group.id}`}>
                                <div className="fp-group-head">
                                    <h5 id={`fp-group-${group.id}`} className="fp-group-title">{group.name}</h5>
                                    <span className="fp-group-count">{group.sequencings.length}</span>
                                    <span className="fp-group-rule" aria-hidden="true"></span>
                                </div>

                                <div className="fp-grid">
                                    {group.sequencings.map((seq: any) => (
                                        <FundingCard
                                            key={seq.id}
                                            id={seq.id}
                                            icon={seq.icon}
                                            icon_color={seq.icon_color}
                                            name={seq.name}
                                            subtitle={seq.subtitle}
                                            amount_range={seq.amount_range}
                                            terms={seq.terms}
                                            action_url={seq.action_url}
                                            engine_status={seq.engine_status}
                                            engine_status_label={seq.engine_status_label}
                                            latest_review_status={seq.latest_review_status}
                                            readiness_factors={seq.readiness_factors}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}

                </div>
            </div>
        </div>
    );
};

export default Funding;
