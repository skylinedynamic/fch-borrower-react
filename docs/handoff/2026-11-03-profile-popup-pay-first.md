# Complete Your Profile popup no longer blocks paying an invoice

**Date:** 2026-11-03
**Branch:** bugfix/round-2
**Author:** Awlad Hossain

## Problem
The Complete Your Profile popup (`ProfileCompleteCheckModal`) opens on every page but Profile when the borrower's profile has gaps, and it cannot be dismissed. It stays hidden only while the subscription is restricted. So a borrower with an **active** subscription, an incomplete profile and an **unpaid invoice** (for example the next installment) could not reach Pay Now: Invoices, the invoice page, Payments and Billing Details were all covered. They could only pay after finishing the profile, or once the invoice went overdue and the subscription became restricted. Seen while testing BUG-066: the popup "sometimes" appeared before invoice payment.

## Solution
Decision (user, 2026-11-03): **pay first, then the profile.**

- New `PAYMENT_PATHS` (`/invoices`, `/payments`, `/billing-details`) in `src/config/accessRestriction.ts`, plus a helper `isUnderPath()`. A page under one of those paths also matches, for example `/invoices/42`. A page that only starts with the same letters, such as `/invoices-archive`, does not.
- `ProfileCompleteCheckModal` stays closed on those pages. On the next page the borrower opens, it comes back exactly as before: it still cannot be dismissed, and it still lists the missing fields.
- `RESTRICTED_ALLOWED_PATHS` is now built from `PAYMENT_PATHS`. Its values are unchanged.

## Files changed
- `src/config/accessRestriction.ts`: `PAYMENT_PATHS`, `isUnderPath()`; `RESTRICTED_ALLOWED_PATHS` uses them.
- `src/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal.tsx`: skips the payment pages.

## Tests
- **Updated `tests/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal.test.tsx`.** The popup stays away on `/invoices`, `/invoices/42`, `/payments`, `/payments/7` and `/billing-details`. It comes back after moving from Invoices to another page, and it still opens on `/invoices-archive`. The 6 new expectations failed before the change.
- **Added `tests/config/accessRestriction.test.ts` (3).** Covers `isUnderPath`, and checks that the payment pages stay open to a restricted borrower.
- **Updated E2E `e2e/pages/profile-complete-modal.spec.ts`.** The existing checks opened `/payments` and `/billing-details`, where the popup no longer appears. They now use `/documents` and `/appointment` (both have confirm dialogs, as the backdrop test needs). New tests:
  - the popup stays away on Invoices, Payments and Billing Details;
  - it comes back after clicking Documents in the sidebar.

  The completion-response wait now starts before `goto()`, to avoid a race. Result: 8 tests, passed twice in a row with `--repeat-each=2`.
- **Run:** full `npx vitest run`: 216 files, 1630 passed. `npm run typecheck`: clean.

## Open / follow-up
- The partner portal has no equivalent popup, so nothing changes there.
