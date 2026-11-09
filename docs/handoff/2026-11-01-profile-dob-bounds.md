# Profile: date of birth picker offers 18–120 years old (BUG-005, round 2)

2026-11-01

## Problem
QA round 2 **BUG-005** found that a client's date of birth accepted any date: a 17-year-old and a 106-year-old were both saved. The report was against the Owner portal. The borrower's own Profile › Personal Info had the same gap. Its picker, and the date of birth Change Request picker, only had `maxDate: "today"`, and the API only checked `before:today`.

## Solution
- The API now refuses an age outside 18–120 on the profile and on a date of birth change request. See `fch-api/docs/handoff/2026-11-01-client-dob-and-financials-bounds.md`. The form already shows the API's error under the field.
- Both Flatpickr pickers (the Personal Info field and the Change Request modal) take `minDate`/`maxDate` from `dateOfBirthBounds()`. The year dropdown starts at the earliest allowed year.
- `BORROWER_AGE = { MIN: 18, MAX: 120 }` is in the new `src/config/borrower.ts`. `dateOfBirthBounds()` is in `src/utils/dates.ts` and is the same as the admin's: the latest date is the 18th birthday, and the earliest is the day after the 121st birthday.

## Files changed
- `src/config/borrower.ts`: new, `BORROWER_AGE`.
- `src/utils/dates.ts`: `dateOfBirthBounds()`.
- `src/pages/profile/components/PersonalInfo.tsx`: both DOB pickers bounded. The bounds are memoised.
- `tests/utils/dates.test.ts`: `dateOfBirthBounds` cases.
- `tests/pages/profile/components/PersonalInfo.test.tsx`: the Flatpickr mock records its options; a new case checks the DOB picker's min and max dates.
- `e2e/sidebar/profile/personal-info-dob-bounds.spec.ts`: new. The picker's years run from 120 to 18 years ago. It uses the Change Request picker when the DOB is locked. Writes nothing.

## Testing
- New Vitest cases failed first (no helper, picker options without min/max), then passed.
- Full Vitest: 206 files, 1525/1525 passed. `npm run typecheck` is clean.
- Playwright (chromium, local API): `personal-info-dob-bounds.spec.ts`, `personal-info-format-errors.spec.ts` and `profile-save.spec.ts` passed.

## Open items
- The funding application ownership and co-borrower DOB pickers are unchanged; they were not in the QA report.
