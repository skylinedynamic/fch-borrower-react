import { describe, expect, it } from 'vitest'
import {
  isOptionalDocumentCategory,
  isRequiredDocumentCategory,
  REQUIRED_DOCUMENT_CATEGORIES,
} from '../../src/config/documents'

// The Getting Started walkthrough needs a document in four categories only;
// the API keeps the same list (BorrowerDocType::REQUIRED_NAMES).
describe('required document categories', () => {
  it('are exactly the four', () => {
    expect(REQUIRED_DOCUMENT_CATEGORIES).toEqual([
      "Driver's License",
      'Voided Business Check',
      'EIN / Corporation Docs',
      'Business Bank Statements',
    ])
  })

  it.each(["Driver's License", 'Voided Business Check', 'EIN / Corporation Docs', 'Business Bank Statements'])(
    'treats %s as required',
    (name) => {
      expect(isRequiredDocumentCategory(name)).toBe(true)
      expect(isOptionalDocumentCategory(name)).toBe(false)
    }
  )

  it('matches the curly apostrophe the API names Driver’s License with', () => {
    expect(isRequiredDocumentCategory('Driver’s License')).toBe(true)
  })

  it('ignores case and surrounding spaces', () => {
    expect(isRequiredDocumentCategory('  Voided Business check ')).toBe(true)
  })

  it.each([
    'Equipment Invoice / Quote',
    'A/R Aging Report',
    'Business Plan',
    'Business Tax Returns',
    'Personal Tax Returns',
    'Miscellaneous Documents',
    'Others',
    'Bank Statements',
  ])('treats %s as optional', (name) => {
    expect(isOptionalDocumentCategory(name)).toBe(true)
    expect(isRequiredDocumentCategory(name)).toBe(false)
  })
})
