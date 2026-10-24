import { describe, expect, it } from 'vitest'
import {
  formatSSN,
  unformatSSN,
  maskSSN,
  formatEIN,
  unformatEIN,
  formatDUNS,
  unformatDUNS,
  formatPhoneNumber,
  unformatPhoneNumber,
  formatCurrency,
  unformatCurrency,
  formatLast4SSN,
  formatZipCode,
  formatNumber,
  unformatNumber,
  formatSpeedToFunds,
} from '../../src/utils/formatters'

describe('formatSSN', () => {
  it('formats a full 9-digit SSN as ###-##-####', () => {
    expect(formatSSN('123456789')).toBe('123-45-6789')
  })

  it('formats partial input incrementally', () => {
    expect(formatSSN('12')).toBe('12')
    expect(formatSSN('12345')).toBe('123-45')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatSSN('123-45-6789')).toBe('123-45-6789')
    expect(formatSSN('abc123def456ghi789')).toBe('123-45-6789')
  })

  it('truncates input longer than 9 digits', () => {
    expect(formatSSN('1234567890123')).toBe('123-45-6789')
  })

  it('returns empty string for empty input', () => {
    expect(formatSSN('')).toBe('')
  })
})

describe('unformatSSN', () => {
  it('strips hyphens back to raw digits', () => {
    expect(unformatSSN('123-45-6789')).toBe('123456789')
  })

  it('returns empty string for empty input', () => {
    expect(unformatSSN('')).toBe('')
  })
})

describe('maskSSN', () => {
  it('shows only the last 4 digits', () => {
    expect(maskSSN('123456789')).toBe('***-**-6789')
    expect(maskSSN('123-45-6789')).toBe('***-**-6789')
  })

  it('pads with * when fewer than 4 digits are available', () => {
    expect(maskSSN('67')).toBe('***-**-**67')
  })

  it('returns empty string for empty input', () => {
    expect(maskSSN('')).toBe('')
  })
})

describe('formatEIN / unformatEIN', () => {
  it('formats as XX-XXXXXXX', () => {
    expect(formatEIN('123456789')).toBe('12-3456789')
  })

  it('round-trips through unformat', () => {
    expect(unformatEIN(formatEIN('123456789'))).toBe('123456789')
  })
})

describe('formatDUNS / unformatDUNS', () => {
  it('keeps only digits, max 9', () => {
    expect(formatDUNS('12-345-6789')).toBe('123456789')
    expect(unformatDUNS('12-345-6789-extra')).toBe('123456789')
  })
})

describe('formatPhoneNumber / unformatPhoneNumber', () => {
  it('formats as (###) ###-####', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
  })

  it('formats partial input incrementally', () => {
    expect(formatPhoneNumber('123')).toBe('123')
    expect(formatPhoneNumber('1234')).toBe('(123) 4')
  })

  it('round-trips through unformat', () => {
    expect(unformatPhoneNumber(formatPhoneNumber('1234567890'))).toBe('1234567890')
  })

  it('returns empty string for empty input', () => {
    expect(formatPhoneNumber('')).toBe('')
    expect(unformatPhoneNumber('')).toBe('')
  })
})

describe('formatCurrency / unformatCurrency', () => {
  it('adds comma separators to the integer part', () => {
    expect(formatCurrency('1234567')).toBe('1,234,567')
    expect(formatCurrency(1234567)).toBe('1,234,567')
  })

  it('preserves a decimal part', () => {
    expect(formatCurrency('1234.5')).toBe('1,234.5')
  })

  it('handles a leading decimal point', () => {
    expect(formatCurrency('.5')).toBe('0.5')
  })

  it('returns empty string for null/undefined/empty input', () => {
    expect(formatCurrency('')).toBe('')
    expect(formatCurrency(null as unknown as string)).toBe('')
    expect(formatCurrency(undefined as unknown as string)).toBe('')
  })

  it('unformats back to a plain numeric string, keeping one decimal point', () => {
    expect(unformatCurrency('1,234,567.89')).toBe('1234567.89')
    expect(unformatCurrency('1.234.567')).toBe('1.234567')
  })
})

describe('formatLast4SSN', () => {
  it('keeps only digits, max 4', () => {
    expect(formatLast4SSN('a1b2c3d4e5')).toBe('1234')
  })

  it('returns empty string for empty input', () => {
    expect(formatLast4SSN('')).toBe('')
  })
})

describe('formatZipCode', () => {
  it('keeps only digits, max 5', () => {
    expect(formatZipCode('12345-6789')).toBe('12345')
  })

  it('returns empty string for empty input', () => {
    expect(formatZipCode('')).toBe('')
  })
})

describe('formatNumber / unformatNumber', () => {
  it('strips non-digit characters', () => {
    expect(formatNumber('a1b2c3')).toBe('123')
    expect(unformatNumber('a1b2c3')).toBe('123')
  })

  it('returns empty string for empty input', () => {
    expect(formatNumber('')).toBe('')
    expect(unformatNumber('')).toBe('')
  })
})

/**
 * BUG-025 (CP-FUND-07): the funding detail showed "1-5 Days Days". The value
 * is free text that usually carries its own unit ("1-5 Days", "24-72 Hours"),
 * and the page appended " Days" to it anyway.
 */
describe('formatSpeedToFunds', () => {
  it.each([
    ['1-5 Days', '1-5 Days'],
    ['24-72 Hours', '24-72 Hours'],
    ['2 Weeks', '2 Weeks'],
    ['1 - 7 days', '1 - 7 days'],
  ])('keeps a value that has its own unit: %s', (value, expected) => {
    expect(formatSpeedToFunds(value)).toBe(expected)
  })

  it.each([
    ['1-5', '1-5 Days'],
    ['7', '7 Days'],
    [' 3 - 7 ', '3 - 7 Days'],
  ])('adds Days to a bare number or range: %s', (value, expected) => {
    expect(formatSpeedToFunds(value)).toBe(expected)
  })

  it.each([
    ['1-5 Days Days', '1-5 Days'],
    ['24-72 Hours Days', '24-72 Hours'],
  ])('repairs a unit doubled by an earlier save: %s', (value, expected) => {
    expect(formatSpeedToFunds(value)).toBe(expected)
  })

  it('returns the fallback when there is no value', () => {
    expect(formatSpeedToFunds(null)).toBe('—')
    expect(formatSpeedToFunds(undefined)).toBe('—')
    expect(formatSpeedToFunds('  ')).toBe('—')
    expect(formatSpeedToFunds('', '1 - 7 Days')).toBe('1 - 7 Days')
  })
})
