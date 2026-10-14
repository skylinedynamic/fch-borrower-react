# E2E tests for the borrower portal (one folder per sidebar menu item)

**Date:** 2026-10-13 · **Branch:** `feature/e2e-portal-sidebar` (branched from `release` @ `9575275`; not committed yet)

## Problem
- The portal had no working E2E suite. All Playwright specs were deleted in `470b60a`, so `npm run test:e2e` ran nothing.
- The old specs had other problems too:
  - They used a seeder email that doesn't exist in the local DB.
  - Their wrong-password test hit the real account, which locks after 5 attempts.
  - The web server served a stale `dist/` build.
- There was no list of issues found by E2E runs, and no rule for writing per-feature handoff notes.

## Solution
- Rebuilt the Playwright suite against the live local backend (`http://127.0.0.1:8000`, borrower `craig-borrower@fourcornerholdings.com`):
  - `e2e/auth.setup.ts` logs in once through the real form and saves the session to `e2e/.auth/borrower.json` (gitignored).
  - Three projects: `setup`, `guest` (`e2e/auth/`) and `chromium` (`e2e/sidebar/**`, reuses the saved session).
  - One folder per sidebar menu item (`e2e/sidebar/<menu>/`), plus `credit-builder/<sub-item>/` for the submenu and `menu/` for the sidebar itself.
- Added a shared fixture (`e2e/support/fixtures.ts`). It fails any test that hits an uncaught page error or a 5xx API response. It also provides helpers:
  - `openFromSidebar` clicks the menu item like a user, then checks the URL and the active highlight.
  - `sidebarLink` matches the exact label, so "Funding" does not also match "Funding Request".
  - `dataRows` skips skeleton rows. While loading, `TableLoader` is itself a PrimeReact table, so clicking an ordinary row locator can hit a placeholder.
- The specs are read-only on purpose: no submit, upload, payment or mark-all-read, because the local DB holds real-looking data.
- Logout logs in on its own, because logging out revokes the token server-side and would sign out every later spec.
- `playwright.config.ts` now builds before `preview`, uses longer timeouts (45s expect / 90s test) because `artisan serve` handles one request at a time, and uses the list + html reporters.
- Issues are logged in `docs/e2e/ISSUES.md` with a status each. `CLAUDE.md` now has a **Handoff notes (required)** section and an **E2E tests** section.

## Files changed
- `playwright.config.ts`: setup/guest/chromium projects, build-before-preview, timeouts, reporters
- `.gitignore`: `e2e/.auth/`
- `CLAUDE.md`: handoff-note rule (file name `YYYY-MM-DD-<title>.md`, required sections) and E2E conventions
- `e2e/support/env.ts`, `e2e/support/fixtures.ts`: config and shared fixture/helpers
- `e2e/auth.setup.ts`, `e2e/auth/login.spec.ts`
- `e2e/sidebar/{menu,dashboard,pre-qualification,funding-request,my-applications,capital-access,invoices,payments,billing-details,documents,resource-hub,appointment,funding,notification,profile,logout}/*.spec.ts`
- `e2e/sidebar/credit-builder/{overview,step-by-step-guide,credit-accounts}/*.spec.ts`
- `docs/e2e/ISSUES.md`: issue tracker and coverage map

## Testing
**First run (same day, before fixes):** `npx playwright test` gave 53 passed, 1 failed, 1 skipped (22.4 min).
- Failed: `sidebar-menu.spec.ts › sidebar logo image actually loads` (E2E-006).
  - Root cause: the branding row in `app_configurations` (partner 1, key `logo_sidebar`) points to `partners/1/1780479400_fch-logo-wide.png`, but that file is not in `storage/app/public/partners/1/`. The local DB came from another environment without its uploaded files. The other branding keys (`favicon`, `logo_document`, `logo_mail`, `logo_mobile`) are missing their files too.
  - Why 403 and not 404: `php artisan serve` finds no static file, so the request falls through to Laravel. There it matches the private `local` disk's `/storage/{path}` route (`'serve' => true`), which requires a signed URL and answers 403 outside production.
  - On the frontend, `<img>` had no `onError` handling, so the brand box was empty.
- Skipped: `resource-hub.spec.ts › a Legal & Registration item opens its content` was a `test.fixme` for E2E-007. Those items have no file or link, so a click only toasted "Resource not available".

**After the fixes (see `2026-10-13-fix-e2e-open-issues.md`): 59 passed, 0 failed, 0 skipped (24.2 min).**
- The logo test was replaced by `brand box shows the tenant logo or, if it fails, the tenant name`. `BrandLogo.tsx` now shows the tenant's `site_name` when the image fails, and never the host logo.
- The fixme was replaced by three passing tests (Legal & Registration, Download Assets, Education & Help → detail page).

## Open items
- All issues E2E-001 to E2E-011 are ✅ Fixed. See `docs/e2e/ISSUES.md`.
- Local data only: re-upload the partner-1 branding images in admin, or copy them into `storage/app/public/partners/1/`, to see the real logo instead of the name fallback.
- The branch was made from `release`. Per `CLAUDE.md`, feature work should branch from `stage`; rebase or recreate before opening a PR.
- Not yet in CI: the suite needs a running backend and a seeded borrower.
