import { unformatSSN } from './formatters'

/**
 * What the API's App\Rules\Ssn enforces, repeated here so a borrower hears about
 * a malformed number while the form is still in front of them rather than as a
 * 422 for a field they cannot easily re-read off a screen.
 *
 * Nine digits is not enough to be an SSN: the SSA never issues area 000, 666 or
 * 900-999, group 00, or serial 0000. Kept in step with App\Rules\Ssn - a change
 * to one belongs in both.
 */
export const SSN_DIGITS = 9
export const SSN_INVALID_MESSAGE = 'Enter a valid 9-digit SSN as XXX-XX-XXXX.'

export function ssnError(value: string): string | null {
  const digits = unformatSSN(value)

  if (digits.length !== SSN_DIGITS) {
    return SSN_INVALID_MESSAGE
  }

  const area = digits.slice(0, 3)
  const group = digits.slice(3, 5)
  const serial = digits.slice(5)

  if (area === '000' || area === '666' || Number(area) >= 900 || group === '00' || serial === '0000') {
    return SSN_INVALID_MESSAGE
  }

  return null
}
