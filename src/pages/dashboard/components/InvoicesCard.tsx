import React from 'react'
import DashboardCard, { StatusPill } from './DashboardCard'
import type { DashboardInvoice } from '../../../modules/dashboard/types'
import { formatInvoiceAmount, invoiceStatusTone } from '../dashboardMappers'

/** The latest invoices (the API sends up to 5); only rendered when there are some. */
export default function InvoicesCard({ invoices }: { invoices: DashboardInvoice[] }) {
  return (
    <DashboardCard widget="invoices" title="Invoices" icon="ri-file-list-3-line" tone="danger">
      <ul className="db-invoices">
        {invoices.map((invoice) => {
          const tone = invoiceStatusTone(invoice.status)
          return (
            <li key={invoice.id} className={`db-invoice tone-${tone}`}>
              <span className="db-invoice-icon" aria-hidden="true">
                <i className="ri-bill-line"></i>
              </span>
              <div className="min-w-0 flex-grow-1">
                <div className="db-invoice-id" title={invoice.invoice_id}>
                  {invoice.invoice_id}
                </div>
                <div className="db-invoice-meta">
                  <span className="db-invoice-amount">
                    {formatInvoiceAmount(invoice.payment_amount, invoice.currency_symbol)}
                  </span>
                  <StatusPill tone={tone}>{invoice.status}</StatusPill>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </DashboardCard>
  )
}
