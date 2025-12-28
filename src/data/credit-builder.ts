export const CREDIT_BUILDER_STATUS = {
  VERIFIED: 'verified',
  PROCESSING: 'processing',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const

export type CreditBuilderStatus = typeof CREDIT_BUILDER_STATUS[keyof typeof CREDIT_BUILDER_STATUS]
