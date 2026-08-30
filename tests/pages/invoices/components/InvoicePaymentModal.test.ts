import { describe, expect, it } from 'vitest'
import { isStripeProvider, isBankTransferProvider } from '../../../../src/pages/invoices/components/InvoicePaymentModal.jsx'

describe('isStripeProvider', () => {
  it('matches by provider name, case-insensitively', () => {
    expect(isStripeProvider({ name: 'Stripe' })).toBe(true)
    expect(isStripeProvider({ name: 'stripe' })).toBe(true)
    expect(isStripeProvider({ name: ' STRIPE ' })).toBe(true)
  })

  it('matches by provider slug as a fallback', () => {
    expect(isStripeProvider({ name: 'Custom Gateway', slug: 'stripe' })).toBe(true)
  })

  it('is false for other providers or missing input', () => {
    expect(isStripeProvider({ name: 'Square' })).toBe(false)
    expect(isStripeProvider(null)).toBe(false)
    expect(isStripeProvider(undefined)).toBe(false)
  })
})

describe('isBankTransferProvider', () => {
  it('matches the exact "Bank Transfer" provider name', () => {
    expect(isBankTransferProvider({ name: 'Bank Transfer' })).toBe(true)
  })

  it('matches a "bank_transfer" slug', () => {
    expect(isBankTransferProvider({ name: 'ACH', slug: 'bank_transfer' })).toBe(true)
  })

  it('matches any provider name containing "bank" or "transfer"', () => {
    expect(isBankTransferProvider({ name: 'Wire Transfer' })).toBe(true)
    expect(isBankTransferProvider({ name: 'US Bank ACH' })).toBe(true)
  })

  it('is false for unrelated providers or missing input', () => {
    expect(isBankTransferProvider({ name: 'Stripe' })).toBe(false)
    expect(isBankTransferProvider(null)).toBe(false)
  })
})
