// How the overview figures on Funding Options read: where a score sits on its
// range, and the FICO band it falls in.

const FICO_MIN = 300
const FICO_MAX = 850

/** FICO's own bands, lowest score in each. */
const FICO_BANDS: { min: number; label: string }[] = [
  { min: 800, label: 'Exceptional' },
  { min: 740, label: 'Very Good' },
  { min: 670, label: 'Good' },
  { min: 580, label: 'Fair' },
  { min: 0, label: 'Poor' },
]

const toNumber = (value: unknown): number | null => {
  const n = Number(value)
  return value === '' || value == null || Number.isNaN(n) ? null : n
}

const clamp = (n: number) => Math.min(1, Math.max(0, n))

/** The readiness score (0-100) as a 0-1 share; nothing to show counts as empty. */
export function readinessRatio(score: unknown): number {
  const n = toNumber(score)
  return n === null ? 0 : clamp(n / 100)
}

/** A FICO score as a 0-1 share of the 300-850 range, or null without a score. */
export function ficoRatio(score: unknown): number | null {
  const n = toNumber(score)
  if (n === null || n <= 0) return null
  return clamp((n - FICO_MIN) / (FICO_MAX - FICO_MIN))
}

/** The FICO band for a score, or null without a score. */
export function ficoBand(score: unknown): string | null {
  const n = toNumber(score)
  if (n === null || n <= 0) return null
  return FICO_BANDS.find((band) => n >= band.min)!.label
}
