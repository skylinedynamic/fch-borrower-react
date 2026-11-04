const filled = (value: unknown): boolean =>
  value !== null && value !== undefined && String(value).trim() !== ''

const BUSINESS_FIELDS = ['business_name', 'industry_type', 'business_structure']
const FUNDING_FIELDS = [
  'funding_requested_amount',
  'funding_urgency',
  'purpose_of_funding',
  'personal_credit_score',
  'estimated_business_credit_score',
]

/**
 * Where a pre-qualification draft picks up: the first step not saved yet,
 * or Review when all three are. A borrower who left after step 3 came back
 * to Personal Info and had to page through again (R2 BUG-026).
 *
 * A draft exists (it has an id) only once Personal Info was saved; without
 * one the wizard starts at the beginning, whatever the profile pre-fills.
 */
export function resumeStepFor(data: Record<string, unknown> | null | undefined): number {
  if (!data?.id) return 0
  if (!BUSINESS_FIELDS.every((field) => filled(data[field]))) return 1
  if (!FUNDING_FIELDS.every((field) => filled(data[field]))) return 2
  return 3
}
