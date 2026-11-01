import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { renderWithProviders } from '../../test-utils'
import PaymentDetails from '../../../src/pages/payments/PaymentDetails.jsx'

vi.mock('bootstrap/js/dist/modal', () => ({ default: class { show() {} hide() {} dispose() {} static getInstance() { return null } } }))

/**
 * BUG-062: Verification Info printed every key the API sent in raw_details -
 * for a card payment, the gateway's PaymentIntent with its client_secret. The
 * API now sends only readable fields; the page also shows only the fields it
 * knows, by name, so nothing unexpected is ever printed.
 */
const PAYMENT = {
  id: 189,
  transaction_id: 'TX-189',
  payment_type: 'Cash Payment',
  status: 'SUCCEEDED',
  displayable_amount: '$2,497.00',
  amount: 2497,
  transaction_date: '2026-10-15',
}

const respondWith = (rawDetails: unknown) =>
  server.use(http.get('*/borrower/payments/:id', () => HttpResponse.json({ status: true, data: { ...PAYMENT, raw_details: rawDetails } })))

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/payments/:id" element={<PaymentDetails />} />
    </Routes>,
    { route: '/payments/189' }
  )

const verificationInfo = async () => {
  const title = await screen.findByRole('heading', { name: 'Verification Info' })
  return within(title.parentElement as HTMLElement)
}

describe('PaymentDetails - Verification Info', () => {
  it('shows the readable fields by name', async () => {
    respondWith({
      provider: 'Cash Payment',
      bank_name: 'First Bank',
      account_name: 'Acme Funding',
      account_number: '****6789',
      transaction_number: 'DEP-5521',
      approved_by: 'Olive Owner',
      approved_at: '2026-10-15 10:00 AM',
    })
    renderPage()

    const section = await verificationInfo()
    expect(section.getByText('Bank Name').nextElementSibling).toHaveTextContent('First Bank')
    expect(section.getByText('Account Name').nextElementSibling).toHaveTextContent('Acme Funding')
    expect(section.getByText('Account Number').nextElementSibling).toHaveTextContent('****6789')
    expect(section.getByText('Transaction Number').nextElementSibling).toHaveTextContent('DEP-5521')
    expect(section.getByText('Approved By').nextElementSibling).toHaveTextContent('Olive Owner')
  })

  it('never prints a field it does not know - gateway internals included', async () => {
    respondWith({
      bank_name: 'First Bank',
      client_secret: 'pi_3Abc_secret_XyZ',
      customer: 'cus_Q1',
      latest_charge: 'ch_9',
      metadata: { invoice_id: '12' },
    })
    renderPage()

    await verificationInfo()
    expect(screen.queryByText(/secret/i)).not.toBeInTheDocument()
    expect(screen.queryByText('cus_Q1')).not.toBeInTheDocument()
    expect(screen.queryByText('ch_9')).not.toBeInTheDocument()
    expect(screen.queryByText(/invoice_id/)).not.toBeInTheDocument()
  })

  it('a card payment with nothing to verify has no Verification Info', async () => {
    respondWith([])
    renderPage()

    expect(await screen.findByText('TX-189')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Verification Info' })).not.toBeInTheDocument()
  })
})
