export const ENROLLMENT_TYPE_ONE_TIME = 'One Time Payment';
export const ENROLLMENT_TYPE_INSTALLMENT = 'Installment';

export const SUBSCRIPTION_STATUS_ACTIVE = 'Active';
export const SUBSCRIPTION_STATUS_COMPLETED = 'Completed';
export const SUBSCRIPTION_STATUS_CANCELLED = 'Cancelled';
export const SUBSCRIPTION_STATUS_EXPIRED = 'Expired';
export const SUBSCRIPTION_STATUS_PENDING = 'Pending';

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { label: 'All Status', value: null },
  { label: SUBSCRIPTION_STATUS_ACTIVE, value: SUBSCRIPTION_STATUS_ACTIVE },
  { label: SUBSCRIPTION_STATUS_COMPLETED, value: SUBSCRIPTION_STATUS_COMPLETED },
  { label: SUBSCRIPTION_STATUS_CANCELLED, value: SUBSCRIPTION_STATUS_CANCELLED },
  { label: SUBSCRIPTION_STATUS_EXPIRED, value: SUBSCRIPTION_STATUS_EXPIRED },
  { label: SUBSCRIPTION_STATUS_PENDING, value: SUBSCRIPTION_STATUS_PENDING },
];

export const isOneTimeType = (type?: string, installmentCount?: number): boolean => {
  if (!type && (installmentCount === undefined || installmentCount <= 1)) return true;
  const normalized = (type || '').trim().toLowerCase();
  return (
    normalized === ENROLLMENT_TYPE_ONE_TIME.toLowerCase() ||
    (installmentCount !== undefined && installmentCount <= 1)
  );
};
