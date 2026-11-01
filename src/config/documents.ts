/**
 * The only document categories a borrower has to upload a document in: the
 * Getting Started walkthrough's documents step is done once each has one, and
 * the Documents page counts these. Every other category is optional (it still
 * takes uploads). The API has no flag for this and matches the same names
 * (BorrowerDocType::REQUIRED_NAMES), so keep the two lists in step.
 */
export const REQUIRED_DOCUMENT_CATEGORIES = [
  "Driver's License",
  'Voided Business Check',
  'EIN / Corporation Docs',
  'Business Bank Statements',
] as const

/**
 * A name folded for comparing: trimmed, lower case, straight apostrophes (the
 * API names it "Driver’s License", with a curly one).
 */
const comparable = (name: string): string => name.trim().toLowerCase().replace(/’/g, "'")

const REQUIRED = new Set(REQUIRED_DOCUMENT_CATEGORIES.map(comparable))

/** Whether a document category needs a document. */
export const isRequiredDocumentCategory = (name: string): boolean => REQUIRED.has(comparable(name))

/** Whether a document category may stay empty (it still takes uploads). */
export const isOptionalDocumentCategory = (name: string): boolean => !isRequiredDocumentCategory(name)
