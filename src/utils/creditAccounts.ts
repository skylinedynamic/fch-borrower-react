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

/** A free-text requirement, or "Not Required" when it is blank. */
export const requirementLabel = (value: string | null | undefined): string => {
  const text = (value ?? '').trim()
  return text === '' ? 'Not Required' : text
}

/**
 * The logo of a credit account: an absolute URL as is, or a stored path under
 * the API's storage. Null when the account has none.
 */
export const creditAccountLogo = (imageUrl: string | null | undefined, apiBaseUrl: string): string | null => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  return `${apiBaseUrl.replace('/api/v1', '/storage/')}${imageUrl}`
}

const MINOR_WORDS = new Set(['of', 'the', 'and', '&'])

/**
 * Shown in place of a missing logo: "Office Depot" -> "OD", "Staples" -> "ST",
 * "Bank of America" -> "BA" (small words are skipped).
 */
export const issuerInitials = (issuer: string | null | undefined): string => {
  const all = (issuer ?? '').trim().split(/\s+/).filter(Boolean)
  const significant = all.filter((w) => !MINOR_WORDS.has(w.toLowerCase()))
  const words = significant.length ? significant : all
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/** The minimum time in business, e.g. "12 mo+"; "No min" when there is none (0 or blank). */
export const timeInBusinessLabel = (months: number | null | undefined): string =>
  months ? `${months} mo+` : 'No min'
