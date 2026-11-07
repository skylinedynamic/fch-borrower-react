export const ENTITY_TYPE_PARTNER = 'Partner';
export const ENTITY_TYPE_BORROWER = 'Borrower';
export const ENTITY_TYPE_USER = 'User';
export const ENTITY_TYPE_EMPLOYEE = 'Employee';
export const DEFAULT_BORROWER_CURRENCY = 'USD';

// Window event fired once refresh-user has stored fresh user data (the API
// flagged the user with is_refresh) - e.g. the agreement sign modal asks again.
export const USER_REFRESHED_EVENT = 'fch:user-refreshed';
