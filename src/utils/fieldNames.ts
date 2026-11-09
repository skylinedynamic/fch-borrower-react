/** Field-name words that are acronyms, kept in capitals ("business_ein" → "Business EIN"). */
const ACRONYMS = new Set(['ein', 'ssn', 'dob', 'zip', 'llc'])

/** An API field key as a label: "business_email" → "Business Email". */
export const formatFieldName = (field: string) =>
  field
    .split('_')
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
