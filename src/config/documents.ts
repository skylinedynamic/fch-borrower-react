/**
 * Document categories a borrower can leave empty and still apply for funding.
 * The API has no flag for this; it finds the catch-all category by its name
 * too (BorrowerController), so the names are kept here.
 */
const OPTIONAL_DOCUMENT_CATEGORIES = ['others', 'miscellaneous documents']

/** Whether a document category may stay empty (it still takes uploads). */
export const isOptionalDocumentCategory = (name: string): boolean =>
  OPTIONAL_DOCUMENT_CATEGORIES.includes(name.trim().toLowerCase())
