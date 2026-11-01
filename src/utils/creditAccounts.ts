/**
 * The PG Required answer shown on a credit account card.
 *
 * The value is free text entered per account, so the same answer arrived as
 * "Typically required", "Typically Required", "No" or "Not Required" (BUG-084).
 * The recognised answers collapse to one wording each; anything more specific
 * (a condition, a threshold) is kept as written rather than lost.
 */
export const pgRequiredLabel = (value: string | null | undefined): string => {
  const text = (value ?? '').trim()
  const normalized = text.toLowerCase()

  if (['', 'no', 'none', 'n/a', 'na', 'not required', 'false'].includes(normalized)) {
    return 'Not Required'
  }

  if (['typically required', 'usually required', 'typically', 'usually'].includes(normalized)) {
    return 'Typically Required'
  }

  if (['yes', 'required', 'true'].includes(normalized)) {
    return 'Required'
  }

  return text
}
