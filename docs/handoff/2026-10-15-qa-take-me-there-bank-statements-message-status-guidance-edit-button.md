# QA fixes: Take Me There scroll, bank-statement message, funding request status guidance, Edit button alignment

**Date:** 2026-10-15. Branch `bugfix/qa-fixes-2026-10-15` (from `stage`). The backend half (the banking message in the API) is in `fch-backend-api` on the same branch; the plan is `fch-backend-api/docs/QA_ISSUES_2026-10-15_PLAN.md` (tasks 2c, 3, 6, 7).

## Problem
1. **Take Me There** in Ask Support closed the chat but did nothing when the target was the page already open. On the dashboard scrolled down, "dashboard" → Take Me There left the page where it was.
2. **Bank statements:** a funding option blocked by a failed bank-statement check (deposits, balance, NSF, negative days, statements on file) showed only "Missing Info" and raw figures.
3. **Status guidance** on `/funding-requests/:id`:
   - The Status Guideline text was unclear ("Admin can reviewing the request.").
   - It had no Submitted entry, and its cards were in a different order from the timeline.
   - Nothing said what the current status means or that the funding application opens only once the request is Approved.
4. **Edit Application** on `/funding-requests` sat out of line with Details and View Application.

## Solution
1. `src/utils/revealRoute.ts`: after `navigate()`, scroll the window smoothly to the top and bring the active sidebar link into view. Called from `SupportChatWidget.handleNavigate`.
2. `src/utils/bankingGuidance.ts` picks the failed banking factor's `message` and `action`, which the API now sends.
   - `FundingCard`'s missing-requirements hover card leads with the message.
   - `FundingDetail` shows it as an alert with an **Upload Bank Statements** link to `/documents`.
   - The text comes from the API; there is no frontend copy.
3. `src/config/funding.ts`:
   - Guideline cards rewritten for the borrower, in timeline order: Submitted, Pending, Accepted, In Progress, Approved, Rejected, Cancelled.
   - New `FUNDING_REVIEW_NEXT_STEP`, `FUNDING_REVIEW_AWAITING_APPROVAL` and `..._NOTE`.

   `ReviewProgressCard` adds a **What happens next** box for the current status. Until approval it adds "You can start your funding application once this request is approved." The unused `baseSteps` array was removed. "Process Application" was already shown only when Approved.
4. **Cause found in the browser:** `custom.min.css` gives every `.btn-warning` `padding: 0.45rem` top and bottom, meant for the large Filters button. The small yellow Edit Application button was therefore 33px tall against 27px for the others. `custom.css` now restores the small-button padding for `.btn-warning.btn-sm`. The Filters button is unchanged.

## Files changed
- `src/utils/revealRoute.ts` (new), `src/components/Common/ChatWidget/SupportChatWidget.tsx`
- `src/utils/bankingGuidance.ts` (new), `src/pages/funding/components/FundingCard.tsx`, `src/pages/funding/components/FundingDetail.tsx`
- `src/config/funding.ts`, `src/pages/funding-requests/components/ReviewProgressCard.tsx`
- `assets/css/custom.css`

## Tests added or updated
- Unit:
  - `tests/utils/revealRoute.test.ts`
  - `tests/utils/bankingGuidance.test.ts`
- Integration:
  - `tests/Assistant/ChatWidget/SupportChatWidget.test.tsx`: Take Me There to `/` scrolls to the top
  - `tests/pages/funding/FundingDetail.test.tsx`: alert and link shown or not
  - new `tests/pages/funding/FundingCard.test.tsx`: hover card leads with the message
  - new `tests/pages/funding-requests/ReviewProgressCard.test.tsx`: card order and text, next step per status, the "once approved" note only before approval
- E2E (real local API; one answer per spec replaced, so the state does not depend on local data):
  - `e2e/sidebar/funding/funding-bank-statements.spec.ts`: alert, then the link opens Documents; no alert when passing
  - `e2e/sidebar/funding-request/funding-request-status-guidance.spec.ts`: In Progress shows guidance and no Process Application; Approved shows both
  - `e2e/sidebar/funding-request/funding-request-actions.spec.ts`: the three row actions share one line and height inside the cell. It failed before the CSS fix (3.2px offset) and passes after.

## Verified
- `npm run typecheck`: clean. The new E2E specs also type-check (`tsc --strict`).
- `npx vitest run`: 109 files, **697 passed**, 0 failed.
- `npx playwright test` on the new specs plus `funding.spec.ts`, `funding-review.spec.ts` and `funding-request.spec.ts`: **17 passed**.

## Status / still pending
- Done: tasks 2c, 3, 6 and 7.
- Not committed.


## Follow-up (same day): Banking Activity reason, one message
- **Problem:** the hover card read "Banking Activity: Failed / Required: Uploaded". The first fix then showed the message twice: the red headline, and the factor line below it.
- **Solution:**
  - `FundingCard` shows the API's `reason` and "Required: {requirement}" on the factor line, and drops the red headline when a factor line already explains it.
  - On `FundingDetail`, the alert (with Upload Bank Statements) is the single message, with nothing repeated under the factor row.
  - `bankingGuidance()` prefers the Banking Activity message (missing / rejected / under review) over a figure failure.
- **Files:** `src/utils/bankingGuidance.ts`, `src/pages/funding/components/FundingCard.tsx`, `src/pages/funding/components/FundingDetail.tsx`.
- **Tests:**
  - `tests/utils/bankingGuidance.test.ts`, `tests/pages/funding/FundingCard.test.tsx`, `tests/pages/funding/FundingDetail.test.tsx`
  - E2E case in `e2e/sidebar/funding/funding-bank-statements.spec.ts` (card hover)
- **Verified:** Vitest **700 passed**; typecheck clean.
- **Not verified:** the E2E run stopped at login. The E2E borrower `craig-borrower@fourcornerholdings.com` no longer exists in the local database ("The email you entered does not exist"). Re-run `npx playwright test e2e/sidebar/funding/funding-bank-statements.spec.ts` once that account is back.


## Follow-up (same day): funding request documents separate from the library; "Submitted" instead of "Pending"

**Problem:**
- The funding request wizard showed and removed the borrower's library documents. Remove deleted them from Documents.
- A just-submitted request showed "Pending" next to "Submitted".

**Solution:**
- **Wizard:**
  - lists `GET /borrower/funding/requests/documents` (the request's own copies);
  - attaches with `attachRequestWizardDocuments` (one copy per file);
  - removes with `removeRequestWizardDocument` (copy only; the dialog says "It stays in your Documents");
  - decides "missing" from the request's own files (`src/utils/requestDocuments.ts`).
- **Request detail page:** request copies download by URL.
- **"Submitted" label:** `fundingReviewStatusLabel()` shows Pending as **Submitted**:
  - the timeline has no separate Pending step, and Submitted is the current step (time shown once);
  - badges, the filter option and the "Total Submitted" card use the new label;
  - the stored status is unchanged.

**Tests:**
- `tests/modules/funding/services.test.ts`, `tests/utils/requestDocuments.test.ts` (new), `tests/config/fundingStatusLabel.test.ts` (new), `tests/pages/funding-requests/ReviewProgressCard.test.tsx`
- E2E `funding-request.spec.ts` ("Total Submitted").
- Vitest **716 passed**; typecheck clean.
- E2E not re-run: the local E2E borrower account is missing.


## Reverted (2026-10-15, product decision)

**Reverted:**
- Funding request and application documents kept apart from the borrower library. That covers the migration, `FundingRequestDocumentService`, wizard changes, request → application copy, Banking Activity counting request files, the backfill command and the resource.
- The admin request page "Not Uploaded" eager-load fix.
- The application wizard same-name upload fix.
- Pending shown as "Submitted".
- The Edit Application alignment CSS.

The funding request and application document flow is back to how it was on `stage`.

**Kept:**
- Pre-qualification notification
- Host cannot edit a partner's application
- Take Me There
- Lender / Funding Group order and Funding Type search
- Bank statement messages and Under Review passing
- Funding request status description ("What happens next")
- Downloads streamed, not saved, password never stored
