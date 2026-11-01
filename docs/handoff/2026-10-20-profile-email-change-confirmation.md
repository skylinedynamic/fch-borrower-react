# Profile email change goes through confirmation

**Date:** 2026-10-20
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
On **Profile → Personal Info**, saving a new email changed the sign-in email at once. The API also reset the password to a random one and mailed it to the new address. A typo locked the borrower out, and whoever owned the typed address received a working password. Every other email change in the platform (partners, users, employees, and clients edited by a partner) already waits for confirmation from the new address.

## Solution
The profile now uses the same email-change process. This depends on the fch-api change of the same date.
- Saving a new email leaves the sign-in email as it is. The new address becomes `pending_email`:
  - the new address gets a confirmation link;
  - the old address is told and can cancel.
- The link opens `/email-change/confirm/...` on this portal (`EmailChangeLinkPage`). The borrower enters their current password and the email changes. They are then signed out everywhere.
- The save toast shows the API's message, "A confirmation link has been sent to … The email will change once it is confirmed."
- The email field keeps showing the current email. A notice under it names the pending address, with **Resend link** and **Cancel change**.
- The password is no longer reset and no password email is sent.
- Uniqueness is checked by the API, ignoring capitals and ignoring deleted logins. A taken email is a 422 on the field, and nothing in the form is saved.

## Files changed
- `src/modules/account/types.ts`: `PendingEmailChange`.
- `src/modules/account/services.ts`: `resendEmailChange()` and `cancelEmailChange()` (POST `/borrower/profile/email-change/resend|cancel`).
- `src/modules/account/queries.ts`: `useResendEmailChange` and `useCancelEmailChange`. Cancel refetches the personal info.
- `src/modules/profile/types.ts`: `PersonalInfoData.pending_email`.
- `src/pages/profile/components/PendingEmailNotice.tsx`: new notice under the email field.
- `src/pages/profile/components/PersonalInfo.tsx`: renders the notice.
- `tests/mocks/handlers.ts`: the default personal-info response has `pending_email: null`.

## Tests
- Added `tests/modules/account/pendingEmailChange.test.ts`: the resend and cancel endpoints and their response mapping.
- Updated `tests/pages/profile/components/PersonalInfo.test.tsx` with a new "changing the email" block (6 tests):
  - the notice shows the pending address, or nothing when no change is pending;
  - after a save, the field keeps the current email and the toast says a link was sent;
  - resend works, and an API error is toasted;
  - cancel removes the notice.
- Added E2E `e2e/sidebar/profile/profile-email-change-save.spec.ts` against the real API: save a new email, check the notice, resend, cancel, reload and check nothing changed. It cancels its own change, so it can be repeated.
- Results:
  - `npm run typecheck` is clean.
  - `npx vitest run`: 777/778 passed. The failure was `FundingRequestStep` "takes several purposes", which timed out under load and passes alone (12/12).
  - `npx playwright test e2e/sidebar/profile`: 17/18 passed. `business-details-locked-error.spec.ts` failed a sub-pixel position check on the Business Details tab (expected ≈3.3px, got 4px). This change doesn't touch that tab.

## Open / follow-up
- The confirmation step itself (link page, password, sign-out) is covered by the existing `e2e/login/email-change-link.spec.ts`. This spec stops at cancel, so the test borrower's email never changes.
- `business-details-locked-error.spec.ts`: the sub-pixel failure needs a separate look.
