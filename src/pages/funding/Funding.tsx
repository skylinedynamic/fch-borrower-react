import React, { useEffect, useState } from 'react';
import '../../../assets/css/funding.css';
import '../../../assets/css/responsive.css';
import { Link } from 'react-router-dom';
import { fetchBorrowerFunding } from '../../modules/funding/services';
import FundingCard from './components/FundingCard';
import FundingLoader from '../../components/Loader/FundingLoader';
import CustomDropdown from '../../components/Common/CustomDropdown';
import { toast } from 'react-toastify';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps { icon: string; label: string; value: string; color: string; }

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
    <div className="col-6 col-md-6 col-xl-3 funding-stat-card-col">
        <div className="card shadow-sm border-0 rounded-2 bg-white card-animate">
            <div className="card-body py-3 px-4 d-flex align-items-center funding-stat-card-body">
                <div className={`avatar-md bg-${color}-subtle rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0 funding-stat-card-icon`}>
                    <i className={`${icon} text-${color} fs-24 funding-stat-card-icon-i`}></i>
                </div>
                <div>
                    <p className="text-muted mb-0 fs-13 fw-medium text-uppercase funding-stat-card-label">{label}</p>
                    <h4 className="mb-0 fw-bold text-dark fs-22 lh-1 funding-stat-card-value">{value}</h4>
                </div>
            </div>
        </div>
    </div>
);

// ─── Stat config ──────────────────────────────────────────────────────────────
const formatReadiness = (v: any) => v === 'N/A' || v == null ? 'N/A' : `${v}/100`;
const formatFico = (v: any) => v === 'N/A' || v == null ? 'N/A' : `${v}`;
const formatRevenue = (v: any) => (v === 'N/A' || v == null) ? 'N/A' : v;
const formatTimeInBusiness = (v: any) => (v === 'N/A' || v == null) ? 'N/A' : v;

interface StatConfig {
    key: string;
    label: string;
    labelKey?: string;
    icon: string;
    color: string;
    format: (v: any) => string;
}

const STAT_CONFIG: StatConfig[] = [
    { key: 'funding_readiness_score', label: 'Funding Readiness Score', icon: 'ri-bar-chart-fill', color: 'primary', format: formatReadiness },
    { key: 'fico_score', label: 'FICO Score', icon: 'ri-dashboard-line', color: 'info', format: formatFico },
    { key: 'monthly_revenue', label: 'Monthly Revenue', icon: 'ri-money-dollar-circle-line', color: 'success', format: formatRevenue },
    { key: 'time_in_business', label: 'Time in Business', icon: 'ri-calendar-line', color: 'warning', format: formatTimeInBusiness },
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

                {/* ── Breadcrumb ──────────────────────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-18 mb-1 mt-0">Funding Options</h4>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                                        <li className="breadcrumb-item active fw-medium" aria-current="page">Funding Options</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ──────────────────────────────────────────── */}
                <div className="row g-4 funding-stats-row">
                    {STAT_CONFIG.map((cfg) => (
                        <StatCard
                            key={cfg.key}
                            icon={cfg.icon}
                            color={cfg.color}
                            label={cfg.labelKey && stats[cfg.labelKey] ? stats[cfg.labelKey] : cfg.label}
                            value={cfg.format(stats[cfg.key])}
                        />
                    ))}
                </div>

                {/* ── Search & Filter Bar ────────────────────────────────────────── */}
                <div className="row mb-3 funding-filter-row">
                    <div className="col-12">
                        <div className="card shadow-sm border-0 bg-white mb-2">
                            <div className="card-body p-3">
                                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-3">
                                    <div className="flex-grow-1">
                                        <div className="row g-3">
                                            {/* Search Field (col-9) */}
                                            <div className="col-12 col-md-9">
                                                <div className="input-group vendor-filter-input-group border-0 transition-all shadow-sm-hover bg-light rounded" style={{ backgroundColor: '#f3f6f9' }}>
                                                    <span className="input-group-text bg-transparent border-0 pe-1">
                                                        <i className="ri-search-line text-muted opacity-75"></i>
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-transparent border-0 ps-1 fs-13 shadow-none"
                                                        placeholder="Search here..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Category Dropdown (col-3) */}
                                            <div className="col-12 col-md-3">
                                                <div className="h-100">
                                                    <CustomDropdown
                                                        options={allTypes.map(t => ({ id: t.id.toString(), name: t.name }))}
                                                        value={activeType}
                                                        onChange={(val) => { setActiveType(val.toString()); }}
                                                        optionLabel="name"
                                                        optionValue="id"
                                                        placeholder="All Product Categories"
                                                        className="border-0 rounded-2 fs-13 vendor-filter-bg h-100 w-100"
                                                        searchable={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2 flex-shrink-0">
                                        <button
                                            className="btn btn-warning d-flex align-items-center justify-content-center gap-2 px-3 transition-all fs-13 shadow-sm text-white"
                                            onClick={applyFilters}
                                        >
                                            <i className="ri-equalizer-fill align-bottom"></i> Filters
                                        </button>
                                        {hasFilter && (
                                            <button
                                                className="btn-clear d-flex align-items-center justify-content-center gap-2 px-3 transition-all fs-13"
                                                onClick={clearAll}
                                            >
                                                <i className="ri-close-line align-bottom"></i> Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Empty State ──────────────────────────────────────────── */}
                {filteredGroups.length === 0 ? (
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body text-center d-flex flex-column justify-content-center align-items-center funding-empty-state">
                                    <div className="funding-empty-state-icon">
                                        <i className="ri-search-eye-line text-muted" />
                                    </div>
                                    <h4 className="fw-bold text-dark mb-2 fs-4">No funding options found</h4>
                                    <p className="text-muted fs-15 mb-4">Try adjusting your search or filter to see more results.</p>
                                    <button onClick={clearAll} className="btn btn-dark px-4 py-2 fw-medium shadow-sm">Reset Filters</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    filteredGroups.map((group: any) => (
                        <div key={group.id} className="mb-4">
                            {/* Group header */}
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <h5 className="mb-0 fw-bold fs-15 text-dark">{group.name}</h5>
                                <span className="funding-group-count">
                                    {group.sequencings.length}
                                </span>
                            </div>

                            {/* Cards grid */}
                            <div className="row g-3 funding-cards-row">
                                {group.sequencings.map((seq: any) => (
                                    <div
                                        key={seq.id}
                                        className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 d-flex align-items-stretch"
                                    >
                                        <FundingCard
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
};

export default Funding;
