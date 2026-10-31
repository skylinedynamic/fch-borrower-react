# BUG-134: a Failed funding option no longer says "High Match" or lists reasons it may qualify

**Date:** 2026-10-28
**Branch:** bugfix/qa-round1-release-v2

## Problem
Funding > Term Loans (`/funding/6`) for a client whose profile is incomplete: the badge said **Failed**, but under it the page said **High Match**, and the "Why You May Qualify" box said "Business profile meets our lending standards", while 7 of 8 underwriting factors were Failed. The client got two opposite answers on one screen.

Causes:
- "High Match" was hard-coded for every Active or Review option, whatever the factors said.
- "Why You May Qualify" listed every Good or Strong factor, even when the option was Failed.

## Solution
In `src/pages/funding/components/FundingDetail.tsx`, when the option is Failed (any factor Failed, Restricted or Weak, the same rule as the badge):
- the match label is not shown;
- the left panel is titled **What to Fix** and lists each failed, restricted or weak factor with its status. The Missing Documents list stays under it.

An option with nothing missing still shows "High Match" and "Why You May Qualify" as before.

## Files changed
- `src/pages/funding/components/FundingDetail.tsx`

## Tests
- Added to `tests/pages/funding/FundingDetail.test.tsx` (Defect: BUG-134): no match label and no qualify reasons when Failed; What to Fix lists the failed or weak factors and the missing documents, and not the Good ones; an eligible option is unchanged.
- Updated: the BUG-026 test now waits with `findAllByText`, because a failed factor is now listed twice (in What to Fix and in Underwriting Factors).
- Fixed a flaky test, `tests/pages/fundapplication/components/steps/FundingRequestStep.test.tsx` ("takes several purposes..."). It failed only under the load of a full run: "Payroll" is also in the unfiltered list, so the test found and clicked it there just before the filtered list replaced it, and the click hit a removed option. It now waits until the list is filtered, then clicks. No app code changed.
- Suites run: `tests/pages/funding`: 45 passed. `npm run typecheck`: 0 errors. `npm run test:coverage`: 173/173 files passed. `npm run build`: OK.
- Merged to `stage` in PR #27, with no conflicts. Stage's redesigned My Applications reads the same `requested_amount` / `preferred_funding_type` / `purpose_of_funds` fields, so it shows the API's BUG-136 values too.

## Open / follow-up
- "High Match" is still a fixed label for every eligible option. The API sends no match level, so Medium or Low Match never shows.
