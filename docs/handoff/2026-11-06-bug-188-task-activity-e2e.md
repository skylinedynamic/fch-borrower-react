# BUG-188: Task activity lists each task once (E2E)

**Date:** 2026-11-06

## Problem
Credit Builder → Overview → Task activity kept old rejected requests under "Needs attention" after the task was resubmitted and verified. Tasks verified more than once were also counted more than once. The cause was in fch-api, which returned every submission of each task instead of the latest one.

## Solution
Fixed in fch-api (`docs/handoff/2026-11-06-bug-188-task-activity-latest-request.md`): only each task's latest request is returned. The response shape is unchanged, so no source change was needed here.

## Files changed
- `e2e/sidebar/credit-builder/overview/overview.spec.ts`: new "Task activity" test. It checks that every task title in the task-overview response appears once, and that the page's All count equals that number.

## Testing
- `npx playwright test e2e/sidebar/credit-builder/overview/`: 6 passed, against the local fch-api.
- The E2E borrower is local borrower 1, whose data has repeated submissions. Without the API fix, the title check fails.

## Open items
- Not committed.
