# Invoice payment: message when no method can take a payment

**Date:** 2026-10-20
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
When a partner's Stripe was switched on but its keys weren't set up, the invoice payment modal showed "Initializing secure payment gateway..." forever. The API sent Stripe with no publishable key, and the card form waited for a Stripe.js that never loaded.

## Solution
- The fix is in fch-api (same date): `GET /payment/get-payment-methods` now lists only the methods that can take a payment. A Stripe without usable keys, or a Bank Transfer without a bank account, is left out, and the partner sees why on their Settings page.
- In the portal, the message for an empty list now says what it means for the borrower: "Online payment isn't available for this invoice right now. Please contact support to arrange payment." It used to say "No active payment providers are available."

## Files changed
- `src/pages/invoices/components/PaymentProviderSelector.jsx`: the empty-list message.

## Tests
- Updated `tests/pages/invoices/components/PaymentProviderSelector.test.tsx` for the new message.
- Added E2E `e2e/sidebar/invoices/invoice-payment-unavailable.spec.ts`, against the real API and session with only the method list answered empty: the modal shows the message and no "Initializing…" spinner. Nothing is paid.
- Results:
  - `npm run typecheck` is clean.
  - `npx vitest run`: 778/778.
  - The new E2E passes.
- `e2e/sidebar/invoices/invoice-payment.spec.ts` (the real Stripe sandbox payment) **fails locally**. This is a data problem, not this change: the host partner's Stripe, Cash and Bank Transfer are all switched off (`status=0`) in the local database, so the list was empty before this change too. The host's sandbox keys pass the new rule, so the spec should pass again once Stripe is switched on.
- To run specs that use the seeders here, set `E2E_BACKEND_PATH=../fch-api`. The default `../fch-backend-api` doesn't exist on this machine and fails with `spawnSync php ENOENT`.

## Open / follow-up
- If Stripe.js itself fails to load (ad-blocker, network), `StripeForm` still waits forever. It needs a `.catch` with a "couldn't load" message; not done here.
