import { UserSubscription } from './auth';
import { SUBSCRIPTION_STATUS_TYPES, PARTNER_TYPES } from '../../config/partnerTypeOptions';
import { STATUS_PAID } from '../../config/invoiceConfig';

/**
 * Helper: convert string date to midnight Date object, or null
 */
const toDate = (d?: string | null) => {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

/**
 * Determine if a user is restricted from using the platform
 */
export function isSubscriptionRestricted(subscription: UserSubscription | null | undefined): boolean {
    if (!subscription) return false;

    // Hosts are never restricted
    if (subscription.is_host) return false;

    // If client is on a free trial, do not restrict access/menus
    if (subscription.is_free_trail) {
        return false;
    }

    // 1. Check White-Label Partner enrollment fee status
    const partnerType = String(subscription.partner_type).toLowerCase();

    if (
        [
            PARTNER_TYPES.WHITE_LABEL.toLowerCase(),
            PARTNER_TYPES.CERTIFIED.toLowerCase()
        ].includes(partnerType) &&
        !subscription.partner_payment_for_me
    ) {
        return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = toDate(subscription.subscription_end_date);

    const subStatus = String(subscription.subscription_status).toLowerCase().trim();
    const activeStatus = (SUBSCRIPTION_STATUS_TYPES.ACTIVE).toLowerCase().trim();

    if (subStatus && subStatus !== activeStatus) {
        return true;
    }

    // If subscription_end_date is null, no need to lock
    if (!endDate) {
        return false;
    }

    // Lock profile/menu if current date is past subscription_end_date
    if (today > endDate) {
        return true;
    }

    return false;
}

/** Why a restricted borrower's menus are locked - picks the message they are shown. */
export const RESTRICTION_REASON = {
    /** The enrollment is still being set up (not yet paid for, or pending). */
    ACTIVATION: 'activation',
    /** The subscription has expired, been cancelled or run past its end date. */
    INACTIVE: 'inactive',
} as const;

export type RestrictionReason = (typeof RESTRICTION_REASON)[keyof typeof RESTRICTION_REASON];

const ENDED_STATUSES = [SUBSCRIPTION_STATUS_TYPES.EXPIRED, SUBSCRIPTION_STATUS_TYPES.CANCELLED].map((s) => s.toLowerCase());

/**
 * Why the borrower is restricted, or null when they are not (BUG-033).
 */
export function getRestrictionReason(subscription: UserSubscription | null | undefined): RestrictionReason | null {
    if (!subscription || !isSubscriptionRestricted(subscription)) return null;

    const status = String(subscription.subscription_status ?? '').toLowerCase().trim();
    const endDate = toDate(subscription.subscription_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (ENDED_STATUSES.includes(status) || (endDate && today > endDate)) {
        return RESTRICTION_REASON.INACTIVE;
    }

    return RESTRICTION_REASON.ACTIVATION;
}

/**
 * Returns true when the borrower is on the Limited Free Edition (free trial).
 * While on the free trial the following modules must be locked:
 *   Capital Access, Invoices, Payments, Resource Hub, Credit Builder
 */
export function isFreeTrialLocked(subscription: UserSubscription | null | undefined): boolean {
    return !!subscription?.is_free_trail;
}
