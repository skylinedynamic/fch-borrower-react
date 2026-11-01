# Credit Card Stacking locked text: no raw Markdown (BUG-034)

Date: 2026-10-26

## Problem
The restricted Capital Access (now Credit Card Stacking) screen showed "To view your personalized **Capital Access Readiness Scores**, explore **Estimated Total Access**…" with the `**` visible.

## Solution
Already fixed in the code: `CapitalAccessLocked.tsx` renders the terms in `<strong>` (on `origin/stage` as well). Added a test so raw Markdown cannot come back.

## Files changed
- `tests/components/CapitalAccess/CapitalAccessLocked.test.tsx`: new case. The summary has no `*`, and both terms render as `<strong>`.

## Testing
- The new test passes (6/6 in the file). Checked by temporarily putting `**…**` back: the test failed, then the file was restored unchanged.

## Open items
- None.
