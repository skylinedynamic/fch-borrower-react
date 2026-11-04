# CI failure: Bootstrap timers after teardown, and a timing-dependent Documents test

**Date:** 2026-11-05
**Branch:** bugfix/round-2

## Problem
`npm run test:feature` failed in CI (`Process completed with exit code 1`) in two ways.

1. **An unhandled error, with every test passing.** First it came from `CancelChangeRequestDialog.test.tsx`, then from `Documents.test.tsx`:
   ```
   TypeError: Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.
    ❯ triggerTransitionEnd node_modules/bootstrap/js/src/util/index.js
   This error was caught after test environment was torn down.
   ```
2. **A test failure.** `Documents page - removing an accepted document (R2 BUG-045) > shows why a document an open request needs was not removed` reported `expected "spy" to be called ... Number of calls: 0`. It passes when the file runs alone.

## Cause
1. **The unhandled error.** A test that ends with a real Bootstrap modal open leaves the hide running on timers once `cleanup()` unmounts the modal: Bootstrap's emulated transition end, plus the components' 100–300 ms backdrop sweeps. When those timers fire after Vitest has torn jsdom down, Bootstrap's `new Event()` no longer belongs to that window. Vitest then fails the run. Which file shows it depends on timing, so it moved between files.
2. **The test failure.** The test waited with Vitest's `vi.waitFor`, which gives up after 1 s. Under CI load the 422 round trip and the toast take longer than that. `tests/setup.ts` already gives Testing Library's `waitFor` 5 s for this reason, but `vi.waitFor` ignores that setting.

## Solution
- **`tests/setup.ts`:** `afterAll` waits 400 ms before closing MSW, so any Bootstrap timers still pending run while jsdom is still up. This happens once per test file and fixes every modal test, not one file at a time.
- **`Documents.test.tsx` and `StrategySelection.test.tsx`:** use Testing Library's `waitFor`, which gets the 5 s from setup, instead of `vi.waitFor`. What the tests check is unchanged.
- **`CancelChangeRequestDialog.test.tsx`:** the test-only fix tried first for this file is no longer needed. The file is back as it was.

## Files changed
- `tests/setup.ts`: the teardown wait.
- `tests/pages/documents/Documents.test.tsx`: `waitFor` in place of `vi.waitFor`.
- `tests/pages/capital-access/StrategySelection.test.tsx`: `waitFor` in place of `vi.waitFor`.

## Testing
- **Red:** `CancelChangeRequestDialog.test.tsx` failed with "1 error (Unhandled)" on 3 of 3 local runs.
- **Green:** with only the setup change, 2 of 2 runs passed with no error.
- **CI commands:**
  - `npm run test:unit`: 38 files and 341 tests passed;
  - `npm run test:feature`: 177 files and 1234 tests passed;
  - neither had an unhandled error. These are the same counts as CI.
- **`npm run typecheck`:** clean.
- **Not reproduced:** the Documents timing failure could not be reproduced on demand locally, since it is a CI-load race. It is covered by the longer wait.

## Open items
- **`vi.waitFor` elsewhere:** `tests/lib/auth/auth.test.ts` still uses `vi.waitFor` with the 1 s default. It is a non-DOM unit test and has not failed.
- **Not committed.**
