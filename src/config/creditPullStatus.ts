/**
 * Where the client's latest credit request stands, as the API reports it.
 *
 * The values mirror CreditAuthorizationConsent::REQUEST_PENDING / REQUEST_COMPLETED
 * in fch-api - a change to one belongs in both.
 */
export const CREDIT_REQUEST_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const

export type CreditRequestStatus = (typeof CREDIT_REQUEST_STATUS)[keyof typeof CREDIT_REQUEST_STATUS]

/** How each status is shown on the Credit Profile tab. */
export const CREDIT_REQUEST_STATUS_DISPLAY: Record<
  CreditRequestStatus,
  { label: string; hint: string; tone: string; icon: string }
> = {
  [CREDIT_REQUEST_STATUS.PENDING]: {
    label: 'Pending',
    hint: 'Waiting for your credit to be pulled',
    tone: 'is-pending',
    icon: 'ri-time-line',
  },
  [CREDIT_REQUEST_STATUS.COMPLETED]: {
    label: 'Completed',
    hint: 'Your credit was pulled',
    tone: 'is-completed',
    icon: 'ri-checkbox-circle-line',
  },
}
