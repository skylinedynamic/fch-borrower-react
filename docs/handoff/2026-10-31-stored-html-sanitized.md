# Stored HTML is sanitized before it is rendered (BUG-004, round 2)

**Date:** 2026-10-31
**Branch:** bugfix/round-2
**Author:** awlad (with Claude Code)

## Problem
QA round 2 defect log **BUG-004** (R1 OP-SEC-06, High/P1): a lead named `R2-XSS <img src=x onerror=console.log("xss")>` ran its `onerror` in the admin's Activity panel. The API writes names into activity descriptions ("Lead profile created for …") and the portals render descriptions with `dangerouslySetInnerHTML`, unsanitized. The defect log showed the bug as **Fixed**, but no fix existed on any branch.

This portal renders the same kind of stored HTML in eleven places, none sanitized: the application Activity details (`ApplicationActivity.tsx`, the same activity descriptions), funding request activity, appointment modal and list, funding option description, credit-guide tier and task text, disclosures, and pagination labels.

## Solution
- `src/utils/sanitizeHtml.ts` — DOMPurify with its defaults: formatting and ordinary links stay; `<script>`, `on*` handlers, `javascript:` URLs, iframes and objects go. Links with `target="_blank"` get `rel="noopener noreferrer"`.
- Every `dangerouslySetInnerHTML` in `src/` now passes its HTML through `sanitizeHtml()`. This also covers HTML already stored (e.g. QA's lead 192).
- `tests/utils/sanitizeHtml.usage.test.ts` fails, naming file and line, when a new `dangerouslySetInnerHTML` does not use `sanitizeHtml()`. Static markup the code writes itself goes in its `ALLOWED` list with the reason (today: the funding request page's `<style>` blocks).
- New dependency **`dompurify` 3.4.15** (the same version the admin panel already had through `html2pdf.js`).
- The API now also escapes names in the descriptions it writes (`fch-api/docs/handoff/2026-10-31-stored-html-sanitized.md`); the admin panel has the same render fix.

## Files changed
- `package.json`, `package-lock.json` — `dompurify` ^3.4.15.
- `src/utils/sanitizeHtml.ts` — new.
- `src/components/Paginations/GlobalPagination.tsx`, `src/pages/appointment/AppointmentModal.tsx`, `src/pages/appointment/Appointments.tsx`, `src/pages/credit-builder/creditguide/components/{TaskDetailsModal,Tier1Task,Tier2Task,TierGenericTask}.tsx`, `src/pages/fundapplication/components/shared/DisclosureModal.tsx`, `src/pages/funding/components/FundingDetail.tsx`, `src/pages/funding-requests/FundingRequestDetailPage.tsx`, `src/pages/myapplication/components/detail/ApplicationActivity.tsx` — render through `sanitizeHtml()`.
- `src/pages/funding-requests/FundingRequestDetailPage.tsx` — `ActivityItem` exported for its test (additive).
- Tests: `tests/utils/sanitizeHtml.test.ts`, `tests/utils/sanitizeHtml.usage.test.ts`, `tests/pages/funding-requests/FundingRequestDetailPage.activityXss.test.tsx` (new); BUG-004 cases added to `ApplicationActivity.test.tsx`, `AppointmentModal.test.tsx`, `Appointments.test.tsx`, `FundingDetail.test.tsx`.
- `e2e/sidebar/my-applications/application-detail.spec.ts` — an activity description with `<img onerror>` (served via `page.route`) shows its text and runs nothing.

## Testing
- Each new test failed first (`<img onerror>` still in the DOM; guard listed 11 renders), then passed.
- Full Vitest suite — 205 files, 1517 passed.
- `npm run typecheck` — clean.
- Playwright `e2e/sidebar/my-applications/application-detail.spec.ts` against the local API — 4 passed (the new spec ran, not skipped).

## Open / follow-up
- Update BUG-004 in the round-2 defect log: it was marked Fixed before any fix existed.
- Credit-guide tier/task text, disclosures and pagination labels come from admin settings or the API, not from borrowers; they are sanitized by the same rule but have no case of their own beyond the guard.
