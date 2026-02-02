/**
 * Partner Type Options Configuration
 *
 * Defines the available partner types with their enrollment fees
 */

export const SUBSCRIPTION_STATUS_TYPES = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DELINQUENT: "Delinquent",
  CANCELED: "Canceled",
};

export interface PartnerTypeOption {
  label: string;
  value: string;
  oneTimeFee?: number;
  monthlyPayment?: number;
  platformFee?: number;
  planFee?: number; // Legacy support
}

export const PARTNER_TYPE_OPTIONS: PartnerTypeOption[] = [];

export const PARTNER_INFORMATION_TYPE_OPTIONS: PartnerTypeOption[] = [];


export const PAYMENT_TYPE_OPTIONS = [
  { label: "One-Time Payment ($5,997)", value: "One-Time Payment" },
  {
    label: "Payment Plan ($797/mo, 11-month plan)",
    value: "Payment Plan (11-month plan)",
  },
];

export const SUBSCRIPTION_STATUS_OPTIONS = [
  {
    label: SUBSCRIPTION_STATUS_TYPES.ACTIVE,
    value: SUBSCRIPTION_STATUS_TYPES.ACTIVE,
  },
  {
    label: SUBSCRIPTION_STATUS_TYPES.SUSPENDED,
    value: SUBSCRIPTION_STATUS_TYPES.SUSPENDED,
  },
  {
    label: SUBSCRIPTION_STATUS_TYPES.DELINQUENT,
    value: SUBSCRIPTION_STATUS_TYPES.DELINQUENT,
  },
  {
    label: SUBSCRIPTION_STATUS_TYPES.CANCELED,
    value: SUBSCRIPTION_STATUS_TYPES.CANCELED,
  },
];
