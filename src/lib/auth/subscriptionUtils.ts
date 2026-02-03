import { AuthUser } from '../../store/auth/authStore';
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
export function isSubscriptionRestricted(user: AuthUser | null | undefined): boolean {
    if (!user) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextInstallmentDate = toDate(user.next_installment_date);

    const subStatus = String(user.subscription_status).toLowerCase().trim();
    const activeStatus = (SUBSCRIPTION_STATUS_TYPES.ACTIVE || 'Active').toLowerCase().trim();

    if (subStatus && subStatus !== activeStatus) {
        return true;
    }

    if (nextInstallmentDate && nextInstallmentDate < today) {
        return true;
    }

    return false;
}
