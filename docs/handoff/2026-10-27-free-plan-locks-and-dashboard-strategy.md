# Free-plan locks: Billing Details by URL, Credit Builder items, Dashboard strategy button (BUG-110, BUG-111, BUG-099)

Date: 2026-10-27

## Problem
- **BUG-111:** a free-plan client could type `/billing-details` and the page opened with a red "Server Error", although the menu item is locked. `/billing-details` was missing from `FREE_TRIAL_LOCKED_PATHS` in `ProtectedRoute`.
- **BUG-110:** on the free plan, Credit Builder's Overview, Step-By-Step Guide and Credit Accounts showed no lock, while clicking them went nowhere because the routes are locked. The other locked menus show a lock.
- **BUG-099:** without a verified credit profile, Credit Card Stacking shows its locked page, but the Dashboard still offered "Choose Strategy". The raw `**...**` text from the same report is already fixed on stage, where the locked page uses `<strong>`.

## Solution
- `/billing-details` added to `FREE_TRIAL_LOCKED_PATHS`. A free-plan client typing it lands on the Dashboard like the other locked pages.
- The three Credit Builder items carry the lock whenever the group does (`creditBuilderLocked = isRestricted || isFreeTierModule`).
- The Dashboard reads `credit_card_stacking.unlocked` from the profile completion, the same answer `CapitalAccessGuard` uses. When it is `false`, the hero card shows "Locked / Unlock your capital access strategy / Verify your credit profile and complete your Tier 0 tasks…" and the button reads "See how to unlock". The button opens Credit Card Stacking, which shows the locked page's explanation. While the answer is loading or fails, the button stays as before.

## Files changed
- `src/lib/auth/ProtectedRoute.tsx`: `/billing-details` locked on the free plan.
- `src/components/Layout/Sidebar.jsx`: `creditBuilderLocked`; lock icon on the three Credit Builder items.
- `src/pages/dashboard/Dashboard.tsx`: `useProfileCompletion`, `locked` passed to the hero.
- `src/pages/dashboard/components/DashboardHero.tsx`: `locked` prop and its copy.
- `tests/lib/auth/ProtectedRoute.test.tsx`: free plan is sent away from `/billing-details`.
- `tests/components/Layout/SidebarFreePlanLocks.test.tsx`: new. Credit Builder and its items are locked on the free plan and not on a paid one.
- `tests/pages/dashboard/Dashboard.test.tsx`: profile completion served; locked shows "See how to unlock" and no Choose Strategy; unlocked keeps Choose Strategy.

## Testing
- Each new test failed first, then passed.
- `tests/lib/auth`: 61/61. `tests/components/Layout`: 62/62. `tests/pages/dashboard`: 73/73.
- Full Vitest run: 1281/1281 (169 files). `npm run typecheck`: 0 errors.
- The same change set updates `e2e/auth/login.spec.ts` for BUG-104 (API): an unknown email now shows "Invalid email or password." instead of "…does not exist". The live E2E was not run here.

## Open items
- None.
