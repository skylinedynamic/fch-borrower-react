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
    // If user is not loaded/missing, default to NOT restricted to avoid UI flashes/race conditions
    if (!user) return false;

    // Hosts are never restricted
    if (user.is_host === 1) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = toDate(user.subscription_end_date);
    const nextInstallmentDate = toDate(user.next_installment_date);
    const nextPlatformFeeDate = toDate(user.next_platform_fee_date);
    const phase = user.phase;
    const enrollmentType = user.enrollment_type;

    // Subscription inactive → restricted
    // Case-insensitive comparison
    const status = (user.subscription_status || '').toLowerCase();
    const activeStatus = SUBSCRIPTION_STATUS_TYPES.ACTIVE.toLowerCase();
    
    if (status !== activeStatus) {
        return true;
    }

    // If not Fixed enrollment (meaning it's installment based)
    // and we are in enrollment phase, check next installment
    if (enrollmentType !== 'Fixed enrollment') {
        if (phase === 'enrollment') {
            if (nextInstallmentDate && today >= nextInstallmentDate) {
                return true;
            }
        }
    }

    // Subscription ended → platform fee may apply
    if (endDate && today >= endDate) {
        // Platform fee due today or past → restricted
        if (nextPlatformFeeDate && today >= nextPlatformFeeDate) {
            return true;
        }
        // Package ended, platform fee not yet due → ok
        return false;
    }

    // Platform fee phase logic
    if (phase === 'platform_fee') {
        if (nextPlatformFeeDate && today >= nextPlatformFeeDate) {
            return true;
        }
    }

    // Default → not restricted
    return false;
}
