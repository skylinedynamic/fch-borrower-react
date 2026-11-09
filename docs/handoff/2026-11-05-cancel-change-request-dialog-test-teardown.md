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

## Follow-up: the Documents test still failed in CI, from a stray modal
With the 5 s wait, CI still failed the same Documents test. The DOM it printed held **two** open "Are you sure?" modals, but the page renders only one.

**Cause:** this was a real app race, not timing.
- The previous test ("says the document is accepted before it is removed") ended while Bootstrap was still opening its modal. React had already rendered the text, but Bootstrap's show finishes on a timer.
- `cleanup()` unmounted the modal, and React took it out of the page.
- When the show timer then ran, Bootstrap found the element missing from `<body>` and appended it again, open and with its backdrop. Nothing owned it.
- The next test clicked that stray modal's "Yes, Delete It", so no request was sent.
- In the app the same thing happens if a confirm modal is unmounted within about 150 ms of being asked to show.

**Fix:** `src/utils/bootstrapModal.ts` `hideAndDisposeModal()`. It is used by every modal's unmount cleanup. It now notes whether React had already taken the element out of the page. If it had, it closes the modal once Bootstrap finishes the show (`shown.bs.modal`), and removes the element if Bootstrap put it back. When it has no element, it falls back to Bootstrap's own `_element`. Under StrictMode's development remount the element never leaves the page, so it is left alone, as before.

**Tests:**
- **New, `tests/components/GlobalModal/unmountWhileOpening.test.tsx`:** `DeleteConfirmModal` and `ConfirmationModal` are unmounted right after `show`. Both tests failed first, with one stray `.modal` left in the page, and pass now.
- **Related suites:** `tests/components/GlobalModal`, `tests/utils/bootstrapModal.test.ts`, the profile dialog and Documents: 51 passed.
- **CI commands:** `npm run test:unit` 341 passed; `npm run test:feature` 178 files and 1236 tests passed, with no unhandled errors.
- **`npm run typecheck`:** clean.

**Files changed (follow-up):**
- `src/utils/bootstrapModal.ts`
- `tests/components/GlobalModal/unmountWhileOpening.test.tsx` (new)

## Open items
- **E2E not run:** no Playwright E2E was run for this. `hideAndDisposeModal` is shared by the confirm, invoice, payment, billing and task-complete modals; a browser check of opening and closing one of them is worthwhile.
- **`vi.waitFor` elsewhere:** `tests/lib/auth/auth.test.ts` still uses `vi.waitFor` with the 1 s default. It is a non-DOM unit test and has not failed.
- **Not committed.**
