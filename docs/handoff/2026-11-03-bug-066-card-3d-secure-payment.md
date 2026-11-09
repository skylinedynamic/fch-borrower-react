# BUG-066: paying an invoice with a 3-D Secure (OTP) card

**Date:** 2026-11-03
**Branch:** bugfix/round-2
**Author:** Awlad Hossain

## Problem
QA (R2-CP-INV-02): a client paying an invoice by card (Invoices › invoice › Pay Now › Stripe) left no payment record when the attempt failed, and the Payments page said "No payments found."

- **Declined card (4000 0000 0000 0002).** Already recorded as Failed since BUG-035 (fch-api, 26-Oct). QA tested a build from before that fix.
- **3-D Secure card (4000 0027 6000 3184).** The modal showed "This card requires verification from your bank, which is not supported yet." Nothing was recorded, and a card whose bank asks for an OTP could not pay at all.

## Solution
The API now supports 3-D Secure (fch-api handoff `2026-11-03-bug-066-card-3d-secure-checkout.md`). The portal:

1. Sends the Stripe payment method to `POST /borrower/process-payment`, as before.
2. If the answer has `requires_action`, runs the bank's challenge with `stripe.handleNextAction({ clientSecret })`. The Pay button reads **"Waiting for your bank to verify..."** meanwhile.
3. However the challenge ended, calls `POST /borrower/process-payment/confirm { payment_id }`. The API reads the result from Stripe, so the browser's view is never trusted on its own:
   - **Succeeded:** the same "Payment completed successfully!" toast and reload as before.
   - **Failed:** an error toast with the reason.
   - **Not answered yet:** an info toast. The backend settles the payment within minutes.

**How it is built:**
- **The flow** lives in a new hook, `src/pages/invoices/hooks/useStripeCardCheckout.ts`, built on new `useProcessPayment` / `useConfirmAuthenticatedPayment` mutations in `modules/invoice/queries.ts`. The component no longer calls the service directly.
- **`PaymentMethodForms.jsx` → `.tsx`.** It now only tokenises the card and shows the outcome.

The failed attempt shows on the Payments page as **Failed**, and an attempt still waiting on the bank as **Pending**. Both already existed in `PAYMENT_STATUS_COLORS`.

## Files changed
- `src/modules/invoice/types.ts`: `ProcessPaymentPayload`, `ProcessPaymentResult`, `ProcessPaymentResponse`.
- `src/modules/invoice/services.ts`: typed `processUnifiedPayment`; new `confirmAuthenticatedPayment`.
- `src/modules/invoice/queries.ts`: `useProcessPayment`, `useConfirmAuthenticatedPayment`.
- `src/pages/invoices/hooks/useStripeCardCheckout.ts` (new): charge → bank challenge → confirm; `CHECKOUT_STAGE` / `CHECKOUT_OUTCOME` constants.
- `src/pages/invoices/components/PaymentMethodForms.jsx` → `PaymentMethodForms.tsx`: uses the hook; typed props; the button label follows the stage.
- `e2e/support/stripe.ts` (new): Stripe test cards, `openPayNowWithCard()`, `answer3dsChallenge()`.
- `e2e/sidebar/invoices/invoice-3ds-payment.spec.ts` (new).
- `docs/e2e/ISSUES.md`: E2E-027 (this fix), E2E-028 (local data: Cash disabled), and the submit-flows table.

## Tests
- **Updated `tests/pages/invoices/components/PaymentMethodForms.test.tsx`.** It now runs through MSW against the real `apiClient` and query client; it used to mock `services.ts`. Only Stripe's SDK is mocked. New 3-D Secure cases:
  - challenge completed;
  - "Waiting for your bank" while the challenge is open;
  - the bank refuses;
  - still pending;
  - Stripe's own error.

  The decline case now uses the API's real 400 shape. The PCI guard is kept.
- **Added `tests/pages/invoices/hooks/useStripeCardCheckout.test.tsx` (6):** plain card, challenge then confirm, stage while authenticating, refusal, pending, first-call decline.
- **Updated `tests/modules/invoice/services.test.ts`:**
  - the hand-off is passed through;
  - `confirmAuthenticatedPayment` posts only `payment_id`;
  - the existing payment test uses the API's real `payment_id` shape (it mocked `data.id`).
- **E2E `e2e/sidebar/invoices/invoice-3ds-payment.spec.ts`** (real fch-api plus the Stripe sandbox):
  - **Fail:** a 400 from confirm, an error toast, the invoice still Unpaid, a Failed row in Payments;
  - **Complete:** the invoice turns Paid.
- **Red first:** 6 component/service tests failed before the code, and the hook tests failed on the missing module.
- **Run:**
  - `npx vitest run tests/modules/invoice tests/pages/invoices`: 53 passed;
  - full `npm test`: 216 files, 1623 tests passed; `npm run typecheck`: clean;
  - E2E `invoice-3ds-payment` (2), `invoice-payment` (4242), `payments` (3): all pass.
  - `card-data-guard`: 2 of 3 fail on local data only (E2E-028).
  - Run seeding specs with `E2E_BACKEND_PATH=../fch-api`.

## Open / follow-up
- **Deploy together with fch-api.** An old portal build would treat the hand-off as a success.
- **E2E-028:** re-enable Cash Payment for partner 1 locally (or seed it) to get `card-data-guard` green again.
