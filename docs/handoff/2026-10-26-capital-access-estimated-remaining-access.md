# Capital Access — the estimate is labelled "Estimated Remaining Access" (BUG-031)

**Date:** 2026-10-26
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
QA defect log **BUG-031** (CP-CAP-04), retest on 26 Oct: Partially Fixed. Tradeline Depth and "1 account" were fixed. Still open: Estimated Total Access was $1,365,000 for both Laborum (score 78) and Michael Chen (score 88), and client 144 (score 83) showed $1,865,000.

The API (`BorrowerCapitalAccessController` / `CapitalAccessOverviewController`) adds up the **maximum exposure of every play the client qualifies for, leaving out plays already completed**. It is a gate, not a grade: any qualifying client gets each play's full maximum, and completed plays lower the figure.

## Solution
**Decision: keep the calculation and say it is what remains.** The card is now titled **"Estimated Remaining Access"**, with the line "From the plays you qualify for and have not completed yet". The Capital Access locked screen's wording matches.

## Files changed
- `src/components/CapitalAccess/EstimatedTotalAccessCard.tsx`: title and explanatory line.
- `src/components/CapitalAccess/CapitalAccessLocked.tsx`: "Estimated Remaining Access" in the unlock text.
- `tests/components/CapitalAccess/EstimatedTotalAccessCard.test.tsx`: new, 1 test.

## Testing
- **New:** the title and the remaining-plays line (failed first).
- Full Vitest: 159 files, 1,206 passed. `npm run typecheck` clean.


## The amount reads short (follow-up)
The card shows the API's `estimated_total_access_compact` (`formatCompactCurrency`: $1.4M, $1.37M, $77K), with the full amount (`estimated_total_access`) on hover (`title`). It falls back to the full amount when the short form is not sent. `CapitalAccess.tsx` passes both; the card gained `totalAccessFull`.

**Tests:** +1 card test (short with the full amount on hover) and +2 page tests (short form; full amount without it). Both short-form tests failed first. Full Vitest: 159 files, 1,209 passed. Typecheck clean.

## Open items
- The admin Clients › Capital Access tab has the same wording (admin handoff, same date).
- QA sheet: BUG-031 → Fixed (wording, as decided). The amount is unchanged by design.
