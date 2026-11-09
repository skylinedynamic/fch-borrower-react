# BUG-043: pre-flight checklist names the missing business fields

**Date:** 2026-11-03

## Problem
On Capital Access › play › Pre-Flight Checklist (`/credit-card-stacking/:id/pre-flight`), "Business Information" showed only a Missing badge. The borrower could not tell which field to fill in. QA's case was an empty Business Email.

## Solution
- **API:** the item now follows the profile's business rule and sends `missing_fields`. See fch-api `docs/handoff/2026-11-03-bug-043-pre-flight-business-info-rule.md`.
- **Under the item:** a line such as "Missing: Business Email, ZIP Code", with a **Complete in Profile** link to Profile › Business Details (`/profile?tab=1`).
- **Shared label helper:** field keys become labels through `formatFieldName`, which moved out of `ProfileCompleteCheckModal` into a shared util. The checklist and the profile modal therefore word fields the same way.

## Files changed
- `src/utils/fieldNames.ts`: `formatFieldName`, new; moved from the modal.
- `src/components/ProfileCompleteCheckModal/ProfileCompleteCheckModal.tsx`: uses the shared helper.
- `src/config/profileRoutes.ts`: `PROFILE_BUSINESS_DETAILS_ROUTE`.
- `src/modules/capital-access/types.ts`: `ChecklistItem`, with `missing_fields`.
- `src/modules/capital-access/services.ts`: keeps `missing_fields` when mapping.
- `src/pages/capital-access/PreFlightChecklist.tsx`: the missing fields and the link.
- `assets/css/custom.css`: `.ca-checklist-missing`.
- `e2e/sidebar/credit-card-stacking/credit-card-stacking-flow.spec.ts`: any missing hint links to the Business Details tab.

## Testing
- **New:**
  - `tests/pages/capital-access/PreFlightChecklist.test.tsx` (2): shown when missing, hidden when complete.
  - `tests/utils/fieldNames.test.ts` (2).
- **Added:** 1 test in `tests/modules/capital-access/services.test.ts` (`missing_fields` mapping).
- **Red first:** the page and mapping tests failed before the change.
- **Vitest full suite:** 213 files, 1579 tests passed. `npm run typecheck`: clean.
- **E2E:** the assertion was added but not run here, because it needs the local API.

## Open items
- **Link target:** the link always opens Business Details, because Business Information is the only item that sends `missing_fields`.
