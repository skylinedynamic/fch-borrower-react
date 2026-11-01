import { describe, expect, it } from 'vitest'
import { eligibilityLabel, hasMissingReadinessFactors } from '../../src/utils/fundingEligibility'

/**
 * BUG-026 (CP-FUND-04): the funding card said "Likely Eligible" while the
 * option's detail page said "Eligible Now", "Manual Review Required" or
 * "Conditional" for the same borrower. Both now take their label from here:
 * the engine's own label, unless the option is locked or underwriting factors
 * are missing.
 */
describe('eligibilityLabel', () => {
  it.each([
    ['Active', 'Eligible Now'],
    ['Warning', 'Conditional'],
    ['Review', 'Manual Review Required'],
    ['Greyed Out', 'Better Fit Later'],
  ])('shows the engine label for %s', (engineStatus, engineStatusLabel) => {
    expect(eligibilityLabel({ engineStatus, engineStatusLabel, hasMissingFactors: false })).toBe(engineStatusLabel)
  })

  it('says Failed while underwriting factors are missing, whatever the engine says', () => {
    expect(eligibilityLabel({ engineStatus: 'Warning', engineStatusLabel: 'Conditional', hasMissingFactors: true })).toBe('Failed')
  })

  it('says Locked for an option with no lenders, even with missing factors', () => {
    expect(eligibilityLabel({ engineStatus: 'Locked', engineStatusLabel: 'Locked', hasMissingFactors: true })).toBe('Locked')
  })

  it('falls back to Eligible Now when the API sends no label', () => {
    expect(eligibilityLabel({ engineStatus: 'Active', engineStatusLabel: undefined, hasMissingFactors: false })).toBe('Eligible Now')
  })
})

describe('hasMissingReadinessFactors', () => {
  it('counts failed, restricted and weak factors, in any case', () => {
    expect(hasMissingReadinessFactors([{ status: 'Good' }, { status: 'Failed' }])).toBe(true)
    expect(hasMissingReadinessFactors([{ status: 'restricted' }])).toBe(true)
    expect(hasMissingReadinessFactors([{ status: 'Weak' }])).toBe(true)
    expect(hasMissingReadinessFactors([{ status: 'Good' }, { status: 'Strong' }, { status: 'Fair' }])).toBe(false)
    expect(hasMissingReadinessFactors([])).toBe(false)
  })
})
