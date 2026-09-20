import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { server } from '../../mocks/server'
import { renderWithProviders, screen } from '../../test-utils'
import BillingDetails from '../../../src/pages/billing-details/BillingDetails'

class FakeBootstrapModal {
  show() {}
  hide() {}
  dispose() {}
}

beforeEach(() => {
  ;(window as any).bootstrap = { Modal: FakeBootstrapModal }
})

afterEach(() => {
  server.resetHandlers()
  delete (window as any).bootstrap
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
              { id: 1, name: 'Stripe', display_name: 'Disabled Stripe', status: false },
              { id: 2, name: 'Bank Transfer', display_name: 'Bank Transfer', status: true },
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
})
