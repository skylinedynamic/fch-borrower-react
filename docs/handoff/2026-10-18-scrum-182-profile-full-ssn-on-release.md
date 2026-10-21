# SCRUM-182: profile full SSN, brought onto a release-based branch

**Date:** 2026-10-18 · **Branch:** `bugfix/scrum-182` (from `release`, uncommitted)

## Why
The Personal Info tab's full Social Security Number field (`2026-10-12-profile-full-ssn.md`) exists only on `stage`. On `release` the tab still asks for "Last 4 SSN". This branch ships the `stage` version from `release`.

## How the merge stays clean
- New files are copied from `stage` byte for byte:
  - `src/components/SsnInput/SsnInput.tsx`
  - `src/pages/profile/components/SsnField.tsx`
  - `src/utils/validators.ts`
  - `tests/utils/validators.test.ts`
- The edits to existing files are `stage`'s own hunks:
  - `PersonalInfo.tsx`
  - `CreditProfileTab.tsx`
  - `modules/profile/types.ts`
  - `profile.tsx`
- A trial `git merge-tree` into `origin/stage` gives the same 4 conflicting files as before this work. Into `origin/release` it gives 0.

`CreditProfileTab.tsx`:
- This branch's earlier commit (address prefill) and `stage` both imported `usePersonalInfo`. `stage`'s import line is kept and the branch's is dropped.
- The address prefill now reuses the same `personalInfo`.
- Its comment no longer says the profile holds only the last four digits.

## Changes
- Personal Info has a "Social Security Number" field.
  - It is formatted `XXX-XX-XXXX` and checked like the API's `App\Rules\Ssn`.
  - A full SSN on file shows masked (`***-**-6789`); the eye button shows it in full.
  - An older account holding only the last four digits sees an empty field and "Only the last 4 digits are on file. Please enter your full SSN."
- Credit Profile:
  - The SSN field uses the same `SsnInput`.
  - A full SSN on the profile is the default; a request submitted earlier wins over it.
- **New here, not on `stage`:** "Identity on file" offers Reveal only when the SSN has more than four digits. Before, with just the last four digits (an older account, or a bureau report like `XXX-XX-6789`), Reveal replaced `***-**-6789` with the bare four digits, which showed less. `CreditIdentityPanel.tsx` is unchanged on `stage`, so this merges cleanly.

**API contract change:** deploy together with fch-api's `bugfix/scrum-182`.
- `GET personal-info` returns `ssn` instead of `last_4_ssn`.
- `POST personal-info` takes `ssn`.

## Tests
Vitest:
- `PersonalInfo.test.tsx`: `stage`'s SSN block.
- `CreditProfileTab.test.tsx`:
  - `stage`'s "the SSN from the profile" block, merged beside this branch's "what it starts from" block, whose fixture is now `ssn: '6789'`;
  - 2 new tests for "offers no Reveal".
- `tests/utils/validators.test.ts`.
- `tests/mocks/handlers.ts`: the default `personal-info` handler returns `ssn: null`.

All were red before the code. Full suite: 103 files, 637 tests passed. `npm run typecheck` is clean.

Playwright (mocked at `http://127.0.0.1:8000/api/v1`):
- `e2e/sidebar/profile/profile-ssn.spec.ts` (new, 4 tests): masked SSN and eye button, the last-four notice, Reveal for a full SSN, no Reveal for the last four.
- `e2e/sidebar/profile/credit-profile-form-prefill.spec.ts`: updated to `ssn`, plus 1 test for the masked default.

7/7 passed.

The specs mock the API at `127.0.0.1:8000`. With another `VITE_API_BASE_URL` in `.env`, build with `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1 npm run build` before running them.

## Open
`formatLast4SSN` is now unused. It is kept, as on `stage`.
