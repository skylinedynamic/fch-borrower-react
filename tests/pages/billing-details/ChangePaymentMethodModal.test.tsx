import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { server } from '../../mocks/server'
import { renderWithProviders, screen, within } from '../../test-utils'
import BillingDetails from '../../../src/pages/billing-details/BillingDetails'

// BUG-101: the modal is opened through the bundled Bootstrap Modal, the one the
// production build has. There is no `window.bootstrap` global here, as on stage,
// where the Change button did nothing. A synchronous fake keeps show() visible.
vi.mock('bootstrap/js/dist/modal', () => {
  class FakeModal {
    private el: HTMLElement
    constructor(el: HTMLElement) {
      this.el = el
    }
    show() {
      this.el.classList.add('show')
      this.el.style.display = 'block'
    }
    hide() {
      this.el.classList.remove('show')
      this.el.style.display = 'none'
    }
    dispose() {}
  }
  return { default: FakeModal }
})

afterEach(() => {
  server.resetHandlers()
})

describe('BillingDetails > Change Payment Method modal', () => {
  it(
    'REGRESSION: only renders payment providers the API marks enabled (status !== false) — ' +
      'guards billings/services.ts + BillingDetails.tsx\'s provider filter without touching either file',
    async () => {
      server.use(
        http.get('*/borrower/billing-details', () =>
          HttpResponse.json({
            data: {
              borrower: { id: 1, name: 'Craig Borrower', email: 'craig@example.com', default_payment_method: null },
              subscription: null,
            },
          })
        ),
        http.get('*/common/partner-payment-providers', () =>
          HttpResponse.json({
            data: [
              { id: 1, name: 'Stripe', display_name: 'Disabled Stripe', status: false, can_take_payments: false },
              { id: 2, name: 'Bank Transfer', display_name: 'Bank Transfer', status: true, can_take_payments: true },
            ],
          })
        )
      )

      const user = userEvent.setup()
      renderWithProviders(<BillingDetails />)

      const changeButton = await screen.findByRole('button', { name: /change/i })
      await user.click(changeButton)

      const bankTransferMatches = await screen.findAllByText('Bank Transfer')
      expect(bankTransferMatches.length).toBeGreaterThan(0)
      expect(screen.queryByText('Disabled Stripe')).not.toBeInTheDocument()
    }
  )

  it('BUG-101: Change opens the dialog with the gateway list, with no window.bootstrap global', async () => {
    expect((window as unknown as { bootstrap?: unknown }).bootstrap).toBeUndefined()
    server.use(
      http.get('*/borrower/billing-details', () =>
        HttpResponse.json({
          data: {
            borrower: { id: 1, name: 'Craig Borrower', email: 'craig@example.com', default_payment_method: 'Stripe' },
            subscription: null,
          },
        })
      ),
      http.get('*/common/partner-payment-providers', () =>
        HttpResponse.json({ data: [{ id: 2, name: 'Bank Transfer', display_name: 'Bank Transfer', status: true, can_take_payments: true }] })
      )
    )

    const user = userEvent.setup()
    renderWithProviders(<BillingDetails />)

    await user.click(await screen.findByRole('button', { name: /change/i }))

    const dialog = screen.getByText('Change Default Payment Method').closest('.modal') as HTMLElement
    expect(dialog).toHaveClass('show')
    expect(await within(dialog).findByText('Available Payment Gateways')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Bank Transfer').length).toBeGreaterThan(0)
  })

  /**
   * BUG-151: Stripe switched on but with no keys ("Active - Not configured")
   * was offered here, so it could become the default for auto-charges, while
   * the invoice Pay Now dialog already hid it. Both offer only a gateway that
   * can take payments (the API's can_take_payments).
   */
  it('BUG-151: leaves out a gateway that is switched on but cannot take payments', async () => {
    server.use(
      http.get('*/borrower/billing-details', () =>
        HttpResponse.json({ data: { borrower: { id: 1, name: 'Craig Borrower', email: 'craig@example.com', default_payment_method: null }, subscription: null } })
      ),
      http.get('*/common/partner-payment-providers', () =>
        HttpResponse.json({
          data: [
            { id: 1, name: 'Stripe', display_name: 'Keyless Stripe', status: true, can_take_payments: false },
            { id: 3, name: 'Cash Payment', display_name: 'Cash Payment', status: true, can_take_payments: true },
          ],
        })
      )
    )
    const user = userEvent.setup()

    renderWithProviders(<BillingDetails />)
    await user.click(await screen.findByRole('button', { name: /change/i }))

    expect((await screen.findAllByText('Cash Payment')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Keyless Stripe')).not.toBeInTheDocument()
  })

  /**
   * With no gateway able to take payments the dialog showed its heading over an
   * empty grid - nothing to pick, no reason given. It says so, as the invoice
   * Pay Now dialog does.
   */
  it('says no payment method is available when none can take payments', async () => {
    server.use(
      http.get('*/borrower/billing-details', () =>
        HttpResponse.json({ data: { borrower: { id: 1, name: 'Craig Borrower', email: 'craig@example.com', default_payment_method: null }, subscription: null } })
      ),
      http.get('*/common/partner-payment-providers', () =>
        HttpResponse.json({ data: [{ id: 1, name: 'Stripe', display_name: 'Keyless Stripe', status: true, can_take_payments: false }] })
      )
    )
    const user = userEvent.setup()

    renderWithProviders(<BillingDetails />)
    await user.click(await screen.findByRole('button', { name: /change/i }))

    expect(await screen.findByText(/no payment method is available right now/i)).toBeInTheDocument()
    expect(screen.queryByText('Available Payment Gateways')).not.toBeInTheDocument()
    expect(screen.queryByText('Keyless Stripe')).not.toBeInTheDocument()
  })
})
