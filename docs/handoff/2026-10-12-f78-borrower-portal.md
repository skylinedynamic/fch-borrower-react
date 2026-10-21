# Borrower portal (F78, was O13)

**Date:** 2026-10-12
**Branch:** bugfix-awlad
**Author:** Awlad Hossain
**Findings:** `fch-api/docs/test-findings.md` — F78 (was O13)

## Problem
borrower-fch `fetchTimeSlots()` called `GET /common/time-slots/fetch-all`, which does not exist; nothing called the function.

## Solution
Dead function and its types removed from borrower-fch (`modules/appointment`).

## Files changed
- `borrower-fch: src/modules/appointment/services.ts`
- `borrower-fch: src/modules/appointment/types.ts`

## Tests
- borrower-fch typecheck + suite — written to fail first, then passing.
- Suites run: borrower-fch `npm run typecheck` clean, `npm test` 98 files / 601 passed.

## Open / follow-up
None.
