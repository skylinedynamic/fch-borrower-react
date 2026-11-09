# BUG-044: the other plays say why they are locked while one runs

**Date:** 2026-11-02
**Author:** awlad

## Problem
BUG-044 (R2-CP-CAP-03). Client 144 started Foundation 100 Play. Then, on Credit Card Stacking > All Strategies:
- All 9 other plays showed a padlock with no text or tooltip, and clicking did nothing.
- The count read "9 available".
- Opening another play by URL (`/credit-card-stacking/2/overview`) bounced back to the strategy page without a word.

**One play at a time is the rule, by design.** The API's `PlayAccessGuard` makes only the running play `isAccessible` (`CapitalAccessStrategyOverviewResource`). It was simply never explained.

## Solution
The rule stays. The page now says it, in client-fch only:
- **A notice above the locked plays:** "You can run one play at a time. Finish {running play} to start another.", with a "Go to {running play}" link to its roadmap.
- **Each locked row and its padlock** carries the same reason as a tooltip (`title`) and `aria-label`. During the next-play cooling delay the reason is "Your next play unlocks in …" instead.
- **Design:** a white card in the same style as the play rows. It has a primary left border, a round lock icon, the title "A play is already running", the reason under it, and a primary "Continue {running play}" button. The button goes full width on a phone.
- **The count** reads "N locked while a play is running" instead of "N available".
- **By URL:** `PlayOverview` redirects a locked play with router state. The strategy page then shows the reason as a toast, once (`toastId`). An unknown id or a load error still redirects without it.

**Found on the way: every Capital Access primary button was transparent.** `CreditAccounts.css`, from the Credit Accounts redesign, is imported eagerly from `App.jsx`, so it loads on every page. It redefined `.ca-btn`, `.ca-btn-primary`, `.ca-card`, `.ca-card-body`, `.ca-metric` and `.ca-metric-label`, which Capital Access also uses. It set the background from `--ca-brand`, which exists only inside `.ca-page`, so elsewhere the background resolved to nothing. Every selector in that file is now scoped under `.ca-page`. Screenshots confirm that both Capital Access (the notice button and the hero's View Strategy) and Credit Accounts render correctly.

## Files changed
- `src/config/capitalAccess.ts`: `onePlayAtATimeMessage`, `playsLockedWhileRunningLabel`, `PLAY_LOCKED_REDIRECT_STATE`, `PLAY_LOCKED_TOAST_ID`.
- `src/pages/capital-access/StrategySelection.tsx`: the notice, the count, the tooltips, and the toast on redirect.
- `src/pages/capital-access/PlayOverview.tsx`: the locked redirect carries the state.
- `assets/css/custom.css`: `.ca-running-play-notice*`.
- `src/pages/credit-builder/creditvendorapplication/CreditAccounts.css`: every selector scoped under `.ca-page`.

## Testing
- **New:** `tests/pages/capital-access/StrategySelection.test.tsx`, 5 tests. The 4 for a running play failed first:
  - the notice, with its link and the count;
  - the tooltip on each lock;
  - the toast after a redirect from a locked play's overview;
  - no toast on an ordinary visit;
  - with no running play there is no notice and the plays are links.
- **E2E:** `credit-card-stacking-flow.spec.ts`, `while a play runs, the other plays say why they are locked`, against the local API. It skips if the borrower has no running play.
- **Run:**
  - Vitest full suite: 1572 passed, in 210 files.
  - `e2e/sidebar/credit-card-stacking/`: 12 passed.
  - `npm run typecheck`: clean.

## Open items
- Switching plays (abandon the running one and start another) is not offered. That is a business decision for the BA: what happens to submitted steps and approvals, and whether a cooling delay applies.
