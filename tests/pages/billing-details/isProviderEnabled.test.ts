import { describe, expect, it } from 'vitest'
import { isProviderEnabled } from '../../../src/pages/billing-details/BillingDetails'
import type { PaymentProviderItem } from '../../../src/modules/billings'

const provider = (status: PaymentProviderItem['status']): PaymentProviderItem => ({
  id: 1,
  name: 'stripe',
  display_name: 'Stripe',
  status,
})

describe('isProviderEnabled', () => {
  it('excludes a provider explicitly disabled (status: false)', () => {
    expect(isProviderEnabled(provider(false))).toBe(false)
  })

  it('includes an enabled provider (status: true)', () => {
    expect(isProviderEnabled(provider(true))).toBe(true)
  })

  it('includes a provider with no status field at all (undefined)', () => {
    expect(isProviderEnabled(provider(undefined))).toBe(true)
  })
})
