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

---

# Merge stage into bugfix/round-2 (second merge, same day)

## Problem
Merging `stage` left three files in conflict:
- `src/modules/funding-application/services.ts`
- `src/modules/funding-application/queries.ts`
- `src/pages/myapplication/MyApplications.css`

The two sides had made these changes:
- **`bugfix/round-2`:**
  - `loadStep`, which adopts the loaded version (R2 BUG-033);
  - `requestKey()`, which keys each step's cache by the id as text, so the wizard reads each step once.
- **`stage`:** a wizard step can read its application by `funding_application_id`, for an application converted from the embed form, which has no funding request.

## Solution
- **`services.ts`:** each step loader takes `stage`'s `(fundingRequestId, fundingApplicationId)` with `lookupParams()`, and loads through this branch's `loadStep`.
- **`queries.ts`:**
  - **Both kept:** this branch's `requestKey()` and `stage`'s `wizardEnabled()`.
  - **Cache key:** `[..., requestKey(fundingRequestId), ...(fundingApplicationId ? [String(id)] : [])]`.
- **`MyApplications.css`:** both blocks are kept, this branch's phone rules for the details dialog and `stage`'s locked-application banner.
- **`tests/modules/funding-application/queries.applicationLookup.test.tsx`:** the funding-request read is now keyed by `'29'` (text), not `29`. This is this branch's single-load fix; `stage`'s own funding-request test already expected text.

## Testing
- **`npm run typecheck`:** clean.
- **Full Vitest run:** 1717 passed of 1717.
