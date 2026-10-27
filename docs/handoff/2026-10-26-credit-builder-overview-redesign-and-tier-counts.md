# Credit Builder — Overview redesign; the tier counts match the Guide (BUG-024)

**Date:** 2026-10-26
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
QA defect log **BUG-024** (CP-CBO-02), retest on 25 Oct: **Partially Fixed**. The Overview said "Tasks completed in this tier: **0/8**" while the Step-By-Step Guide said Tier 1 **0/1**.

From Tier 1 on a tier needs only `task_to_complete` of its tasks (1). Doing one opens the next tier and the task moves into it. Tier 0 needs all of them. The API fix (counts out of the required tasks; the estimate is the longest open task) is in fch-api `docs/handoff/2026-10-26-credit-builder-tier-progress-out-of-required-tasks.md`.

On the client side:
- the Guide's `TierAccordion` showed **8/1, 4/1, 3/1, 2/1** on finished tiers: verified tasks over `task_to_complete`, uncapped;
- the Overview was asked to be redesigned ("top notch").

## Solution
- **Guide (`TierAccordion`):** the count is out of `task_to_complete`, capped at the tasks listed (all tasks when not set), and the verified count is capped at that. Finished tiers read 1/1.
- **Overview, redesigned** in the Guide's visual language. The tenant's brand colours the hero and primary buttons, its secondary colour the progress accents, and everything else is a fixed palette. It works on a phone (the roadmap turns vertical; tiles and lanes stack) and respects reduced motion.
  - **Hero (`OverviewHero`):** title, subtitle, the current tier badge, an **overall progress ring** (the Guide's Overall Progress) with "X of Y tasks verified", and "Open Step-By-Step Guide". It shows while the progress loads or fails, so the title is always there.
  - **Tier roadmap (`TierRoadmap`):** every tier as a step (Completed / In progress / Locked, with `aria-current="step"`) on a gold-to-brand track filled to the current tier, and a "Step N of M" chip.
  - **Current tier (`CurrentTierCard`):** why it matters, plus three tiles:
    - tier progress, as a ring;
    - "Tasks completed in this tier" `done/needed`, with pips;
    - "Estimated completion", the longest open task's days, or "Tier complete" / "All tiers complete".
  - **Task activity (`TaskStatusCards`):** see "Task activity redesign" below. A list the API leaves out is treated as empty, no longer a crash.
  - **Training videos (`VideoPlayerSection`):** the player with a "Now playing" bar and a numbered playlist (buttons, keyboard-focusable). Inline styles and mouse-hover handlers moved to CSS.
  - The unused Bootstrap tooltip setup and the commented-out sidebar widgets are removed.

## Files changed
- `src/pages/credit-builder/creditguide/components/TierAccordion.tsx`: capped count.
- `src/pages/credit-builder/creditoverview/CreditOverview.tsx`: page layout, imports `CreditOverview.css`.
- `src/pages/credit-builder/creditoverview/CreditOverview.css`: new, the Overview's styles (`co-*`).
- `src/pages/credit-builder/creditoverview/components/`:
  - `ProgressRing.tsx`: new.
  - `OverviewHero.tsx`: new.
  - `TierRoadmap.tsx`: new.
  - `CurrentTierCard.tsx`: new.
  - `CreditProgress.tsx`: puts them together.
  - `TaskStatusCards.tsx`: redesigned.
  - `VideoPlayerSection.tsx`: redesigned.
- **Tests:**
  - `tests/pages/credit-builder/creditoverview/components/CreditProgress.test.tsx`: rewritten, 8 tests.
  - `tests/pages/credit-builder/creditguide/TierAccordion.test.tsx`: +2.
  - `e2e/sidebar/credit-builder/overview/overview.spec.ts`: updated, +1.

## Testing
- **Vitest:**
  - **Overview (new, all failed first):** the overall ring and "6 of 16 tasks verified"; the three tiles; 0/1 for a tier needing one; "Tier complete" instead of "0 days"; "All tiers complete" on the last tier; the roadmap's done/current/locked steps; the link to the Guide; the title while the progress fails.
  - **Guide:** 0/1, and 1/1 (not 2/1) when more were done. The latter failed first.
  - Full suite: 156 files, 1,193 passed. `npm run typecheck` clean.
- **E2E** (built app, real local API, `E2E_BACKEND_PATH=C:\laragon\www\fch-api`): `e2e/sidebar/credit-builder`, 9 passed.
  - The Overview's ring equals the Guide's Overall Progress.
  - The tier tile reads `n/m`.
  - The roadmap has one current step and links to the Guide.
  - The Guide locator moved to `.cg-stat`/`.cg-stat-num`. It had been broken since the Guide's own redesign (25 Oct).
- **Looked at in Chromium** (1440px and 400px) against the local API with the E2E borrower (Tier 4): 81% overall, 25 of 31, every tier step done or current, Tier 4 1/1, "All tiers complete".


## QA retest 26 Oct — follow-up
The API now counts a tier with nothing listed yet as needing its `task_to_complete` (0/1), and the overall total as the sum of the tiers' rows (fch-api handoff, same date). A tier in that state has no estimate (0 days, yet a task is still needed), so:
- **Overview (`CurrentTierCard`):** "Estimated completion" shows "—", not "0 days".
- **Guide (`CreditGuide`):** "Est. Time to Next Tier" shows "Ready for Next Tier" only when nothing is left, "—" when a task is still needed but none is listed, otherwise the days.

**Tests:**
- +1 each in `CreditProgress.test.tsx` and `CreditGuide.test.tsx`; both failed first.
- The Guide's existing "nothing left" test now has 0 tasks remaining, as its name says.
- Full Vitest: 156 files, 1,195 passed. `npm run typecheck` clean.
- E2E `e2e/sidebar/credit-builder` (local API): 8 passed.


## Task activity redesign and 4px corners (follow-up)
The three-lane task board read poorly: an empty lane ("No Tasks Processing") took a third of the width, 25 verified tasks scrolled in a narrow box, and nothing pointed at what needed fixing. `TaskStatusCards` is now **Task activity**:
- **Filter tabs** (All / Needs attention / In review / Verified) with counts, and a thin **distribution bar** (red / blue / green).
- **One list of rows**, in order of what needs action: rejected ("Needs attention", red edge, the rejection reason, **Fix in the guide**), then in review, then verified (with the date).
- The first **6** rows, then "Show all N".
- An empty filter says so ("Nothing needs your attention"). With nothing submitted at all, a "No tasks submitted yet" card links to the Guide.
- **Phone:** the tabs wrap, and the status and actions go under each row's text.

**Every card and block uses a 4px radius** (`--co-radius: 4px`; icon boxes too). Only pill badges and progress bars stay round.

**Tests:**
- `tests/pages/credit-builder/creditoverview/components/TaskStatusCards.test.tsx`: new, 6 tests (counts per tab, rejected first with reason and guide link, filtering, first six then all, an empty filter, nothing submitted). All failed first.
- Full Vitest: 157 files, 1,201 passed. `npm run typecheck` clean. E2E `e2e/sidebar/credit-builder` (local API): 8 passed.
- **Looked at in Chromium** (1440px and 400px) with the E2E borrower: 32 tasks (7 needing attention, 25 verified).


## Training videos redesign (follow-up)
The playlist showed a generic YouTube icon per video, and the player was a black box until it loaded. `VideoPlayerSection` now:
- **Player:** shows the current video's **YouTube thumbnail** (`img.youtube.com/vi/<id>/hqdefault.jpg`, the same source the Resource Hub uses) with a large play button and its length. The YouTube player (iframe) loads only when the borrower presses play, playing straight away, so the page no longer loads an embed on open.
- **Playlist ("Up next"):** each video with its 16:9 thumbnail (`mqdefault`, lazy-loaded), its length on the image, and a play overlay on hover. The current video is highlighted and reads "Ready to play", then "Now playing" with animated bars once started. Every item is a button (keyboard-focusable).
- The playlist is keyed by YouTube id.
- **Phone:** the player sits above the list, with slightly smaller thumbnails.

**Tests:**
- `tests/pages/credit-builder/creditoverview/components/VideoPlayerSection.test.tsx`: new, 4 tests (thumbnails and lengths, the poster before play, the player loading with autoplay on play, a picked video playing and marked). All failed first.
- Full Vitest: 158 files, 1,205 passed. `npm run typecheck` clean. E2E `e2e/sidebar/credit-builder` (local API): 8 passed.
- **Looked at in Chromium** (1440px and 400px) with the real thumbnails.

## Open items
- The videos are still a fixed list in the component (ids, titles and lengths).
- QA sheet: BUG-024 → Fixed after the stage retest.
