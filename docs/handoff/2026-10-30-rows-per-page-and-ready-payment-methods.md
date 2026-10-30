# Funding Request rows per page; Billing offers only ready gateways (BUG-149, BUG-151)

2026-10-30

## Problem
- **BUG-149** (`/funding-requests`): the list paged 10 at a time but had no rows-per-page selector. Invoices and Payments offer 10/25/50/100. The `DataTable` was missing `rowsPerPageOptions`; `onPage` already handled a change of rows.
- **BUG-151** (Billing Details > Default Payment Method > Change): the dialog listed every gateway the partner had switched on (`status !== false`), including Stripe with no keys ("Active - Not configured"). A client could make it their default, so auto-charges would go to a gateway that can't take them. The invoice Pay Now dialog (`/payment/get-payment-methods`) already hid it.

## Solution
- **BUG-149:**
  - New `src/config/tableConfig.ts` with `ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]`.
  - Funding Requests now passes it as `rowsPerPageOptions`.
  - Invoices and Payments use the constant instead of their inline copies.
- **BUG-151:**
  - The dialog also requires `can_take_payments === true`. The list API (`PartnerPaymentProviderListResource`) already sent this flag, computed with the same `PaymentSetup::isReady()` rule Pay Now uses.
  - fch-api now also refuses a not-ready gateway as the default (`PaymentProvider::isOfferedBy()`); see the fch-api handoff of the same date.
  - Not changed: `/common/partner-payment-providers` is also the partner's Settings > Payment Integration list, so it must keep listing gateways that aren't set up.
  - Follow-up: when no gateway can take payments, the dialog used to show "Available Payment Gateways" over an empty grid, with no reason and no Save. Now it says "No payment method is available right now. Please contact support to set up a payment method.", as Pay Now does. This matters more now, because a partner whose only gateway was keyless Stripe now has none to offer.

## Files changed
- `src/config/tableConfig.ts`: new, `ROWS_PER_PAGE_OPTIONS`.
- `src/pages/funding-requests/FundingRequestList.tsx`: `rowsPerPageOptions`.
- `src/pages/invoices/components/InvoiceTable.jsx`, `src/pages/payments/components/PaymentTable.jsx`: use the constant.
- `src/pages/billing-details/BillingDetails.tsx`: provider filter also needs `can_take_payments`.
- `src/modules/billings/services.ts`: `PaymentProviderItem.can_take_payments`.

## Testing
- `tests/pages/funding-requests/FundingRequestList.test.tsx`: new test. The selector offers 10/25/50/100, and choosing 25 asks the API for `per_page: 25`. Seen failing without the fix.
- `tests/pages/billing-details/ChangePaymentMethodModal.test.tsx`: new BUG-151 test (keyless Stripe left out), seen failing first. Existing fixtures gained `can_take_payments`, as the API sends it.
- `e2e/sidebar/funding-request/funding-request.spec.ts`: new test for the rows-per-page selector against the local API.
- Empty-state follow-up:
  - `ChangePaymentMethodModal.test.tsx` gained "says no payment method is available when none can take payments", seen failing first.
  - `e2e/sidebar/billing-details/billing-details.spec.ts` gained the same check, with only the provider list answered.
  - Results: billing E2E 4/4 passed, full Vitest suite 186 files / 1380 passed, `npm run typecheck` passes.
- Results:
  - `npm run typecheck` passes.
  - Full Vitest suite: 186 files, 1379 passed (before the last test was added; the funding-request file is 10/10 since).
  - Playwright (billing-details, funding-request, invoices, payments): 17 passed, 2 failed. The 2 failures are in `invoices/card-data-guard.spec.ts`. They are local data, not this change: the same 2 fail with the fch-api change stashed, and the Pay Now code is untouched. Logged as E2E-024 in `docs/e2e/ISSUES.md`.
  - The run needs `E2E_BACKEND_PATH=../fch-api` on this machine.

## Open items
- E2E-024: switch on Cash Payment for the local E2E partner (or seed it), and make `e2e/support/backend.ts` find `../fch-api`.
- My Applications and Pre Qualification have no paginator at all (noted by QA in BUG-149, not reported as a bug).
