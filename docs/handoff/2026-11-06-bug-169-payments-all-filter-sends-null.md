# BUG-169 follow-up: Payments "All Methods" / "All Types" show nothing

**Date:** 2026-11-06

## Problem
After the BUG-169 API fix (the borrower Payments API now applies Method and Type filters), choosing **All Methods** (or All Types) on `/payments` and clicking Filters showed no payments.

Each filter's "All ..." option in `src/config/paymentConfig.ts` has `value: null`. PrimeReact's `Dropdown`, without `optionValue`, returns the **whole option object** when an option's value is empty. So the page sent `payment_from: {label: 'All Methods', value: null}`. The API now validates `payment_from` as a string and `transaction_type` as Debit or Credit, so it answered 422 and the list was empty. Before the API fix, both fields were dropped silently, which is why this went unnoticed. Status and Environment had the same behaviour. Status survived only because the API unwraps an array status, and the API ignores Environment.

## Solution
Added `optionValue="value"` to the four filter Dropdowns (Status, Environment, Method, Type) in `PaymentFilters.jsx`. Choosing "All ..." now sends `null`, and a real option sends its value as before. The fix is in the frontend because the bug is in what the page sends, so the API keeps its strict validation.

Two more follow-ups, the same day:
- **Environment filter:** "Production" still listed sandbox payments, because the API dropped `is_environment`. This was fixed in `fch-api` (see its BUG-169 handoff). No frontend change was needed beyond `optionValue`.
- **Date Range focus ring:** the filter's Date Range input drew the PrimeReact saga-blue focus ring (`box-shadow: 0 0 0 .2rem #a6d5fa`), unlike the plain inputs beside it. `assets/css/primereact-calendar.css` now removes the box-shadow on focus and hover for `.search-box .p-calendar .p-inputtext`. This covers the Payments and Invoices filter bars. The border colour still comes from `border-light`.
- **Commission payout methods in the Method filter:** a commission paid to a client is recorded with the admin payout dialog's method (Card, Cash, Cheque, Paypal, Stripe, Apple Pay, Google Pay). The filter now offers these too: `COMMISSION_PAYMENT_METHODS` in `src/config/paymentConfig.ts` is appended to `PAYMENT_METHOD_OPTIONS`, without a second Stripe. This was done on Payments only; Invoices has no Method filter.

## Files changed
- `src/config/paymentConfig.ts`: `COMMISSION_PAYMENT_METHODS`, added to `PAYMENT_METHOD_OPTIONS`.
- `tests/config/paymentConfig.test.ts` (new): the commission methods are offered, the gateways are kept, and no method is listed twice. Red first, then green.
- `assets/css/primereact-calendar.css`: no focus ring on filter-bar date ranges.
- `src/pages/payments/components/PaymentFilters.jsx`: `optionValue="value"` on the four Dropdowns.
- `tests/pages/payments/components/PaymentFilters.test.tsx`: new tests.
- `e2e/sidebar/payments/payments.spec.ts`: new tests for the All flow, the Environment filter, and the Date Range focus ring.

## Testing
- `PaymentFilters.test.tsx`: 5 tests. "All ..." sends `null` for all four dropdowns, and a real method still sends its value. Red first: 4 failed, each receiving `{label, value: null}`. All pass after the fix.
- E2E `choosing All Methods and All Types lists every payment again`: picks Stripe + Debit, then All Methods + All Types. The request returns 200 and the total matches the unfiltered list.
- E2E `the Environment filter narrows the list`: Production returns only live payments, and Sandbox returns only sandbox payments. Written after the API fix, so it was not seen red.
- E2E `the Date Range filter shows no focus ring`: red first (`rgb(166, 213, 250) 0px 0px 0px 3.2px`), then green.
- `PaymentFilters.test.tsx`: added "offers the commission payout methods, e.g. Cheque".
- E2E `the Method filter offers the commission payout methods`: the options are visible, and choosing Cheque sends `payment_from: 'Cheque'` and gets a 200.
- The Payments spec passes 8/8. `tests/pages/payments` and `tests/config` pass 115/115.
- Full Vitest: 229 files, 1724 tests passed. `npm run typecheck` is clean.

## Open items
- Other pages may use PrimeReact Dropdowns with a `value: null` "All" option and no `optionValue`, and would have the same latent bug. Not audited here.
- `Payments.jsx` still calls `fetchPayments` directly instead of through a module query hook. This existing pattern was not touched here.
