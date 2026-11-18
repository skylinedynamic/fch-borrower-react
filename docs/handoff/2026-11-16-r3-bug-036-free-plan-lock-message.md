# R3-BUG-036: a free-plan client sent to a locked page is moved to the Dashboard with no explanation

Date: 2026-11-16

## Problem

QA (R3-CP-NOTI-02-R2) signed in as free client 220 (Limited Free Plan) and opened `/invoices`, the target of billing notifications. The client was moved to `/dashboard` with no toast, banner or modal about the lock. Only the "Complete Your Profile" modal showed.

Checking the code showed two silent paths on the free plan:
- **Direct URL:** `ProtectedRoute` redirected free-plan locked paths with a bare `<Navigate to="/dashboard" />`. The subscription-restricted redirect, by contrast, passes `restrictedFrom`, and the sidebar explains it (BUG-033).
- **Menu click:** the sidebar's locked menu items opened the BUG-033 modal only when `isRestricted`. On the free plan, clicking Invoices, Payments, Billing Details, Resource Hub, Credit Card Stacking or Credit Builder (and its items) did nothing.

Also, the free-plan locked path list was hard-coded inside `ProtectedRoute`.

## Solution

The BUG-033 modal now covers the free plan:

- **New reason:** `RESTRICTION_REASON.FREE_PLAN`. Its message is "Not included in the Limited Free Plan … Please contact your account manager to move to a paid plan and unlock it."
  - It names no partner, like the other messages.
  - It does not offer "View Invoices", because Invoices is locked on the free plan. A new `showInvoices` flag on `RESTRICTION_MESSAGES` controls that button.
- **Guard:** `ProtectedRoute` redirects a free-plan locked path with `state={{ restrictedFrom, reason: FREE_PLAN }}`.
- **Sidebar:** the modal is driven by a `lockReason` state instead of a boolean.
  - A locked item opens the modal with the subscription reason if the client is restricted, otherwise `FREE_PLAN`. This applies to links, the Credit Builder button and its three items.
  - A redirect's `state.reason` is used when present.
- **Config:** the locked path list moved to `src/config/accessRestriction.ts` as `FREE_PLAN_LOCKED_PATHS`, built on `PAYMENT_PATHS`. Path matching now uses the shared `isUnderPath()`.

There is no upgrade button: there is no self-service upgrade flow, so the message points to the account manager.

## Files changed

- `src/lib/auth/subscriptionUtils.ts`: `RESTRICTION_REASON.FREE_PLAN`.
- `src/config/accessRestriction.ts`: `FREE_PLAN_LOCKED_PATHS`; the `FREE_PLAN` message; `showInvoices` on every message.
- `src/components/Layout/RestrictedAccessModal.tsx`: "View Invoices" shown only when `showInvoices` is true.
- `src/lib/auth/ProtectedRoute.tsx`: uses the shared list and passes `restrictedFrom` and `reason` on a free-plan redirect.
- `src/components/Layout/Sidebar.jsx`: `lockReason` / `explainLock()`; free-plan locks open the modal.
- `tests/components/Layout/SidebarRestrictedModal.test.tsx`:
  - "opens no modal for a free-trial lock" is replaced by a test that the free-plan lock is explained, with no "View Invoices" link.
  - New tests for Credit Builder and its items, and for the redirect from `/invoices`.
- `e2e/sidebar/menu/subscription-states.spec.ts`: the free-trial menu test now expects the modal; a new test covers opening `/invoices` directly.

## Testing

- **Seen failing first:** the 3 new integration tests.
- **After the fix:**
  - `tests/components/Layout` and `tests/lib/auth`: 159 passed
  - full Vitest: 1,888 passed
  - `npm run typecheck`: clean
  - E2E `e2e/sidebar/menu/subscription-states.spec.ts`: 8 passed, against the local API

## Open items

- R3-BUG-036 is assigned to Arafat in the defect log. Fixed here at the user's request.
- **Billing notifications on the free plan:** QA called `/invoices` "the target of billing notifications". Whether a free-plan client is ever sent such a notification was not checked here.
