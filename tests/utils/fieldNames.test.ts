import { describe, expect, it } from 'vitest'
import { formatFieldName } from '../../src/utils/fieldNames'

describe('formatFieldName', () => {
  it('title-cases each word of a field key', () => {
    expect(formatFieldName('business_email')).toBe('Business Email')
  })

  it('keeps acronyms in capitals', () => {
    expect(formatFieldName('zip_code')).toBe('ZIP Code')
    expect(formatFieldName('business_ein')).toBe('Business EIN')
  })
})
