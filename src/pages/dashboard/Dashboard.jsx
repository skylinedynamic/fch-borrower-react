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

// --- Mock Data Constants ---
const KPI_DATA = [
    {
        title: 'Funding Applications',
        value: '559',
        change: '+16.24 %',
        isPositive: true,
        iconClass: 'las la-handshake',
        iconBg: 'bg-soft-success',
        iconColor: 'text-success',
        linkTo: '/partners'
    },
    {
        title: 'Total Requested',
        value: '$183K',
        change: '+29.08 %',
        isPositive: true,
        iconClass: 'las la-chart-pie',
        iconBg: 'bg-soft-warning',
        iconColor: 'text-warning',
        linkTo: '#'
    },
    {
        title: 'Total Funded',
        value: '$165.89k',
        change: '+0.00 %',
        isPositive: true,
        iconClass: 'bx bx-wallet',
        iconBg: 'bg-soft-primary',
        iconColor: 'text-primary',
        linkTo: '#'
    },
    {
        title: 'Active Partners',
        value: '124',
        change: '+5.2 %',
        isPositive: true,
        iconClass: 'las la-user-friends',
        iconBg: 'bg-soft-info',
        iconColor: 'text-info',
        linkTo: '#'
    }
];

const FUNDING_APPS_DATA = [
    { id: 1, client: 'Vertex Tech Solutions', amount: 250000, date: 'Oct 10, 2025', status: 'Processing' },
    { id: 2, client: 'Evergreen E-Commerce', amount: 120000, date: 'Oct 12, 2025', status: 'Processing' },
    { id: 3, client: 'Aurora Logistics Ltd.', amount: 375000, date: 'Oct 15, 2025', status: 'Processing' },
    { id: 6, client: 'Blue Ridge Construction', amount: 200000, date: 'Oct 17, 2025', status: 'Funded' },
];

const INVOICES_DATA = [
    { id: 'INV-1001', client: 'Alpha Corp', amount: 1500, date: 'Nov 01, 2025', status: 'Unpaid' },
    { id: 'INV-1002', client: 'Beta Ltd', amount: 2300, date: 'Oct 28, 2025', status: 'Paid' },
    { id: 'INV-1003', client: 'Gamma Inc', amount: 850, date: 'Oct 25, 2025', status: 'Paid' },
    { id: 'INV-1004', client: 'Delta Group', amount: 4500, date: 'Oct 22, 2025', status: 'Unpaid' },
];

const MEETINGS_DATA = [
    { id: 1, date: '25', day: 'Tue', time: '10:00 AM', title: 'Strategy Review', type: 'Google Meet' },
    { id: 2, date: '27', day: 'Thu', time: '02:00 PM', title: 'Client Onboarding', type: 'Zoom' },
    { id: 3, date: '30', day: 'Sun', time: '11:30 AM', title: 'Monthly Wrap-up', type: 'In Person' },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const isRestricted = isSubscriptionRestricted(user);

    // Credit Score Mock Data
    const creditScore = 740;
    const creditScoreData = {
        labels: ['Score', 'Remaining'],
        datasets: [
            {
                data: [creditScore, 850 - creditScore],
                backgroundColor: ['#4aa3ff', '#f0f0f0'],
                hoverBackgroundColor: ['#4aa3ff', '#f0f0f0'],
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

    // Tier Mock Data
    const currentTier = 'Platinum';
    const nextTier = 'Diamond';
    const tierProgress = 75;

    // Table Templates
    const formatCurrency = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    const amountBodyTemplate = (rowData) => <span className="fw-semibold text-dark">{formatCurrency(rowData.amount)}</span>;
    const statusBodyTemplate = (rowData) => {
        const severity = rowData.status === 'Funded' || rowData.status === 'Paid' ? 'success' : rowData.status === 'Unpaid' ? 'danger' : 'warning';
        return <Tag value={rowData.status} severity={severity} className="px-2 py-1 rounded-pill fw-medium fs-11 text-uppercase"></Tag>;
    };
    const dateBodyTemplate = (rowData) => <span className="text-muted fs-13">{rowData.date}</span>;

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* --- Header Section --- */}
                {isRestricted && (
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
                                            <h5 className="fs-16 fw-bold text-danger mb-1">Currently you have pending invoice</h5>
                                            <p className="text-muted mb-0 fs-14">Please pay your invoice. Click here to go to the invoice and complete the payment.</p>
                                        </div>
                                        <div className="flex-shrink-0 ms-3">
                                            <Button
                                                label="View & Pay Invoices"
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
                <div className="row mb-3 pb-1">
                    <div className="col-12">
                        <div className="d-flex align-items-lg-center flex-lg-row flex-column justify-content-between">
                            <div className="flex-grow-1">
                                <h4 className="fs-18 fw-bold mb-1 text-dark">Dashboard Overview</h4>
                                <p className="text-muted mb-0 fs-13">Welcome back, {user?.name || 'User'}! Here's your daily summary.</p>
                            </div>
                            <div className="mt-3 mt-lg-0">
                                <div className="d-flex align-items-center gap-2">
                                    <Button label="Add New Application" icon="ri-add-line" className="btn btn-primary btn-sm rounded-pill shadow-sm" onClick={() => navigate('/fund-application')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- KPI Cards --- */}
                <div className="row">
                    {KPI_DATA.map((kpi, index) => (
                        <div className="col-xl-3 col-md-6" key={index}>
                            <div className="card dashboard-card card-animate border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-semibold fs-11 text-muted mb-2">{kpi.title}</p>
                                            <h4 className="mb-0 fs-22 fw-bold text-dark"><span className="counter-value">{kpi.value}</span></h4>
                                        </div>
                                        <div className={`avatar-sm flex-shrink-0`}>
                                            <span className={`avatar-title ${kpi.iconBg} rounded-3 fs-3`}>
                                                <i className={`${kpi.iconClass} ${kpi.iconColor}`}></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-1">
                                        <span className={`badge ${kpi.isPositive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill fs-11 px-2 py-1 float-end`}>
                                            {kpi.change}
                                        </span>
                                        <Link to={kpi.linkTo} className="text-decoration-underline text-muted fs-12">View Details</Link>
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
                                        <h5 className="card-title mb-0 fw-bold fs-16 text-dark">Credit Score</h5>
                                    </div>
                                    <div className="card-body d-flex align-items-center justify-content-between p-4">
                                        <div className="text-center position-relative" style={{ width: '120px', height: '120px' }}>
                                            <Chart type="doughnut" data={creditScoreData} options={creditScoreOptions} className="w-100 h-100" />
                                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                                <h4 className="mb-0 fw-bold text-primary">{creditScore}</h4>
                                                <small className="text-muted fs-10">Excellent</small>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-4">
                                            <p className="text-muted mb-2 fs-13">Your credit score is doing great! You qualify for lower interest rates.</p>
                                            <div className="d-flex gap-2">
                                                <Button label="View Report" className="p-button-outlined p-button-sm rounded-pill fs-12 py-1" size="small" />
                                                <Button label="Boost Score" className="p-button-secondary p-button-text p-button-sm rounded-pill fs-12 py-1" size="small" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card dashboard-card border-0 shadow-sm h-100">
                                    <div className="card-header bg-transparent border-0 pb-0">
                                        <h5 className="card-title mb-0 fw-bold fs-16 text-dark">Current Tier Status</h5>
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column justify-content-center">
                                        <div className="d-flex justify-content-between align-items-end mb-2">
                                            <div>
                                                <span className="text-muted fs-13">Current Tier</span>
                                                <h4 className="fw-bold text-warning mb-0"><i className="ri-vip-crown-fill me-1"></i> {currentTier}</h4>
                                            </div>
                                            <div className="text-end">
                                                <span className="text-muted fs-12">Next: {nextTier}</span>
                                                <br />
                                                <span className="fw-bold text-dark fs-14">{tierProgress}%</span>
                                            </div>
                                        </div>
                                        <ProgressBar value={tierProgress} showValue={false} style={{ height: '8px' }} color="#f59e0b" className="mb-3 rounded-pill" />
                                        <p className="text-muted fs-13 mb-0">Earnings needed to upgrade: <span className="fw-bold text-dark">$12,500</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Invoices & Applications Tabs or Stacked */}

                        {/* Latest Invoices */}
                        <div className="card dashboard-card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between py-3">
                                <h5 className="card-title mb-0 fw-bold fs-16 text-dark">Latest Invoices</h5>
                                <Button label="View All Invoices" icon="ri-arrow-right-line" iconPos="right" className="p-button-text p-button-sm fs-12 text-primary" onClick={() => navigate('/invoices')} />
                            </div>
                            <div className="card-body p-0">
                                <DataTable value={INVOICES_DATA} className="p-datatable-sm custom-table" responsiveLayout="scroll">
                                    <Column field="id" header="Invoice ID" className="ps-4 fw-medium text-primary"></Column>
                                    <Column field="client" header="Client" className="fw-semibold text-dark"></Column>
                                    <Column field="date" header="Date" body={dateBodyTemplate}></Column>
                                    <Column field="amount" header="Amount" body={amountBodyTemplate}></Column>
                                    <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                    <Column body={() => <Button icon="ri-download-line" rounded text severity="secondary" className="p-0" />} className="text-center" style={{ width: '3rem' }}></Column>
                                </DataTable>
                            </div>
                        </div>

                        {/* Recent Funding Applications */}
                        <div className="card dashboard-card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between py-3">
                                <h5 className="card-title mb-0 fw-bold fs-16 text-dark">Recent Applications</h5>
                                <Button label="View All" icon="ri-arrow-right-line" iconPos="right" className="p-button-text p-button-sm fs-12 text-primary" onClick={() => navigate('/my-applications')} />
                            </div>
                            <div className="card-body p-0">
                                <DataTable value={FUNDING_APPS_DATA} className="p-datatable-sm custom-table" responsiveLayout="scroll">
                                    <Column field="client" header="Applicant" className="ps-4 fw-semibold text-dark"></Column>
                                    <Column field="amount" header="Requested" body={amountBodyTemplate}></Column>
                                    <Column field="date" header="Submitted" body={dateBodyTemplate}></Column>
                                    <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                    <Column body={() => <Button icon="ri-eye-line" rounded text severity="secondary" className="p-0" />} className="text-center" style={{ width: '3rem' }}></Column>
                                </DataTable>
                            </div>
                        </div>

                    </div>

                    {/* --- Right Column (Sidebar Widgets) --- */}
                    <div className="col-xl-3">

                        {/* Upcoming Meetings/Tasks */}
                        <div className="card dashboard-card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 py-3">
                                <h5 className="card-title mb-0 fw-bold fs-16 text-dark">Upcoming Meetings</h5>
                            </div>
                            <div className="card-body pt-0">
                                <div className="vstack gap-3">
                                    {MEETINGS_DATA.map((meeting, idx) => (
                                        <div className="d-flex align-items-center p-3 rounded-3 bg-light-subtle border border-light" key={idx}>
                                            <div className="flex-shrink-0 text-center me-3">
                                                <div className="avatar-sm bg-white rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center border">
                                                    <span className="text-dark fw-bold fs-14 lh-1">{meeting.date}</span>
                                                    <small className="text-muted fs-9 text-uppercase">{meeting.day}</small>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <h6 className="fs-13 mb-1 text-truncate text-dark fw-semibold">{meeting.title}</h6>
                                                <p className="text-muted fs-11 mb-0"><i className="ri-time-line align-bottom me-1"></i>{meeting.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button label="Schedule Meeting" icon="ri-calendar-event-line" className="p-button-outlined p-button-sm w-100 mt-3 rounded-pill" />
                            </div>
                        </div>

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
                                <Button label="Contact Support" className="p-button-primary p-button-sm rounded-pill w-100" />
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
