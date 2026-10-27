import { describe, expect, it } from 'vitest'
import { pgRequiredLabel } from '../../src/utils/creditAccounts'

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
