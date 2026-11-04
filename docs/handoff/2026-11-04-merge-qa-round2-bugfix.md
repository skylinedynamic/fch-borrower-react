# Merge origin/qa-round2-bugfix into bugfix/round-2

**Date:** 2026-11-04
**Branch:** bugfix/round-2

## Problem
Merging `origin/qa-round2-bugfix` into `bugfix/round-2` left one file in conflict: `tests/pages/appointment/AppointmentModal.test.tsx`. Both branches had added new describe blocks at the end of the file.

## Solution
Both sides were kept:
- this branch's blocks: BUG-004 (the description cannot run script) and R2 BUG-024 (an appointment that ends after midnight);
- the incoming block: R2 BUG-046 (a client cancels an appointment the host booked with them).

No production code was in conflict.

## Files changed
- `tests/pages/appointment/AppointmentModal.test.tsx`: the conflict, resolved by keeping both sides' describe blocks.

## Testing
- **`tests/pages/appointment`:** 18 passed.
- **`npm run typecheck`:** clean.
- **Full Vitest run:** 1675 passed and 1 failed. The failure was `FundApplication.hiddenStepSave.test.tsx` (26 s, a timeout under load); it passes when run alone, and it is not part of the merge.

## Open items
- **Not committed:** the merge itself is not committed yet.
