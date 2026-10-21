# E2E-017: no raw card data in payments

**Date:** 2026-10-13 · **Branch:** `feature/e2e-portal-sidebar` (borrower), `e2e-missing-tests` (backend) — not committed · **Related:** `docs/e2e/ISSUES.md` E2E-017

## Problem
- `src/pages/invoices/components/PaymentMethodForms.jsx` had `AuthorizeNetForm`, `SquareForm` and `EcryptForm`. Each kept the card number, expiry and CVV in React state and posted them in `payment_token` (for example `{gateway: 'authorize_net', cardNumber, cardCode, …}`).
- The issue was first logged as "the portal sends raw card numbers". That was wrong.
  - **Not wired anywhere:** the forms were not used by any screen in either portal. A guard test already checked for this.
  - **Those providers are manual:** in `InvoicePaymentModal`, choosing Square, Authorize.Net or Ecrypt shows `ManualProcessingNoticeView`. The borrower pays outside the portal and confirms with a reference number, like Cash, and the invoice goes to Processing for an admin to verify.
- **The real exposure:**
  - The dead code was one import away from being used.
  - The same forms exist in `Fch-admin-frontend-react`.
  - `POST /process-payment` **accepted a raw card payload with HTTP 200**.
- **Also found:** the backend drivers for the three gateways are stubs (`charge()` returns a fake success). Their local configurations hold placeholder credentials, so a real tokenised integration cannot be built or tested here.

## Solution
- An earlier attempt hid the three providers. It was **reverted**, because hiding them would remove a working manual payment option (partner 46 uses Square) on the basis of the wrong description above.
- **Backend:** `ProcessPaymentRequest::withValidator()` rejects any `payment_token` whose JSON carries card fields (`cardNumber`, `card_number`, `cardCode`, `card_code`, `cvv`, `cvc`, `expMonth`, `exp_month`, `expYear`, `exp_year`, `expiry`), with 422 and a new message `payment_validation.raw_card_data_not_accepted`. Stripe (`pm_…` token) and the manual methods are unchanged.
- **Frontend:** the three raw-card forms are deleted, along with their `CardField` and formatting helpers. A header comment explains that card entry is Stripe Elements only. The PCI guard now fails if any `src/` file mentions those forms or builds a `cardNumber:`/`cardCode:` payload.

## Files changed
- Backend:
  - `app/Http/Requests/Api/V1/GlobalPayment/ProcessPaymentRequest.php`
  - `lang/en/payment_validation.php`
  - `tests/Feature/Payment/NoRawCardPaymentsTest.php` (new, 3 tests)
- Borrower portal:
  - `src/pages/invoices/components/PaymentMethodForms.jsx` (forms removed)
  - `tests/pages/invoices/components/PaymentMethodForms.test.tsx` (stronger guard, 2 tests)
  - `e2e/sidebar/invoices/card-data-guard.spec.ts` (new, 3 tests)
  - `e2e/sidebar/invoices/invoice-payment.spec.ts` (asserts only a Stripe `pm_` token leaves the browser; longer timeout)
  - `docs/e2e/ISSUES.md`

## Testing
- Backend:
  - `NoRawCardPaymentsTest` 3/3. The raw-card test got 200 before the fix and 422 after.
  - `tests/Feature/Payment` + `tests/Integration/Payment` + `tests/Unit/Payment`: 106/106.
- Borrower:
  - `npx vitest run --maxWorkers=1`: **642/642**. The machine had ~1.7 GB of free RAM, and the default parallel run crashed Node with out-of-memory.
  - E2E `e2e/sidebar/invoices/`: **8/8**. This includes a real Stripe test-card payment and a manual Cash payment that reaches Processing.

## Open items
- Remove the same dead forms from `Fch-admin-frontend-react` (`src/pages/invoices/components/PaymentMethodForms.jsx`). The API already refuses their payload.
- A real Authorize.Net, Square or Ecrypt integration (Accept.js, Web Payments SDK, …) needs each gateway's sandbox credentials and a real driver.
- Local RAM is tight (~1.7 GB free). Close unused apps before running the full E2E or unit suite.

## Final full-suite result (2026-10-14)
- `npx playwright test` (127 tests): **115 passed** in 1.3h; 12 failed.
  - 11 failed with `net::ERR_CONNECTION_REFUSED` at `localhost:4173`: the preview server dropped near the end of the run, under low RAM.
  - 1 failed on a one-off `pageerror: Failed to fetch` during the document upload.
- A rerun of those spec folders (`sidebar/documents`, `sidebar/resource-hub`, `topbar`) gave **32/32 passed**, and the fetch error did not recur.
- **Every one of the 127 tests has passed**, but across two runs, not one uninterrupted run.
- The fixture now records where a page error was thrown (first stack frame), so a repeat names its source.
