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


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextInstallmentDate = toDate(user.next_installment_date);

    // Diagnostic logging - help find why "Unpaid" isn't locking
    const subStatus = String(user.subscription_status || '').toLowerCase().trim();
    const generalStatus = String(user.status || '').toLowerCase().trim();
    const activeStatus = (SUBSCRIPTION_STATUS_TYPES.ACTIVE || 'Active').toLowerCase().trim();
    
    console.log('--- Lock System Diagnostic ---', {
        userId: user.id || user.entity_id,
        subStatus,
        generalStatus,
        activeStatus,
        nextInstallmentDate: user.next_installment_date,
        today: today.toISOString().split('T')[0],
        isHost: user.is_host
    });

    // 1. Subscription status check: Locked if not "Active"
    // We check BOTH subscription_status and general status
    // If ANY of them indicate the user is not active, we lock.
    
    // Explicit check for known inactive status keywords
    const inactiveKeywords = ['unpaid', 'suspended', 'delinquent', 'canceled', 'inactive'];
    
    if (inactiveKeywords.includes(subStatus) || inactiveKeywords.includes(generalStatus)) {
        console.log(`Result: Locked (Found inactive status: "${subStatus || generalStatus}")`);
        return true;
    }

    // Strict "Active" check: If a status is present but is NOT the active keyword
    if (subStatus && subStatus !== activeStatus) {
        console.log(`Result: Locked (subStatus "${subStatus}" is not "${activeStatus}")`);
        return true;
    }
    
    if (generalStatus && generalStatus !== activeStatus) {
        console.log(`Result: Locked (generalStatus "${generalStatus}" is not "${activeStatus}")`);
        return true;
    }

    // 2. Installment date check: Locked if next_installment_date < today
    if (nextInstallmentDate && nextInstallmentDate < today) {
        console.log('Result: Locked (next_installment_date is past)');
        return true;
    }

    console.log('Result: Not Restricted (Allowed)');
    return false;
}
