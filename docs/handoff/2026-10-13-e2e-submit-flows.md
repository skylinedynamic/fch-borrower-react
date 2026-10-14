# E2E for the submit flows (real API) and the bugs they found

**Date:** 2026-10-13 · **Branch:** `feature/e2e-portal-sidebar` (not committed yet) · **Related:** `docs/e2e/ISSUES.md` (E2E-014 to E2E-018), backend handoff `fch-backend-api/docs/handoff/2026-10-13-stripe-ssn-steplock-fixes.md`

## Problem
The E2E suite only opened the screens that write data; it never submitted them. The owner asked for these flows to be run for real against the E2E borrower (`craig-borrower@fourcornerholdings.com`) and approved:
- writing to that account, including changes that cannot be undone (mark all read, funding request, capital-access step);
- a real OpenAI call on every pre-qualification submit;
- a Stripe sandbox payment with test card 4242 4242 4242 4242, a future expiry and CVC 123.

## Solution
- **10 submit specs**, each in its menu's folder. See the "Submit flows" table in `docs/e2e/ISSUES.md` for each spec's real effect and how it cleans up.
- **Local-only backend seeders**, run through `e2e/support/backend.ts` (`php artisan db:seed`):
  - `E2EUnpaidInvoiceSeeder`: creates a $1 `borrower_fee` invoice, with no subscription side effects.
  - `E2EResetBorrowerPasswordSeeder`: restores the account's password. The original password predates the current strength rules, so the portal's own form cannot set it back.
- `expectOk()` in `e2e/support/fixtures.ts`: reads a failed response's body only on failure. After a success the page navigates away and the body is gone.
- **Bugs found and fixed:**
  - **E2E-014 (backend, security):** partner 1's sandbox Stripe keys were saved swapped, which sent a secret key to the browser.
  - **E2E-015 (backend, PII):** saving Personal Info overwrote the stored full SSN with its last 4 digits.
  - **E2E-016 (backend):** a schedule-locked capital-access step could be submitted straight through the API.
  - **E2E-018 (frontend):** an uncaught `null.style` TypeError from Bootstrap modals being disposed while still closing; fixed in 8 components with a shared helper.
- **Found, not fixed (E2E-017, PCI):** the Authorize.Net, Square and Ecrypt forms send the raw card number to the backend. This needs gateway tokenisation, which is a product/payments decision.

## Files changed (fch-borrower-react)
- `src/utils/bootstrapModal.ts` (new) and `tests/utils/bootstrapModal.test.ts` (new, 5 tests)
- `src/components/GlobalModal/ConfirmationModal.tsx`, `DeleteConfirmModal.tsx`, `src/pages/credit-builder/creditguide/components/TaskCompleteModal.tsx`, `src/pages/fundapplication/components/shared/EditConfirmationModal.tsx`, `src/pages/billing-details/BillingDetails.tsx`, `src/pages/invoices/components/InvoicePaymentModal.jsx`, `InvoicePreviewModal.jsx`, `src/pages/payments/PaymentDetails.jsx`: now use `hideAndDisposeModal()`
- `e2e/support/backend.ts` (new); `e2e/support/fixtures.ts` (adds `expectOk`); `e2e/fixtures/e2e-test-document.pdf` (new)
- New specs:
  - `e2e/topbar/change-password/change-password-submit.spec.ts`
  - `e2e/sidebar/profile/profile-save.spec.ts`
  - `e2e/sidebar/notification/mark-all-read.spec.ts`
  - `e2e/sidebar/documents/document-upload.spec.ts`
  - `e2e/sidebar/appointment/appointment-create.spec.ts`
  - `e2e/sidebar/invoices/invoice-payment.spec.ts`
  - `e2e/sidebar/capital-access/step-submit.spec.ts`
  - `e2e/sidebar/funding-request/fund-application-save.spec.ts`
  - `e2e/sidebar/funding/funding-request-submit.spec.ts`
  - `e2e/sidebar/pre-qualification/prequal-submit.spec.ts`
- `docs/e2e/ISSUES.md` (E2E-014 to E2E-018, the submit-flow table), `CLAUDE.md` (E2E conventions for submit specs and seeders)

## Testing
- Unit tests: `npx tsc --noEmit` is clean; `npx vitest run` gave **641/641** (102 files).
- Each submit spec was run on its own until it passed. The first runs failed on test selectors (dropdowns, toasts, Stripe iframe, file-manager names) and on the real bugs above.
- Full suite (124 tests, local backend): **115 passed** in 51.5 min. The other 9 then passed in a rerun (17/17):
  - 2 were fixed after they failed: step-submit now picks any non-Approved step, and funding-review got a longer timeout.
  - 7 never ran: the Playwright worker process crashed (Windows 0xC0000409) after `playwright.config.ts` was edited mid-run.
- Suite fixes made along the way:
  - The global test timeout is now 180s, because `php artisan serve` handles one request at a time.
  - `openFundApplicationWizard()` also finds an application that is already in progress.
  - The "Edit Submitted Application?" dialog is handled.
  - The approved-funding banner test checks both states.
- **A sleeping PC breaks a run:** one earlier full run had a 1.6h test while the machine slept, and the tests around it timed out.

## Data notes (local DB)
- **Craig's stored SSN is currently only the last 4 digits.** The first profile-save run hit E2E-015 before the fix. The original encrypted value (from the MySQL binlog) is kept in the session scratchpad. Restoring it was blocked by the PII guard, so it needs the owner's go-ahead.
- Craig's `home_address` was restored to `101 Tech Way, Apt 4B` (from the binlog) after a run timed out mid-test.
- Partner 1's sandbox Stripe keys were swapped back into the right fields.
- Craig now has 2 paid $1 E2E invoices, 1+ submitted funding requests, 1+ new pre-qualifications, and Pending capital-access steps from these runs.
- Unrelated rows named "E2E Appointment … host/wl/…" (ids 29–35) come from some other test, not this suite; they were left alone.

## Open items
- E2E-017: tokenise card entry for Authorize.Net, Square and Ecrypt.
- Check stage/production for swapped Stripe keys (E2E-014) and for truncated SSNs (E2E-015).
- `funding-request-submit` uses up one of the 16 funding options per run; it will need data reset eventually.
