import { describe, expect, it } from 'vitest'
import { formatSSN, unformatSSN, maskSSN, formatEIN, unformatEIN, formatDUNS, unformatDUNS } from './formatters'

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
