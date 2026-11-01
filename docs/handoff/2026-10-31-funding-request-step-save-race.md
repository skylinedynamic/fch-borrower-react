# Funding Request step: flaky save test on CI

**Date:** 2026-10-31
**Branch:** bugfix/all-bugfix

## Problem
CI failed on `FundingRequestStep.test.tsx > Additional Funding Types > sends them with the funding request`: `expected [] to deeply equal ['SBA Loan', 'Line of Credit']`. It passed locally.

The step gives its save function to the parent in a `useEffect` (`onRegisterSave(handleSave)`), which runs after a render. The test waited for the loaded chips to show, then called `save()` straight away. On a slow runner that was still the save from before the data loaded, so it posted `[]`. Two other tests in the file had already hit this and retry the save.

## Solution
"sends them with the funding request" and "takes several purposes and sends them joined" now use the same retry as those two: `waitFor(async () => { save(); expect(posted...) })`. The expected values are unchanged.

Every funding application step registers its save the same way (BusinessInformationStep, DisclosuresStep, ...). Registering a stable function that calls the latest `handleSave` would remove the race in all of them. That is a bigger change and was not made here.

## Files changed
- `tests/pages/fundapplication/components/steps/FundingRequestStep.test.tsx`: the two save tests retry until the post carries the values on screen.

## Testing
- `FundingRequestStep.test.tsx` was run 3 times in a row: 13/13 passed each time.
- `npm run typecheck` passes.

## Open items
- The register-in-an-effect pattern in all funding application steps (see Solution).
