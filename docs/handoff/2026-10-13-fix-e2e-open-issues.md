# Fix the open E2E issues (E2E-005 to E2E-009, plus E2E-011)

**Date:** 2026-10-13 · **Branch:** `feature/e2e-portal-sidebar` (not committed yet) · **Related:** `docs/e2e/ISSUES.md`, `2026-10-13-e2e-portal-sidebar-tests.md`

## Problem
The first E2E pass left five issues open:
- **E2E-005**: `GET /borrower/funding` took ~12s. That made Funding and Dashboard show skeletons for 30s+ on the single-threaded `artisan serve`.
- **E2E-006**: the sidebar logo area was blank whenever the tenant's logo file failed to load. The local partner logo returns 403, and there was no fallback.
- **E2E-007**: Resource Hub items under Legal & Registration, Download Assets and Education & Help have no file or link. Clicking one only showed a "Resource not available" toast.
- **E2E-008**: the sidebar user dropdown still had theme demo content: "Welcome Anna!", "Balance : $5971.67", and `href="#"` links.
- **E2E-009**: `@import` sat below a `:root {}` block in three stylesheets. Browsers ignore an `@import` in that position, so the fonts never loaded, and `vite build` warned about it.

While checking the build for E2E-009, one more turned up:
- **E2E-011**: `zIndex: 1;` in `custom.css`, which browsers drop.

## Solution
- **E2E-005 (backend, `fch-backend-api`)**:
  - Profiling showed 4,223 queries per request. The same borrower-only EXISTS checks ran 1,659 times each, and every sequence's engine status was re-evaluated about 7 times.
  - Fix: memoize the borrower checks on the `Borrower` instance, memoize `engine_status` per `FundingSequencing` instance, and eager-load `lenderVisibilities.lender`.
  - Result: 206 queries, ~1-3s. The response JSON is the same except the time-based `borrower_value`.
- **E2E-006**: new `BrandLogo.tsx` component. If the image fails to load, it shows the tenant's own `site_name`, never the host logo (that would break the white-label rule in `utils/brandLogo.ts`). It tries the image again when the URL changes. Used in the Sidebar, Header and Auth logos, with matching CSS (`.brand-logo-text`).
- **E2E-007**: an item with no file or link now opens `/resources/:id`. That page already shows "Guidance details coming soon." when there is no content. The real content still has to be added in admin.
- **E2E-008**: the dropdown now shows the real user's name, Profile, Change Password, and a Logout `<button>`. The demo entries are removed.
- **E2E-009 / E2E-011**: moved `@import` to the top of `agreement-builder.css`, `disclosure-modal.css` and `app.css`, and changed `zIndex` to `z-index`. The build no longer warns about either.

## Files changed
**fch-borrower-react**
- `src/components/Layout/BrandLogo.tsx` (new): logo with a fallback to the tenant's name
- `src/components/Layout/Sidebar.jsx`: BrandLogo, plus the real user dropdown
- `src/components/Layout/Header.jsx`, `src/components/Layout/Auth.jsx`: BrandLogo
- `src/pages/resources/ResourceHub.jsx`: items without content open the detail page instead of a toast
- `assets/css/agreement-builder.css`, `disclosure-modal.css`, `app.css`: `@import` moved first
- `assets/css/custom.css`: `.brand-logo-text` styles, `zIndex` changed to `z-index`
- `tests/components/Layout/BrandLogo.test.tsx`, `tests/components/Layout/SidebarBranding.test.tsx` (new)
- `tests/pages/resources/ResourceHub.test.tsx` (3 cases added)
- `tests/config/cssImportOrder.test.ts` (new): `@import` placement and camelCase properties in every project stylesheet
- `e2e/sidebar/menu/sidebar-menu.spec.ts`: logo-or-name check, user dropdown check
- `e2e/sidebar/resource-hub/resource-hub.spec.ts`: 3 detail-page tests replace the `fixme`
- `e2e/sidebar/funding/funding.spec.ts`: API response under 8s
- `docs/e2e/ISSUES.md`: all issues now ✅ Fixed

**fch-backend-api**: see `fch-backend-api/docs/handoff/2026-10-13-borrower-funding-n-plus-one.md`.

## Testing
- Each fix started with a failing test (red), then the change made it pass (green). The CSS test was also checked against the old files to confirm it fails on them.
- Frontend: `npx tsc --noEmit` is clean; `npx vitest run` passed **631/631** (100 files).
- Backend: `BorrowerFundingEngineStatusQueryTest` **4/4**. The full `php artisan test` run gave 1300 passed and 18 failed; all 18 are in `tests/Integration/PreQualification` and fail the same way with these changes stashed, so they were already broken.
- E2E: full `npx playwright test` (local backend): **59 passed, 0 failed, 0 skipped** in 24.2 min. The earlier run had 53 passed, 1 failed (logo) and 1 skipped (Resource Hub fixme).

## Open items
- The local partner logo file `storage/partners/1/1780479400_fch-logo-wide.png` is still missing. Re-upload it in admin to see the image instead of the name.
- Resource Hub Legal, Download Assets and Education items still need real content in admin. The frontend no longer dead-ends on them.
- `z-index: 1` on `.ca-sk-step-row` now actually applies (the Capital Access skeleton). Give it a quick visual check.
- Pre-existing and unrelated: 18 `PreQualification` integration tests fail in the backend.
