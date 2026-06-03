import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBorrowerFunding } from '../../modules/funding/services';
import FundingCard from './components/FundingCard';
import FundingLoader from '../../components/Loader/FundingLoader';
import { toast } from 'react-toastify';
import { Dropdown } from 'primereact/dropdown';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps { icon: string; label: string; value: string; color: string; }

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
    <div className="col-xl-3 col-md-6">
        <div className="card shadow-sm border-0 rounded-2 bg-white card-animate">
            <div className="card-body py-3 px-4 d-flex align-items-center">
                <div className={`avatar-md bg-${color}-subtle rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0`}>
                    <i className={`${icon} text-${color} fs-24`}></i>
                </div>
                <div>
                    <p className="text-muted mb-0 fs-13 fw-medium text-uppercase">{label}</p>
                    <h4 className="mb-0 fw-bold text-dark fs-22 lh-1">{value}</h4>
                </div>
            </div>
        </div>
    </div>
);

// ─── Dynamic stat card config ─────────────────────────────────────────────────
// Each entry maps an API stats field to display properties.
// formatMoney: divide by 1M and format as $X.XXM  |  formatCount: display as-is
const formatMoney = (v: any) => `$${((Number(v) || 0) / 1_000_000).toFixed(2)}M`;
const formatCount = (v: any) => `${Number(v) || 0}`;

interface StatConfig {
    key: string;           // key in the stats object from the API
    label: string;         // fallback label if API doesn't supply one
    labelKey?: string;     // optional API key for a dynamic label
    icon: string;
    color: string;
    format: (v: any) => string;
}

const STAT_CONFIG: StatConfig[] = [
    {
        key: 'total_approved',
        label: 'Total Approved',
        labelKey: 'total_approved_label',
        icon: 'ri-money-dollar-circle-line',
        color: 'success',
        format: formatMoney,
    },
    {
        key: 'total_funded',
        label: 'Total Funded',
        labelKey: 'total_funded_label',
        icon: 'ri-file-text-line',
        color: 'info',
        format: formatMoney,
    },
    {
        key: 'total_options',
        label: 'Funding Options',
        labelKey: 'total_options_label',
        icon: 'ri-line-chart-line',
        color: 'primary',
        format: formatCount,
    },
    {
        key: 'total_groups',
        label: 'Funding Groups',
        labelKey: 'total_groups_label',
        icon: 'ri-group-line',
        color: 'warning',
        format: formatCount,
    },
];

// ─── Filter Bar (reference style) ─────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    height: 38,
    padding: '0 32px 0 12px',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    background: '#fff',
    fontSize: 13,
    color: '#495057',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    minWidth: 160,
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Funding = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeType, setActiveType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchBorrowerFunding();
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
    const allTypes = [{ id: 'all', name: 'All Categories' }, ...types];
    const hasFilter = searchQuery.trim() !== '' || activeType !== 'all';

    const matchesQuery = (seq: any, q: string) => {
        if (!q) return true;
        q = q.toLowerCase();

        // Check common string fields first
        const checkString = (val: any) => typeof val === 'string' && val.toLowerCase().includes(q);

        if (checkString(seq.name) || checkString(seq.subtitle) || checkString(seq.amount_range) || checkString(seq.terms)) {
            return true;
        }

        // Check arrays (tags, accounts, etc.)
        const maybeArray = (val: any) => Array.isArray(val) && val.some((it: any) => String(it).toLowerCase().includes(q));
        if (maybeArray(seq.tags) || maybeArray(seq.accounts) || maybeArray(seq.credit_accounts)) return true;

        // Fallback: scan top-level primitive values for a match
        for (const k in seq) {
            const v = seq[k];
            if (typeof v === 'string' && v.toLowerCase().includes(q)) return true;
            if (typeof v === 'number' && String(v).includes(q)) return true;
            if (Array.isArray(v) && v.some(item => String(item).toLowerCase().includes(q))) return true;
        }

        return false;
    };

    const filteredGroups = groups
        .map((group: any) => ({
            ...group,
            sequencings: group.sequencings.filter((seq: any) => {
                const matchesTab = activeType === 'all' || seq.funding_type_id?.toString() === activeType;
                const q = searchQuery.toLowerCase().trim();
                const matchesSearch = matchesQuery(seq, q);
                return matchesTab && matchesSearch;
            }),
        }))
        .filter((g: any) => g.sequencings.length > 0);

    const clearAll = () => { setSearchQuery(''); setActiveType('all'); };

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* ── Sticky Subheader / Breadcrumb ─────────────────────────── */}
                <div className="row page-subheader-sticky bg-body">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-20 mb-1">Funding Options</h4>
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

                {/* ── Stat Cards — fully dynamic from API stats ──────────── */}
                <div className="row g-4">
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

                {/* ── Filter Bar (reference-style flat row) ─────────────────── */}
                <div
                    className="mt-0 mb-2"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                        padding: '8px 14px',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                        <i className="ri-search-line" style={{
                            position: 'absolute', left: 10, top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#adb5bd', fontSize: 14, pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            placeholder="Search here"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                height: 38,
                                paddingLeft: 32,
                                paddingRight: searchQuery ? 30 : 10,
                                border: '1px solid #dee2e6',
                                borderRadius: 6,
                                fontSize: 13,
                                color: '#212529',
                                background: '#fff',
                                outline: 'none',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#6c757d')}
                            onBlur={(e) => (e.target.style.borderColor = '#dee2e6')}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute', right: 8, top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', color: '#adb5bd',
                                    display: 'flex', padding: 0, fontSize: 15,
                                }}
                            >
                                <i className="ri-close-circle-fill" />
                            </button>
                        )}
                    </div>

                    {/* Type Select */}
                        
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Dropdown
                            value={activeType}
                            options={allTypes.map((t: any) => ({
                                label: t.id === 'all' ? 'All Categories' : t.name,
                                value: t.id === 'all' ? 'all' : t.id.toString(),
                            }))}
                            onChange={(e) => setActiveType(e.value)}
                            placeholder="All Categories"
                            optionLabel="label"
                            optionValue="value"
                            className="w-100"
                            style={{
                                height: '38px',
                                minWidth: '160px',
                            }}
                        />
                    </div>

                    {/* Filters Button */}
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            height: 38, padding: '0 14px',
                            border: 'none', borderRadius: 6,
                            background: '#6c757d',
                            color: '#fff',
                            fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}
                        onClick={() => {}}
                    >
                        <i className="ri-equalizer-line" style={{ fontSize: 14 }} />
                        Filters
                    </button>

                    {/* × Clear */}
                    {hasFilter && (
                        <button
                            onClick={clearAll}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'none', border: 'none',
                                cursor: 'pointer', color: '#6c757d',
                                fontSize: 13, fontWeight: 500,
                                padding: '0 4px', flexShrink: 0,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <i className="ri-close-line" style={{ fontSize: 15 }} />
                            Clear
                        </button>
                    )}
                </div>

                {/* ── Empty State ────────────────────────────────────────────── */}
                {filteredGroups.length === 0 ? (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <i className="ri-search-eye-line fs-1 text-muted d-block mb-3" />
                            <h6 className="fw-semibold text-dark mb-1">No funding options found</h6>
                            <p className="text-muted fs-13 mb-3">Try adjusting your search or filter.</p>
                            <button onClick={clearAll} className="btn btn-dark btn-sm">Reset Filters</button>
                        </div>
                    </div>
                ) : (
                    filteredGroups.map((group: any) => (
                        <div key={group.id} className="mb-3">
                            {/* Group header */}
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <h5 className="mb-0 fw-bold fs-15 text-dark">{group.name}</h5>
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    background: '#eef2ff', color: '#3b52d4',
                                    padding: '2px 8px', borderRadius: 20,
                                }}>
                                    {group.sequencings.length}
                                </span>
                            </div>

                            {/* Cards grid — equal-height rows via d-flex + align-items-stretch */}
                            <div className="row g-3">
                                {group.sequencings.map((seq: any) => (
                                    <div
                                        className="col-xxl-3 col-xl-4 col-lg-4 col-md-6 d-flex align-items-stretch"
                                        key={seq.id}
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
                                            tags={seq.tags}
                                            accounts={seq.accounts}
                                            credit_accounts={seq.credit_accounts}
                                            apr={seq.apr}
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
