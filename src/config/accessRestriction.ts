import { RESTRICTION_REASON, type RestrictionReason } from '../lib/auth/subscriptionUtils'
import { NOTIFICATIONS_ROUTE } from './notifications'

/**
 * Where a borrower sees and settles what they owe. Paying always comes first:
 * these stay open to a restricted borrower, and the Complete Your Profile
 * popup leaves them alone (pay first, then finish the profile).
 */
export const PAYMENT_PATHS = ['/invoices', '/payments', '/billing-details']

/**
 * The pages a restricted borrower can still open (BUG-069): what they owe and
 * how to resume, and their own profile. Notifications stay open on every
 * plan: the header bell is always shown.
 */
export const RESTRICTED_ALLOWED_PATHS = ['/dashboard', '/profile', ...PAYMENT_PATHS, NOTIFICATIONS_ROUTE]

/**
 * The modules that are not part of the Limited Free Plan: reached by URL they
 * send the client back to the Dashboard, which says why (R3-BUG-036). Billing
 * Details opened with a "Server Error" before it was listed here (BUG-111).
 */
export const FREE_PLAN_LOCKED_PATHS = [
  '/credit-card-stacking',
  ...PAYMENT_PATHS,
  '/resources',
  '/credit-builder',
]

/** Whether a pathname is one of `paths` or a page under it ("/invoices/42"). */
export const isUnderPath = (pathname: string, paths: readonly string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

/**
 * What a client is told when they open a locked menu or page (BUG-033,
 * R3-BUG-036). Worded for the client: it never says who still has to pay.
 * `showInvoices` offers the Invoices page - not on the free plan, where
 * Invoices is itself locked.
 */
export const RESTRICTION_MESSAGES: Record<RestrictionReason, { icon: string; title: string; message: string; showInvoices: boolean }> = {
  [RESTRICTION_REASON.ACTIVATION]: {
    icon: 'ri-time-line',
    title: 'Your account is being activated',
    message:
      'This section unlocks as soon as your account activation is complete. If you have an unpaid invoice, paying it from Invoices will complete your part; otherwise there is nothing you need to do. Please contact your account manager if you have any questions.',
    showInvoices: true,
  },
  [RESTRICTION_REASON.INACTIVE]: {
    icon: 'ri-lock-2-line',
    title: 'Your subscription is not active',
    message:
      'This section is locked because your subscription is no longer active. You can resume it from Billing Details, or check Invoices for any payment due. Please contact your account manager if you have any questions.',
    showInvoices: true,
  },
  [RESTRICTION_REASON.FREE_PLAN]: {
    icon: 'ri-lock-2-line',
    title: 'Not included in the Limited Free Plan',
    message:
      'This section is not part of the Limited Free Plan. Please contact your account manager to move to a paid plan and unlock it.',
    showInvoices: false,
  },
}
