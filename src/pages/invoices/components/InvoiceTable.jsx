import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_OPTIONS, STATUS_PAID } from '../../../data/invoiceConfig';
import InvoicePaymentModal from './InvoicePaymentModal';
import InvoicePreviewModal from './InvoicePreviewModal';
import { useAuthStore } from '../../../store/auth/authStore';
import TableLoader from '../../../components/Loader/TableLoader';

export default function InvoiceTable({
    data,
    loading,
    totalRecords,
    page,
    perPage,
    onPage,
    onSort,
    onFilter,
    filters,
    sortField,
    sortOrder,
    onRefresh
}) {
    const user = useAuthStore((state) => state.user);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    if (loading && (!data || data.length === 0)) {
        return <TableLoader rows={perPage} columns={7} />;
    }

    const handlePayClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    const handlePreviewClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPreviewModal(true);
    };

    const handlePaymentSuccess = (paymentId) => {
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        if (onRefresh) {
            onRefresh();
        }
    };

    const statusBodyTemplate = (rowData) => {
        const status = rowData.status?.toLowerCase();
        const color = INVOICE_STATUS_COLORS[status] || 'primary';
        return (
            <span className={`badge bg-${color} text-uppercase`}>
                {rowData.status}
            </span>
        );
    };

    const amountBodyTemplate = (rowData) => {
        return `$${Number(rowData.payment_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const statusFilterElement = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={INVOICE_STATUS_OPTIONS}
                onChange={(e) => options.filterApplyCallback(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Status"
                className="p-column-filter"
                showClear
                style={{ minWidth: '10rem' }}
            />
        );
    };

    const actionBodyTemplate = (rowData) => {
        const isNotPaid = rowData.status !== STATUS_PAID;
        return (
            <div className="d-flex align-items-center justify-content-center gap-2">
                <button
                    className="btn btn-soft-danger btn-sm p-1 d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewClick(rowData);
                    }}
                    title="View Details"
                >
                    <i className="ri-file-pdf-line fs-14"></i>
                </button>
                {isNotPaid && (
                    <button
                        className="btn btn-primary btn-sm waves-effect waves-light fw-medium border-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePayClick(rowData);
                        }}
                    >
                        <i className="ri-secure-payment-line align-middle me-1"></i>
                        Pay Now
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="table-responsive table-card mt-1">
            <DataTable
                value={data}
                paginator
                lazy
                first={(page - 1) * perPage}
                rows={perPage}
                totalRecords={totalRecords}
                onPage={onPage}
                onSort={onSort}
                sortField={sortField}
                sortOrder={sortOrder === 'asc' ? 1 : -1}
                onFilter={onFilter}
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={['invoice_id', 'customer_name', 'email', 'created_at', 'payment_amount', 'status']}
                loading={loading}
                dataKey="id"
                className="p-datatable-sm"
                emptyMessage={<div className="text-center">No invoices found. Contact your partner to pay and unlock.</div>}
                responsiveLayout="scroll"
            >
                <Column field="invoice_id" header="Invoice ID" sortable filter showFilterMatchModes filterPlaceholder="Search by ID" style={{ minWidth: '100px' }}></Column>
                <Column field="customer_name" header="Customer" sortable filter showFilterMatchModes filterPlaceholder="Search by name" style={{ minWidth: '180px' }}></Column>
                <Column field="email" header="Email" sortable filter showFilterMatchModes filterPlaceholder="Search by email" style={{ minWidth: '100px' }}></Column>
                <Column field="created_at" header="Invoice Date" sortable filter showFilterMatchModes filterPlaceholder="Search by date" style={{ minWidth: '120px' }}></Column>
                <Column field="payment_amount" header="Amount" body={amountBodyTemplate} sortable filter showFilterMatchModes filterPlaceholder="Search by amount" style={{ minWidth: '100px' }}></Column>
                <Column field="status" header="Status" body={statusBodyTemplate} sortable filter filterElement={statusFilterElement} showFilterMatchModes={false} style={{ minWidth: '100px' }}></Column>
                <Column header="Action" body={actionBodyTemplate} style={{ minWidth: '120px' }} alignHeader="center" align="center"></Column>
            </DataTable>

            <InvoicePaymentModal
                show={showPaymentModal}
                onHide={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                invoice={selectedInvoice}
            />

            <InvoicePreviewModal
                show={showPreviewModal}
                onHide={() => setShowPreviewModal(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
}
