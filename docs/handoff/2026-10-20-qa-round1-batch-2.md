# QA round 1 - batch 2 (borrower portal: BUG-026, BUG-027, BUG-036, BUG-009)

**Date:** 2026-10-20
**Branch:** `bugfix/qa-round1-release` (from `release`; first cut from `stage` as `bugfix/qa-round1-batch-2`, moved 2026-10-21 - no file differed between the two) - not committed
**Author:** arafat-invento (with Claude Code)
**API side:** `fch-backend-api/docs/handoff/2026-10-20-qa-round1-batch-2.md`

## Problem
- **BUG-026** Funding: the card said "Likely Eligible" (or "Failed") while the option's detail page said "Eligible Now", "Manual Review Required" or "Conditional".
- **BUG-027** My Applications: an application the borrower had started (On Hold) was missing ("No funding applications found."), and the dashboard count was 0.
- **BUG-036** Pre Qualification: Previous (or the Personal Info tab) on Business Details did nothing - going back first validated and saved the step being left.
- **BUG-009** Funding Requests: QA saw descending sort keep the ascending order. Not reproducible on this build.

## Solution
- `src/utils/fundingEligibility.ts`: one rule for card and detail - Locked, else Failed while underwriting factors are missing, else the engine's own label. The card still shows "Under Review" for a pending request (it is blocked until decided).
- My Applications: the API now lists On Hold; such a row shows "Continue Application" to `/fund-application/{funding_request_id}` instead of the view link (it has nothing to view yet).
- Pre-qualification: going to an earlier step only changes step; typed values stay in state and are saved on the way forward.
- BUG-009: no code change; a test pins asc then desc (request and rendered order).

## Files changed
- `src/utils/fundingEligibility.ts` - new
- `src/pages/funding/components/FundingCard.tsx`, `src/pages/funding/components/FundingDetail.tsx` - use it
- `src/pages/myapplication/components/FundingApplications.tsx` - On Hold row action
- `src/pages/prequalification/hooks/usePreQualificationForm.ts` - backward navigation

## Tests
- Added: `tests/utils/fundingEligibility.test.ts`, `tests/pages/myapplication/components/FundingApplications.test.tsx`
- Added cases: `FundingCard.test.tsx`, `FundingDetail.test.tsx`, `usePreQualificationForm.test.tsx`, `FundingRequestList.test.tsx`
- Updated: `FundingCard.test.tsx` "normal eligibility label" now expects the engine label, not "Likely Eligible"
- Suites run: `npx vitest run`, `tsc --noEmit` - see the report for this branch
- Not run: Playwright e2e - it runs live against the local API and database (no mocked project), and tests must not touch the `.env` database.

## Open / follow-up
- `ENGINE_STATUS_LABELS.LIKELY_ELIGIBLE` is no longer used by the card or detail.
