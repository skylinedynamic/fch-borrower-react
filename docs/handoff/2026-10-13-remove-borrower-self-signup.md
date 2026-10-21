# Remove borrower self sign-up

**Date:** 2026-10-13
**Branch:** bugfix-awlad
**Author:** Awlad Hossain

## Problem
Borrower self sign-up was switched off but only half removed:
- **Leftover code.** The Sign Up route and its import in `src/App.jsx` were commented out. The page (`src/pages/singin/SignUp.jsx`), the `registerBorrower()` call, the `useRegisterBorrower()` hook and the `BorrowerRegistrationPayload` type were all still there.
- **Dead endpoint.** The API route the call posts to (`POST /borrower/register`) was commented out in fch-api too, so the code could never work.

## Solution
**Decision (user):** borrowers will not sign up themselves.

The feature is removed here and in fch-api (F118, `fch-api/docs/handoff/2026-10-13-f118-unreachable-code-and-borrower-self-signup-removed.md`).
- Deleted `src/pages/singin/SignUp.jsx`.
- Removed `registerBorrower()` from `src/modules/auth/services.ts`.
- Removed `useRegisterBorrower()` from `src/modules/auth/queries.ts`.
- Removed `BorrowerRegistrationPayload` from `src/modules/auth/types.ts`.
- Removed the commented Sign Up import and route from `src/App.jsx`.
- Removed the commented `isSignup` line from `src/components/Layout/Auth.jsx`.

Sign In, Forgot Password and Reset Password are unchanged.

## Files changed
- `src/pages/singin/SignUp.jsx` (deleted)
- `src/modules/auth/services.ts`
- `src/modules/auth/queries.ts`
- `src/modules/auth/types.ts`
- `src/App.jsx`
- `src/components/Layout/Auth.jsx`
- `tests/modules/auth/services.test.ts`

## Tests
- **Updated:** `tests/modules/auth/services.test.ts`, with a new `no borrower self sign-up` block. It checks that:
  - there is no `registerBorrower` or `useRegisterBorrower` in the auth module;
  - `SignUp.jsx` is gone and `SignIn.jsx` stays.

  It failed first, then passed.
- **E2E:** none; no Playwright spec covered sign-up.
- **Run:** `npm test` passed (99 files, 606 tests). `npm run typecheck` is clean.

## Open / follow-up
Deploy with fch-api. This change only removes unreachable code, so the order does not matter.
