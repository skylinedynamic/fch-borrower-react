# Locked menus explain why in a modal (BUG-033)

Date: 2026-10-26

## Problem
A restricted client (e.g. one who paid its own enrollment invoice while the account was still being activated) saw lock icons on Funding, Credit Card Stacking, Documents, etc. Clicking a locked menu did nothing, and opening a locked page silently redirected to the Dashboard. The pending-invoice banner was gone, so nothing told the client why.

## Solution
- `getRestrictionReason()` (next to `isSubscriptionRestricted()`) names the reason: `activation` (enrollment still being set up) or `inactive` (expired, cancelled, or past its end date).
- A new `RestrictedAccessModal` shows the message for that reason, with "View Invoices" and "Got it". As asked, the wording never says the partner has not paid.
- The sidebar opens the modal on a locked menu item or the locked Credit Builder group. `ProtectedRoute` passes `restrictedFrom` when it redirects a locked page to the Dashboard, and the sidebar opens the modal then too.
- Free-trial locks are unchanged (no modal).
- Messages live in `src/config/accessRestriction.ts`.

## Files changed
- `src/lib/auth/subscriptionUtils.ts`: `RESTRICTION_REASON`, `getRestrictionReason()`.
- `src/config/accessRestriction.ts`: new; title/message per reason.
- `src/components/Layout/RestrictedAccessModal.tsx`: new reactstrap modal.
- `src/components/Layout/Sidebar.jsx`: opens the modal on locked clicks and after a guard redirect.
- `src/lib/auth/ProtectedRoute.tsx`: the restricted redirect carries `state.restrictedFrom`.
- `tests/lib/auth/subscriptionUtils.test.ts`: 3 tests for `getRestrictionReason`.
- `tests/components/Layout/SidebarRestrictedModal.test.tsx`: new (5 tests).
- `e2e/sidebar/menu/subscription-states.spec.ts`: the expired case checks the modal; a new awaiting-activation case covers a locked menu and a locked page. The stale labels `Capital Access` and `Notification` were also updated to `Credit Card Stacking` and `Notifications`. Those had made two cases fail before this change.

## Testing
- New unit and sidebar tests failed first, then passed. Full Vitest: 160 files, 1218 passed.
- `npm run typecheck`: clean.
- E2E `e2e/sidebar/menu/subscription-states.spec.ts` (local API): 6/6 passed.

## Open items
- The sidebar's `LinkItem` is defined inside `Sidebar`, so every sidebar render re-mounts the menu links. The new tests click them with `fireEvent` for that reason. Moving `LinkItem` out of the component would fix the re-mount.
