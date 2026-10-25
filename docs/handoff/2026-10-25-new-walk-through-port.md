# Borrower Getting Started walkthrough on feature/new-walk-through

**Date:** 2026-10-25
**Branch:** `feature/new-walk-through` (borrower-fch and fch-api)
**Author:** Awlad Hossain

## Problem
The borrower Getting Started walkthrough was built on `feature/walk-through`. That branch also holds a lot of unrelated work: the Dashboard, Funding, Documents, Capital Access and Credit Guide redesigns, the profile form messages and `shareInFlight`. Only the walkthrough had to move to `feature/new-walk-through`, without the rest.

The Complete Your Profile modal also had a close button. A borrower could dismiss it and keep using the portal with an incomplete profile.

## Solution
- **Walkthrough port** (`b0c7729`). Only the walkthrough was taken from `feature/walk-through`:
  - the onboarding suggestion in the topbar, with its popup and progress logic
  - the sidebar "go here next" arrow
  - Verify All, the Tier 0 submitted modal and the pointer finger in the Credit Guide
  - going on to the next unfinished profile tab after a save
  - completion invalidation after profile saves, credit profile submit and document upload

  Shared files were edited by hand or with a 3-way patch, so the new branch keeps its own notifications, funding requests and Credit Guide markup.
- **Capital Access → Credit Card Stacking rename.** The rename came with the port. `/capital-access/*` now redirects to `/credit-card-stacking` through `PrefixRedirect`.
- **Complete Your Profile modal.** It is now walk-through's `ProfileCompleteCheckModal.tsx`, which replaces the `.jsx`:
  - It lists only the unfinished sections, with up to 3 missing fields each plus "+N more".
  - The first section is marked "Start here".
  - It reads the shared `useProfileCompletion` query instead of making its own request.
  - It can't be dismissed: there is no close or cancel button, and Escape and backdrop clicks do nothing. Picking a section is the only way out.
- **fch-api** (`d68b897b` on its `feature/new-walk-through`):
  - the `walkthrough_progress` table
  - `OnboardingStepService`
  - the endpoints `POST profile/onboarding/{complete,skip,resume,path}`
  - the walk-through version of `ProfileCompletionService`

## Files changed
- `src/components/Onboarding/*`, `src/modules/onboarding/*`, `src/config/onboardingSteps.ts`, `src/store/onboardingPopupStore.ts`: the walkthrough itself.
- `src/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal.tsx` and `.css`: the new modal, with no close or cancel. The `.jsx` is removed.
- `src/pages/creditguide/components/{TierAccordion,VerifyTasksModal,Tier0SubmittedModal,PointerFinger}.tsx`, `VerifyAll.css`, `taskVerification.ts`: Verify All in the Credit Guide.
- `src/pages/profile/profile.tsx`, `nextProfileTab.ts`, and `components/{PersonalInfo,BusinessDetails,FinancialSupport,CreditProfileTab}.tsx`: go on to the next tab after a save.
- `src/components/Layout/{Header,Sidebar}.jsx`: the topbar suggestion and the sidebar arrow, plus the Credit Card Stacking menu item.
- `src/App.jsx`, `src/components/Common/PrefixRedirect.tsx`, and route strings in pages and guards: the `/credit-card-stacking` rename.
- `src/modules/{profile,funding,credit-builder/guide,capital-access}/*`, `src/lib/query/queryKeys`: completion and funding queries, and an optional `enabled`.
- `src/utils/modalBackdrop.ts`, `src/store/auth` (`clearOnboardingSession` on logout), `src/pages/documents/Documents.tsx`.

## Tests
- **Added:** the walkthrough unit and integration tests:
  - `tests/modules/onboarding/*`
  - `tests/components/Onboarding/*`
  - `tests/pages/profile/nextProfileTab.test.ts`
  - `tests/pages/profile/profile.test.tsx` (13)
  - `tests/utils/modalBackdrop.test.ts`
  - `tests/pages/creditguide/TierAccordion.test.tsx`
- **Updated:**
  - `tests/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal.test.tsx` (7). Covers the redesign, no close or cancel, Escape keeps it open, and one shared request.
  - `SidebarOnboardingArrow.test.tsx` mocks.
  - `ProtectedRoute.test.tsx` (the new path).
- **E2E:**
  - `e2e/topbar/getting-started.spec.ts` (6)
  - `e2e/pages/profile-complete-modal.spec.ts` (2): no ✕, Escape keeps it open, and a section opens its Profile tab.
- **Run:**
  - `npm run typecheck`: clean.
  - `npm test`: 132 files and 953 tests, all pass.
  - The 2 Playwright specs above: 8 pass.
  - fch-api `OnboardingStepTest`: 60 pass.

## Open / follow-up
- Run `php artisan migrate` on fch-api to create the walkthrough tables. It has not been run here.
- Neither branch is pushed yet.
- These were left out on purpose and are still only on `feature/walk-through`:
  - the Dashboard, Funding, Documents, Capital Access and Credit Guide redesigns
  - the profile form messages and fch-api's `ProfileRequiredFieldsTest`
  - `shareInFlight`
