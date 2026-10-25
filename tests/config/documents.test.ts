import { describe, expect, it } from 'vitest'
import { isOptionalDocumentCategory } from '../../src/config/documents'

describe('isOptionalDocumentCategory', () => {
  it('treats Others, and Miscellaneous Documents, as optional', () => {
    expect(isOptionalDocumentCategory('Others')).toBe(true)
    expect(isOptionalDocumentCategory('Miscellaneous Documents')).toBe(true)
  })

  it('ignores case and surrounding spaces', () => {
    expect(isOptionalDocumentCategory('  others ')).toBe(true)
  })

  it('treats every other category as required', () => {
    expect(isOptionalDocumentCategory('Bank Statements')).toBe(false)
    expect(isOptionalDocumentCategory('Other Income')).toBe(false)
  })
})
