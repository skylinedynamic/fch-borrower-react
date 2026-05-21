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
import { useDashboard } from '../../modules/dashboard';
import DashboardLoader from '../../components/Loader/DashboardLoader';




export default function Dashboard() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const userSubscription = useAuthStore((state) => state.userSubscription);
    const isRestricted = isSubscriptionRestricted(userSubscription);


    // Fetch dashboard data
    const { data: dashboardData, isLoading, error } = useDashboard();

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
            title: 'Pre Qualification Applications',
            value: dashboardData.data.states.pre_qualifications.toString(),
            iconClass: 'las la-chart-pie',
            iconBg: 'bg-soft-warning',
            iconColor: 'text-warning',
        },
        {
            title: 'Total Requested Amount',
            value: `$${(dashboardData.data.states.total_requested_amount / 1000).toFixed(0)}K`,
            iconClass: 'bx bx-wallet',
            iconBg: 'bg-soft-primary',
            iconColor: 'text-primary',
        },
        {
            title: 'Total Funded Amount',
            value: dashboardData.data.states.total_funded_amount > 0 ? `$${(dashboardData.data.states.total_funded_amount / 1000).toFixed(0)}K` : '$0',
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


    // Credit Score Mock Data (keep as mock since not in API)
    const creditScore = 740;
    const creditScoreData = {
        labels: ['Score', 'Remaining'],
        datasets: [
            {
                data: [creditScore, 850 - creditScore],
                backgroundColor: ['#405189', '#f0f0f0'],
                hoverBackgroundColor: ['#405189', '#f0f0f0'],
                borderWidth: 0
            }
        ]
    };
    const creditScoreOptions = {
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        }
    };

    // Tier data from API
    const tierData = dashboardData?.data.tier;

    // Table Templates
    const formatCurrency = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    const requestedAmountTemplate = (rowData) => <span className="text-dark fs-13">{formatCurrency(rowData.requested_amount)}</span>;
    const fundedAmountTemplate = (rowData) => <span className="text-dark fs-13">{formatCurrency(rowData.funded_amount)}</span>;
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
                    <div className="row mb-4">
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
                        <div className="col-xl-3 col-md-6" key={index}>
                            <div className="card dashboard-card card-animate border-0 shadow-sm mb-0">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fs-12 text-muted mb-2">{kpi.title}</p>
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

                        {/* Credit & Tier Section */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="card dashboard-card border-0 shadow-sm h-100">
                                    <div className="card-header bg-transparent border-0 pb-0">
                                        <h5 className="card-title mb-0 flex-grow-1">Credit Score</h5>
                                    </div>
                                    <div className="card-body d-flex align-items-center justify-content-between p-4">
                                        <div className="text-center position-relative" style={{ width: '120px', height: '120px', opacity: '0.4' }}>
                                            <Chart type="doughnut" data={creditScoreData} options={creditScoreOptions} className="w-100 h-100" />
                                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                                <h4 className="mb-0 fw-bold text-muted">---</h4>
                                                <small className="text-muted fs-10">N/A</small>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-4">
                                            <p className="text-muted mb-2 fs-13">You haven't started credit scoring yet. Build your credit profile to unlock better financing options.</p>

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
                        <div className="card dashboard-card border-0 shadow-sm mb-3">
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

                        {/* Recent Funding Applications */}
                        <div className="card dashboard-card border-0 shadow-sm mb-3">
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

                    {/* --- Right Column (Sidebar Widgets) --- */}
                    <div className="col-xl-3">

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
