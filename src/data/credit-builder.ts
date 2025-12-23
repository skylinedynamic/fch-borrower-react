export const CREDIT_BUILDER_STATUS = {
  COMPLETED: 'completed',
  PROCESSING: 'processing',
  PENDING: 'pending',
} as const

export type CreditBuilderStatus = typeof CREDIT_BUILDER_STATUS[keyof typeof CREDIT_BUILDER_STATUS]
