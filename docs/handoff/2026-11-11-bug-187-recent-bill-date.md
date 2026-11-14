# BUG-187: Current / Recent Bill card shows the invoice's own date

**Date:** 2026-11-11
**Branch:** round-1-run-2-fix
**Author:** Awlad Hossain

## Problem
On Billing Details › CURRENT / RECENT BILL, the card's date could be one day later than the invoice it links to. For a viewer ahead of UTC (Dhaka, UTC+6), an invoice made in the UTC evening showed the next day. QA reported this as BUG-187 on the partner's My Subscription screen. The borrower card had the same cause.

## Solution
The fix is in `fch-api`: `recent_bill.created_at` now comes from `toDateOnly()` instead of `toTimezone()`. See `fch-api/docs/handoff/2026-11-11-bug-187-recent-bill-date.md`. No portal code changed. The card renders the API string as it is, and the new tests pin that.

## Files changed
- `tests/pages/billing-details/BillingDetails.finalInstallment.test.tsx`: new test. The card shows `Date: 2026-10-20` exactly as the API sends it.
- `e2e/sidebar/billing-details/billing-details-recent-bill-date.spec.ts`: new read-only spec against the local backend, with the browser in `Asia/Dhaka`. The card date must equal the "Invoice Date" on the invoice it links to.

## Tests
- `npx vitest run tests/pages/billing-details`: 21 passed (5 files).
- `npm run typecheck`: clean.
- `npx playwright test e2e/sidebar/billing-details/billing-details-recent-bill-date.spec.ts e2e/sidebar/billing-details/billing-details.spec.ts`: 6 passed, setup included.

## Open / follow-up
- The E2E spec only exercises the timezone edge when the E2E borrower's latest invoice was made after 18:00 UTC. Otherwise it still checks that the card and the invoice agree. The deterministic red/green proof is the `fch-api` feature test.
