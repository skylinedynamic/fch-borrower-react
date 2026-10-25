# walk-through page redesigns on feature/new-walk-through

**Date:** 2026-10-25
**Branch:** `feature/new-walk-through`
**Author:** Awlad Hossain

## Problem
The walkthrough port (`2026-10-25-new-walk-through-port.md`) brought only the walkthrough itself. The redesigned pages built alongside it on `feature/walk-through` were left behind, so `feature/new-walk-through` still showed the old Dashboard, Step-By-Step Guide, Documents, Funding and Credit Card Stacking lock screen.

## Solution
These redesigns are now ported from `feature/walk-through`:
- the Dashboard
- the Credit Guide (Step-By-Step Guide)
- Documents
- Funding
- the Credit Card Stacking lock screen and its guard

Each file was sorted against the branches' common ancestor (`d7d51f8a`):
- **Changed only on walk-through:** taken whole. That's 62 source and test files, plus `config/{capitalAccess,documents,funding}.ts`.
- **Changed only on new-walk-through:** kept. These are `NotificationSkeleton`, `TaskCompleteModal`, `FundingRequestWizard` and `FundingDetail`.
- **Changed on both:** merged.
  - **Credit Card Stacking pages and `RecommendedNextStep`:** new-walk-through's only edit was the `/credit-card-stacking` rename, which walk-through has. Taken whole.
  - **`Documents.tsx`:** walk-through's version already has the walkthrough hold and release, and the completion refresh. Taken whole.
  - **`TierAccordion.tsx`:** walk-through's version, which has Verify All built in. The `VerifyAll.css` split out during the first port is removed; its rules are back in `CreditGuide.css`.
  - **`FundingCard.tsx`:** walk-through's version, with new-walk-through's "Funding Request" wording re-applied.
  - **Dashboard:** `Dashboard.jsx` is replaced by walk-through's `Dashboard.tsx` and its components, adapted to new-walk-through's API:
    - Approved requests come from `useActiveFundingRequests()` (`/borrower/active-funding-requests`). The dashboard response no longer carries them.
    - The top cards show the API's `total_*_amount_formatted` values ($37.2M, $45,000) instead of formatting them in the browser.
    - `useDashboard` re-checks on every visit (`refetchOnMount: 'always'`), as on walk-through, so new meetings and invoices show up.
- **`CapitalAccessGuard`:** now reads `credit_card_stacking.unlocked` from the profile completion API. It shows the locked or overview skeleton while loading, remembered per user in `creditCardStackingHint.ts`.

### Calmer dashboard, after review
The redesigned dashboard was too colourful.
- The hero banner is kept exactly as designed.
- Below it, everything moves to the portal's navy on white:
  - the KPI tiles are white cards with a navy top edge and dark figures
  - the card icons are navy on a light tint
  - the approved-request banner, tier badge, "Tasks Under Review" box and meeting date tiles are navy and white
  - the "Need Help?" strip is a white card
- Colour stays only where it means something: the red pending-invoice warning, the red-to-green score gauge and the invoice status edges.
- The unused bright palette variables are removed.
- The support button now reads **Make an Appointment** and opens `/appointment`.

Second review:
- **"Need Help?" strip:** colourful again (violet-to-blue gradient).
- **Credit Score and Current Tier Status** are two cards with a 16px gap, no longer two halves of one card.
- **Approved-funding banner** under the topbar (`GlobalFundingBanner`, on every page) was a pale Bootstrap `alert-success` strip that went unnoticed. It's now `GlobalFundingBanner.tsx` (from `.jsx`) with its own `GlobalFundingBanner.css`. A first, strong green version was too loud, with oversized text, so it is now:
  - one compact line on a light mint tint, with dark green text
  - a solid green trophy icon and a solid green "Start Funding Application" button
  - same wording, `role="alert"`, position and spacer as before
- **"Ready to Process" card:** the same light mint tint, with a green left edge, a solid green icon, dark text, white fact tiles and the navy button.
- **Last pass:**
  - Neither the banner nor the card has a coloured outer border; the card keeps only its 4px green left edge.
  - The banner is a little taller (12px padding) and a slightly deeper mint.
  - The card's Prev / Next buttons, which had faded into the tint, are solid green with white text.

### Dashboard polish after review
- **Even gaps:** one `--db-gap` (16px) for every gap across and down. The portal's `custom.min.css` cuts every Bootstrap row's gutter to 30% (about 10px), so `.db-page .row` sets its own.
- **Meetings and invoices scroll:** both lists have a fixed height and scroll, so a long list doesn't stretch the row. The API sends at most 5 of each.
- **Invoices match the meetings list:** compact rows in the same framed list, with the number over "$amount · date" and the status on the right. No coloured edge or fill, and a **View All Invoices** button.
- **Buttons at the foot:** "Schedule Meeting" and "View All Invoices" sit at the bottom of their cards and line up. "Schedule Meeting" moved out of the centred empty state.
- **Clickable rows:**
  - an invoice row opens `/invoices/:id`
  - a Recent Funding Applications row opens `/my-applications/funding/:id`
  - a Pre-Qualification row opens the same details modal as My Applications
  - Each row's first cell is a real link or button stretched over the row (Bootstrap `.stretched-link`), so it works with a keyboard and screen reader too.
- **Total Est. Access** shows like the top cards ($920K, $4.53M), from fch-api's new `estimated_total_access_compact`. That field uses the same `formatCompactCurrency`, which now also shortens thousands; see fch-api's `2026-10-25-compact-currency-thousands.md`.

### e2e specs brought up to date
Several specs still described the old screens.
- **Dashboard:** they wait for the "Welcome back" heading instead of "Dashboard Overview". The strategy button opens `/credit-card-stacking`, or isn't offered while an invoice is unpaid.
- **Credit Card Stacking:** the specs moved to `e2e/sidebar/credit-card-stacking/` with the new paths, labels and headings. Their paths in `docs/e2e/ISSUES.md` are updated.
- **Documents:** they use the category buttons instead of accordions.
- **Getting Started popup:** it opens by itself once per step per login and covered pages mid-test (it made the funding-card specs fail). `e2e/support/fixtures.ts` now handles it two ways. Its own spec doesn't use these fixtures.
  - Before each spec it reads the borrower's current step from the API and marks it as already shown this session, as the portal does after showing it.
  - If it opens anyway, `page.addLocatorHandler` puts it off ("Later").

## Files changed
- `src/pages/dashboard/*`: `Dashboard.tsx` with its components, mappers and `Dashboard.css` (in the calmer palette); the `.jsx` is removed. `SupportCard` now reads "Make an Appointment".
- `e2e/sidebar/dashboard/*`, `e2e/sidebar/documents/documents.spec.ts`, `e2e/sidebar/credit-card-stacking/*` (moved from `capital-access/`), `e2e/support/fixtures.ts`, `docs/e2e/ISSUES.md`: e2e specs updated for the new screens.
- `src/modules/dashboard/{queries,types}.ts`: `refetchOnMount`, `funding_requests`, `fico_score`, and a nullable `tier`.
- `src/App.jsx`: imports `Dashboard` without the `.jsx` extension.
- `src/components/Layout/GlobalFundingBanner.tsx` and `.css` (replaces the `.jsx`), `src/components/Layout/Layout.jsx`: the noticeable approved-funding banner.
- `src/pages/credit-builder/creditguide/*`: the redesign, `CreditGuide.css` and `TaskStatusAction`; `VerifyAll.css` is removed.
- `src/pages/documents/*`: `Documents.css`, `DocumentCategory`, `DocumentsFundingPrompt` and `useWideScreen`.
- `src/pages/funding/*`: `Funding.css`, `FundingHowItWorks` and `fundingStats`.
- `src/components/CapitalAccess/*`, `src/pages/capital-access/*`, `src/lib/auth/{CapitalAccessGuard,CapitalAccessStrategyGuard,creditCardStackingHint}`: the lock screen and its guard.
- `src/components/Loader/*`: Dashboard, Credit Card Stacking, Funding and tier-task skeletons.
- `src/config/{capitalAccess,documents,funding}.ts`, `src/modules/documents/queries.ts`, `src/utils/shareInFlight.ts`: what the redesigns depend on.

## Tests
- **Taken from walk-through:** the Dashboard, Credit Guide, Documents, Funding and Credit Card Stacking page and component tests, the loader tests, `CapitalAccessGuard` and `CapitalAccessStrategyGuard`, `config/documents`, `modules/documents/queries` and `shareInFlight`.
- **Merged:**
  - `tests/pages/dashboard/Dashboard.test.tsx`: walk-through's test, now serving the approved requests from their own endpoint and expecting the API-formatted amounts ($37.2M). It failed before the dashboard was adapted.
  - `tests/modules/dashboard/queries.test.tsx`: new-walk-through's `useActiveFundingRequests` tests plus walk-through's "re-checks on every visit" test.
  - `TierAccordion.test.tsx`: back to walk-through's original.
- **Run:**
  - `npm run typecheck`: clean.
  - `npm test`: 143 files and 1075 tests, all pass.
  - `npm run build`: passes.
  - Read-only Playwright specs for the Dashboard, Documents, Funding, Credit Card Stacking, Step-By-Step Guide, Getting Started and Complete Your Profile: see the PR or commit message for the result.
- **Checked by hand:** each redesigned page on the dev server with live data.

## Open / follow-up
- Every page logs "Cannot set properties of undefined (setting 'Waves')". It also happens on the login page, so it comes from the legacy ripple library and is not part of this port.
- `e2e/.auth/borrower.json` (the saved e2e login, including a token) is tracked in git, although CLAUDE.md says it is gitignored. It should be untracked and ignored.
- Still only on `feature/walk-through`: the Layout, Header and Sidebar differences that are new-walk-through's own work, sign-up and the fund-application changes.
