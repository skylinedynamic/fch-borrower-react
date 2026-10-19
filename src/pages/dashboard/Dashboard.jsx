import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Chart } from 'primereact/chart';
import { useAuthStore } from '../../store/auth';
import { isSubscriptionRestricted } from '../../lib/auth/subscriptionUtils';
import { INVOICE_STATUS_TYPES } from '../../config/invoiceStatusOptions';
import { PARTNER_TYPES } from '../../config/partnerTypeOptions';
import { FUNDING_APPLICATION_STATUS_CLASS_MAP } from '../../config/funding';
import { useActiveFundingRequests, useDashboard } from '../../modules/dashboard';
import { useCapitalAccessOverview } from '../../modules/capital-access/queries';
import DashboardLoader from '../../components/Loader/DashboardLoader';





export default function Dashboard() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const userSubscription = useAuthStore((state) => state.userSubscription);
    const isRestricted = isSubscriptionRestricted(userSubscription);


    const [activeRequestIndex, setActiveRequestIndex] = useState(0);

    // Fetch dashboard data
    const { data: dashboardData, isLoading, error } = useDashboard();
    const { data: activeFundingRequests } = useActiveFundingRequests();

    // Fetch capital access overview data
    const { data: overview } = useCapitalAccessOverview();
    const score = overview?.readiness_score ?? 0;
    const status = overview?.readiness_status ?? 'N/A';
    const statusColor = overview?.readiness_status_color;
    const totalAccess = overview?.estimated_total_access ?? '$0';
    const currentPlay = overview?.current_play;

    const widgetStyle = {
        '--ca-status-color': 'var(--ca-primary)',
        '--ca-status-bg': 'var(--ca-primary-light)',
        '--ca-status-border': 'rgba(64, 81, 137, 0.2)',
        '--ca-status-color-light': 'var(--ca-primary)',
        '--ca-status-color-dark': '#2d3a6b'
    };

    // Process KPI data from API
    const kpiData = dashboardData ? [
        {
            title: 'Funding Applications',
            value: dashboardData.data.states.funding_applications.toString(),
            iconClass: 'las la-handshake',
            iconBg: 'bg-soft-success',
            iconColor: 'text-success',
        },
        {
            title: 'Total Funding Requests',
            value: (dashboardData.data.states.funding_requests || 0).toString(),
            iconClass: 'las la-chart-pie',
            iconBg: 'bg-soft-warning',
            iconColor: 'text-warning',
        },
        {
            title: 'Total Requested Amount',
            // Formatted by the API: $37.2M, $45,000.
            value: dashboardData.data.states.total_requested_amount_formatted || '$0',
            iconClass: 'bx bx-wallet',
            iconBg: 'bg-soft-primary',
            iconColor: 'text-primary',
        },
        {
            title: 'Total Funded Amount',
            value: dashboardData.data.states.total_funded_amount_formatted || '$0',
            iconClass: 'las la-user-friends',
            iconBg: 'bg-soft-info',
            iconColor: 'text-info',
        }
    ] : [];

    // Process funding applications data
    const fundingApps = dashboardData?.data.latest_funding_applications.map(app => ({
        id: app.id,
        funding_type: app.purpose_of_funds,
        entity_type: app.entity_type,
        industry_type: app.industry_type,
        requested_amount: parseFloat(app.requested_amount || 0),
        funded_amount: parseFloat(app.total_funded_amount || 0),
        date: app.formatted_created_at,
        status: app.status,
        status_class: app.status_class
    })) || [];

    // Process pre-qualification data
    const preQualData = dashboardData?.data.latest_pre_qualifications.map(pq => ({
        id: pq.id,
        funding_type: pq.purpose_of_funding || 'N/A',
        industry_type: pq.industry_type || 'N/A',
        business_structure: pq.business_structure || 'N/A',
        funding_requested_amount: pq.funding_requested_amount ? parseFloat(pq.funding_requested_amount) : 0,
        date: pq.formatted_created_at,
        status: pq.status,
        status_class: pq.status_class
    })) || [];


    // Process meetings data
    const meetingsData = dashboardData?.data.upcoming_meeting.map(meeting => {
        const date = new Date(meeting.appointment_date);
        return {
            id: meeting.id,
            date: date.getDate().toString(),
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            title: meeting.subject,
            type: meeting.meeting_type
        };
    }) || [];

    // Process invoices data
    const invoicesData = dashboardData?.data.invoices.map(invoice => {
        let status_class = 'info';
        const st = invoice.status;
        if (st === INVOICE_STATUS_TYPES.PAID) status_class = 'success';
        else if (st === INVOICE_STATUS_TYPES.UNPAID || st === INVOICE_STATUS_TYPES.OVERDUE) status_class = 'danger';
        else if (st === INVOICE_STATUS_TYPES.PENDING) status_class = 'warning';

        return {
            id: invoice.id,
            invoice_id: invoice.invoice_id,
            payment_amount: parseFloat(invoice.payment_amount || 0),
            payment_date: invoice.payment_date,
            status: invoice.status,
            status_class: status_class,
            currency_symbol: invoice.currency_symbol,
            formatted_created_at: invoice.formatted_created_at
        };
    }) || [];

    const pendingInvoices = invoicesData.filter(invoice => String(invoice.status || '').trim().toLowerCase() !== INVOICE_STATUS_TYPES.PAID.toLowerCase());
    const partnerType = String(user?.partner_type || '').trim().toLowerCase();
    const isWL = partnerType.includes('white') || partnerType === PARTNER_TYPES.WHITE_LABEL.toLowerCase();
    const isCertified = partnerType.includes('certified') || partnerType === PARTNER_TYPES.CERTIFIED.toLowerCase();
    const showAlert = (isRestricted || isWL || isCertified) && pendingInvoices.length > 0;

    // The same cached query as the layout's banner: no extra request.
    const activeApprovedRequests = activeFundingRequests?.data?.active_approved_funding_requests || [];
    const activeApprovedRequestCount = activeFundingRequests?.data?.active_approved_funding_request_count || 0;
    const currentActiveRequest = activeApprovedRequests[activeRequestIndex] || activeFundingRequests?.data?.active_approved_funding_request;

    // Credit Score from API
    const ficoScore = dashboardData?.data.fico_score;
    const hasFico = ficoScore !== null && ficoScore !== undefined && ficoScore !== '';
    const displayFico = hasFico ? Number(ficoScore) : null;

    const creditScoreData = React.useMemo(() => {
        // Cap the score to a max of 850 so the chart doesn't wrap around multiple times for values > 850
        const cappedFicoScore = hasFico ? Math.min(displayFico, 850) : 0;
        
        return {
            labels: ['Score', 'Remaining'],
            datasets: [
                {
                    data: hasFico ? [cappedFicoScore, 850 - cappedFicoScore] : [0, 100],
                    backgroundColor: ['#405189', '#f0f0f0'],
                    hoverBackgroundColor: ['#405189', '#f0f0f0'],
                    borderWidth: 0
                }
            ]
        };
    }, [hasFico, displayFico]);

    const creditScoreOptions = React.useMemo(() => ({
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        }
    }), []);

    // Tier data from API
    const tierData = dashboardData?.data.tier;

    // Table Templates
    const formatCurrency = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    const requestedAmountTemplate = (rowData) => <span className="text-dark fs-13">{formatCurrency(rowData.requested_amount)}</span>;
    const fundedAmountTemplate = (rowData) => <span className="text-dark fs-13">{formatCurrency(rowData.funded_amount)}</span>;
    const fundingStatusBodyTemplate = (rowData) => {
        const customClass = FUNDING_APPLICATION_STATUS_CLASS_MAP[rowData.status];
        const badgeClass = customClass
            ? customClass
            : `bg-${rowData.status_class}-subtle text-${rowData.status_class}`;
        return <span className={`badge ${badgeClass} px-3 py-1 rounded-pill fw-bold fs-10 text-uppercase shadow-sm`}>{rowData.status}</span>;
    };
    const statusBodyTemplate = (rowData) => {
        return <span className={`badge bg-${rowData.status_class}-subtle text-${rowData.status_class} px-3 py-1 rounded-pill fw-bold fs-10 text-uppercase shadow-sm`}>{rowData.status}</span>;
    };
    const dateBodyTemplate = (rowData) => <span className="text-dark fs-13">{rowData.date}</span>;
    const textBodyTemplate = (rowData, field) => <span className="text-dark fs-13">{rowData[field]}</span>;
    const preQualAmountTemplate = (rowData) => <span className="text-dark fs-13">{formatCurrency(rowData.funding_requested_amount)}</span>;
    const invoiceAmountTemplate = (rowData) => <span className="text-dark fs-13">{rowData.currency_symbol}{parseFloat(rowData.payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>;
    const companyBodyTemplate = (rowData) => (
        <div className="d-flex align-items-center gap-3">
            <div>
                <h6 className="mb-0 fs-13 fw-semibold text-dark">{rowData.funding_type}</h6>
            </div>
        </div>
    );

    // Show loading state
    if (isLoading) {
        return <DashboardLoader />;
    }

    // Show error state
    if (error) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="alert alert-danger" role="alert">
                        <h4 className="alert-heading">Error loading dashboard</h4>
                        <p>{error.message || 'Failed to load dashboard data. Please try again later.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content dashboard-page">

            <div className="container-fluid">

                {/* --- Header Section --- */}
                {showAlert && (
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card bg-danger-subtle border-0 shadow-sm border-start border-danger border-3">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title bg-danger text-white rounded-circle fs-20">
                                                    <i className="ri-error-warning-fill"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="fs-16 fw-bold text-danger mb-1">
                                                {pendingInvoices.length === 1 ? "You currently have a pending invoice" : "You currently have pending invoices"}
                                            </h5>
                                            <p className="text-muted mb-0 fs-14">
                                                {pendingInvoices.length === 1
                                                    ? "Please pay your invoice. Click here to go to the invoice and complete the payment."
                                                    : "Please pay your invoices. Click here to go to the invoices and complete the payment."}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 ms-3">
                                            <Button
                                                label={pendingInvoices.length === 1 ? "View & Pay Invoice" : "View & Pay Invoices"}
                                                icon="ri-bill-line"
                                                className="p-button-danger rounded-3"
                                                onClick={() => navigate('/invoices')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="row">
                    <div className="col-12">
                        <div className="d-flex align-items-lg-center flex-lg-row flex-column justify-content-between py-2">
                            <div className="flex-grow-1">
                                <h4 className="fs-16 mb-1">Dashboard Overview</h4>
                                <p className="text-muted mb-0 fs-13">Welcome back, {user?.name}! Here's what's happening with your business.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- KPI Cards --- */}
                <div className="row">
                    {kpiData.map((kpi, index) => (
                        <div className="col-xl-3 col-md-6 mb-3" key={index}>
                            <div className="card dashboard-card card-animate border-0 shadow-sm mb-0 h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fs-12 text-muted mb-2 text-truncate" title={kpi.title}>{kpi.title}</p>
                                            <h4 className="mb-0 fs-22 fw-bold text-dark"><span className="counter-value">{kpi.value}</span></h4>
                                        </div>
                                        <div className={`avatar-sm flex-shrink-0`}>
                                            <span className={`avatar-title ${kpi.iconBg} rounded-3 fs-3`}>
                                                <i className={`${kpi.iconClass} ${kpi.iconColor}`}></i>
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row mt-3">
                    {/* --- Left Column (Main Content) --- */}
                    <div className="col-xl-9">

                        {/* Capital Access Entry Widget */}
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="ca-dashboard-widget" style={widgetStyle}>
                                    <div className="row g-0">
                                        {/* Left side: Metrics */}
                                        <div className="col-md-8 ca-dw-metrics">
                                            {/* Header */}
                                            <div className="ca-dw-header">
                                                <div className="ca-dw-icon">
                                                    <i className="ri-funds-line"></i>
                                                </div>
                                                <div>
                                                    <span className="ca-dw-label">Capital Access</span>
                                                    <p className="ca-dw-subtitle">Funding Readiness Overview</p>
                                                </div>
                                            </div>

                                            {/* Score Gauge + Status */}
                                            <div className="ca-dw-gauge-wrap">
                                                <div className="ca-dw-gauge">
                                                    <svg viewBox="0 0 100 100">
                                                        <circle className="track" cx="50" cy="50" r="44" />
                                                        <circle
                                                            className="fill"
                                                            cx="50" cy="50" r="44"
                                                            strokeDasharray={`${2 * Math.PI * 44}`}
                                                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - score / 100)}`}
                                                        />
                                                    </svg>
                                                    <div className="ca-dw-gauge-center">
                                                        <span className="ca-dw-score-num">{score}</span>
                                                        <span className="ca-dw-score-label">Score</span>
                                                    </div>
                                                </div>
                                                <div className="ca-dw-score-info">
                                                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                                        <div className="ca-dw-status-badge mb-0">
                                                            <i className="ri-checkbox-circle-fill"></i>
                                                            {status}
                                                        </div>
                                                        <div className="ca-dw-access-badge mb-0">
                                                            <span>Total Est. Access:</span>
                                                            <strong>{totalAccess}</strong>
                                                        </div>
                                                    </div>
                                                    <p className="ca-dw-score-desc">Readiness index out of 100 based on your credit profile and business factors.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side: CTA Panel */}
                                        <div className="col-md-4 ca-dw-cta">
                                            <div>
                                                <div className="ca-dw-cta-tag">
                                                    <i className="ri-sparkling-line"></i>
                                                    {currentPlay ? 'Active Strategy' : 'Get Started'}
                                                </div>
                                                <h3 className="ca-dw-cta-title">
                                                    {currentPlay
                                                        ? 'Continue your funding journey'
                                                        : 'Start your capital access strategy'
                                                    }
                                                </h3>
                                                <p className="ca-dw-cta-desc">
                                                    {currentPlay
                                                        ? 'Pick up where you left off and keep building your business credit profile.'
                                                        : 'Choose a play strategy tailored to your business funding goals and credit profile.'
                                                    }
                                                </p>
                                            </div>
                                            <button
                                                className="ca-dw-cta-btn"
                                                onClick={() => navigate('/capital-access')}
                                            >
                                                {currentPlay ? 'Resume Strategy' : 'Choose Strategy'}
                                                <i className="ri-arrow-right-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credit & Tier Section */}
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <div className="card dashboard-card border-0 shadow-sm h-100">
                                    <div className="card-header bg-transparent border-0 pb-0">
                                        <h5 className="card-title mb-0 flex-grow-1">Credit Score</h5>
                                    </div>
                                    <div className="card-body d-flex align-items-center justify-content-between p-4">
                                        <div className="text-center position-relative" style={{ width: '120px', height: '120px', opacity: hasFico ? '1' : '0.4' }}>
                                            <Chart type="doughnut" data={creditScoreData} options={creditScoreOptions} className="w-100 h-100" />
                                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                                <h4 className={`mb-0 fw-bold ${hasFico ? 'text-primary' : 'text-muted'}`}>{hasFico ? displayFico : '---'}</h4>
                                                <small className="text-muted fs-10">{hasFico ? 'FICO' : 'N/A'}</small>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-4">
                                            <p className="text-muted mb-2 fs-13">
                                                {hasFico
                                                    ? `Your current credit score is ${displayFico}. Keep building your credit profile to unlock better financing options.`
                                                    : "You haven't started credit scoring yet. Build your credit profile to unlock better financing options."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card dashboard-card border-0 shadow-sm h-100 overflow-hidden position-relative">
                                    <div className="card-header bg-transparent border-0 pb-0">
                                        <h5 className="card-title mb-0 flex-grow-1">Current Tier Status</h5>
                                    </div>
                                    <div className="card-body p-4">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-sm flex-shrink-0">
                                                    <div className="avatar-title bg-warning-subtle text-warning rounded-circle fs-20">
                                                        <i className="ri-vip-crown-fill"></i>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="fw-bold text-dark mb-0 fs-16">{tierData?.name || 'N/A'}</h4>
                                                    <p className="text-muted mb-0 fs-12">{tierData?.title || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-3 bg-light-subtle border border-light d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri-task-line text-primary fs-18"></i>
                                                <span className="text-muted fs-13">Tasks Under Review</span>
                                            </div>
                                            <span className="fw-bold text-dark fs-15">{tierData?.tasks_under_review || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pre-Qualification Applications */}
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="card dashboard-card border-0 shadow-sm mb-0">
                                    <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between py-3 px-4">
                                        <h5 className="card-title mb-0 flex-grow-1"><i className="ri-shield-check-line me-2 text-primary"></i>Pre-Qualification Applications</h5>
                                        <Button label="View All" icon="ri-arrow-right-line" iconPos="right" className="p-button-text p-button-sm fs-12 text-primary fw-bold" onClick={() => navigate('/my-applications')} />
                                    </div>
                                    <div className="card-body p-0">
                                        {preQualData.length > 0 ? (
                                            <DataTable value={preQualData} className="p-datatable-sm smart-table" responsiveLayout="scroll">
                                                <Column field="funding_type" header="Funding Type" body={(rowData) => <span className="text-dark fs-13">{rowData.funding_type}</span>} className="ps-4 py-3"></Column>
                                                <Column field="date" header="Date" body={dateBodyTemplate} className="py-3"></Column>
                                                <Column field="industry_type" header="Industry" body={(rowData) => <span className="text-dark fs-13">{rowData.industry_type}</span>} className="py-3"></Column>
                                                <Column field="business_structure" header="Business Structure" body={(rowData) => <span className="text-dark fs-13">{rowData.business_structure}</span>} className="py-3"></Column>
                                                <Column field="funding_requested_amount" header="Funding Requested Amount" body={preQualAmountTemplate} className="py-3"></Column>
                                                <Column field="status" header="Status" body={statusBodyTemplate} className="py-3"></Column>
                                            </DataTable>
                                        ) : (
                                            <div className="text-center py-4">
                                                <div className="avatar-lg mx-auto mb-3">
                                                    <div className="avatar-title bg-light text-muted rounded-circle">
                                                        <i className="ri-shield-check-line fs-1"></i>
                                                    </div>
                                                </div>
                                                <h6 className="fs-14 fw-semibold text-dark mb-2">No Pre-Qualification Applications</h6>
                                                <p className="text-muted fs-12 mb-0">No applications available at this time.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Funding Applications */}
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="card dashboard-card border-0 shadow-sm mb-0">
                                    <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between py-3 px-4">
                                        <h5 className="card-title mb-0 flex-grow-1"><i className="ri-exchange-dollar-line me-2 text-primary"></i>Recent Funding Applications</h5>
                                        <Button label="View All" icon="ri-arrow-right-line" iconPos="right" className="p-button-text p-button-sm fs-12 text-primary fw-bold" onClick={() => navigate('/my-applications')} />
                                    </div>
                                    <div className="card-body p-0">
                                        {fundingApps.length > 0 ? (
                                            <DataTable value={fundingApps} className="p-datatable-sm smart-table" responsiveLayout="scroll">
                                                <Column field="funding_type" header="Funding Type" body={(rowData) => <span className="text-dark fs-13">{rowData.funding_type}</span>} className="ps-4 py-3"></Column>
                                                <Column field="date" header="Date" body={dateBodyTemplate} className="py-3"></Column>
                                                <Column field="entity_type" header="Entity Type" body={(rowData) => <span className="text-dark fs-13">{rowData.entity_type}</span>} className="py-3"></Column>
                                                <Column field="industry_type" header="Industry" body={(rowData) => <span className="text-dark fs-13">{rowData.industry_type}</span>} className="py-3"></Column>
                                                <Column field="requested_amount" header="Requested Amount" body={requestedAmountTemplate} className="py-3"></Column>
                                                <Column field="funded_amount" header="Funded Amount" body={fundedAmountTemplate} className="py-3"></Column>
                                                <Column field="status" header="Status" body={statusBodyTemplate} className="py-3"></Column>
                                            </DataTable>
                                        ) : (
                                            <div className="text-center py-4">
                                                <div className="avatar-lg mx-auto mb-3">
                                                    <div className="avatar-title bg-light text-muted rounded-circle">
                                                        <i className="ri-exchange-dollar-line fs-1"></i>
                                                    </div>
                                                </div>
                                                <h6 className="fs-14 fw-semibold text-dark mb-2">No Funding Applications</h6>
                                                <p className="text-muted fs-12 mb-0">No recent funding applications available.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* --- Right Column (Sidebar Widgets) --- */}
                    <div className="col-xl-3">

                        {currentActiveRequest && (
                            <div className="card shadow mb-3 mt-0 border-2 border-opacity-50" style={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}>
                                <div className="card-body p-4 bg-success-subtle">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success rounded fs-3">
                                                <i className="ri-checkbox-circle-line"></i>
                                            </span>
                                        </div>
                                        <div className="ms-3 flex-grow-1">
                                            <h5 className="fs-16 mb-1 text-success fw-bold">Next Step</h5>
                                            <p className="text-dark mb-0 fw-medium">{activeApprovedRequestCount > 1 ? `${activeApprovedRequestCount} Applications Ready to Process` : 'Application Ready to Process'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-transparent p-2 rounded mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="text-muted fs-12 text-uppercase fw-semibold">Funding Type</span>
                                            <span className="text-dark fw-bold fs-13 text-end">{currentActiveRequest.funding_type || 'N/A'}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted fs-12 text-uppercase fw-semibold">Amount</span>
                                            <span className="text-dark fw-bold fs-13">${Number(currentActiveRequest.requested_amount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-dark mb-3 fs-15 text-center">
                                        Complete your Funding Application to continue.
                                    </p>
                                    <button
                                        className="btn btn-primary fw-bold w-100 mb-3 shadow-sm border-0 d-flex justify-content-center align-items-center"
                                        onClick={() => navigate(`/fund-application/${currentActiveRequest.id}`)}
                                    >
                                        Process Funding Application
                                        <i className="ri-arrow-right-line ms-1"></i>
                                    </button>
                                    {activeApprovedRequestCount > 1 && (
                                        <div className="d-flex justify-content-between align-items-center bg-white rounded-pill px-3 py-1 shadow-sm border border-success border-opacity-25">
                                            <button
                                                className="btn btn-sm btn-link text-success text-decoration-none p-0 fw-bold"
                                                onClick={() => setActiveRequestIndex(prev => Math.max(0, prev - 1))}
                                                disabled={activeRequestIndex === 0}
                                                style={{ opacity: activeRequestIndex === 0 ? 0.4 : 1 }}
                                            >
                                                <i className="ri-arrow-left-line me-1"></i> Prev
                                            </button>
                                            <span className="badge bg-success-subtle text-success fw-bold px-2 py-1">
                                                {activeRequestIndex + 1} / {activeApprovedRequestCount}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-link text-success text-decoration-none p-0 fw-bold"
                                                onClick={() => setActiveRequestIndex(prev => Math.min(activeApprovedRequestCount - 1, prev + 1))}
                                                disabled={activeRequestIndex === activeApprovedRequestCount - 1}
                                                style={{ opacity: activeRequestIndex === activeApprovedRequestCount - 1 ? 0.4 : 1 }}
                                            >
                                                Next <i className="ri-arrow-right-line ms-1"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Meetings/Tasks */}
                        <div className="card dashboard-card border-0 shadow-sm mb-3">
                            <div className="card-header bg-transparent border-bottom py-3 px-4">
                                <h5 className="card-title mb-0 flex-grow-1 fs-15 text-dark">Upcoming Meetings</h5>
                            </div>
                            <div className="card-body px-3 py-0">
                                {meetingsData.length > 0 ? (
                                    <>
                                        <div className="list-group list-group-flush">
                                            {meetingsData.map((meeting, idx) => (
                                                <div className="list-group-item ps-0 px-4 border-light-subtle" key={idx}>
                                                    <div className="row align-items-center g-3">
                                                        <div className="col-auto">
                                                            <div className="avatar-sm p-1 py-2 h-auto bg-light rounded-3 shadow-sm border border-light">
                                                                <div className="text-center">
                                                                    <h5 className="mb-0 fw-bold">{meeting.date}</h5>
                                                                    <div className="text-muted fs-11">{meeting.day}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col">
                                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                                <h5 className="text-muted mb-0 fs-13 fw-medium">{meeting.time}</h5>
                                                                <span className="badge bg-info-subtle text-info text-uppercase fs-10">
                                                                    {meeting.type}
                                                                </span>
                                                            </div>
                                                            <h6 className="fs-14 mb-0 text-truncate d-block ">
                                                                {meeting.title}
                                                            </h6>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3">
                                            <Button onClick={() => navigate('/appointment')} label="Schedule Meeting" icon="ri-calendar-event-line" className="btn btn-outline-primary p-button-sm w-100 rounded-pill" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="avatar-lg mx-auto mb-3">
                                            <div className="avatar-title bg-light text-muted rounded-circle">
                                                <i className="ri-calendar-line fs-1"></i>
                                            </div>
                                        </div>
                                        <h6 className="fs-14 fw-semibold text-dark mb-2">No Upcoming Meetings</h6>
                                        <p className="text-muted fs-12 mb-3">You don't have any scheduled meetings at the moment.</p>
                                        <Button onClick={() => navigate('/appointment')} label="Schedule Meeting" icon="ri-calendar-event-line" className="btn btn-outline-primary p-button-sm rounded-pill" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoices */}
                        {invoicesData.length > 0 && (
                            <div className="card dashboard-card border-0 shadow-sm mb-3">
                                <div className="card-header bg-transparent border-0 py-3">
                                    <h5 className="card-title mb-0 flex-grow-1"><i className="ri-file-list-line me-2 text-danger"></i>Invoices</h5>
                                </div>
                                <div className="card-body pt-0">
                                    {invoicesData.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm mb-0 smart-table">
                                                <thead>
                                                    <tr>
                                                        <th className="py-3">Invoice ID</th>
                                                        <th className="py-3">Amount</th>
                                                        <th className="py-3 text-end">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoicesData.map((invoice, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-3">
                                                                <span className="text-dark fs-13 fw-semibold">{invoice.invoice_id}</span>
                                                            </td>
                                                            <td className="py-3">
                                                                {invoiceAmountTemplate(invoice)}
                                                            </td>
                                                            <td className="py-3 text-end">
                                                                <span className={`badge bg-${invoice.status_class}-subtle text-${invoice.status_class} px-2 py-1 rounded-pill fw-bold fs-10 text-uppercase`}>
                                                                    {invoice.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2">
                                            <div className="avatar-lg mx-auto mb-3">
                                                <div className="avatar-title bg-light text-muted rounded-circle">
                                                    <i className="ri-file-list-line fs-1"></i>
                                                </div>
                                            </div>
                                            <h6 className="fs-14 fw-semibold text-dark mb-2">No Invoices Found</h6>
                                            <p className="text-muted fs-12 mb-0">You're all caught up! No outstanding invoices at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Support / Contact */}
                        <div className="card dashboard-card bg-primary-subtle border-0 shadow-sm">
                            <div className="card-body p-4 text-center">
                                <div className="avatar-sm mx-auto mb-3">
                                    <div className="avatar-title bg-primary text-white rounded-circle fs-20">
                                        <i className="ri-customer-service-2-line"></i>
                                    </div>
                                </div>
                                <h5 className="fs-15 fw-bold text-dark mb-2">Need Help?</h5>
                                <p className="text-muted fs-13 mb-3">Contact our support team for any queries regarding your applications.</p>
                                <Button onClick={() => navigate('/appointment')} label="Contact Support" className="btn btn-primary p-button-sm rounded-pill w-100" />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
