# Date of birth: minimum age 18, calendars open 18 years back

**Date:** 2026-11-09
**Branch:** qa-round2-bugfix

## Problem
Every date of birth could be any past date, so a borrower could enter a child's date and only learn it was wrong after saving (or not at all). Empty calendars opened on today's month. A date field with an error showed its message but no red border: react-flatpickr only puts the class on the hidden input, not on the visible one.

## Solution
Platform minimum age 18, the same rule as the API (`fch-backend-api` `App\Rules\DateOfBirth`). Every date-of-birth calendar:
- offers every year up to today;
- opens an empty field 18 years back (Nov 2008 on 9 Nov 2026, Mar 2009 on 15 Mar 2027), and a saved date on that date;
- shows "You must be at least 18 years old to continue." (or "Date of birth cannot be in the future.") and a red border as soon as such a date is picked. The API returns the same message on save, and the API's message is shown when it comes back.

`src/utils/dateOfBirth.ts` (same file as the partner portal): `MINIMUM_AGE`, `latestDateOfBirth()`, `dateOfBirthError()`, `openOnLatestDateOfBirth` (Flatpickr `onOpen`). Worked out from today's date, so the year moves on by itself.

## Files changed
- `src/utils/dateOfBirth.ts` — new
- `src/pages/profile/components/PersonalInfo.tsx` — Personal Info date of birth and the change-request modal
- `src/pages/profile/components/CreditProfileTab.tsx` — credit profile request
- `src/pages/fundapplication/components/steps/OwnershipInformationStep.tsx`, `.../shared/CoBorrowerModal.tsx` — owner and co-borrower
- `assets/css/flatpickr-fix.css` — red border on Flatpickr's visible input when the field is `.is-invalid`
- `assets/css/primereact-calendar.css` — month dropdown no longer wraps ("November"); invalid border for PrimeReact inputs (kept in sync with the partner portal)

## Tests
- Added: `tests/utils/dateOfBirth.test.ts` — cutoff, moves with the year, 29 Feb, messages, onOpen
- Added: `tests/pages/dateOfBirthPickers.test.tsx` — Personal Info, owner, co-borrower open 18 years back; a 2016 date shows the message and `is-invalid`; an adult date shows neither
- Updated: `tests/pages/profile/components/CreditProfileTab.test.tsx` — real Flatpickr opens on the 18-year month; a 2016 date shows the message and marks the field
- Run: `npx vitest run` on profile, fundapplication, utils, components — 674 passed; `tsc --noEmit` clean for the changed files

## Open / follow-up
- Not checked in a real browser: the CSS (month width, red border).
- "Today" is the browser's date; the API uses UTC (backend `docs/test-findings.md` D18).
