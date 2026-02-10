import { UserSubscription } from './auth';
import { SUBSCRIPTION_STATUS_TYPES } from '../../config/partnerTypeOptions';

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextInstallmentDate = toDate(subscription.next_installment_date);

    const subStatus = String(subscription.subscription_status).toLowerCase().trim();
    const activeStatus = (SUBSCRIPTION_STATUS_TYPES.ACTIVE).toLowerCase().trim();

    if (subStatus && subStatus !== activeStatus) {
        return true;
    }

    if (nextInstallmentDate && nextInstallmentDate < today) {
        return true;
    }

    return false;
}
