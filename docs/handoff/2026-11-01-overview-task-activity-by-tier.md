# Credit Builder Overview: Task activity as tiles, grouped by tier

**Date:** 2026-11-01
**Branch:** bugfix/round-2
**Author:** awlad

## Problem
On Credit Builder › Overview, Task activity read poorly:
- **Rows:** full-width rows with a red left edge on every task.
- **Reasons:** a large red box behind each rejection reason, the same "No matching business record found." seven times.
- **Distribution bar:** a thick red/green bar.
- **Grouping:** tasks from different tiers were mixed together. The user asked to see them tier by tier.

## Solution
The same data, tabs, order and "Show all" as before. Only the layout changed (`TaskStatusCards.tsx`, `CreditOverview.css`):
- **Grouped by tier.** One heading per tier, lowest first ("Tier 0 · 5 tasks", "Tier 4 · 1 task"), done by the new exported `groupByTier`. A task with no tier goes under "Other", last.
  - Inside a tier the order is unchanged: needs attention, then in review, then verified.
  - The tabs filter, and "Show all" still opens the rest after the first 6. Those 6 are taken before grouping.
  - The per-task tier tag is gone, since the heading says it.
- **Tiles:** two to a row on a wide screen, one below 992px.
  - Neutral border with a brand tint on hover, and no red left edge.
  - A small round status icon, the title, and the status pill on the right.
  - The description in muted text.
  - A bottom line with the reason (red text and icon, no box) and "Fix in the guide" on the right. Verified tasks show their date there instead.
- **Distribution bar:** 6px and rounded, instead of 8px.

### Follow-up: compact rows
The tiles took too much space per task. Each tier's tasks are now one bordered list with **one compact row per task**, about 56px high:
- **Left:** a small round status icon.
- **Middle:** the title, and the description on one line, cut with an ellipsis (the full text is in the tooltip).
- **Right:**
  - the rejection reason, on one line in red, at most 260px (the full text is in the tooltip);
  - the status pill;
  - "Fix in the guide", or the verified date.
- **Phone:** the right-hand part moves under the title, and the reason wraps.

## Files changed
- `src/pages/credit-builder/creditoverview/components/TaskStatusCards.tsx`: tile markup, tier groups, `groupByTier`.
- `src/pages/credit-builder/creditoverview/CreditOverview.css`: the `.co-row*` tile styles, `.co-tier-*` group styles, the bar and the breakpoints.

## Tests
- `tests/pages/credit-builder/creditoverview/components/TaskStatusCards.test.tsx`:
  - New: "groups the tasks by tier, lowest tier first, what needs fixing first inside each". It failed first.
  - Updated: the task list is now a region named "Tasks" holding one list per tier. The `rows()` helper and the empty-filter check look it up as a region, not a list. The expectations are otherwise unchanged.
- Run: Credit Builder Vitest, 70 passed. Full Vitest: 208 files, 1,546 passed. `npm run typecheck` clean. E2E `e2e/sidebar/credit-builder`: 11 passed.
- Looked at in Chromium at 1440px and 390px with the E2E borrower (32 tasks, 7 needing attention, in Tier 0 and Tier 4).

## Open / follow-up
- None.
