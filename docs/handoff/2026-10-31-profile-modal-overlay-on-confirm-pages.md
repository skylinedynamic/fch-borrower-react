# Complete Your Profile: overlay missing on some pages

**Date:** 2026-10-31
**Branch:** bugfix/all-bugfix

## Problem
The Complete Your Profile popup (mounted globally in `GlobalModals`) showed over a page that was not dimmed on some pages, e.g. `/documents` and `/billing-details`. Its overlay (`.modal-backdrop`) had been deleted.

Those pages render `ConfirmationModal` or `DeleteConfirmModal`. Both sweep up leftover backdrops shortly after they mount (their `show` effect runs `hide()` with `show` false) and after they unmount: at 100, 150, 300 and 350 ms. They skipped the sweep only when a `.modal.show` existed. Reactstrap adds `show` to the profile modal at the end of its fade, with the modal (`display: block`) and its backdrop already in the page. The profile modal opens as the page loads, so the sweep landed in that window and removed its backdrop.

## Solution
Both modals now call the shared `clearStrayModalBackdrops()` (`src/utils/modalBackdrop.ts`), which already counts a fading-in modal (`display: block`) as open. Their own copies of the guard are removed. Stray backdrops are still cleared when no modal is open.

## Files changed
- `src/components/GlobalModal/ConfirmationModal.tsx`: `cleanupModalEffects` is `clearStrayModalBackdrops`.
- `src/components/GlobalModal/DeleteConfirmModal.tsx`: the mount/hide and unmount sweeps call `clearStrayModalBackdrops`.

## Testing
- New `tests/components/GlobalModal/backdropSweep.test.tsx` (5 tests): each confirm modal, on mount and on unmount, leaves the backdrop of a modal still fading in, and a stray backdrop is still cleared. Without the fix: 4 failed, 1 passed. With it: 5/5 pass.
- `e2e/pages/profile-complete-modal.spec.ts`: 2 new tests, the popup's overlay is present on `/documents` and `/billing-details` after the sweeps. Without the fix both fail. With it: 5/5 pass (plus setup).
- Full Vitest suite: 199 files, 1479 passed. `npm run typecheck` passes.

## Open items
- `DeleteConfirmModal` still removes `modal-open` and body overflow 10 ms after it opens (`show.bs.modal`), so the page can scroll behind it. Not changed here.
