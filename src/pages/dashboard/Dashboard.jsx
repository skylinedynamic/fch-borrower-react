import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useUnpaidInvoiceContext } from '../../contexts/UnpaidInvoiceContext';
import { useNavigate } from 'react-router-dom';

// --- Mock Data Constants ---
const KPI_DATA = [
    {
        title: 'Total Partners',
        value: '559',
        change: '+16.24 %',
        isPositive: true,
        iconClass: 'las la-handshake',
        iconBg: 'bg-success-subtle',
        iconColor: 'text-success',
        linkText: 'View all partners',
        linkTo: '/partners'
    },
    {
        title: 'Total Clients',
        value: '894',
        change: '-3.57 %',
        isPositive: false,
        iconClass: 'las la-user-friends',
        iconBg: 'bg-info-subtle',
        iconColor: 'text-info',
        linkText: 'View all clients',
        linkTo: '#'
    },
    {
        title: 'Total Leads',
        value: '183',
        change: '+29.08 %',
        isPositive: true,
        iconClass: 'las la-chart-pie',
        iconBg: 'bg-warning-subtle',
        iconColor: 'text-warning',
        linkText: 'View all Leads',
        linkTo: '#'
    },
    {
        title: 'My Commission',
        value: '$165.89k',
        change: '+0.00 %',
        isPositive: true, // Defaulting to positive/neutral for 0
        iconClass: 'bx bx-wallet',
        iconBg: 'bg-primary-subtle',
        iconColor: 'text-primary',
        linkText: 'Withdraw money',
        linkTo: '#'
    }
];

const FUNDING_APPS_DATA = [
    { id: 1, client: 'Vertex Tech Solutions', amount: 250000, date: 'Oct 10, 2025', status: 'Processing' },
    { id: 2, client: 'Evergreen E-Commerce', amount: 120000, date: 'Oct 12, 2025', status: 'Processing' },
    { id: 3, client: 'Aurora Logistics Ltd.', amount: 375000, date: 'Oct 15, 2025', status: 'Processing' },
    { id: 4, client: 'Aurora Logistics Ltd.', amount: 375000, date: 'Oct 15, 2025', status: 'Processing' },
    { id: 5, client: 'Aurora Logistics Ltd.', amount: 375000, date: 'Oct 15, 2025', status: 'Processing' },
    { id: 6, client: 'Blue Ridge Construction', amount: 200000, date: 'Oct 17, 2025', status: 'Funded' },
    { id: 7, client: 'Atlas Bakery Co.', amount: 80000, date: 'Oct 19, 2025', status: 'Processing' },
];

const PREQUAL_DATA = [
    { id: 1, client: 'Vertex Tech Solutions', amount: 250000, date: 'Oct 10, 2025', status: 'New' },
    { id: 2, client: 'Evergreen E-Commerce', amount: 120000, date: 'Oct 12, 2025', status: 'New' },
    { id: 3, client: 'Aurora Logistics Ltd.', amount: 375000, date: 'Oct 15, 2025', status: 'New' },
    { id: 4, client: 'Blue Ridge Construction', amount: 200000, date: 'Oct 17, 2025', status: 'Qualified' },
    { id: 5, client: 'Atlas Bakery Co.', amount: 80000, date: 'Oct 19, 2025', status: 'New' },
];

const MEETINGS_DATA = [
    { id: 1, date: '25', day: 'Tue', time: '12:00am - 03:30pm', title: 'Meeting for campaign with sales team' },
    { id: 2, date: '20', day: 'Wed', time: '02:00pm - 03:45pm', title: 'Adding a new event with attachments' },
    { id: 3, date: '17', day: 'Wed', time: '04:30pm - 07:15pm', title: 'Create new project Bundling Product' },
    { id: 4, date: '12', day: 'Tue', time: '10:30am - 01:15pm', title: 'Weekly closed sales won checking with sales team' },
];

export default function Dashboard() {
    const { hasUnpaidInvoices, unpaidInvoices } = useUnpaidInvoiceContext();
    const navigate = useNavigate();
    
    // --- Templates for DataTable ---
    const formatCurrency = (value) => {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
    };

    const amountBodyTemplate = (rowData) => {
        return formatCurrency(rowData.amount);
    };

    const statusBodyTemplate = (rowData) => {
        const getSeverity = (status) => {
            switch (status) {
                case 'Funded': return 'success';
                case 'Qualified': return 'success';
                case 'Processing': return 'warning';
                case 'New': return 'info';
                default: return null;
            }
        };

        return <Tag value={rowData.status} severity={getSeverity(rowData.status)}></Tag>;
    };

    const dateBodyTemplate = (rowData) => {
        return <span className="text-muted">{rowData.date}</span>;
    };

    return (
        <div className="page-content">
            <div className="container-fluid">

                {/* --- Header Section --- */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="fs-18 fw-bold mb-1 text-dark">Welcome back, Craig! 👋</h4>
                                <p className="text-muted mb-0 fs-13">Here's what's happening with your business today.</p>
                            </div>
                            <div className="d-none d-sm-block">
                                <div className="d-flex align-items-center gap-2 text-muted fw-medium fs-13 bg-light px-3 py-2 rounded">
                                    <i className="ri-calendar-line"></i>
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Unpaid Invoices Section ---  */}
                {hasUnpaidInvoices && (
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm border-start border-danger border-3">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-start">
                                        <div className="flex-shrink-0">
                                            <div className="avatar-md bg-danger-subtle rounded d-flex align-items-center justify-content-center">
                                                <i className="ri-error-warning-line text-danger fs-2"></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h5 className="fw-semibold mb-2">Payment Required</h5>
                                            <p className="text-muted mb-3">
                                                You have <strong className="text-danger">{unpaidInvoices.length}</strong> unpaid {unpaidInvoices.length > 1 ? 'invoices' : 'invoice'} totaling{' '}
                                                <strong className="text-danger">
                                                    ${unpaidInvoices.reduce((sum, inv) => {
                                                        const amt = typeof inv.payment_amount === 'string' ? parseFloat(inv.payment_amount) : inv.payment_amount;
                                                        return sum + amt;
                                                    }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </strong>. Please settle your account to unlock all features.
                                            </p>
                                            
                                            {/* Invoice List */}
                                            <div className="list-group list-group-flush mb-3">
                                                {unpaidInvoices.map((invoice, idx) => {
                                                    const amount = typeof invoice.payment_amount === 'string' ? parseFloat(invoice.payment_amount) : invoice.payment_amount;
                                                    return (
                                                        <div key={idx} className="list-group-item px-0 py-3 border-top">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <h6 className="mb-1 fw-semibold">{invoice.invoice_id}</h6>
                                                                    <p className="text-muted mb-0 fs-13">{invoice.customer_name}</p>
                                                                </div>
                                                                <div className="text-end">
                                                                    <div className="fw-bold text-dark mb-1">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                                    <span className="badge bg-warning-subtle text-warning">{invoice.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <button 
                                                className="btn btn-danger"
                                                onClick={() => navigate('/invoices')}
                                            >
                                                <i className="ri-secure-payment-line me-2"></i>
                                                View & Pay Invoices
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- KPI Cards --- */}
                <div className="row">
                    {KPI_DATA.map((kpi, index) => (
                        <div className="col-xl-3 col-md-6" key={index}>
                            <div className="card card-animate border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-semibold fs-12 text-muted mb-0">{kpi.title}</p>
                                        </div>
                                        <div className={`flex-shrink-0 badge ${kpi.isPositive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} fs-11`}>
                                            <i className={`${kpi.isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} align-bottom`}></i> {kpi.change}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between">
                                        <div>
                                            <h4 className="fs-24 fw-bold text-dark mb-4"><span className="counter-value">{kpi.value}</span></h4>
                                            <Link to={kpi.linkTo} className="text-decoration-none text-primary fs-13 fw-medium">
                                                {kpi.linkText} <i className="ri-arrow-right-line align-middle ms-1"></i>
                                            </Link>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className={`avatar-title ${kpi.iconBg} rounded-3 fs-2`}>
                                                <i className={`${kpi.iconClass} ${kpi.iconColor}`}></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Metrics & Meetings Grid --- */}
                <div className="row mt-2">

                    {/* Upcoming Meetings - Left Column on Large Screens */}
                    <div className="col-xl-4">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom-0 d-flex align-items-center justify-content-between py-3">
                                <h5 className="card-title mb-0 text-dark fw-bold">Upcoming Meetings</h5>
                                <Link to="#" className="text-primary fs-12 fw-medium">View All</Link>
                            </div>
                            <div className="card-body pt-0">
                                <div className="vstack gap-3">
                                    {MEETINGS_DATA.map((meeting, idx) => (
                                        <div className="d-flex align-items-center p-3 rounded-3 bg-light-subtle border" key={idx}>
                                            <div className="flex-shrink-0 text-center me-3">
                                                <div className="avatar-sm bg-white rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center border">
                                                    <span className="text-dark fw-bold fs-16 lh-1">{meeting.date}</span>
                                                    <span className="text-muted fs-10 text-uppercase">{meeting.day}</span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <h6 className="fs-14 mb-1 text-truncate text-dark fw-semibold">{meeting.title}</h6>
                                                <p className="text-muted fs-12 mb-0"><i className="ri-time-line align-bottom me-1"></i>{meeting.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-center">
                                    <Button label="Schedule Meeting" icon="ri-calendar-event-line" className="p-button-outlined p-button-sm w-100 rounded-3" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tables - Right Column on Large Screens */}
                    <div className="col-xl-8">
                        {/* Latest Funding Applications */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-bottom-0 d-flex align-items-center justify-content-between py-3">
                                <h5 className="card-title mb-0 text-dark fw-bold">Latest Funding Applications</h5>
                                <Link to="#" className="text-primary fs-12 fw-medium">See all applications</Link>
                            </div>
                            <div className="card-body">
                                <DataTable value={FUNDING_APPS_DATA} paginator rows={5} className="p-datatable-sm p-datatable-gridlines-none" stripedRows tableStyle={{ minWidth: '50rem' }}>
                                    <Column field="client" header="Client Name" className="fw-medium text-dark"></Column>
                                    <Column field="amount" header="Request Amount" body={amountBodyTemplate}></Column>
                                    <Column field="date" header="Submission Date" body={dateBodyTemplate}></Column>
                                    <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                    <Column body={() => (
                                        <Button icon="ri-more-2-fill" rounded text severity="secondary" aria-label="Options" />
                                    )} style={{ width: '3rem' }}></Column>
                                </DataTable>
                            </div>
                        </div>

                        {/* Latest Prequalification Requests */}
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-bottom-0 d-flex align-items-center justify-content-between py-3">
                                <h5 className="card-title mb-0 text-dark fw-bold">Latest Prequalification Requests</h5>
                                <Link to="#" className="text-primary fs-12 fw-medium">See all requests</Link>
                            </div>
                            <div className="card-body">
                                <DataTable value={PREQUAL_DATA} paginator rows={5} className="p-datatable-sm p-datatable-gridlines-none" stripedRows tableStyle={{ minWidth: '50rem' }}>
                                    <Column field="client" header="Client Name" className="fw-medium text-dark"></Column>
                                    <Column field="amount" header="Request Amount" body={amountBodyTemplate}></Column>
                                    <Column field="date" header="Submission Date" body={dateBodyTemplate}></Column>
                                    <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                    <Column body={() => (
                                        <Button icon="ri-more-2-fill" rounded text severity="secondary" aria-label="Options" />
                                    )} style={{ width: '3rem' }}></Column>
                                </DataTable>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals from template: Add Partner */}
            <div className="modal fade" id="addnewpartner" tabIndex="-1" aria-labelledby="addnewpartnerLabel" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="addnewpartnerLabel">Add Partner</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="partnerName" className="form-label">Partner Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" id="partnerName" placeholder="Enter partner name" required />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="companyName" className="form-label">Company Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" id="companyName" placeholder="Enter company name" required />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="partnerEmail" className="form-label">Email Address <span className="text-danger">*</span></label>
                                            <input type="email" className="form-control" id="partnerEmail" placeholder="name@company.com" required />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="partnerPhone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" id="partnerPhone" placeholder="+(1) 234 567 8000" required />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="hstack gap-2 justify-content-between">
                                            <Link to="#" className="text-decoration-underline">View full form</Link>
                                            <button type="submit" data-bs-dismiss="modal" data-toast data-toast-text="Successfyll added Partner" data-toast-gravity="bottom" data-toast-position="right" data-toast-duration="3000" data-toast-close="close" className="btn btn-primary">Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals from template: Add Client */}
            <div className="modal fade" id="addnewClient" tabIndex="-1" aria-labelledby="addnewClientLabel" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="addnewClientLabel">Add Client</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="partnerName" className="form-label">Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" id="partnerName" placeholder="Enter partner name" required />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="partnerEmail" className="form-label">Email Address <span className="text-danger">*</span></label>
                                            <input type="email" className="form-control" id="partnerEmail" placeholder="name@company.com" required />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="partnerPhone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" id="partnerPhone" placeholder="+(1) 234 567 8000" required />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div>
                                            <label htmlFor="companyName" className="form-label">Company Name <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" id="companyName" placeholder="Enter company name" required />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="hstack gap-2 justify-content-between">
                                            <Link to="#" className="text-decoration-underline">View full form</Link>
                                            <button type="submit" data-bs-dismiss="modal" data-toast data-toast-text="Successfyll added Partner" data-toast-gravity="bottom" data-toast-position="right" data-toast-duration="3000" data-toast-close="close" className="btn btn-primary">Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
