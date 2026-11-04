# CI failure: unhandled error after CancelChangeRequestDialog.test

**Date:** 2026-11-05
**Branch:** bugfix/round-2

## Problem
CI failed with `Process completed with exit code 1`, even though every test passed (177 files, 1234 tests). Vitest reported one unhandled error and failed the run:

```
TypeError: Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.
 ❯ triggerTransitionEnd node_modules/bootstrap/js/src/util/index.js
This error originated in "tests/pages/profile/components/CancelChangeRequestDialog.test.tsx" ...
This error was caught after test environment was torn down.
```

It happened locally on every run.

## Cause
The test drives Bootstrap's real Modal and ended with the modal open. Testing Library's cleanup then unmounted it, and `DeleteConfirmModal` hid the modal. Bootstrap finishes a hide on a timer (its emulated transition end), and the component adds a 100 ms backdrop sweep. Those timers fired after Vitest had torn down jsdom, where Bootstrap's `new Event(...)` no longer belongs to the document's window.

This is a test teardown problem only. The app is not affected.

## Solution
The test now unmounts the dialog itself at the end and waits 400 ms, so Bootstrap's timers run while jsdom is still up. What the test checks is unchanged.

## Files changed
- `tests/pages/profile/components/CancelChangeRequestDialog.test.tsx`: unmounts, then waits for the modal's hide timers.

## Testing
- **Before:** 3 local runs of the file, each "1 passed, 1 error (Unhandled)".
- **After:** 3 runs, each "1 passed", with no errors.
- **Full Vitest run:** 227 files and 1717 tests passed, with no unhandled errors.

## Open items
- **Other branch:** the CI run that failed (177 files) is on a different branch from `bugfix/round-2`. This fix has to reach that branch too.
- **Not committed.**
