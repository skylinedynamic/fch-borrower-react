import React, { useEffect, useRef, useState } from 'react';
import Modal from 'bootstrap/js/dist/modal';
import { downloadInvoice, sendInvoice, fetchInvoiceDetails } from '../../../modules/invoice/services';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../../store/auth/authStore';
import { useBrandingStore } from '../../../store/brandingStore';
import InvoicePreviewSkeleton from './InvoicePreviewSkeleton';

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount || 0);
};

const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

export default function InvoicePreviewModal({ show, onHide, invoice }) {
    const user = useAuthStore((state) => state.user);
    const { branding: globalBranding } = useBrandingStore();
    const modalRef = useRef(null);
    const modalInstanceRef = useRef(null);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const [fullInvoice, setFullInvoice] = useState(null);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        const loadInvoiceData = async () => {
            if (show && invoice?.id) {
                setFetching(true);
                try {
                    const response = await fetchInvoiceDetails(invoice.id);
                    if (response.status) {
                        setFullInvoice(response.data);
                    } else {
                        // Fallback to passed invoice if API fails
                        setFullInvoice(invoice);
                        toast.error(response.message || 'Failed to fetch full invoice details');
                    }
                } catch (error) {
                    console.error('Error fetching invoice details:', error);
                    setFullInvoice(invoice);
                    toast.error('Failed to load full invoice details');
                } finally {
                    setFetching(false);
                }
            } else {
                setFullInvoice(null);
            }
        };

        loadInvoiceData();
    }, [show, invoice?.id]);

    useEffect(() => {
        if (!modalRef.current) return;
        if (!modalInstanceRef.current) {
            modalInstanceRef.current = new Modal(modalRef.current, {
                backdrop: true,
                keyboard: true,
            });
        }

        // Sync parent state when modal is closed via backdrop click or keyboard
        const handleHidden = () => onHide();
        modalRef.current.addEventListener('hidden.bs.modal', handleHidden);

        return () => {
            modalRef.current?.removeEventListener('hidden.bs.modal', handleHidden);
            if (modalInstanceRef.current) {
                modalInstanceRef.current.hide();
                modalInstanceRef.current.dispose();
                modalInstanceRef.current = null;
            }
        };
    }, [modalRef.current]);

    // Show/Hide Logic
    useEffect(() => {
        const modal = modalInstanceRef.current;
        if (!modal) return;
        if (show) {
            modal.show();
        } else {
            modal.hide();
        }
    }, [show]);

    // Reset loading states when modal closes or invoice changes
    useEffect(() => {
        if (!show) {
            setDownloadLoading(false);
            setSendLoading(false);
        }
    }, [show, invoice]);

    const handleDownload = async () => {
        if (!displayInvoice?.id || downloadLoading) return;
        setDownloadLoading(true);
        try {
            const response = await downloadInvoice(displayInvoice.id);
            if (response && response.status && response.data?.file) {
                const blob = base64ToBlob(response.data.file, response.data.mime_type || 'application/pdf');
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', response.data.file_name || `invoice-${displayInvoice.invoice_id || displayInvoice.id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error(response?.message || 'Failed to download invoice PDF');
            }
        } catch (error) {
            const message = error?.message || 'Failed to download invoice';
            console.error('Error downloading invoice:', error);
            toast.error(message);
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleSend = async () => {
        if (!displayInvoice?.id || sendLoading) return;
        setSendLoading(true);
        try {
            const response = await sendInvoice(displayInvoice.id);
            if (response.status) {
                toast.success(response.message || 'Invoice sent successfully');
            } else {
                toast.error(response.message || 'Failed to send invoice');
            }
        } catch (error) {
            console.error('Error sending invoice:', error);
            toast.error('Failed to send invoice');
        } finally {
            setSendLoading(false);
        }
    };

    // Use fullInvoice if available, otherwise fallback to the row-level invoice
    const displayInvoice = fullInvoice || invoice;

    // Resolve dynamic branding for invoice
    const invoiceBranding = displayInvoice?.branding || {};
    // Priority is the tenant's OWN branding, then the invoice payload's.
    //
    // globalBranding is this portal's tenant, resolved from the logged-in
    // session. invoiceBranding comes from the invoice resource, which resolves
    // by request domain - so it can come back as the host's and mask a partner
    // that has a perfectly good logo of its own. Own first prevents that.
    //
    // Within each: document logo, then the sidebar logo. Paper is white, so
    // primary_logo (the white-on-transparent one) is never used - it would be
    // invisible here. No bundled default: an invoice with no logo shows the
    // company name rather than another tenant's mark.
    const displayLogo = globalBranding?.logo_document_full_url
        || globalBranding?.logo_sidebar_full_url
        || invoiceBranding.logo_document_full_url
        || invoiceBranding.logo_sidebar_full_url
        || globalBranding?.logo_on_light_full_url
        || globalBranding?.secondary_logo_full_url
        || invoiceBranding.logo_on_light_full_url
        || invoiceBranding.secondary_logo_full_url
        || null;
    const displaySiteName = globalBranding?.site_name || invoiceBranding.site_name || '';
    // Was falling back to the copyright line, which is not an address.
    const displayAddress = invoiceBranding.address || 'California, United States';

    // Calculations - only if displayInvoice exists
    const amount = displayInvoice ? (typeof displayInvoice.payable_amount_sub === 'string'
        ? parseFloat(displayInvoice.payable_amount_sub)
        : displayInvoice.payable_amount_sub || (typeof displayInvoice.payment_amount === 'string'
            ? parseFloat(displayInvoice.payment_amount)
            : displayInvoice.payment_amount || 0)) : 0;

    const subtotal = amount;

    return (
        <div className="modal fade flip" ref={modalRef} tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">

                    <div className="modal-body p-0">
                        {fetching && !fullInvoice ? (
                            <InvoicePreviewSkeleton />
                        ) : !displayInvoice ? (
                            <div className="p-5 text-center text-muted">
                                No invoice data available.
                            </div>
                        ) : (
                            <div className="card shadow-none mb-0" id="demo">
                                <div className="row p-2">
                                    <div className="col-lg-12">
                                        <div className="card-header border-bottom-dashed p-4">
                                            <div className="d-flex flex-column flex-sm-row align-items-center">
                                                <div className="flex-grow-1 text-center text-sm-start">
                                                    {/* Same 200x60 box the sidebar uses, so a logo is the
                                                        same size everywhere. Capping width alone rendered a
                                                        square logo at full height. */}
                                                    {displayLogo
                                                        ? <img
                                                            src={displayLogo}
                                                            className="card-logo card-logo-dark"
                                                            alt={displaySiteName}
                                                            style={{ width: '200px', height: '60px', objectFit: 'contain', objectPosition: 'left center' }}
                                                        />
                                                        : <span className="fs-16 fw-semibold">{displaySiteName}</span>}
                                                </div>
                                                <div className="flex-shrink-0 mt-sm-0 mt-4 text-center text-sm-end">
                                                    <h6 className="mb-1"><span className="text-muted fw-normal">Invoice No:</span> <span id="legal-register-no" className="fw-semibold"> #{displayInvoice.invoice_id || displayInvoice.id}</span></h6>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-12 border-top border-top-dashed">
                                        <div className="card-body p-4">
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <h6 className="text-muted text-uppercase fw-semibold mb-3">Address</h6>
                                                    <p className="text-muted mb-1">{displaySiteName}</p>
                                                    <p className="text-muted mb-0">{displayAddress}</p>
                                                </div>
                                                <div className="col-6 text-end">
                                                    <h6 className="text-muted text-uppercase fw-semibold mb-3">Billing Address</h6>
                                                    <p className="fw-medium mb-2" id="billing-name">{displayInvoice.customer_name || displayInvoice.name || ''}</p>
                                                    <p className="text-muted mb-1" id="billing-address-line-1">{displayInvoice.address || ''}</p>
                                                    {displayInvoice.phone && <p className="text-muted mb-1"><span>Phone: </span><span id="billing-phone-no">{displayInvoice.phone}</span></p>}
                                                    <p className="text-muted mb-0"><span>Email: </span><span id="billing-email">{displayInvoice.email || ''}</span> </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="card-body p-sm-4 p-2">
                                            <div className="row g-3 text-center text-sm-start">
                                                <div className="col-lg-3 col-6">
                                                    <p className="text-muted mb-2 text-uppercase fw-semibold">Invoice No</p>
                                                    <h5 className="fs-14 mb-0">#<span id="invoice-no">{displayInvoice.invoice_id || displayInvoice.id}</span></h5>
                                                </div>
                                                <div className="col-lg-3 col-6">
                                                    <p className="text-muted mb-2 text-uppercase fw-semibold">Date</p>
                                                    <h5 className="fs-14 mb-0"><span id="invoice-date">{displayInvoice.created_at ? new Date(displayInvoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span></h5>
                                                </div>
                                                <div className="col-lg-3 col-6">
                                                    <p className="text-muted mb-2 text-uppercase fw-semibold">Payment Status</p>
                                                    <span className={`badge bg-${displayInvoice.status?.toLowerCase() === 'paid' ? 'success' : 'warning'}-subtle text-${displayInvoice.status?.toLowerCase() === 'paid' ? 'success' : 'warning'} fs-11 text-uppercase`} id="payment-status">
                                                        {displayInvoice.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="col-lg-3 col-6 text-sm-end">
                                                    <p className="text-muted mb-2 text-uppercase fw-semibold">Total Amount</p>
                                                    <h5 className="fs-14 mb-0">$<span id="total-amount">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></h5>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-12">
                                        <div className="card-body p-4">
                                            <div className="table-responsive">
                                                <table className="table table-borderless text-center table-nowrap align-middle mb-0">
                                                    <thead>
                                                        <tr className="table-active">
                                                            <th scope="col" className="text-start">Enrollment Details</th>
                                                            <th scope="col" className="text-end">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody id="products-list">
                                                        <tr>
                                                            <td className="text-start">
                                                                <span className="fw-medium">{displayInvoice.enrollment_type || 'Service Enrollment'}</span>
                                                                {displayInvoice.details && <p className="text-muted mb-0">{displayInvoice.details}</p>}
                                                            </td>
                                                            <td className="text-end">{formatCurrency(subtotal)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="border-top border-top-dashed mt-2">
                                                <table id="invoice-summary" className="table table-borderless table-nowrap align-middle mb-0 ms-auto" style={{ width: '250px' }}>
                                                    <tbody>
                                                        <tr>
                                                            <td>Sub Total</td>
                                                            <td className="text-end"><span id="invoice-subtotal">{formatCurrency(subtotal)}</span></td>
                                                        </tr>
                                                        <tr className="border-top border-top-dashed fs-15">
                                                            <th scope="row">Total Amount</th>
                                                            <th className="text-end"><span id="invoice-total">{formatCurrency(amount)}</span></th>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-3">
                                                <h6 className="text-muted text-uppercase fw-semibold mb-3">Payment Details:</h6>
                                                <p className="text-muted mb-1">Payment Method: <span className="fw-medium" id="payment-method">Stripe</span></p>
                                                <p className="text-muted mb-1">Payment Status: <span className="fw-medium">{displayInvoice.status}</span></p>
                                                {displayInvoice.payment_date && (
                                                    <p className="text-muted mb-1">Paid Date: <span className="fw-medium" id="paid-date">{displayInvoice.payment_date}</span></p>
                                                )}
                                                <p className="text-muted mb-1">Card Holder: <span className="fw-medium" id="card-holder-name">{displayInvoice.customer_name || displayInvoice.name}</span></p>
                                                <p className="text-muted">Total Amount: <span className="fw-medium">$</span><span id="card-total-amount" className="fw-bold">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                            </div>
                                            <div className="mt-4">
                                                <div className="alert alert-info">
                                                    <p className="mb-0"><span className="fw-semibold">NOTES:</span>
                                                        <span id="note"> All accounts are to be paid within 7 days from receipt of invoice. To be paid by Stripe.
                                                            If account is not paid within 7
                                                            days the credits details supplied as confirmation of work undertaken
                                                            will be charged the agreed quoted fee noted above.
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 d-print-none mt-4">
                                                <button
                                                    className="btn btn-clear"
                                                    onClick={onHide}
                                                >
                                                    <i className="ri-close-line align-bottom me-1"></i>
                                                    Cancel
                                                </button>
                                                <div className="hstack gap-2 flex-wrap">
                                                    <button
                                                        className="btn btn-primary shadow-sm"
                                                        onClick={handleDownload}
                                                        disabled={downloadLoading}
                                                    >
                                                        {downloadLoading ? (
                                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                        ) : (
                                                            <i className="ri-download-2-line align-bottom me-1"></i>
                                                        )}
                                                        Download Invoice
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
