import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

const UnpaidInvoicesAlert = ({ unpaidInvoices }) => {
    const navigate = useNavigate();

    // Ensure we have data
    if (!unpaidInvoices || unpaidInvoices.length === 0) return null;

    // Calculate total amount
    const totalAmount = unpaidInvoices.reduce((sum, inv) => {
        const amt = typeof inv.payment_amount === 'string' ? parseFloat(inv.payment_amount) : inv.payment_amount;
        return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const formatCurrency = (value) => {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    // Get the first invoice to display details
    const firstInvoice = unpaidInvoices[0];
    const firstInvoiceAmount = typeof firstInvoice.payment_amount === 'string' ? parseFloat(firstInvoice.payment_amount) : firstInvoice.payment_amount;

    return (
        <div className="row mb-3">
            <div className="col-12">
                <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center p-3 mb-0" role="alert" style={{ background: '#fff5f5', borderLeft: '4px solid #dc3545' }}>

                    {/* Icon Section */}
                    <div className="flex-shrink-0 me-3">
                        <div className="avatar-sm bg-danger rounded-circle d-flex align-items-center justify-content-center">
                            <i className="ri-bank-card-fill text-white fs-4"></i>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-grow-1">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                            <div>
                                <h5 className="alert-heading fw-bold mb-1 text-danger">Action Required: Unpaid Invoices</h5>
                                <p className="mb-0 text-muted">
                                    You have <strong>{unpaidInvoices.length}</strong> unpaid invoice{unpaidInvoices.length !== 1 && 's'} totaling <strong className="text-dark">{formatCurrency(totalAmount)}</strong>.
                                </p>
                                <div className="mt-2 text-dark fs-13">
                                    <span className="badge bg-white text-danger border border-danger-subtle me-2">Latest</span>
                                    <strong>{firstInvoice.invoice_id}</strong> - {firstInvoice.customer_name}
                                    <span className="mx-2">|</span>
                                    <span className="fw-bold">{formatCurrency(firstInvoiceAmount)}</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-3 mt-md-0 ms-md-4">
                                <Button
                                    label="View & Pay"
                                    icon="ri-arrow-right-line"
                                    severity="danger"
                                    className="px-4 rounded-pill shadow-none"
                                    onClick={() => navigate('/invoices')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnpaidInvoicesAlert;
