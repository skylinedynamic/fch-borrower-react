/**
 * Where the borrower says their application with a credit account's vendor
 * stands. The borrower sets it themselves from the card's Mark As menu.
 *
 * BY DESIGN (BUG-028, R2-CP-CBA-01): any status may be picked from any other,
 * N/A straight to Approved included. The vendor approves the account outside
 * the portal; this is only the borrower's own tracking note, so the portal does
 * not enforce Requested -> Processing -> Approved. Do not add an order here or
 * in fch-api's CreditAccountService::apply().
 */
export const CREDIT_ACCOUNT_STATUS = {
    REQUESTED: 'Requested',
    PROCESSING: 'Processing',
    APPROVED: 'Approved',
} as const;

export type CreditAccountStatus = typeof CREDIT_ACCOUNT_STATUS[keyof typeof CREDIT_ACCOUNT_STATUS];

export const creditAccountStatusOptions: { id: CreditAccountStatus; name: string }[] = [
    { id: CREDIT_ACCOUNT_STATUS.REQUESTED, name: 'Requested' },
    { id: CREDIT_ACCOUNT_STATUS.PROCESSING, name: 'Processing' },
    { id: CREDIT_ACCOUNT_STATUS.APPROVED, name: 'Approved' },
];

/** Shown on a card the borrower has not marked yet. */
export const CREDIT_ACCOUNT_NO_STATUS_LABEL = 'Not applied';

/** The "all" choice of the Category and Issuer filters. */
export const CREDIT_ACCOUNT_ALL_CATEGORIES = 'All Categories';
export const CREDIT_ACCOUNT_ALL_ISSUERS = 'All Issuers';

/** Below this tier the catalogue is locked. */
export const CREDIT_ACCOUNTS_MIN_TIER = 2;
