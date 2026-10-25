# Billing Details — Change default payment method opens its dialog (BUG-101)

**Date:** 2026-10-25
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
QA defect log **BUG-101** (CP-INV-13): Client portal › Billing Details › Default Payment Method › **Change** did nothing for host and white-label clients.
- The button highlighted, but no dialog opened.
- The "Change Default Payment Method" dialog was in the page but stayed hidden, with no gateway list and no console error.

The cause: `ChangePaymentMethodModal` in `BillingDetails.tsx` created its Bootstrap modal only `if ((window as any).bootstrap)`.
- The production build bundles Bootstrap and never sets a `window.bootstrap` global. Checked in a browser on the built app: `typeof window.bootstrap === 'undefined'`.
- So no modal instance was made, and `show()` never ran. The gateway list never loaded either, because that call sits after the same "no modal" early return.
- It can work on the dev server, which serves the Bootstrap file unbundled.

`SubscriptionDetailsModal` on the same page had the same check. No other screen in the client portal uses `window.bootstrap`; they all `import Modal from 'bootstrap/js/dist/modal'`.

## Solution
- Both dialogs on Billing Details use the imported `Modal` (`bootstrap/js/dist/modal`), like every other dialog in the app.
- The modal ref is typed `Modal | null` instead of `any`.

## Files changed
- `src/pages/billing-details/BillingDetails.tsx`: imports `Modal`; both dialogs construct it directly; ref typed.
- `tests/pages/billing-details/ChangePaymentMethodModal.test.tsx`: mocks `bootstrap/js/dist/modal` instead of planting a `window.bootstrap` global (which hid the bug); +1 test.
- `e2e/sidebar/billing-details/billing-details.spec.ts`: +1 test.

## Tests
- **Vitest:**
  - New: Change opens the dialog (`.show`) with "Available Payment Gateways" and the gateway, with no `window.bootstrap` global.
  - The existing "only enabled providers" test now runs without the fake global.
  - Both failed before the fix and pass after.
  - Full suite: 130 files, 834 passed. `npm run typecheck` clean.
- **E2E** (built app + preview, real local API; `E2E_BACKEND_PATH=C:\laragon\www\fch-api`): `e2e/sidebar/billing-details`, 3 passed (setup + 2). The new test opens Change, sees the gateway list and closes it. Nothing is saved.

## Open items
- `SubscriptionDetailsModal` has no button that opens it: nothing sets `showDetailsModal` to true. It was fixed the same way, but no user can reach it today.
- QA sheet: BUG-101 → Fixed after the stage retest (host client and WL client).
