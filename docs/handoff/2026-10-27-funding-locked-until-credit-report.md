# Funding locked until the credit report is uploaded

**Date:** 2026-10-27
**Branch:** feature/new-walk-through
**Author:** Awlad Hossain

## Problem
A borrower could open **Funding** before FCH had uploaded their credit report on the admin side (Admin → client → Credit Profile → save). With no report, every funding criterion reads "Failed". That is the correct reading for no data, but it is misleading, and the borrower should not reach the page at that point.

## Solution
- fch-api reports a new `funding` object on `GET /borrower/profile/completion`: `{ unlocked, credit_profile_submitted }`. `unlocked` uses the same check that shows the borrower their credit score: `Borrower::hasVerifiedCreditScore()`, meaning `credit_profile_updated` is set and a `BorrowerCreditProfile` exists. The admin's save creates both. See fch-api's handoff of the same date.
- New `FundingGuard` (`src/lib/auth/`) wraps `/funding`, `/funding/:id` and `/funding/:id/review`. It follows the `CapitalAccessGuard` pattern: a loader while the status loads, the locked screen until `funding.unlocked` is true, then the page. If the API does not send `funding` at all, Funding stays closed.
- New locked screen `FundingLocked` (`src/pages/funding/components/`, styles in `FundingLocked.css`), built as the Funding Options page waiting to open:
  - The page's own banner (`Funding.css`): breadcrumb, "Funding Options", intro line.
  - A raised panel on the banner's bottom edge, where the overview figures normally sit:
    - Left: an icon in the banner's gradient with, to its right (tops lined up, 16px apart), a badge ("In progress" with a pulsing dot, or "Action needed"), "Funding opens once your credit report is uploaded", one line on what is happening, and a **Fill Credit Profile** button (`/profile?tab=3`) while the credit profile is not in.
    - Right: "Before Funding opens", a vertical timeline: **Submit your credit profile** → **We upload your credit report** → **Funding opens**, each step Done / Next / In progress / To do.
  - Below: a faded, non-interactive preview of four program cards (one on phones), so the borrower can see what opens.
  - 4px radius and the Funding page's own tokens throughout. The panel stacks to one column below 992px. Checked in a real browser at 1600, 1280 and 390px wide.
  - Two earlier versions (a single wide card, then a centred card with a horizontal stepper) were redesigned after review.
  - The steps' label is a `<p>`, not an `h4`: `assets/css/responsive.css` forces every `.page-content h4` to 1rem on phones.
- Banner breadcrumb hover (found in review; affected the real Funding Options page too): `assets/css/custom.css` sets every `.breadcrumb-item a:hover` to the brand colour with `!important`, so "Dashboard" vanished into the navy banner on hover. `Funding.css` now keeps it white (`!important`, scoped to `.funding-page .fp-breadcrumb`). Tests: `tests/pages/funding/FundingBreadcrumbHover.test.ts` pins the rule (fails without the fix); E2E "the banner breadcrumb stays white on hover" in both `funding.spec.ts` and `funding-locked.spec.ts` hovers in a real browser (red before the fix: `rgb(0, 31, 63)`; green after).
- Sidebar: unchanged, with no lock on Funding (decided in review). The menu item opens the page as usual, and the page says what it waits for.
- Funding Requests (`/funding-requests`) is not gated: it lists requests already made.

## Files changed
- `src/lib/auth/FundingGuard.tsx`: new route guard; exported from `src/lib/auth/index.ts`
- `src/pages/funding/components/FundingLocked.tsx` + `FundingLocked.css`: new locked screen with the three-step tracker
- `src/config/profileRoutes.ts`: new `CREDIT_PROFILE_FORM_ROUTE` constant
- `src/modules/profile/services.ts`: `FundingAccess` type on the completion status
- `src/App.jsx`: Funding routes wrapped in `FundingGuard`

## Tests
- Added: `tests/lib/auth/FundingGuard.test.tsx`: all three Funding routes closed while locked; open once unlocked; closed when the API omits `funding`
- Added: `tests/pages/funding/components/FundingLocked.test.tsx`: both messages, the Fill Credit Profile link, the page title, the three steps' states for both cases
- Added: `tests/components/Layout/SidebarFundingLock.test.tsx`: Funding in the menu has no lock, locked or not, and links to `/funding`
- E2E added: `e2e/sidebar/funding/funding-locked.spec.ts` (read-only, against the real API):
  - the e2e borrower, whose report is uploaded, gets Funding with no lock
  - with the real status changed to "locked": the menu shows the lock, the page waits for the report, and no "Failed" or funding list request appears
  - direct `/funding/1` and `/funding/1/review` links are closed too
  - "not submitted" links to the credit profile form
- Run: `tests/pages/funding`, `tests/lib/auth` and `tests/components/Layout`: 154/154. `npm run typecheck` clean. Playwright: `funding-locked`, `funding` and `funding-review` specs 12/12. Two unrelated E2E failures are logged in `docs/e2e/ISSUES.md`: E2E-022 (stale selector in `fund-application-funding-types.spec.ts`) and E2E-023 (`funding-request-submit` timed out waiting for the backend).

## Open / follow-up
- The API itself does not refuse `GET /borrower/funding` before the report is in; only the portal closes the pages. The walkthrough's results choice still reads funding counts from it. Enforce it in fch-api if the data should be withheld, not just hidden.
- Free-trial borrowers land on `/funding` straight after submitting their credit profile (`AFTER_CREDIT_PROFILE_ROUTE.FREE_TRIAL`), so they now see the locked page until the report is uploaded. The same goes for the walkthrough's "Loans & other financing" path.
- Flaky, unrelated: `tests/pages/fundapplication/components/steps/FundingRequestStep.test.tsx` failed once in a full-suite run (a different test each time) and passes 3/3 on its own.
