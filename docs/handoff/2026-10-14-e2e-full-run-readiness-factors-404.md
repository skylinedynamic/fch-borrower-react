# E2E full run — readiness factors 404 for an unknown funding id

2026-10-14

## Problem
A full run of the borrower suite against the local `fch-backend-api` (`npx playwright test`) gave **126 passed, 1 failed**. The failure was `e2e/sidebar/funding/funding-review.spec.ts › an unknown funding id shows "Funding Detail Not Found"`: the page itself behaved, but `GET /common/funding-qualification/999999/readiness-factors` answered **500** "Failed to evaluate readiness factors", and the suite's 5xx guard (`e2e/support/fixtures.ts`) fails any test that sees one.

## Solution
Fixed in `fch-backend-api`, not here: `FundingQualificationController` now answers 404 "Funding not found." when the funding id does not exist (both readiness actions). The portal already treats a failed readiness call as "not found". Tracked as `docs/e2e/ISSUES.md` E2E-020.

## Files changed
- This repo: `docs/e2e/ISSUES.md` (E2E-020, E2E-021), this handoff, `e2e/sidebar/invoices/invoice-payment.spec.ts` (see "Second full run"). No app code changed.
- `fch-backend-api`: `app/Http/Controllers/Api/V1/FCH/Common/Funding/FundingQualificationController.php`, `tests/Feature/Funding/ReadinessFactorsUnknownFundingTest.php` (new). See `fch-backend-api/docs/handoff/2026-10-14-prequal-agent-methods-lost-in-merge-and-readiness-404.md`.

## Testing
- Full suite: 127 tests — 126 passed, 1 failed (the 500 above), 0 skipped (16.4 min).
- After the backend fix: `funding-review.spec.ts` 4/4 passed.
- Backend: `ReadinessFactorsUnknownFundingTest` red (500) before, green after.

## Second full run
- **Problem:** after the backend fix, a second full run gave 126 passed, 1 failed: `invoice-payment.spec.ts` hit `net::ERR_ABORTED` on `page.goto('/invoices')` — the portal navigates by itself after a successful payment and the `goto` raced it.
- **Solution:** the spec retries that `goto` until it lands (`expect(...).toPass({ timeout: 30_000 })`). ISSUES E2E-021.
- **Files:** `e2e/sidebar/invoices/invoice-payment.spec.ts`
- **Testing:** `e2e/sidebar/invoices/` 8/8 passed.

## Final full run
- With both fixes in place: **127 passed, 0 failed, 0 skipped** (14.5 min).

## Open items
- None from this run. Note that a full run still uses up one funding option (`funding-request-submit`) and calls the real OpenAI pre-qualification agent (`prequal-submit`).
