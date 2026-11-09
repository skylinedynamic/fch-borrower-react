import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import BillingDetails from '../../../src/pages/billing-details/BillingDetails'

// ConfirmationModal drives Bootstrap's real Modal; a synchronous fake avoids
// its transition callbacks firing after the page has unmounted.
vi.mock('bootstrap/js/dist/modal', () => {
  class FakeModal {
    show() {}
    hide() {}
    dispose() {}
  }
  return { default: FakeModal }
})

/**
 * BUG-049: the monthly installment is rounded to the cent, so the last one
 * takes up the difference (6696.70 over 12: 558.06 a month, the last 558.04).
 * The billing page shows it beside the monthly amount.
 */
const details = (subscription: Record<string, unknown>) => ({
  status: true,
  data: {
    borrower: { id: 5, name: 'Bo Rower', default_payment_method: null, payment_provider: null, stripe_card_info: { customer_id: null, name: null, card_no: null } },
    subscription: {
      id: 3,
      status: 'Active',
      enrollment_type: 'Payment Plan',
      installment_count: 12,
      installments_paid: 4,
      payable_amount: '$7,696.70',
      down_payment: '$1,000.00',
      subscription_amount_per_month: '$558.06',
      ...subscription,
    },
    recent_bill: null,
    upcoming_billing: { next_date: '2026-11-01', amount: '$558.06', raw_amount: 558.06, type: 'Installment' },
    recent_payments: [],
  },
})

afterEach(() => server.resetHandlers())

const SLOW = { timeout: 5000 }

describe('Billing - the last installment', () => {
  it('shows the last installment when it is adjusted for rounding', async () => {
    server.use(http.get('*/borrower/billing-details', () => HttpResponse.json(details({ final_installment_amount: '$558.04' }))))
    renderWithProviders(<BillingDetails />, { route: '/billing-details' })

    expect((await screen.findAllByText('Last Installment', undefined, SLOW)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('$558.04').length).toBeGreaterThan(0)
  })

  it('shows no separate last installment when the plan splits evenly', async () => {
    server.use(http.get('*/borrower/billing-details', () => HttpResponse.json(details({ final_installment_amount: null }))))
    renderWithProviders(<BillingDetails />, { route: '/billing-details' })

    expect((await screen.findAllByText('Subscription per Month', undefined, SLOW)).length).toBeGreaterThan(0)
    expect(screen.queryByText('Last Installment')).not.toBeInTheDocument()
  })
})
