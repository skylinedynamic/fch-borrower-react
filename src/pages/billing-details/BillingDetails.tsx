import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBillingDetails, BillingDetailsData } from '../../modules/billings';

export default function BillingDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<BillingDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingDetails();
  }, []);

  const loadBillingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBillingDetails();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load billing details:', err);
      setError(err?.response?.data?.message || 'Failed to fetch billing details.');
    } finally {
      setLoading(false);
    }
  };

  const recentBill = data?.recent_bill;
  const upcoming = data?.upcoming_billing;
  const subscription = data?.subscription;
  const borrower = data?.borrower;
  const recentPayments = data?.recent_payments || [];

  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* Header with Breadcrumb */}
        <div className="row pb-1 mobile-sticky-header">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between flex-row py-2">
              <div className="flex-grow-1">
                <h4 className="fs-20 mb-1">Billing Details</h4>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb m-0 fs-12 text-muted">
                    <li className="breadcrumb-item">
                      <Link to="/" className="text-muted">Dashboard</Link>
                    </li>
                    <li className="breadcrumb-item active text-primary font-weight-bold" aria-current="page">
                      Billing Details
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* ── Top Metric Cards ── */}
        <div className="row">
          {/* 1. Recent / Current Bill */}
          <div className="col-xl-4 col-md-6 mb-4">
            <div className="card card-height-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="avatar-xs flex-shrink-0 me-3">
                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-16">
                      <i className="ri-article-line"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="card-title mb-0 text-muted text-uppercase fs-12 fw-semibold">
                      Current / Recent Bill
                    </h6>
                  </div>
                  {!loading && recentBill && (
                    <span
                      className={`badge ${
                        recentBill.status === 'PAID'
                          ? 'bg-success-subtle text-success'
                          : recentBill.status === 'PROCESSING'
                          ? 'bg-warning-subtle text-warning'
                          : 'bg-danger-subtle text-danger'
                      } fs-11`}
                    >
                      {recentBill.status}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="py-3 text-center">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                ) : recentBill ? (
                  <div>
                    <h3 className="fs-22 fw-semibold mb-2">
                      ${Number(recentBill.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-muted mb-1 fs-13">
                      <strong>Invoice #:</strong> {recentBill.invoice_id}
                    </p>
                    <p className="text-muted mb-3 fs-12">
                      <strong>Date:</strong> {recentBill.created_at || 'N/A'}
                    </p>

                    <div className="d-flex gap-2">
                      <Link to={`/invoices/${recentBill.id}`} className="btn btn-sm btn-soft-primary">
                        <i className="ri-eye-line me-1 align-middle"></i> View Invoice
                      </Link>
                      {recentBill.status === 'UNPAID' && (
                        <Link to={`/invoices/${recentBill.id}`} className="btn btn-sm btn-success">
                          <i className="ri-secure-payment-line me-1 align-middle"></i> Pay Now
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted my-3 fs-13">No billing invoice generated yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Upcoming Billing */}
          <div className="col-xl-4 col-md-6 mb-4">
            <div className="card card-height-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="avatar-xs flex-shrink-0 me-3">
                    <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                      <i className="ri-calendar-todo-line"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="card-title mb-0 text-muted text-uppercase fs-12 fw-semibold">
                      Upcoming Billing
                    </h6>
                  </div>
                  {subscription && (
                    <span className="badge bg-info-subtle text-info fs-11">
                      {subscription.enrollment_type || 'Active Plan'}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="py-3 text-center">
                    <div className="spinner-border spinner-border-sm text-info" role="status"></div>
                  </div>
                ) : upcoming && upcoming.next_date ? (
                  <div>
                    <h3 className="fs-22 fw-semibold mb-2">
                      ${Number(upcoming.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-muted mb-1 fs-13">
                      <strong>Next Billing Date:</strong> {upcoming.next_date}
                    </p>
                    <p className="text-muted mb-0 fs-12">
                      <strong>Status:</strong>{' '}
                      <span className="text-success fw-medium">Active Subscription</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <h5 className="fs-15 mb-2 text-muted">No Upcoming Automatic Charges</h5>
                    <p className="text-muted fs-12 mb-0">
                      Your subscription billing is currently up to date or completed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Payment Method & Account */}
          <div className="col-xl-4 col-md-12 mb-4">
            <div className="card card-height-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="avatar-xs flex-shrink-0 me-3">
                    <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-16">
                      <i className="ri-bank-card-line"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="card-title mb-0 text-muted text-uppercase fs-12 fw-semibold">
                      Payment Account Info
                    </h6>
                  </div>
                </div>

                {loading ? (
                  <div className="py-3 text-center">
                    <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">
                      <span className="text-muted fs-12 d-block">Default Payment Method</span>
                      <span className="fw-semibold fs-14">
                        {borrower?.default_payment_method || 'Standard Online Payment / Card'}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-muted fs-12 d-block">Account Type</span>
                      <span className="badge bg-light text-dark fs-12">
                        {borrower?.partner_payment_for_me ? 'Partner Paid / Host Managed' : 'Direct Billing'}
                      </span>
                    </div>

                    {borrower?.stripe_customer_id && (
                      <div>
                        <span className="text-muted fs-12 d-block">Stripe Customer ID</span>
                        <code className="fs-12 text-primary">{borrower.stripe_customer_id}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Payments Table ── */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0">Recent Payments History</h5>
                <Link to="/payments" className="btn btn-sm btn-link text-decoration-none">
                  View All Payments <i className="ri-arrow-right-line align-middle"></i>
                </Link>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover table-nowrap align-middle mb-0">
                    <thead className="table-light text-muted fs-12 text-uppercase">
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Transaction ID</th>
                        <th scope="col">Invoice #</th>
                        <th scope="col">Payment Method</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Type</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                            Loading payment history...
                          </td>
                        </tr>
                      ) : recentPayments.length > 0 ? (
                        recentPayments.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => navigate(`/payments/${item.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{item.transaction_date || item.created_at || 'N/A'}</td>
                            <td>{item.transaction_id || 'N/A'}</td>
                            <td>{item.invoice_no || item.invoice_id || '—'}</td>
                            <td>
                              <span className="badge bg-light text-dark fs-12">
                                {item.payment_type || item.from || 'Card'}
                              </span>
                            </td>
                            <td className="fw-semibold">
                              {item.displayable_amount || `$${item.amount}`}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  String(item.transaction_type || 'Debit').toLowerCase() === 'debit'
                                    ? 'bg-danger-subtle text-danger'
                                    : 'bg-success-subtle text-success'
                                } text-uppercase fs-11 fw-semibold`}
                              >
                                {item.transaction_type || 'Debit'}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  item.status === 'SUCCEEDED' || item.status === 'PAID'
                                    ? 'bg-success-subtle text-success'
                                    : item.status === 'PROCESSING'
                                    ? 'bg-warning-subtle text-warning'
                                    : 'bg-danger-subtle text-danger'
                                } fs-11`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted">
                            No payment history records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
