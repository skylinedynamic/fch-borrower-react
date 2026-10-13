# Billing: remove the default payment method

**Date:** 2026-10-13
**Branch:** bugfix-awlad
**Author:** Awlad Hossain

## Problem
On Billing, a borrower could change their default payment method but not remove it, so a saved card was always auto-charged. When no default was set:
- the method card fell back to "Stripe / Sandbox Card";
- the Upcoming card claimed "Scheduled Automatic Charge (Stripe)".

## Solution
- **New service.** `removeDefaultPaymentMethod()` in `modules/billings/services.ts` posts to `/borrower/remove-default-payment-method` (fch-api F110).
- **Type change.** `payment_provider` may now be `null`.
- **Remove button.** The Default Payment Method card has a "Remove" button next to "Change", shown only when a default is set.
  - It opens a warning modal: invoices will not be charged automatically and must be paid manually until a default is set again, and payments already made are not affected.
  - On confirm the page reloads.
- **Empty state.** With no default:
  - the method card reads "No default payment method";
  - the Upcoming card says "Not charged automatically - no default payment method" instead of a scheduled Stripe charge.

## Files changed
- `src/modules/billings/services.ts`: `removeDefaultPaymentMethod()`
- `src/modules/billings/types.ts`: `payment_provider` is nullable
- `src/pages/billing-details/BillingDetails.tsx`: Remove button, empty states, confirmation modal

## Tests
- **Added:** `tests/pages/billing-details/BillingDetails.removeDefault.test.tsx`. It renders the real page with MSW and a synchronous Bootstrap modal fake, and checks two cases:
  - remove → warning → one call → "No default payment method";
  - with no default set: no Stripe fallback, no scheduled automatic charge, and no Remove button.
- **Updated:** `tests/modules/billings/services.test.ts`, for the remove route.
- Both failed first, then passed.
- The page test waits up to 5s. One full run timed out on the 1s default, so the wait was raised; two later full runs both passed.
- **E2E:** none. There is no Billing Playwright spec, so the flow is covered at page level.
- **Run:** `npm test` passed (99 files, 604 tests) twice. `npm run typecheck` is clean.

## Open / follow-up
Deploy with fch-api (F110) and react-fch.
