# QA round 1 - batch 3 (borrower portal: BUG-025, BUG-037, BUG-009)

**Date:** 2026-10-24
**Branch:** `bugfix/qa-round1-release` - not committed
**Author:** arafat-invento (with Claude Code)
**API side:** `fch-backend-api/docs/handoff/2026-10-24-qa-round1-batch-3.md` (all 14 bugs)

## Problem
- **BUG-025** Funding > option detail: SPEED TO FUNDS "1-5 Days Days". Same in the funding wizard and the request modal ("24-72 Hours" became "24-72 Hours Days").
- **BUG-037** Pre Qualification > Business Details: with no business start date, Time in Business was read-only ("Please set business start date in profile") and Next failed.
- **BUG-009** Funding Requests: APPLICATION STATUS never re-ordered (API fix, F149).

## Solution
- `src/utils/formatters.ts` `formatSpeedToFunds()` - used by `FundingDetail.tsx`, `FundingRequestWizard.tsx` (3 places, incl. the saved `estimated_speed`), `FundingRequestModal.tsx`.
- Pre-qualification: the hook tracks `startDateOnFile`. Without one the step shows a Business Start Date picker (not in the future) and sends `business_start_date`; the API saves it to the profile and works out Time in Business. With one, Time in Business stays read-only with a link to Profile > Business Details. Saving the step also refreshes the profile cache.

## Files changed
- `src/utils/formatters.ts`
- `src/pages/funding/components/FundingDetail.tsx`, `src/pages/funding/FundingRequestWizard.tsx`, `src/pages/funding-requests/FundingRequestModal.tsx`
- `src/modules/pre-qualification/types.ts`, `src/modules/pre-qualification/queries.ts`
- `src/pages/prequalification/hooks/usePreQualificationForm.ts`, `src/pages/prequalification/components/BusinessDetailsStep.tsx`, `src/pages/prequalification/PreQualification.tsx`

## Tests
- Added: `tests/pages/prequalification/hooks/usePreQualificationForm.startDate.test.tsx`, `tests/pages/prequalification/components/BusinessDetailsStep.test.tsx`, `formatSpeedToFunds` cases in `tests/utils/formatters.test.ts`, speed cases in `tests/pages/funding/FundingDetail.test.tsx`
- Suites run: `npx vitest run`, `tsc --noEmit` - see the report for this branch
- Not run: Playwright e2e - it signs in to the live local API and database.

## Open / follow-up
- None beyond the API handoff.
