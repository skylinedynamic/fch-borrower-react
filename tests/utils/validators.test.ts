import { describe, expect, it } from 'vitest'
import { SSN_INVALID_MESSAGE, ssnError } from '../../src/utils/validators'

/**
 * The client-side copy of the API's App\Rules\Ssn: nine digits, written
 * XXX-XX-XXXX, and never a combination the SSA does not issue. Shared by every
 * form that takes a full SSN so they cannot drift from each other or the API.
 */
describe('ssnError', () => {
  it.each(['123-45-6789', '123456789', '899-99-9999'])('accepts %s', (value) => {
    expect(ssnError(value)).toBeNull()
  })

  it.each([
    ['too short', '123-45-678'],
    ['last four only', '6789'],
    ['empty', ''],
    ['area 000', '000-12-3456'],
    ['area 666', '666-12-3456'],
    ['area 900+', '912-34-5678'],
    ['group 00', '123-00-4567'],
    ['serial 0000', '123-45-0000'],
  ])('refuses %s', (_label, value) => {
    expect(ssnError(value)).toBe(SSN_INVALID_MESSAGE)
  })

  it('says what a valid SSN looks like, as the API does', () => {
    expect(SSN_INVALID_MESSAGE).toBe('Enter a valid 9-digit SSN as XXX-XX-XXXX.')
  })
})
