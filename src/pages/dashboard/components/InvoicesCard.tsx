import React from 'react'
import { Link } from 'react-router-dom'
import DashboardCard, { StatusPill } from './DashboardCard'
import type { DashboardInvoice } from '../../../modules/dashboard/types'
import { formatInvoiceAmount, invoiceStatusTone } from '../dashboardMappers'

interface InvoicesCardProps {
  invoices: DashboardInvoice[]
  onViewAll: () => void
}

/**
 * The latest invoices (the API sends up to 5); only rendered when there are
 * some. Laid out like the Upcoming Meetings card beside it: a framed list that
 * scrolls, compact rows - number, then amount and date - status on the right.
 * Each row opens its invoice.
 */
export default function InvoicesCard({ invoices, onViewAll }: InvoicesCardProps) {
  return (
    <DashboardCard widget="invoices" title="Invoices" icon="ri-file-list-3-line" tone="danger">
      <ul className="db-invoices">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="db-invoice">
            <div className="db-invoice-main">
              {/* Stretched over the row: the whole row opens the invoice. */}
              <Link to={`/invoices/${invoice.id}`} className="db-invoice-id stretched-link" title={invoice.invoice_id}>
                {invoice.invoice_id}
              </Link>
              <div className="db-invoice-meta">
                <span className="db-invoice-amount">{formatInvoiceAmount(invoice.payment_amount, invoice.currency_symbol)}</span>
                {invoice.formatted_created_at && ` · ${invoice.formatted_created_at}`}
              </div>
            </div>
            <StatusPill tone={invoiceStatusTone(invoice.status)}>{invoice.status}</StatusPill>
          </li>
        ))}
      </ul>
      <button type="button" className="db-outline-btn" onClick={onViewAll}>
        <i className="ri-file-list-3-line me-1" aria-hidden="true"></i>
        View All Invoices
      </button>
    </DashboardCard>
  )
}
