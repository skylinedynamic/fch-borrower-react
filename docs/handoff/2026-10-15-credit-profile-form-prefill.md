# Credit Profile request form: start from the earlier request, else the profile

**Date:** 2026-10-15 · **Branch:** `bugfix/scrum-182` (uncommitted)

## Problem
Profile → Credit Profile tab. A borrower who had already asked found their earlier request in the form, but one asking for the first time got only name, email and phone (from the login user): address, city, state, ZIP, date of birth and middle name were typed out again although the profile already held them.

## Solution
After the tab has applied the earlier request (if any), the **blank** fields are filled once from the borrower's profile (`GET borrower/profile/personal-info`, via `usePersonalInfo`). Precedence: earlier request > profile > login user.

- Fields filled: first/middle/last name, address, city, state, ZIP, date of birth, phone, email.
- **SSN** follows its own rule from `bugfix/all-bugfix`: a full SSN on the profile (`ssn`) is the default, shown masked; only the last four on file leaves the field empty for the borrower to enter.
- Applied once (`useRef`), so a refetch of the profile never puts back something the borrower cleared.
- A borrower with a pulled credit profile still sees the report, not the form (unchanged).

## Files changed
- `src/pages/profile/components/CreditProfileTab.tsx` — profile prefill effect.
- `tests/mocks/handlers.ts` — default blank `personal-info` handler (the form now requests it; unhandled requests error in this suite).
- `tests/pages/profile/components/CreditProfileTab.test.tsx` — 5 tests under "what it starts from".
- `e2e/sidebar/profile/credit-profile-form-prefill.spec.ts` (new, mocked at the API origin) — 2 tests.

## Testing
- Vitest: 4 of the 5 new tests failed before the change; full suite 576/576. `npm run typecheck` clean.
- Playwright: new spec 2/2 against a fresh `npm run build`. Nothing is submitted: a real submission writes an FCRA consent row that cannot be undone.
- No backend change.

## Open items
- None.
