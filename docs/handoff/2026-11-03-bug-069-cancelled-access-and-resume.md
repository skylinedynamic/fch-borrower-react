# BUG-069: a cancelled client keeps access until the end date, and can resume

**Date:** 2026-11-03

## Problem
QA (R2-CP-BILL-03) found that after **Billing Details › Cancel Subscription**, the next login sent every page except Dashboard and Invoices back to `/dashboard`, silently. That included Billing Details, where the plan could be seen, and Profile. The cancel dialog promises full access until the end of the billing period.

**Cause:** `isSubscriptionRestricted()` locked any status other than Active, before it ever looked at the end date. Pages still opened right after cancelling only because the stored status refreshes on the next app start.

There was also no way to resume a cancelled subscription.

## Solution
The client decided how this should work (2026-11-03).

**Access:**
- **Cancelled:** restricted only once the end date has passed. With no end date there is no period left.
- **`toDate()`:** reads `YYYY-MM-DD` as a local day. `new Date()` reads it as UTC, which locks users west of UTC a day early.
- **Pages open while restricted:** Dashboard, Profile, Invoices, Payments, Billing Details and Notifications (`RESTRICTED_ALLOWED_PATHS`). The sidebar no longer locks Profile or Billing Details.
- **Lock message:** now says the subscription can be resumed from Billing Details.

**Resume:**
- **Button:** a **Resume Subscription** button on Billing Details, shown while the subscription is Cancelled (`components/ResumeSubscription.tsx`, `useResumeSubscription`). After confirming:
  - **Before the end date:** active at once. A success toast shows, the stored subscription is refreshed so the portal unlocks, and the page reloads.
  - **After the end date:** the borrower is taken to the invoice to pay (`/invoices/:id`), with an info toast.
- **Payment warning:** the invoice payment modal warns "Your subscription is cancelled. Paying this invoice will reactivate it…" when the API flags `reactivates_subscription` (`ReactivationNotice.tsx`). Once paid, it refreshes the stored subscription.

The API side is in fch-api `docs/handoff/2026-11-03-bug-069-cancel-and-resume-subscription.md`.

## Files changed
- `src/lib/auth/subscriptionUtils.ts`: the cancelled rule; local date parsing.
- `src/config/accessRestriction.ts`: `RESTRICTED_ALLOWED_PATHS`; the lock message.
- `src/lib/auth/ProtectedRoute.tsx`: uses `RESTRICTED_ALLOWED_PATHS`.
- `src/components/Layout/Sidebar.jsx`: Profile and Billing Details are no longer locked by a restriction.
- `src/modules/billings/{types,services,queries,index}.ts`: `RESUME_RESULT`, `resumeBorrowerSubscription`, `useResumeSubscription`.
- `src/pages/billing-details/components/ResumeSubscription.tsx` (new) and `BillingDetails.tsx`: the button.
- `src/pages/invoices/components/ReactivationNotice.tsx` (new) and `InvoicePaymentModal.jsx`: the warning and the refresh.
- `e2e/sidebar/billing-details/billing-details-resume-save.spec.ts`: new.
- `e2e/sidebar/menu/subscription-states.spec.ts`: Billing Details and Profile are open while restricted, and a cancelled-before-end-date case is added.
- `docs/e2e/ISSUES.md`: the new spec, plus E2E-025 and E2E-026 (unrelated failures found on the way).

## Testing
- **New or updated unit and integration tests**, each red first:
  - `tests/lib/auth/subscriptionUtils.test.ts`: cancelled before, on and after the end date; no end date.
  - `tests/lib/auth/ProtectedRoute.test.tsx`: what opens before and after the end date.
  - `tests/components/Layout/SidebarRestrictedModal.test.tsx`: the unlocked items; the lock message.
  - `tests/pages/billing-details/BillingDetails.resume.test.tsx` (5).
  - `tests/pages/invoices/components/ReactivationNotice.test.tsx` (4).
- **Vitest full suite:** 215 files, 1610 tests passed. `npm run typecheck`: clean.
- **E2E, live local API and a fresh build:**
  - `billing-details/` (7) and `menu/subscription-states` (7) pass.
  - The resume spec covers two flows:
    - **Cancel and resume before the end date:** cancel, reload with the stored status Cancelled, Documents, Profile and Appointment still open, then Resume makes it Active, with the toast and the bell.
    - **After the end date:** Documents locked and Profile open; Resume opens the invoice, and the payment modal shows the warning.
- **E2E runner note:** Playwright reuses a running preview on `:4173`. If that preview is an old build, run on a fresh one, e.g. `npm run build`, `npx vite preview --port 4174`, then `E2E_BASE_URL=http://localhost:4174 E2E_BACKEND_PATH=../fch-api npx playwright test …`.

## Open items
- **Unrelated E2E failures:** E2E-025 (menu label in a spec) and E2E-026 (profile test data) were found on the way, not caused by this change.
- **Store after cancelling:** cancelling does not refresh the stored status, which is harmless now that cancelled keeps access until the end date.
