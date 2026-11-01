# Credit Builder — Overview shows the same progress as the Guide (BUG-024)

**Date:** 2026-10-24
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
QA defect log **BUG-024** (CP-CBO-02): Credit Builder › Overview and › Step-By-Step Guide showed different progress. The Overview card showed three different figures, none of them the Guide's:
- the badge next to the tier name was the **current tier's** % ("75% Complete");
- the bar used its own formula (finished tiers + current tier fraction ÷ number of tiers, e.g. 15%);
- the Guide shows overall task progress (e.g. 38%).
"Tasks completed" was always 0/… — an API bug, fixed in fch-api (`docs/handoff/2026-10-24-credit-builder-progress-matches-guide.md`).

## Solution
`CreditProgress.tsx` (Overview card) no longer computes its own progress:
- badge: **"{overall}% Overall"** from `total_complete_percentage` — the Guide's "Overall Progress";
- bar: the same overall %, now a labelled `progressbar` ("Overall progress", `aria-valuenow`);
- the current tier's own figures stay, labelled: "Tier 0 progress: 75%", "Tasks completed in this tier: 6/8".

Depends on the fch-api fix of the same date for correct values; no change to the API's response shape or `types.ts`.

## Files changed
- `src/pages/credit-builder/creditoverview/components/CreditProgress.tsx` — overall % in badge and bar; tier figures labelled.
- `tests/pages/credit-builder/creditoverview/components/CreditProgress.test.tsx` — new, 3 tests.
- `e2e/sidebar/credit-builder/overview/overview.spec.ts` — new test: Overview overall % equals the Guide's.

## Tests
- New Vitest tests (3) failed first (no "Overall" badge, no labelled bar, no tier labels), pass after.
- `tests/pages/credit-builder` + `tests/components/Loader` — 32 passed; `npm run typecheck` clean.
- E2E `e2e/sidebar/credit-builder` against the local fch-api — 7 passed, including the new comparison test.

## Open items
- Mark BUG-024 in the QA defect log back to In Progress, then Fixed after the stage retest (both repos deploy together: the card relies on the fixed API values).
