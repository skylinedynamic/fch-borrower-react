import React, { useState, useEffect } from 'react';
import { processUnifiedPayment } from '../../../modules/invoice/services';
import { toast } from 'react-toastify';
import { getStripe } from '../../../lib/stripe';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

/*
 * Card payments only go through a gateway's own tokenisation (Stripe Elements):
 * the card number never touches this app. The raw-card forms for Authorize.Net,
 * Square and Ecrypt were removed (E2E-017); those providers are paid manually
 * with a reference number (InvoicePaymentModal › ManualProcessingNoticeView).
 */

/* ── Summary + Pay button ── */

const PaymentSummary = ({ amount }) => (
  <div className="stripe-summary-card">
    <div className="d-flex flex-column">
      <span className="stripe-summary-title">Total to Pay</span>
      <h4 className="stripe-summary-amount mb-0">${amount.toFixed(2)}</h4>
    </div>
    <div className="avatar-sm">
      <span className="avatar-title bg-primary text-white rounded-circle fs-4">
        <i className="ri-secure-payment-line"></i>
      </span>
    </div>
  </div>
);

const PayButton = ({ amount, disabled, onClick, processing }) => (
  <div className="hstack gap-2 justify-content-center">
    <button
      type="button"
      className="stripe-submit-btn"
      disabled={disabled || processing}
      onClick={onClick}
    >
      {processing ? (
        <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Processing...</>
      ) : (
        <><i className="ri-shield-check-line me-1"></i> Pay ${amount.toFixed(2)}</>
      )}
    </button>
  </div>
);

/* ── Stripe form ── */

export const StripeForm = ({ amount, invoice, selectedProvider, onPaymentSuccess, onCancel }) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    getStripe(selectedProvider?.publishable_key).then(setStripePromise);
  }, [selectedProvider]);

  if (!stripePromise) {
    return (
      <div className="text-center py-4">
        <span className="spinner-border spinner-border-sm text-primary" role="status" />
        <span className="ms-2">Initializing secure payment gateway...</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardFormInner
        amount={amount}
        invoice={invoice}
        selectedProvider={selectedProvider}
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

const StripeCardFormInner = ({ amount, invoice, selectedProvider, onPaymentSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setProcessing(true);
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
        toast.error(error.message || 'Failed to authorize card details');
        setProcessing(false);
        return;
      }

      const response = await processUnifiedPayment({
        payment_token: paymentMethod.id,
        invoice_id: invoice.id,
        payment_method_id: selectedProvider.id,
      });

      if (response.status) {
        toast.success('Payment completed successfully!');
        onPaymentSuccess(response.data?.id || response.data?.payment_id);
        window.location.reload();
      } else {
        toast.error(response.message || 'Payment failed');
        onCancel();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to process payment');
      onCancel();
    } finally {
      setProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#495057',
        fontFamily: 'Inter, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '15px',
        '::placeholder': {
          color: '#adb5bd',
        },
      },
      invalid: {
        color: '#f06548',
        iconColor: '#f06548',
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="card-detail-form text-start">
      <div className="mb-4">
        <label className="stripe-field-label mb-2">Card Information</label>
        <div className="card-detail-input py-3 px-2 border rounded bg-light">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => setIsValid(e.complete)}
          />
        </div>
      </div>
      <PaymentSummary amount={amount} />
      <PayButton
        amount={amount}
        disabled={!isValid || processing}
        processing={processing}
        onClick={handlePay}
      />
    </div>
  );
};
