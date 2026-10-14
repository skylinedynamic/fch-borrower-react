import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '../../lib/stripe';
import { Skeleton } from 'primereact/skeleton';
import {
  fetchBillingDetails,
  fetchPaymentProviders,
  updateDefaultPaymentMethod,
  cancelBorrowerSubscription,
  BillingDetailsData,
  PaymentProviderItem,
} from '../../modules/billings';
import BillingDetailsLoader from '../../components/Loader/BillingDetailsLoader';
import ConfirmationModal from '../../components/GlobalModal/ConfirmationModal';
import { hideAndDisposeModal } from '../../utils/bootstrapModal';
import {
  isOneTimeType,
  ENROLLMENT_TYPE_ONE_TIME,
  SUBSCRIPTION_STATUS_ACTIVE,
  SUBSCRIPTION_STATUS_COMPLETED,
  SUBSCRIPTION_STATUS_CANCELLED,
  SUBSCRIPTION_STATUS_EXPIRED,
  SUBSCRIPTION_STATUS_PENDING,
} from '../../config/subscriptionConfig';
import {
  PAYMENT_STATUS_PAID,
  PAYMENT_STATUS_UNPAID,
  PAYMENT_STATUS_PROCESSING,
  PAYMENT_STATUS_SUCCEEDED,
  TRANSACTION_TYPE_DEBIT,
  TRANSACTION_TYPE_CREDIT,
  PROVIDER_STRIPE,
} from '../../config/paymentConfig';

// Inner Stripe Form component for card details
export const StripeCardInputForm = ({
  selectedProvider,
  submitting,
  setSubmitting,
  onSuccess,
  onCancel,
}: {
  selectedProvider: PaymentProviderItem;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not loaded');
      }

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to authorize card');
        setSubmitting(false);
        return;
      }

      await updateDefaultPaymentMethod({
        provider_name: selectedProvider.name,
        payment_method_id: paymentMethod.id,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to update payment method.');
    } finally {
      setSubmitting(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#1e293b',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '15px',
        '::placeholder': {
          color: '#94a3b8',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && (
        <div className="alert alert-danger fs-12 py-2 mb-3 rounded-1" role="alert">
          {errorMsg}
        </div>
      )}
      <div className="mb-4">
        <label className="form-label fs-13 fw-semibold text-dark mb-2">Card Details</label>
        <div className="p-3 border rounded-1 bg-white shadow-sm">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 pt-2">
        <button type="button" className="btn btn-light py-2 px-4 fw-medium" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary py-2 px-4 fw-bold" disabled={!stripe || submitting}>
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span> Saving...
            </>
          ) : (
            'Save New Card & Set Default'
          )}
        </button>
      </div>
    </form>
  );
};

// Provider skeleton loader for modal
const ModalProvidersLoader = () => (
  <div className="row g-3 mb-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="col-12 col-sm-6 col-md-4">
        <div className="card border rounded-1 p-3 text-center h-100 mb-0 shadow-sm bg-white" style={{ minHeight: '115px' }}>
          <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center">
            <Skeleton width="110px" height="50px" className="mb-2 rounded-1" />
            <Skeleton width="60%" height="1rem" className="mb-0" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Stripe form initialization skeleton loader
const StripeFormLoader = () => (
  <div className="p-3 border rounded-1 bg-white mb-3 shadow-xs">
    <Skeleton width="30%" height="1rem" className="mb-3" />
    <Skeleton width="100%" height="45px" className="rounded-1" />
  </div>
);

// Main Modal component
const ChangePaymentMethodModal = ({
  show,
  currentMethod,
  onClose,
  onUpdated,
}: {
  show: boolean;
  currentMethod?: string | null;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<any>(null);

  const [providers, setProviders] = useState<PaymentProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState<boolean>(true);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modalRef.current && (window as any).bootstrap) {
      modalInstanceRef.current = new (window as any).bootstrap.Modal(modalRef.current, {
        backdrop: 'static',
        keyboard: false,
      });

      const handleHidden = () => {
        onClose();
      };

      const currentModalRef = modalRef.current;
      currentModalRef?.addEventListener('hidden.bs.modal', handleHidden);

      return () => {
        currentModalRef?.removeEventListener('hidden.bs.modal', handleHidden);
      };
    }
  }, []);

  useEffect(() => {
    const modal = modalInstanceRef.current;
    if (!modal) return;

    if (show) {
      modal.show();
      loadProviders();
    } else {
      modal.hide();
    }
  }, [show]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const modal = modalInstanceRef.current;
      // Not hide()+dispose() back to back: that races the hide animation (E2E-018).
      hideAndDisposeModal(modal, null);
      modalInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (show && selectedProvider && selectedProvider.name.toLowerCase() === PROVIDER_STRIPE.toLowerCase()) {
      initStripe(selectedProvider.publishable_key || undefined);
    }
  }, [show, selectedProvider]);

  const initStripe = async (pubKey?: string) => {
    try {
      const promise = await getStripe(pubKey);
      setStripePromise(promise);
    } catch (e) {
      console.error('Failed to init stripe', e);
    }
  };

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const res = await fetchPaymentProviders();
      const list = Array.isArray(res) ? res.filter((p) => p.status !== false) : [];
      setProviders(list);
      if (list.length > 0) {
        const matching = list.find(
          (p) =>
            p.name.toLowerCase() === (currentMethod || '').toLowerCase() ||
            p.display_name.toLowerCase() === (currentMethod || '').toLowerCase()
        );
        setSelectedProvider(matching || list[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch payment providers:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleClose = () => {
    const modal = modalInstanceRef.current;
    if (modal) {
      modal.hide();
    } else {
      onClose();
    }
  };

  const isStripeSelected = selectedProvider?.name?.toLowerCase() === 'stripe';

  const handleNonStripeSave = async () => {
    if (!selectedProvider) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateDefaultPaymentMethod({
        provider_name: selectedProvider.name,
      });
      handleClose();
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update payment method.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="modal fade flip"
      ref={modalRef}
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-1 overflow-hidden">
          <div className="modal-header bg-light px-4 py-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-xs flex-shrink-0">
                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-16">
                  <i className="ri-bank-card-line"></i>
                </span>
              </div>
              <div>
                <h5 className="modal-title fs-16 fw-bold mb-0 text-dark">Change Default Payment Method</h5>
                <span className="text-muted fs-12">Select your preferred payment gateway</span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={handleClose} disabled={submitting}></button>
          </div>
          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger fs-13 py-2 px-3 mb-3 rounded-1 d-flex align-items-center gap-2" role="alert">
                <i className="ri-error-warning-line fs-16"></i>
                <span>{error}</span>
              </div>
            )}

            {loadingProviders ? (
              <ModalProvidersLoader />
            ) : (
              <div>
                <label className="form-label fs-13 fw-semibold text-dark mb-3">
                  Available Payment Gateways
                </label>
                <div className="row g-3 mb-4">
                  {providers.map((p) => {
                    const isSelected = selectedProvider?.id === p.id;
                    return (
                      <div key={p.id} className="col-12 col-sm-6 col-md-4">
                        <div
                          className={`card cursor-pointer h-100 mb-0 transition-all position-relative rounded-1 ${isSelected
                            ? 'border-2 border-primary bg-primary-subtle shadow-sm'
                            : 'border bg-white hover-shadow'
                            }`}
                          style={{ minHeight: '115px' }}
                          onClick={() => setSelectedProvider(p)}
                        >
                          {isSelected && (
                            <div className="position-absolute top-0 end-0 m-2">
                              <span className="badge bg-primary rounded-circle p-1 d-inline-flex align-items-center justify-content-center">
                                <i className="ri-check-line text-white fs-12"></i>
                              </span>
                            </div>
                          )}
                          <div className="card-body p-3 text-center d-flex flex-column align-items-center justify-content-center">
                            <div className="provider-card-logo-container mb-2 d-flex align-items-center justify-content-center" style={{ height: '55px' }}>
                              {p.logo ? (
                                <img
                                  src={p.logo}
                                  alt={p.display_name}
                                  className="img-fluid provider-card-logo-img"
                                  style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
                                />
                              ) : (
                                <div className="avatar-md">
                                  <span className="avatar-title bg-light text-primary rounded-circle fs-24">
                                    <i className="ri-bank-card-line"></i>
                                  </span>
                                </div>
                              )}
                            </div>
                            <h6 className="fs-13 fw-semibold mb-0 text-dark">{p.display_name || p.name}</h6>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedProvider && (
                  <div className="border-top pt-4">
                    {isStripeSelected ? (
                      <div>
                        <div className="alert alert-info fs-12 mb-3 rounded-1 d-flex align-items-center gap-2">
                          <i className="ri-information-line fs-16 flex-shrink-0"></i>
                          <span>Enter your card details below to set Stripe as your primary payment method.</span>
                        </div>
                        {stripePromise ? (
                          <Elements stripe={stripePromise}>
                            <StripeCardInputForm
                              selectedProvider={selectedProvider}
                              submitting={submitting}
                              setSubmitting={setSubmitting}
                              onSuccess={() => {
                                handleClose();
                                onUpdated();
                              }}
                              onCancel={handleClose}
                            />
                          </Elements>
                        ) : (
                          <StripeFormLoader />
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="alert alert-secondary fs-13 mb-4 rounded-1 d-flex align-items-center gap-2">
                          <i className="ri-checkbox-circle-line fs-16 text-success flex-shrink-0"></i>
                          <span>
                            Selecting <strong>{selectedProvider.display_name || selectedProvider.name}</strong> will set it as your primary default payment method.
                          </span>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                          <button type="button" className="btn btn-light py-2 px-4 fw-medium" onClick={handleClose} disabled={submitting}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary py-2 px-4 fw-bold"
                            onClick={handleNonStripeSave}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span> Updating...
                              </>
                            ) : (
                              'Set as Default Method'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Subscription Details Modal Component
const SubscriptionDetailsModal = ({
  show,
  subscription,
  upcoming,
  onClose,
  onCancelClick,
}: {
  show: boolean;
  subscription: any;
  upcoming: any;
  onClose: () => void;
  onCancelClick: () => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (modalRef.current && (window as any).bootstrap) {
      modalInstanceRef.current = new (window as any).bootstrap.Modal(modalRef.current, {
        backdrop: 'static',
        keyboard: false,
      });

      const handleHidden = () => {
        onClose();
      };

      const currentModalRef = modalRef.current;
      currentModalRef?.addEventListener('hidden.bs.modal', handleHidden);

      return () => {
        currentModalRef?.removeEventListener('hidden.bs.modal', handleHidden);
      };
    }
  }, []);

  useEffect(() => {
    const modal = modalInstanceRef.current;
    if (!modal) return;

    if (show) {
      modal.show();
    } else {
      modal.hide();
    }
  }, [show]);

  useEffect(() => {
    return () => {
      const modal = modalInstanceRef.current;
      // Not hide()+dispose() back to back: that races the hide animation (E2E-018).
      hideAndDisposeModal(modal, null);
      modalInstanceRef.current = null;
    };
  }, []);

  const handleClose = () => {
    const modal = modalInstanceRef.current;
    if (modal) {
      modal.hide();
    } else {
      onClose();
    }
  };

  const isCancelled = (subscription?.status || '').toLowerCase() === SUBSCRIPTION_STATUS_CANCELLED.toLowerCase();
  const hasCompletedDate = Boolean(subscription?.enrollment_completed_at);
  const installmentsPaid = Number(subscription?.installments_paid || 0);
  const installmentCount = Number(subscription?.installment_count || 0);
  const isOneTime = isOneTimeType(subscription?.enrollment_type, subscription?.installment_count);

  const isCompleted = Boolean(
    subscription?.is_completed ||
    (isOneTime ? hasCompletedDate : (hasCompletedDate && installmentCount > 0 && installmentsPaid >= installmentCount)) ||
    [SUBSCRIPTION_STATUS_COMPLETED.toLowerCase(), SUBSCRIPTION_STATUS_EXPIRED.toLowerCase()].includes((subscription?.status || '').toLowerCase())
  );

  const modalContent = (
    <div className="modal fade flip" ref={modalRef} tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-1 overflow-hidden">
          <div className="modal-header bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div className="avatar-xs flex-shrink-0">
                <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                  <i className="ri-calendar-check-line"></i>
                </span>
              </div>
              <div>
                <h5 className="modal-title fs-16 fw-bold mb-0 text-dark">
                  {isOneTime ? 'Payment Details' : 'Subscription Details'}
                </h5>
                <span className="text-muted fs-12">
                  {isOneTime ? 'One-time payment breakdown' : 'Plan breakdown & schedule'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body p-4">
            {subscription ? (
              <div>
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-1 mb-3">
                  <div>
                    <span className="text-muted fs-12 d-block text-uppercase fw-semibold">Enrollment Plan</span>
                    <h6 className="fs-15 fw-bold text-dark mb-0">{subscription.enrollment_type || ENROLLMENT_TYPE_ONE_TIME}</h6>
                  </div>
                  <span className={`badge billing-card-badge-pill ${isCompleted ? 'bg-success-subtle text-success border border-success-subtle' : isCancelled ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-info-subtle text-info border border-info-subtle'}`}>
                    {isCompleted ? SUBSCRIPTION_STATUS_COMPLETED : subscription.status || SUBSCRIPTION_STATUS_ACTIVE}
                  </span>
                </div>

                {isOneTime ? (
                  <div className="row g-3 fs-13 mb-3">
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Enrollment Type</span>
                      <strong className="text-dark">{subscription.enrollment_type || ENROLLMENT_TYPE_ONE_TIME}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Total Amount</span>
                      <strong className="text-dark">{subscription.payable_amount || subscription.total_subscription_amount || 'N/A'}</strong>
                    </div>
                    <div className="col-12 border-top pt-2">
                      <span className="text-muted d-block fs-12">Completed Date</span>
                      <strong className="text-success">{subscription.enrollment_completed_at || subscription.subscription_start_date || 'N/A'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="row g-3 fs-13 mb-3">
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Total Plan Amount</span>
                      <strong className="text-dark">{subscription.payable_amount || 'N/A'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Down Payment</span>
                      <strong className="text-dark">{subscription.down_payment || 'N/A'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Subscription per Month</span>
                      <strong className="text-dark">{subscription.subscription_amount_per_month || 'N/A'}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Installment Progress</span>
                      <strong className="text-dark">Paid: {subscription.installments_paid ?? 0} / Total: {subscription.installment_count ?? 0}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block fs-12">Subscription Start Date</span>
                      <strong className="text-dark">{subscription.subscription_start_date || 'N/A'}</strong>
                    </div>
                    {!isCompleted && (
                      <div className="col-6">
                        <span className="text-muted d-block fs-12">Next Billing Date</span>
                        <strong className="text-info">{upcoming?.next_date || subscription.subscription_end_date || 'N/A'}</strong>
                      </div>
                    )}
                  </div>
                )}

                {!isCompleted && !isCancelled && (
                  <div className="border-top pt-3 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-danger btn-sm px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
                      onClick={() => {
                        handleClose();
                        onCancelClick();
                      }}
                    >
                      <i className="ri-close-circle-line"></i> Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted fs-13 mb-0">No active subscription found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default function BillingDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<BillingDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChangeModal, setShowChangeModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

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

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await cancelBorrowerSubscription();
      setToastMsg({ type: 'success', message: 'Subscription cancelled successfully.' });
      setShowCancelModal(false);
      loadBillingDetails();
    } catch (err: any) {
      setToastMsg({
        type: 'danger',
        message: err?.response?.data?.message || 'Failed to cancel subscription.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const recentBill = data?.recent_bill;
  const upcoming = data?.upcoming_billing;
  const subscription = data?.subscription;
  const borrower = data?.borrower;
  const recentPayments = data?.recent_payments || [];

  const isSubscriptionCancelled = (subscription?.status || '').toLowerCase() === SUBSCRIPTION_STATUS_CANCELLED.toLowerCase();
  const subHasCompletedDate = Boolean(subscription?.enrollment_completed_at);
  const subInstallmentsPaid = Number(subscription?.installments_paid || 0);
  const subInstallmentCount = Number(subscription?.installment_count || 0);
  const subIsOneTime = isOneTimeType(subscription?.enrollment_type, subscription?.installment_count);

  const isSubscriptionCompleted = Boolean(
    subscription?.is_completed ||
    (subIsOneTime ? subHasCompletedDate : (subHasCompletedDate && subInstallmentCount > 0 && subInstallmentsPaid >= subInstallmentCount)) ||
    [SUBSCRIPTION_STATUS_COMPLETED.toLowerCase(), SUBSCRIPTION_STATUS_EXPIRED.toLowerCase()].includes((subscription?.status || '').toLowerCase())
  );

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

        {toastMsg && (
          <div className={`alert alert-${toastMsg.type} alert-dismissible fade show`} role="alert">
            <i className={`ri-${toastMsg.type === 'success' ? 'checkbox-circle' : 'error-warning'}-line me-2 align-middle fs-16`}></i>
            {toastMsg.message}
            <button type="button" className="btn-close" onClick={() => setToastMsg(null)}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="ri-error-warning-line me-2 align-middle fs-16"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {loading ? (
          <BillingDetailsLoader />
        ) : (
          <>
            {/* ── Top Metric Cards ── */}
            <div className="row g-3 mb-3">
              {/* 1. Recent / Current Bill */}
              <div className="col-xl-4 col-md-6 col-12">
                <div className="card billing-card-wrapper h-100 mb-0">
                  <div className="card-body p-3 d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="billing-card-icon-avatar bg-primary-subtle text-primary">
                          <i className="ri-file-list-3-line"></i>
                        </div>
                        <div>
                          <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0">
                            Current / Recent Bill
                          </h6>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {recentBill && (
                          <span
                            className={`badge billing-card-badge-pill ${(recentBill.status || '').toUpperCase() === PAYMENT_STATUS_PAID.toUpperCase()
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : (recentBill.status || '').toUpperCase() === PAYMENT_STATUS_PROCESSING.toUpperCase()
                                ? 'bg-warning-subtle text-warning border border-warning-subtle'
                                : 'bg-danger-subtle text-danger border border-danger-subtle'
                              }`}
                          >
                            {recentBill.status}
                          </span>
                        )}
                        {recentBill && (
                          <Link to={`/invoices/${recentBill.id}`} className="btn btn-sm btn-soft-primary px-2.5 py-1 fs-12 fw-semibold d-inline-flex align-items-center gap-1">
                            <i className="ri-eye-line"></i> View Invoice
                          </Link>
                        )}
                      </div>
                    </div>

                    {recentBill ? (
                      <div className="my-1">
                        <h3 className="billing-card-amount fs-20 mb-1">
                          {recentBill.amount}
                        </h3>
                        <div className="d-flex flex-column gap-1 fs-12 text-muted">
                          <div>
                            <i className="ri-hashtag text-primary me-1"></i>
                            <span>Invoice #: <strong>{recentBill.invoice_id}</strong></span>
                          </div>
                          <div>
                            <i className="ri-calendar-event-line text-primary me-1"></i>
                            <span>Date: <strong>{recentBill.created_at || 'N/A'}</strong></span>
                          </div>
                        </div>
                        {(recentBill.status || '').toUpperCase() === PAYMENT_STATUS_UNPAID.toUpperCase() && (
                          <div className="mt-2">
                            <Link to={`/invoices/${recentBill.id}`} className="btn btn-sm btn-success px-2.5 py-1 fs-12 fw-semibold d-inline-flex align-items-center gap-1">
                              <i className="ri-secure-payment-line"></i> Pay Now
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted my-auto fs-13">No billing invoice generated yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Upcoming Billing */}
              <div className="col-xl-4 col-md-6 col-12">
                <div className="card billing-card-wrapper h-100 mb-0">
                  <div className="card-body p-3 d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="billing-card-icon-avatar bg-info-subtle text-info">
                          <i className="ri-calendar-check-line"></i>
                        </div>
                        <div>
                          <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0">
                            Upcoming Billing
                          </h6>
                        </div>
                      </div>
                      {upcoming && upcoming.next_date && !isSubscriptionCompleted && (
                        <span className="badge billing-card-badge-pill bg-info-subtle text-info border border-info-subtle">
                          Next Charge
                        </span>
                      )}
                    </div>

                    {upcoming && upcoming.next_date && !isSubscriptionCompleted ? (
                      <div className="d-flex flex-column flex-grow-1 justify-content-between">
                        <div className="my-1">
                          <h3 className="billing-card-amount fs-20 mb-1">
                            {upcoming.amount}
                          </h3>
                          <div className="d-flex align-items-center gap-1 fs-12 text-muted">
                            <i className="ri-calendar-event-line text-info me-1"></i>
                            <span>Next Billing Date: <strong className="text-dark">{upcoming.next_date}</strong></span>
                          </div>
                        </div>
                        {(() => {
                          const providerName = borrower?.payment_provider?.name || borrower?.default_payment_method || PROVIDER_STRIPE;
                          const isStripe = providerName.toLowerCase() === PROVIDER_STRIPE.toLowerCase();

                          if (isStripe) {
                            return (
                              <div className="d-flex align-items-center gap-2 mt-auto pt-2 fs-12 text-success fw-semibold">
                                <i className="ri-checkbox-circle-fill fs-14 text-success"></i>
                                <span>Scheduled Automatic Charge ({PROVIDER_STRIPE})</span>
                              </div>
                            );
                          }
                          return (
                            <div className="d-flex align-items-center gap-2 mt-auto pt-2 fs-12 text-info fw-semibold">
                              <i className="ri-time-line fs-14 text-info"></i>
                              <span>Scheduled Payment via {providerName}</span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="my-auto">
                        <h6 className="fs-13 fw-semibold text-muted mb-1">No Upcoming Charges</h6>
                        <p className="text-muted fs-12 mb-0">
                          {isSubscriptionCompleted
                            ? 'Subscription is fully completed. All installments paid.'
                            : 'Your subscription billing is currently up to date.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Default Payment Method */}
              <div className="col-xl-4 col-md-12 col-12">
                <div className="card billing-card-wrapper h-100 mb-0">
                  <div className="card-body p-3 d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="billing-card-icon-avatar bg-warning-subtle text-warning">
                          <i className="ri-wallet-3-line"></i>
                        </div>
                        <div>
                          <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0">
                            Default Payment Method
                          </h6>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-soft-primary px-2.5 py-1 fs-12 fw-medium rounded-1"
                        onClick={() => setShowChangeModal(true)}
                      >
                        <i className="ri-edit-line me-1"></i> Change
                      </button>
                    </div>

                    <div className="d-flex align-items-center gap-3 pt-2">
                      {borrower?.payment_provider?.logo ? (
                        <div className="billing-card-logo-box">
                          <img
                            src={borrower.payment_provider.logo}
                            alt={borrower.payment_provider.name}
                            className="billing-card-logo-img"
                          />
                        </div>
                      ) : (
                        <div className="billing-card-icon-avatar bg-light text-warning">
                          <i className="ri-bank-card-2-line"></i>
                        </div>
                      )}
                      <div>
                        <h6 className="fs-14 fw-bold text-dark mb-1">
                          {borrower?.payment_provider?.name || borrower?.default_payment_method || PROVIDER_STRIPE}
                        </h6>
                        {(() => {
                          const providerName = borrower?.payment_provider?.name || borrower?.default_payment_method || PROVIDER_STRIPE;
                          const isStripe = providerName.toLowerCase() === PROVIDER_STRIPE.toLowerCase();
                          const cardInfo = borrower?.stripe_card_info || (typeof borrower?.stripe_customer_id === 'object' ? borrower?.stripe_customer_id : null);
                          const hasCustomer = Boolean(cardInfo?.customer_id || borrower?.stripe_customer_id);
                          const cardHolderName = cardInfo?.name || (hasCustomer || isStripe ? 'Sandbox Card' : null);
                          const cardNumber = cardInfo?.card_no;

                          if (isStripe && (cardHolderName || cardNumber)) {
                            return (
                              <div className="fs-12 text-muted">
                                {cardHolderName && (
                                  <div className="d-flex align-items-center mb-0.5">
                                    <i className="ri-user-line me-1 text-primary"></i>
                                    <span className="fw-medium text-dark">{cardHolderName}</span>
                                  </div>
                                )}
                                {cardNumber && (
                                  <div className="d-flex align-items-center">
                                    <i className="ri-bank-card-line me-1 text-primary"></i>
                                    <span className="fw-medium text-dark">{cardNumber}</span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return <span className="text-muted fs-12 d-block">Primary payment gateway</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Separate Subscription Overview Row ── */}
            {subscription && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="card billing-card-wrapper mb-0">
                    <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between p-3 pb-0">
                      <div className="d-flex align-items-center gap-2">
                        <div className="billing-card-icon-avatar bg-info-subtle text-info">
                          <i className="ri-shield-star-line"></i>
                        </div>
                        <div>
                          <h5 className="card-title fs-15 fw-bold mb-0 text-dark">
                            {subIsOneTime ? 'Payment Overview' : 'Subscription Overview'}
                          </h5>
                          <span className="text-muted fs-12">
                            {subIsOneTime ? 'One-time payment breakdown & plan details' : 'Plan details & billing breakdown'}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge billing-card-badge-pill ${isSubscriptionCompleted ? 'bg-success-subtle text-success border border-success-subtle' : isSubscriptionCancelled ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-info-subtle text-info border border-info-subtle'}`}>
                          {isSubscriptionCompleted ? 'Completed' : subscription.status || 'Active'}
                        </span>
                        {!subIsOneTime && !isSubscriptionCompleted && !isSubscriptionCancelled && (
                          <button
                            type="button"
                            className="btn btn-sm btn-soft-danger px-3 py-1.5 fs-12 fw-semibold d-inline-flex align-items-center gap-1"
                            onClick={() => setShowCancelModal(true)}
                          >
                            <i className="ri-close-circle-line"></i> Cancel Subscription
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="card-body p-3">
                      {subIsOneTime ? (
                        /* ── One-Time Payment Fields ── */
                        <div className="row g-3">
                          <div className="col-xl-4 col-md-6 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Enrollment Plan</span>
                              <h6 className="fs-14 fw-bold text-dark mb-0">{subscription.enrollment_type || ENROLLMENT_TYPE_ONE_TIME}</h6>
                            </div>
                          </div>

                          <div className="col-xl-4 col-md-6 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Total Payment Amount</span>
                              <h6 className="fs-14 fw-bold text-dark mb-0">{subscription.payable_amount || subscription.total_subscription_amount || 'N/A'}</h6>
                            </div>
                          </div>

                          <div className="col-xl-4 col-md-12 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Payment Completed Date</span>
                              <h6 className="fs-14 fw-bold text-success mb-0">{subscription.enrollment_completed_at || subscription.subscription_start_date || 'N/A'}</h6>
                            </div>
                          </div>

                          <div className="col-12">
                            <div className="p-3 border rounded-1 bg-success-subtle text-success d-flex align-items-center justify-content-between">
                              <span className="fs-12 fw-semibold">Payment Status</span>
                              <span className="fw-bold fs-12">
                                <i className="ri-checkbox-circle-fill me-1"></i> One-Time Payment Completed
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── Installment / Payment Plan Fields ── */
                        <div className="row g-3">
                          <div className="col-xl-3 col-md-6 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Total Plan Amount</span>
                              <h6 className="fs-14 fw-bold text-dark mb-0">{subscription.payable_amount || 'N/A'}</h6>
                            </div>
                          </div>

                          <div className="col-xl-3 col-md-6 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Down Payment</span>
                              <h6 className="fs-14 fw-bold text-dark mb-0">{subscription.down_payment || '$0.00'}</h6>
                            </div>
                          </div>

                          <div className="col-xl-3 col-md-6 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Subscription per Month</span>
                              <h6 className="fs-14 fw-bold text-dark mb-0">{subscription.subscription_amount_per_month || 'N/A'}</h6>
                            </div>
                          </div>

                          <div className="col-xl-3 col-md-6 col-12">
                            <div className="p-3 bg-light rounded-1 h-100">
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">Installment Progress</span>
                              <h6 className="fs-14 fw-bold text-dark mb-0">
                                Paid: {subscription.installments_paid ?? 0} / Total: {subscription.installment_count ?? 0}
                              </h6>
                            </div>
                          </div>

                          <div className="col-xl-6 col-md-6 col-12">
                            <div className="p-3 border rounded-1 d-flex align-items-center justify-content-between">
                              <span className="text-muted fs-12">Subscription Start Date</span>
                              <span className="fw-semibold fs-12 text-dark">
                                {subscription.subscription_start_date || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {!isSubscriptionCompleted ? (
                            <div className="col-xl-6 col-md-6 col-12">
                              <div className="p-3 border rounded-1 d-flex align-items-center justify-content-between">
                                <span className="text-muted fs-12">Next Billing Date</span>
                                <span className="fw-bold fs-12 text-info">
                                  {upcoming?.next_date || subscription.subscription_end_date || 'N/A'} ({upcoming?.amount || '$0.00'})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="col-xl-6 col-md-6 col-12">
                              <div className="p-3 border rounded-1 bg-success-subtle text-success d-flex align-items-center justify-content-between">
                                <span className="fs-12 fw-semibold">Subscription Status</span>
                                <span className="fw-bold fs-12">
                                  <i className="ri-checkbox-circle-fill me-1"></i> Subscription Fully Completed
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                            <th scope="col">Invoice #</th>
                            <th scope="col">Payment Method</th>
                            <th scope="col">Amount</th>
                            <th scope="col">Type</th>
                            <th scope="col">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPayments.length > 0 ? (
                            recentPayments.map((item) => (
                              <tr
                                key={item.id}
                                className="cursor-pointer"
                                onClick={() => navigate(`/payments/${item.id}`)}
                              >
                                <td>{item.transaction_date || item.created_at || 'N/A'}</td>
                                <td>{item.invoice_no || item.invoice_id || '—'}</td>
                                <td>
                                  <span className="badge bg-light text-dark fs-12">
                                    {item.payment_type || item.from || 'Card'}
                                  </span>
                                </td>
                                <td className="fw-semibold">
                                  {item.displayable_amount || item.amount}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${String(item.transaction_type || TRANSACTION_TYPE_DEBIT).toLowerCase() === TRANSACTION_TYPE_DEBIT.toLowerCase()
                                      ? 'bg-danger-subtle text-danger'
                                      : 'bg-success-subtle text-success'
                                      } text-uppercase fs-11 fw-semibold`}
                                  >
                                    {item.transaction_type || TRANSACTION_TYPE_DEBIT}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${[(PAYMENT_STATUS_SUCCEEDED).toUpperCase(), (PAYMENT_STATUS_PAID).toUpperCase()].includes((item.status || '').toUpperCase())
                                      ? 'bg-success-subtle text-success'
                                      : (item.status || '').toUpperCase() === (PAYMENT_STATUS_PROCESSING).toUpperCase()
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
                              <td colSpan={6} className="text-center py-4 text-muted">
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
          </>
        )}
      </div>

      {/* ── Change Payment Method Modal ── */}
      <ChangePaymentMethodModal
        show={showChangeModal}
        currentMethod={borrower?.default_payment_method}
        onClose={() => setShowChangeModal(false)}
        onUpdated={() => {
          setShowChangeModal(false);
          loadBillingDetails();
        }}
      />

      {/* ── Subscription Details Modal ── */}
      <SubscriptionDetailsModal
        show={showDetailsModal}
        subscription={subscription}
        upcoming={upcoming}
        onClose={() => setShowDetailsModal(false)}
        onCancelClick={() => {
          setShowDetailsModal(false);
          setShowCancelModal(true);
        }}
      />

      {/* ── Cancel Subscription Confirmation Modal ── */}
      <ConfirmationModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription?"
        message={`Are you sure you want to cancel your subscription? You will continue to have full access to your plan features until the end of your current billing period${subscription?.subscription_end_date ? ` (${subscription.subscription_end_date})` : ''}. After that date, automatic renewals will be stopped.`}
        confirmText="Yes, Cancel Subscription"
        cancelText="Keep Subscription"
        confirmBtnClass="btn-danger"
        iconClass="ri-error-warning-line"
        iconBgClass="bg-danger-subtle"
        iconTextClass="text-danger"
        loading={cancelling}
        loadingText="Cancelling..."
      />
    </div>
  );
}
