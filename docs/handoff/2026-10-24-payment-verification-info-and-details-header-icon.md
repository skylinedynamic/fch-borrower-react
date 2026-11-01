# Payment details — Verification Info shows named fields only (BUG-062), and the details header icon shows

**Date:** 2026-10-24
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
1. **BUG-062** (CP-PAY-09): Payments › payment detail › Verification Info printed every key of the API's `raw_details` — for a card payment the Stripe PaymentIntent, client_secret included. `PaymentDetails.jsx` looped over `Object.entries(rawDetails)`, skipping only a few approval keys, and JSON-printed objects.
2. Payment and Invoice details: the header icon was a dark square with no visible icon. The tile uses `bg-gray-subtle`, defined only in the partner portal's `custom.css`; here the tile fell back to the theme's dark primary, the same colour as the `text-primary` icon.

## Solution
1. The API now sends only readable fields (fch-api `docs/handoff/2026-10-24-borrower-payment-details-no-gateway-internals.md`). The page also prints only the fields it knows, by name — `PAYMENT_VERIFICATION_FIELDS` in `src/config/paymentConfig.ts` (Payment Method, Bank Name, Account Name, Account Number, Transaction Number, Instructions, Error); approval/rejection keep their own blocks. Unknown keys and objects are never printed.
2. `.bg-gray-subtle` (#e8e7e7, as in the partner portal) added to `assets/css/custom.css` — fixes both pages, which share the markup.

## Files changed
- `src/pages/payments/PaymentDetails.jsx` — Verification Info from the named list.
- `src/config/paymentConfig.ts` — `PAYMENT_VERIFICATION_FIELDS`.
- `assets/css/custom.css` — `.bg-gray-subtle`.
- `tests/pages/payments/PaymentDetails.verification.test.tsx` — new, 3 tests.
- `e2e/sidebar/payments/payments.spec.ts` — the details header tile is light gray with its icon; +1 test: the detail response and page carry no gateway internals.

## Tests
- New Vitest: named fields shown with labels; unknown keys (client_secret, customer, charge, metadata) never printed — both failed first; a card payment with nothing to verify has no section. Full suite: 129 files, 822 passed. `npm run typecheck` clean.
- E2E (local API): `e2e/sidebar/payments` 3 passed; `e2e/sidebar/invoices` 7 of 9 — `card-data-guard` "payment methods on offer" and "manual method" failed because the pay modal offered no methods in the local data (left by the no-payment-method spec); not touched by this change.
- Running the invoice specs needs `E2E_BACKEND_PATH=C:\laragon\www\fch-api` here — `e2e/support/backend.ts` defaults to `../fch-backend-api`.

## Open items
- Mark BUG-062 in the QA defect log In Progress, then Fixed after the stage retest.
