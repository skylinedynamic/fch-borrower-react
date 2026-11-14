# Invoice window shows the method the invoice was really paid with (BUG-206)

**Date:** 2026-11-11
**Branch:** round-1-run-2-fix

## Problem
QA's BUG-206 was found in the Owner portal: an invoice paid by Bank Transfer showed "Payment Method: Stripe" and a "Card Holder". The client portal's invoice window (`InvoicePreviewModal.jsx`) had the same hard-coded "Stripe" and printed "Card Holder" on every invoice, even an unpaid one. Its notes always said "To be paid by Stripe."

## Solution
The window reads the API's new `payment_method`, `payment_reference` and `is_card_payment` from `GET /borrower/invoice/{id}` (fch-api handoff of the same name):
- **Payment Method:** the real method. "Not paid yet" (`PAYMENT_METHOD_NOT_PAID_LABEL`) when nothing has paid it. "-" for a paid invoice with no record.
- **Reference:** shown when there is one.
- **Payer line:** only on a paid invoice. "Card Holder" for a card payment, "Paid By" otherwise.
- **Notes:** leave out "To be paid by Stripe." when it was paid another way.

## Files changed
- `src/config/invoiceConfig.ts`: `PAYMENT_METHOD_NOT_PAID_LABEL`
- `src/pages/invoices/components/InvoicePreviewModal.jsx`: Payment Details and notes from the API
- `tests/pages/invoices/components/InvoicePreviewModal.test.tsx`: new "payment details" block (3 tests)
- `e2e/sidebar/invoices/invoices.spec.ts`: new live test, View Details on an unpaid invoice

## Testing
- **Vitest:** the Bank Transfer and Not-paid tests failed before the change (2 failed); the card test already passed. All pass now. `tests/pages/invoices`: 9 files, 50 passed. Full run: see the session report.
- `npm run typecheck` clean.
- **Playwright** (local fch-api): `e2e/sidebar/invoices/invoices.spec.ts`, 4 passed, 1 skipped. The new test skips itself when the E2E borrower has no unpaid invoice, which was the case locally.

## Open items
- The new E2E test needs a borrower with an unpaid invoice to run, otherwise it skips. No seeder makes one yet.
- Deploy with the fch-api change.
