import { RESTRICTION_REASON, type RestrictionReason } from '../lib/auth/subscriptionUtils'

/**
 * What a restricted borrower is told when they open a locked menu or page
 * (BUG-033). Worded for the borrower: it never says who still has to pay.
 */
export const RESTRICTION_MESSAGES: Record<RestrictionReason, { icon: string; title: string; message: string }> = {
  [RESTRICTION_REASON.ACTIVATION]: {
    icon: 'ri-time-line',
    title: 'Your account is being activated',
    message:
      'This section unlocks as soon as your account activation is complete. If you have an unpaid invoice, paying it from Invoices will complete your part; otherwise there is nothing you need to do. Please contact your account manager if you have any questions.',
  },
  [RESTRICTION_REASON.INACTIVE]: {
    icon: 'ri-lock-2-line',
    title: 'Your subscription is not active',
    message:
      'This section is locked because your subscription is no longer active. Please check Invoices for any payment due, or contact your account manager to reactivate your account.',
  },
}
