import { describe, expect, it } from 'vitest'

import { validateCreditLimit } from '../../../src/pages/capital-access/StepDetail'

/**
 * What an approved credit limit is allowed to be.
 *
 * It used to be clamped to the step's own estimate - est_limit_min to
 * est_limit_max - so an approval outside the estimated band could not be
 * recorded at all, even when that is what the lender actually approved. The
 * estimate is a projection, not a rule, so it is now shown as guidance beside
 * the field and nothing else: any amount can be entered.
 *
 * What remains is only what makes a figure an amount at all - present, numeric,
 * not negative.
 */
describe('validateCreditLimit', () => {
  it('accepts an amount far above any estimated range', () => {
    expect(validateCreditLimit('5000000')).toBe('')
  })

  it('accepts an amount far below any estimated range', () => {
    expect(validateCreditLimit('1')).toBe('')
  })

  it('accepts zero', () => {
    expect(validateCreditLimit('0')).toBe('')
  })

  it('accepts a decimal amount', () => {
    expect(validateCreditLimit('2500.75')).toBe('')
  })

  it('still requires a value', () => {
    expect(validateCreditLimit('')).toBe('Approved Credit Limit is required.')
  })

  it('still requires a number', () => {
    expect(validateCreditLimit('abc')).toBe('Approved Credit Limit must be a number.')
  })

  it('still refuses a negative amount', () => {
    // Not a limit anyone can be approved for, so this is not part of the cap
    // that was lifted.
    expect(validateCreditLimit('-100')).toBe('Approved Credit Limit cannot be negative.')
  })
})
