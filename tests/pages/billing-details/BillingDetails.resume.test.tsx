import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import BillingDetails from '../../../src/pages/billing-details/BillingDetails'
import { useAuthStore } from '../../../src/store/auth'
import { RESUME_RESULT } from '../../../src/modules/billings'

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

const toastSuccess = vi.hoisted(() => vi.fn())
const toastInfo = vi.hoisted(() => vi.fn())
vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(), { success: toastSuccess, info: toastInfo, error: vi.fn(), warn: vi.fn() }),
  ToastContainer: () => null,
}))

/**
 * BUG-069: a cancelled subscription can be resumed from Billing Details, on
 * the plan it was on. Before its end date it is active again at once; after
 * it, the borrower is taken to the invoice to pay first.
 */
const details = (subscription: Record<string, unknown>) => ({
  status: true,
  data: {
    borrower: { id: 5, name: 'Bo Rower', default_payment_method: null, payment_provider: null, stripe_card_info: { customer_id: null, name: null, card_no: null } },
    subscription: {
      id: 3,
      status: 'Cancelled',
      enrollment_type: 'Payment Plan',
      installment_count: 12,
      installments_paid: 4,
      payable_amount: '$7,696.70',
      down_payment: '$1,000.00',
      subscription_amount_per_month: '$558.06',
      subscription_end_date: '2026-11-22',
      ...subscription,
    },
    recent_bill: null,
    upcoming_billing: null,
    recent_payments: [],
  },
})

const SLOW = { timeout: 5000 }

const open = () =>
  renderWithProviders(
    <Routes>
      <Route path="/billing-details" element={<BillingDetails />} />
      <Route path="/invoices/:id" element={<div>Invoice Page</div>} />
    </Routes>,
    { route: '/billing-details' }
  )

const resumeAndConfirm = async () => {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /resume subscription/i }, SLOW))
  await user.click(screen.getByRole('button', { name: /yes, resume/i, hidden: true }))
}

beforeEach(() => {
  useAuthStore.setState({
    token: 't',
    user: { id: 1 },
    userSubscription: { subscription_status: 'Cancelled', subscription_end_date: '2026-11-22' },
  } as never)
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  useAuthStore.setState({ token: undefined, user: null, userSubscription: null } as never)
})

describe('Billing Details - resuming a cancelled subscription', () => {
  it('offers Resume instead of Cancel once the subscription is cancelled', async () => {
    server.use(http.get('*/borrower/billing-details', () => HttpResponse.json(details({}))))
    open()

    expect(await screen.findByRole('button', { name: /resume subscription/i }, SLOW)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel subscription/i })).not.toBeInTheDocument()
  })

  it('offers no Resume while the subscription is active', async () => {
    server.use(http.get('*/borrower/billing-details', () => HttpResponse.json(details({ status: 'Active' }))))
    open()

    expect(await screen.findByRole('button', { name: /cancel subscription/i }, SLOW)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resume subscription/i })).not.toBeInTheDocument()
  })

  it('is active again at once before the end date, and the portal unlocks', async () => {
    const resumed = vi.fn()
    let billingStatus = 'Cancelled'
    server.use(
      http.get('*/borrower/billing-details', () => HttpResponse.json(details({ status: billingStatus }))),
      http.post('*/borrower/resume-subscription', () => {
        resumed()
        billingStatus = 'Active'
        return HttpResponse.json({ status: true, message: 'Your subscription is active again.', data: { status: RESUME_RESULT.ACTIVE, invoice_id: null } })
      }),
      http.get('*/common/refresh-user', () => HttpResponse.json({ status: true, data: { id: 1 } })),
      http.get('*/borrower/user-details', () =>
        HttpResponse.json({ status: true, data: { user: { subscription_status: 'Active', subscription_end_date: '2026-11-22' } } })
      ),
    )
    open()

    await resumeAndConfirm()

    await waitFor(() => expect(resumed).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Your subscription is active again.'))
    await waitFor(() => expect(useAuthStore.getState().userSubscription?.subscription_status).toBe('Active'))
    expect(await screen.findByRole('button', { name: /cancel subscription/i }, SLOW)).toBeInTheDocument()
  })

  it('takes the borrower to the invoice to pay after the end date', async () => {
    server.use(
      http.get('*/borrower/billing-details', () => HttpResponse.json(details({ subscription_end_date: '2026-10-01' }))),
      http.post('*/borrower/resume-subscription', () =>
        HttpResponse.json({ status: true, message: 'Pay the invoice to reactivate your subscription.', data: { status: RESUME_RESULT.PAYMENT_REQUIRED, invoice_id: 77 } })
      ),
    )
    open()

    await resumeAndConfirm()

    expect(await screen.findByText('Invoice Page')).toBeInTheDocument()
    expect(toastInfo).toHaveBeenCalledWith('Pay the invoice to reactivate your subscription.')
  })

  it('explains in the confirmation what happens', async () => {
    server.use(http.get('*/borrower/billing-details', () => HttpResponse.json(details({}))))
    const user = userEvent.setup()
    open()

    await user.click(await screen.findByRole('button', { name: /resume subscription/i }, SLOW))

    expect(screen.getByText('Resume Subscription?')).toBeInTheDocument()
    expect(
      screen.getByText('Billing continues on your current plan. If your billing period has already ended, you will be asked to pay the next invoice first.')
    ).toBeInTheDocument()
  })
})
