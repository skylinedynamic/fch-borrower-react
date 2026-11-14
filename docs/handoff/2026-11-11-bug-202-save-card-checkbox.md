# BUG-202 follow-up: "Save card as default payment method"

**Date:** 2026-11-11
**Branch:** round-1-run-2-fix
**Author:** Awlad Hossain

## Problem
A card a borrower used to pay an invoice could become their saved card without asking. Every card payment also became the Stripe default that later charges use. See `fch-api/docs/handoff/2026-11-11-bug-202-follow-ups-save-card-and-payer-names.md`.

## Solution
- The card form in the payment modal now has a "Save card as default payment method" checkbox, unticked by default.
- It sends `save_card` with the payment. The API keeps the card only when it is ticked.
- Same component as the admin panel.

## Files changed
- `src/pages/invoices/components/SaveCardCheckbox.tsx` (new).
- `src/pages/invoices/components/PaymentMethodForms.tsx`: checkbox; sends `save_card`.
- `src/modules/invoice/types.ts`: `save_card` on `ProcessPaymentPayload`.
- `docs/e2e/ISSUES.md`: E2E-029.

## Tests
- **Vitest:** `tests/pages/invoices/components/PaymentMethodForms.test.tsx`
  - the payload now carries `save_card: false`
  - +2: the checkbox is unticked by default, and ticked it sends `save_card: true`
  - the new cases failed first, then passed
  - `tests/pages/invoices`: 52 passed
- **Typecheck:** clean.
- **E2E:** `e2e/sidebar/invoices/invoice-payment.spec.ts` now checks the box is unticked and that `save_card: false` is sent.
  - The spec **fails locally** for an unrelated reason: partner 1's Stripe is in production mode, so the test card 4242 cannot be charged (E2E-029).
  - It fails the same way with this change removed.
  - The checkbox showed, unticked, in the failure screenshot.
- **Full suite:** see the session summary.

## Open / follow-up
- **Deploy with fch-api.**
- **E2E-029:** switch partner 1's Stripe back to Sandbox locally, then rerun the spec.
- Not committed.
