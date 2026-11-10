import { describe, expect, it } from 'vitest'
import { dateOfBirthBounds, formatRelativeTime } from '../../src/utils/dates'
import { BORROWER_AGE } from '../../src/config/borrower'

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-01T12:00:00Z')

  it('returns an empty string for missing or invalid values', () => {
    expect(formatRelativeTime(null, now)).toBe('')
    expect(formatRelativeTime('not a date', now)).toBe('')
  })

  it('says "Just now" for the last minute (and for small clock skew)', () => {
    expect(formatRelativeTime('2026-10-01T11:59:30Z', now)).toBe('Just now')
    expect(formatRelativeTime('2026-10-01T12:00:20Z', now)).toBe('Just now')
  })

  it('uses minutes, hours and days within the last week', () => {
    expect(formatRelativeTime('2026-10-01T11:55:00Z', now)).toBe('5 minutes ago')
    expect(formatRelativeTime('2026-10-01T09:00:00Z', now)).toBe('3 hours ago')
    expect(formatRelativeTime('2026-09-30T12:00:00Z', now)).toBe('yesterday')
    expect(formatRelativeTime('2026-09-27T12:00:00Z', now)).toBe('4 days ago')
  })

  it('shows the date once it is a week or more old', () => {
    expect(formatRelativeTime('2026-09-01T12:00:00Z', now)).toBe('Sep 1, 2026')
  })
})

/**
 * BUG-005 (QA round 2): a date of birth only had to be in the past. The pickers
 * now offer the API's range, 18 to 120 years old.
 */
describe('dateOfBirthBounds', () => {
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  it('allows the 18th birthday as the latest date, and the day after the 121st as the earliest', () => {
    const { minDate, maxDate } = dateOfBirthBounds(new Date(2026, 9, 21))

    expect(ymd(maxDate)).toBe('2008-10-21')
    expect(ymd(minDate)).toBe('1905-10-22')
  })

  it('keeps 29 February inside the month on a non-leap year', () => {
    expect(ymd(dateOfBirthBounds(new Date(2028, 1, 29)).maxDate)).toBe('2010-02-28')
  })

  it('reads the ages from BORROWER_AGE', () => {
    expect(BORROWER_AGE).toEqual({ MIN: 18, MAX: 120 })
  })
})
