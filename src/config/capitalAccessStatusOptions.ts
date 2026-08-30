export const CAPITAL_ACCESS_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
} as const;

export type CapitalAccessStatus = typeof CAPITAL_ACCESS_STATUS[keyof typeof CAPITAL_ACCESS_STATUS];

export const capitalAccessStatusOptions = [
  { id: CAPITAL_ACCESS_STATUS.PENDING, name: CAPITAL_ACCESS_STATUS.PENDING },
  { id: CAPITAL_ACCESS_STATUS.APPROVED, name: CAPITAL_ACCESS_STATUS.APPROVED },
  { id: CAPITAL_ACCESS_STATUS.DECLINED, name: CAPITAL_ACCESS_STATUS.DECLINED },
];

export const SCORE_CATEGORIES = {
  MODEL_WEIGHT: 'model_weight',
  SUBSCORE_TIER: 'subscore_tier',
  READINESS_BAND: 'readiness_band',
  LATE_PAYMENT_MODIFIER: 'late_payment_modifier',
  TIME: 'time',
} as const;

export const SCORE_MODELS = {
  FUNDING_READINESS: 'funding_readiness',
  APPROVAL_PROBABILITY: 'approval_probability',
  APPROVAL_ODDS: 'approval_odds',
  GENERAL_SETTING: 'general_setting',
} as const;

export const SCORE_FACTORS = {
  FICO: 'fico',
  UTILIZATION: 'utilization',
  TIME_IN_BUSINESS: 'time_in_business',
  REVENUE_STRENGTH: 'revenue_strength',
  TRADELINE_DEPTH: 'tradeline_depth',
  BANKING_RELATIONSHIPS: 'banking_relationships',
  FICO_ABOVE_MINIMUM: 'fico_above_minimum',
  RECENT_INQUIRIES: 'recent_inquiries',
  BANKING_RELATIONSHIP: 'banking_relationship',
  REVENUE_INCOME: 'revenue_income',
} as const;

export const ACCESS_TIME = {
  DAY: 'Day',
  ANYTIME: 'Anytime',
  MORNING: 'Morning',
  MIDDAY: 'Mid Day',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
} as const;

export type AccessTime = typeof ACCESS_TIME[keyof typeof ACCESS_TIME];
