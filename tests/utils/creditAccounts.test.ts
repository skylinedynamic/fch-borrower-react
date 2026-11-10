import { describe, expect, it } from 'vitest'
import { pgRequiredLabel, timeInBusinessLabel } from '../../src/utils/creditAccounts'

/**
 * BUG-084: one card said "Typically required", the next "Typically Required",
 * others "No" or "Not Required". The PG Required value is free text entered per
 * account; the card shows one of three fixed answers instead.
 */
describe('pgRequiredLabel', () => {
  it.each([
    ['Typically required', 'Typically Required'],
    ['Typically Required', 'Typically Required'],
    ['  usually required ', 'Typically Required'],
    ['No', 'Not Required'],
    ['not required', 'Not Required'],
    ['None', 'Not Required'],
    ['N/A', 'Not Required'],
    ['', 'Not Required'],
    [null, 'Not Required'],
    [undefined, 'Not Required'],
    ['Yes', 'Required'],
    ['required', 'Required'],
  ])('%j reads as %s', (raw, expected) => {
    expect(pgRequiredLabel(raw)).toBe(expected)
  })

  it('keeps a specific condition the generic answers would lose', () => {
    expect(pgRequiredLabel('Required above $50k')).toBe('Required above $50k')
  })
})

describe('requirementLabel', () => {
  it('says Not Required for a blank requirement and keeps any other text', async () => {
    const { requirementLabel } = await import('../../src/utils/creditAccounts')
    expect(requirementLabel(null)).toBe('Not Required')
    expect(requirementLabel('   ')).toBe('Not Required')
    expect(requirementLabel(' Manual review ')).toBe('Manual review')
  })
})

describe('creditAccountLogo', () => {
  it('keeps an absolute URL, puts a stored path under the API storage, and gives null when there is none', async () => {
    const { creditAccountLogo } = await import('../../src/utils/creditAccounts')
    expect(creditAccountLogo('https://cdn.example/a.png', 'https://api.example/api/v1')).toBe('https://cdn.example/a.png')
    expect(creditAccountLogo('logos/a.png', 'https://api.example/api/v1')).toBe('https://api.example/storage/logos/a.png')
    expect(creditAccountLogo(null, 'https://api.example/api/v1')).toBeNull()
  })
})

describe('issuerInitials', () => {
  it('takes the first letters of the first two words, or the first two of one word', async () => {
    const { issuerInitials } = await import('../../src/utils/creditAccounts')
    expect(issuerInitials('Office Depot')).toBe('OD')
    expect(issuerInitials('staples')).toBe('ST')
    expect(issuerInitials('Bank of America')).toBe('BA')
    expect(issuerInitials('The Home Depot')).toBe('HD')
    expect(issuerInitials('  ')).toBe('?')
  })
})

describe('timeInBusinessLabel', () => {
  it('shows the months with a plus, or "No min" when there is no minimum, never "0 mo+"', () => {
    expect(timeInBusinessLabel(12)).toBe('12 mo+')
    expect(timeInBusinessLabel(0)).toBe('No min')
    expect(timeInBusinessLabel(null)).toBe('No min')
    expect(timeInBusinessLabel(undefined)).toBe('No min')
  })
})
