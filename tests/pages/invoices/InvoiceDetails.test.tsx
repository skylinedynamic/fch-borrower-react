import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { renderWithProviders } from '../../test-utils'
import InvoiceDetails from '../../../src/pages/invoices/InvoiceDetails'

// The pay flow is its own screen with its own tests; this page only mounts it.
vi.mock('../../../src/pages/invoices/components/InvoicePaymentModal', () => ({ default: () => null }))

const billedTo = {
  name: 'Bo Rower',
  company_name: 'Bo Co',
  email: 'bo@example.test',
  phone: '555-0300',
  address: '9 Market St',
  city: 'Tampa',
  state: 'FL',
  postal_code: '33602',
  country: 'United States',
}

const respondWith = (invoice: Record<string, unknown>) =>
  server.use(http.get('*/borrower/invoice/:id', () => HttpResponse.json({ status: true, data: invoice })))

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/invoices/:id" element={<InvoiceDetails />} />
    </Routes>,
    { route: '/invoices/7' }
  )

const billedToSection = async () => {
  const title = await screen.findByRole('heading', { name: 'Billed To' })
  return within(title.parentElement as HTMLElement)
}

describe('InvoiceDetails', () => {
  it("bills the payer at their company's address", async () => {
    respondWith({
      id: 7,
      invoice_id: 'INV-7',
      type: 'Enrollment',
      status: 'Unpaid',
      displayable_amount: '$2,497.00',
      billed_to: billedTo,
    })

    renderPage()

    const to = await billedToSection()
    expect(to.getByText('Bo Rower')).toBeInTheDocument()
    expect(to.getByText('Bo Co')).toBeInTheDocument()
    expect(to.getByText('9 Market St')).toBeInTheDocument()
    expect(to.getByText('Tampa, FL 33602')).toBeInTheDocument()
    expect(to.getByText('United States')).toBeInTheDocument()
    expect(to.getByText('555-0300')).toBeInTheDocument()
    expect(to.getByText('bo@example.test')).toBeInTheDocument()
  })

  it('names the plan only when the invoice bills for one', async () => {
    respondWith({ id: 7, invoice_id: 'INV-7', type: 'Enrollment', enrollment_type: 'One Time Payment', billed_to: billedTo })

    renderPage()

    expect(await screen.findByText('One Time Payment')).toBeInTheDocument()
  })

  it('leaves the plan line out when the invoice bills for none', async () => {
    respondWith({ id: 7, invoice_id: 'INV-7', type: 'Platform Fee', billed_to: billedTo })

    renderPage()

    await billedToSection()
    expect(screen.queryByText(/Enrollment Type/)).not.toBeInTheDocument()
  })
})
