import React from 'react'

interface PendingInvoiceAlertProps {
  count: number
  onPay: () => void
}

export default function PendingInvoiceAlert({ count, onPay }: PendingInvoiceAlertProps) {
  const single = count === 1
  return (
    <div className="db-alert is-attention" role="alert">
      <span className="db-alert-icon" aria-hidden="true">
        <i className="ri-error-warning-fill"></i>
      </span>
      <div className="db-alert-text">
        <h2 className="db-alert-title">
          {single ? 'You currently have a pending invoice' : 'You currently have pending invoices'}
        </h2>
        <p className="mb-0">
          {single
            ? 'Please pay your invoice. Click here to go to the invoice and complete the payment.'
            : 'Please pay your invoices. Click here to go to the invoices and complete the payment.'}
        </p>
      </div>
      <button type="button" className="btn btn-danger db-alert-btn" onClick={onPay}>
        <i className="ri-bill-line me-1" aria-hidden="true"></i>
        {single ? 'View & Pay Invoice' : 'View & Pay Invoices'}
      </button>
    </div>
  )
}
