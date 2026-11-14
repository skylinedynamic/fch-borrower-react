import { describe, expect, it } from 'vitest'
import { PAYMENT_METHOD_OPTIONS } from '../../src/config/paymentConfig'

/**
 * A commission paid to a client is recorded with the method picked in the
 * admin payout dialog (Card, Cash, Cheque, Paypal, Stripe, Apple Pay,
 * Google Pay), so the Payments Method filter must offer those too.
 */
describe('PAYMENT_METHOD_OPTIONS', () => {
  const values = PAYMENT_METHOD_OPTIONS.map((o) => o.value)

  it('offers every commission payout method', () => {
    for (const method of ['Card', 'Cash', 'Cheque', 'Paypal', 'Stripe', 'Apple Pay', 'Google Pay']) {
      expect(values).toContain(method)
    }
  })

  it('keeps the gateway methods and "All Methods" first', () => {
    expect(PAYMENT_METHOD_OPTIONS[0]).toEqual({ label: 'All Methods', value: null })
    for (const gateway of ['Stripe', 'Bank Transfer', 'Square', 'Ecrypt', 'Authorize.Net', 'Cash Payment']) {
      expect(values).toContain(gateway)
    }
  })

  it('lists each method once', () => {
    expect(new Set(values).size).toBe(values.length)
  })
})
