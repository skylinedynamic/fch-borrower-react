import { describe, expect, it } from 'vitest'
import { PAYMENT_PATHS, RESTRICTED_ALLOWED_PATHS, isUnderPath } from '../../src/config/accessRestriction'

describe('isUnderPath', () => {
  it('matches a listed page and the pages under it', () => {
    expect(isUnderPath('/invoices', PAYMENT_PATHS)).toBe(true)
    expect(isUnderPath('/invoices/42', PAYMENT_PATHS)).toBe(true)
    expect(isUnderPath('/payments/7', PAYMENT_PATHS)).toBe(true)
    expect(isUnderPath('/billing-details', PAYMENT_PATHS)).toBe(true)
  })

  it('does not match a page that only starts with the same letters', () => {
    expect(isUnderPath('/invoices-archive', PAYMENT_PATHS)).toBe(false)
    expect(isUnderPath('/dashboard', PAYMENT_PATHS)).toBe(false)
    expect(isUnderPath('/', PAYMENT_PATHS)).toBe(false)
  })
})

describe('payment pages', () => {
  it('stay open to a restricted borrower', () => {
    for (const path of PAYMENT_PATHS) {
      expect(RESTRICTED_ALLOWED_PATHS).toContain(path)
    }
  })
})
