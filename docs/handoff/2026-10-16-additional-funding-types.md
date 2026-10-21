# Additional Funding Types on the funding application's Funding Request step

**Date:** 2026-10-16
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
Step 4 of 8 of the funding application wizard, Funding Request, only asked for one Preferred Funding Type. The embedded form already lets an applicant name the other funding types they would also consider, and the funding application stores them, but neither the borrower nor the partner wizard showed or saved them.

## Solution
An **Additional Funding Types** field right after Preferred Funding Type: a PrimeReact `MultiSelect` with chips, offering every funding type except the preferred one. Changing the preferred type drops it from the chosen additional types, so it is never picked twice. The step sends `additional_funding_types` (an array, empty when none) with its save and prefills it from the API.

Depends on fch-api (same day): `additional_funding_types` on `POST/GET /borrower/funding-application/funding-request` (and the partner's `/common/...` twin). The API refuses the preferred type, duplicates, and anything not on the funding type list. The same field was added to the partner portal (react-fch) wizard, and to its Intake & Review details (Funding Request tab). The application detail page and modal in this portal show it too; fch-api's detail resources give `additional_funding_types` (an empty list when none).

## Files changed
- `src/data/profile.ts` — `additionalFundingTypeOptions(preferred)` and `withoutPreferredFundingType(chosen, preferred)`
- `src/pages/fundapplication/components/steps/FundingRequestStep.tsx` — the field, payload and prefill
- `assets/css/custom.css` — `.additional-funding-types`: 37.5px field, 4px-cornered chips
- `src/pages/fundapplication/FundApplication.tsx` — initial state and prefill of `additionalFundingTypes`
- `src/pages/fundapplication/types.ts` — `additionalFundingTypes` on `FundingRequest`
- `src/modules/funding-application/types.ts` — `additional_funding_types` on the API response
- `src/pages/myapplication/FundingApplicationDetailPage.tsx` — Additional Funding Types after Funding Type (N/A when none)
- `src/pages/myapplication/components/FundingApplicationDetailsModal.tsx` — the same in the modal's Funding Request section
- `src/modules/my-application/types.ts` — `additional_funding_types` on the application

## Tests
- Added: `tests/data/profile.test.ts` — the options leave out the preferred type; a type that becomes preferred is dropped
- Added: `tests/pages/fundapplication/components/steps/FundingRequestStep.test.tsx` — field after Preferred Funding Type, prefill, options exclude the preferred type, payload with and without types (MSW against the real `apiClient`)
- Updated: `tests/pages/myapplication/FundingApplicationDetailPage.test.tsx`, `tests/pages/myapplication/components/FundingApplicationDetailsModal.test.tsx` — the field is shown after the funding type; N/A when none
- E2E: `e2e/sidebar/my-applications/application-detail.spec.ts` — new test: the detail page shows what the API gives
- E2E: `e2e/sidebar/funding-request/fund-application-funding-types.spec.ts` — read-only, against the local API: the API returns the field, Step 4 shows it after Preferred Funding Type, the list leaves out the preferred type. Skips if the suite borrower has not saved steps 1-3.
- Run: `npx vitest run` — 706 passed, 1 failed: `PersonalInfo.test.tsx › asks for the full number when only the last four are on file`, which fails the same way without this change (from commit `cb1a971`). `npm run typecheck` — clean. New E2E — passed.

## Open / follow-up
- The pre-existing `PersonalInfo` SSN test failure above needs looking at separately.
