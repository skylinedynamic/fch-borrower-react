# BUG-049: show the adjusted last installment on Billing Details

**Date:** 2026-11-03

## Problem
The API now bills an installment plan's last installment at balance − monthly × (months − 1), so the plan totals exactly (see fch-api `docs/handoff/2026-11-03-bug-049-final-installment-adjusted.md`). The borrower's Billing Details showed only the monthly amount, so the last bill would look wrong.

## Solution
Billing Details (`/billing-details`) shows **Last Installment** beside "Subscription per Month", both in the subscription section and in the details modal. It appears only when the API sends `subscription.final_installment_amount`, which is null on an even split. A short note explains it: "Your last payment differs by a few cents from the monthly amount so that all payments add up to exactly the plan total."

## Files changed
- `src/modules/billings/types.ts`: `final_installment_amount`.
- `src/config/subscriptionConfig.ts`: `FINAL_INSTALLMENT_NOTE`.
- `src/pages/billing-details/BillingDetails.tsx`: the Last Installment field in both places.

## Testing
- **New:** `tests/pages/billing-details/BillingDetails.finalInstallment.test.tsx` (2): shown when adjusted, hidden on an even split. It failed first.
- **Vitest full suite:** 211 files, 1574 tests passed. `npm run typecheck`: clean.

## Open items
- None.
