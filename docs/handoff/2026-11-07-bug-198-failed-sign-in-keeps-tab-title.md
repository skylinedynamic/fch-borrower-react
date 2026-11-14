# BUG-198: a failed sign-in keeps the portal's tab title

**Date:** 2026-11-07

## Problem
On a white-label client login page (e.g. `qatestwlpartnerco-borrower…/login`, tab "QA-Test WL Partner | Borrower Portal"), a wrong email or password showed "Invalid email or password." correctly, but the tab title changed to the host's "Four Corner Funding" until the page was reloaded.

Cause:
- **The 401:** a failed sign-in answers 401 (`ApiResponse::loginError`).
- **The interceptor:** the shared `apiClient` response interceptor treated every 401 as an ended session and called `clearAuth()`.
- **`clearAuth()`:** cleared the branding and hard-set `document.title = 'Four Corner Funding'`.
- **No reload:** the page was already `/login`, so nothing reloaded and the host's name stayed.

The same hard-coded title also applied on every real logout from a white-label portal.

## Solution
- **`apiClient`:** a 401 logs out (`clearAuth()` and redirect) only when the request was sent signed in, with an `Authorization` header. A 401 on a request without a token, such as a failed sign-in, is left to the form that sent it.
- **`clearAuth()`:** the tab gets back this portal's own title, `portalMeta(<cached public branding>).title`, i.e. "<site name> | Borrower Portal". The cached branding is what the login page saves for its domain. When none is cached, the title is left as it is. There is no default name (07-Nov decision: no "Four Corner Funding" fallback).
- **Storage key:** the `public_branding` localStorage key is now the constant `PUBLIC_BRANDING_STORAGE_KEY`, used by `Layout/Auth.jsx` and `auth.ts`.

## Files changed
- `src/lib/http/apiClient.ts`: logs out on a 401 only for a request sent with a token.
- `src/lib/auth/auth.ts`: logout puts back the portal's own title from the cached public branding, and leaves the title alone when there is none.
- `src/config/portalMeta.ts`: `PUBLIC_BRANDING_STORAGE_KEY`.
- `src/components/Layout/Auth.jsx`: uses the constant.
- `tests/lib/http/apiClient.test.ts`:
  - the 401 tests now send a token
  - new: a 401 with no token leaves auth and the page alone
- `tests/lib/auth/auth.test.ts`: logout title is the cached portal's ("White Label Co | Borrower Portal"). With nothing cached, the title is unchanged.
- `tests/pages/singin/SignIn.test.tsx`: new. On a white-label portal, a wrong password (401) keeps "QA-Test WL Partner | Borrower Portal".
- `e2e/auth/login.spec.ts`: 2 new tests against the real backend. A failed sign-in keeps the title, on the host portal and with white-label branding.

## Testing
- **Vitest:** the 4 new tests failed first: `clearAuth` called; title "Four Corner Funding" (×3). Then they passed. Full suite: 1731 passed (230 files).
- **Follow-up (no default name):** the "unknown branding" test failed first (title became "Four Corner Funding | Borrower Portal"), then passed. `tests/lib` + `tests/pages/singin`: 118 passed.
- `npm run typecheck`: clean.
- **Playwright `--project=guest e2e/auth/`:**
  - On the old code (stashed and rebuilt), "a failed sign-in keeps the portal tab title" failed: the title became "Four Corner Funding".
  - With the fix (and again after the follow-up): 11/11 passed.

## Open items
- Locally every domain is the host's, so the white-label E2E serves the partner branding through `page.route`. The sign-in itself goes to the real backend.
- Not committed.
