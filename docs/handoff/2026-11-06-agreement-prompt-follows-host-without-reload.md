# Agreement prompt follows the host without a reload

**Date:** 2026-11-06
**Branch:** feature/agreement-required
**Author:** awlad

## Problem
The host can now require or waive the borrower agreement for one client (fch-api `POST /common/agreement-sign/required/{userId}`). The API then flags the client's user with `is_refresh`. The borrower portal did not react to that while it was open:
- **The flag was never read.** `is_refresh` was looked at only when the app loaded (`refreshSubscription`, which runs on a token change) and after a profile save. Changing pages never called `refresh-user`.
- **The modal asked once.** `AgreementSignModal` is mounted once in the layout, so its `/borrower/agreement-sign/check` query ran once.
- **It never closed.** Once open, it only closed for a free trial.

So a client the host required saw the sign modal only after a full reload or a new login, and a waived client kept seeing it.

## Solution
The same pattern as the partner portal (Fch-admin-frontend-react):
- **`apiClient` response interceptor.** After each successful call made with a session, it looks at `GET /borrower/user-details`. Calls made together share one check. The check's own calls and the `/auth/` calls are excluded. When `is_refresh` is set, `getUserDetails()` reloads the user (`refresh-user`); the API then clears the flag.
- **`refreshUser()`** (`lib/auth/authApi.ts`) fires `USER_REFRESHED_EVENT` once the fresh user is stored.
- **`AgreementSignModal`** listens for it and refetches `/check`:
  - it opens when signing is now needed;
  - it closes when signing is no longer needed (waived, or signing turned off);
  - it keeps what was filled in when the wording is unchanged;
  - it keeps the thank-you screen after signing.

**Once signed, no check.** `useCheckAgreementSign(enabled)` is off while `user.is_agreement_signed` is true, so a signed borrower never calls `/borrower/agreement-sign/check`: not on load, and not after a refresh. Before, it was called on every app load. The refresh listener checks the same flag, because `refetch()` would run anyway. If the host cancels the signature, `refresh-user` brings `is_agreement_signed: false`, the check starts again, and the modal opens. This matches the partner portal.

**Behaviour change:** every call made with a session is followed by one `user-details` call (coalesced). Other `is_refresh` changes, such as subscription or profile data the API flags, now also reach an open portal without a reload.

**API dependency:** the fch-api change on the same branch (`agreement_required`, `is_refresh` on toggle).

## Files changed
- `src/config/appConfig.ts`: `USER_REFRESHED_EVENT`.
- `src/lib/http/apiClient.ts`: coalesced `user-details` check after each successful call (`triggerUserRefreshCheck`).
- `src/lib/auth/authApi.ts`: `refreshUser()` fires `USER_REFRESHED_EVENT`.
- `src/modules/agreement/queries.ts`: `useCheckAgreementSign(enabled = true)`.
- `src/components/AgreementSignModal/AgreementSignModal.jsx`: refetches `/check` on the event, but not once signed; the check query is off once signed; closes when no longer needed; keeps the same template object for unchanged wording.

## Tests
- **Added `tests/lib/http/userRefreshCheck.test.ts` (4):**
  - a flagged user is reloaded and the event fires;
  - an unflagged user is only looked at;
  - calls made together are checked once;
  - no check after its own or `/auth/` calls, or without a session.
- **Added `tests/modules/agreement/queries.test.tsx` (2):** asks when enabled; does not ask when disabled.
- **Updated `tests/components/AgreementSignModal/AgreementSignModal.test.tsx` (+5):**
  - opens after a refresh once required;
  - closes once waived;
  - keeps the thank-you screen;
  - a signed borrower never calls `/check`, even after a refresh;
  - after the host cancels a signature, it asks again and opens.
- **Updated `tests/mocks/handlers.ts`:** default unflagged `GET /borrower/user-details`. Without it, tests with a session hit an unhandled request (2 `CreditProfileTab` tests failed until it was added).
- **E2E added `e2e/pages/agreement-required-refresh.spec.ts` (API mocked):** the modal opens after a page change once the host requires it, then closes once waived, with one `refresh-user` each. It fails against a build without the fix and passes with it.
- **Run:**
  - `npm test`: 1515 passed;
  - `npm run typecheck`: clean;
  - E2E: the new spec, `profile-complete-modal` (5 passed together), and `topbar/agreement` with real login (8 passed).

## Open items
- **Extra call.** Each burst of API calls now adds one `user-details` request. This matches the partner portal; watch it if the API load matters.
