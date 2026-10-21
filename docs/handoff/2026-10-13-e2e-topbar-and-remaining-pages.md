# E2E for the topbar, the agreement builder and the remaining portal pages

**Date:** 2026-10-13 · **Branch:** `feature/e2e-portal-sidebar` (not committed yet) · **Related:** `docs/e2e/ISSUES.md`, `2026-10-13-e2e-portal-sidebar-tests.md`, `2026-10-13-fix-e2e-open-issues.md`

## Problem
The E2E suite covered the 16 sidebar menu pages and login only. Not covered:
- **Topbar:** hamburger, notification bell, the user menu (Change Password, My Agreement, Logout) and the approved-funding banner.
- **Agreement builder:** the sign modal and the signed-agreement page.
- **Pages not linked from the sidebar:**
  - forgot/reset password and change password
  - the fund application wizard and the funding request wizard
  - the application detail page
  - the capital-access play flow (strategy, overview, pre-flight, roadmap, step, completion)
  - resource detail
  - the 403/404 pages
- **Other plans:** free-trial and expired-subscription borrowers.

Writing these tests turned up two real bugs:
- **E2E-012:** hosts were never exempt from subscription locks, because `is_host` was dropped when storing the subscription.
- **E2E-013:** "My Agreement" led to the 404 page for a borrower flagged as signed but with no stored agreement copy.

## Solution
- **New specs**, sorted by where they are reached from:
  - `e2e/topbar/{menu,change-password,agreement,logout}/`
  - more specs under the matching `e2e/sidebar/<menu>/` folders
  - `e2e/pages/errors/`
  - `e2e/auth/password-reset.spec.ts`
- `playwright.config.ts`: the `chromium` project now also matches `topbar/` and `pages/`.
- **Read-only throughout.** Two flows that would otherwise need DB writes use `page.route` instead:
  - **Agreement sign modal:** `check` and `submit` are mocked, so the real modal, iframe, agree gate and thank-you screen run.
  - **Subscription states:** the real `/borrower/user-details` and `/common/refresh-user` responses are fetched, and only the subscription fields are overridden.
- **E2E-012 fix:** `is_host` is now added to the stored subscription in both `modules/auth/services.ts` (login) and `lib/auth/auth.ts` (`refreshSubscription`), and to the `UserSubscription` type.
- **E2E-013 fix:** `DownloadAgreement.jsx` shows "No signed agreement on file" when the API succeeds with empty HTML. A failed fetch still goes to /not-found.

## Files changed
- `src/modules/auth/services.ts`, `src/lib/auth/auth.ts`, `src/store/auth/authStore.ts`: `is_host` on the subscription
- `src/pages/agreement/DownloadAgreement.jsx`: "not on file" state
- `tests/lib/auth/hostSubscription.test.ts` (new), `tests/pages/agreement/DownloadAgreement.test.tsx` (2 cases added)
- `e2e/topbar/menu/topbar.spec.ts`, `e2e/topbar/change-password/change-password.spec.ts`, `e2e/topbar/agreement/agreement.spec.ts`, `e2e/topbar/logout/logout.spec.ts`
- `e2e/sidebar/menu/subscription-states.spec.ts`, `e2e/sidebar/dashboard/dashboard-widgets.spec.ts`, `e2e/sidebar/funding-request/fund-application.spec.ts`, `e2e/sidebar/my-applications/application-detail.spec.ts`, `e2e/sidebar/capital-access/capital-access-flow.spec.ts`, `e2e/sidebar/funding/funding-review.spec.ts`, `e2e/sidebar/resource-hub/resource-detail.spec.ts`
- `e2e/pages/errors/error-pages.spec.ts`, `e2e/auth/password-reset.spec.ts`
- `playwright.config.ts`, `docs/e2e/ISSUES.md` (E2E-012, E2E-013, coverage map, not-covered list)

## Testing
- Unit tests: `npx tsc --noEmit` is clean; `npx vitest run` gave **636/636** (101 files).
- E2E: full `npx playwright test` (110 tests): see the result line below.
- The first run of the new specs gave 37 passed, 6 failed and 4 skipped. Four failures were wrong selectors in the tests themselves; they were fixed. The other two were E2E-013 and a timing issue on the busy local server.

## Open items
- **Not covered by E2E:** flows that write data — submitting pre-qualification, a funding request or a funding application, a capital-access step, document upload, Stripe payment, appointment create, profile save, password change, mark-all-read. They need a disposable borrower plus Stripe test keys. Each screen is opened and checked read-only.
- **E2E-013 data question:** should `has_sign` without a stored copy re-prompt the borrower to sign?
- Branch from `stage` before opening a PR (currently branched from `release`).
