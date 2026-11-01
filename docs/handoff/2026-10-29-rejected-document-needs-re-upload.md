# Documents shows where each category stands: accepted, pending review or re-upload needed (BUG-135)

**Date:** 2026-10-29
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
**QA defect log BUG-135 (CP-DOC-05).** An admin marked a client's only Voided Business Check file as Rejected. On the client's Documents page the file showed "Rejected" and the reason, but the category still counted as done:
- a green tick and "1 file"
- "Uploaded" in its heading
- progress went from 2 to "3 of 9 categories"
- Your next step moved on to "Upload EIN / Corporation Docs"

The client was never told to upload a new file.

**Pending files looked accepted too (raised in review).** A file waiting for review got the same green tick and "Uploaded", so it read as accepted.

**Cause.** The page counted any file. The API's own onboarding step (`OnboardingStepService::hasUploadedDocuments`) and funding readiness already left rejected documents out, so the page and the server disagreed. BUG-087 had put the review on each file only, and a test pinned the category list as unchanged.

## Solution
One rule, in `src/utils/documentProgress.ts` (`documentCategoryState`):

| State | When | List entry | Heading |
|---|---|---|---|
| `accepted` | any file accepted | green tick, "1 file" | green "Accepted" |
| `pending` | a file that isn't rejected, none accepted yet | amber clock, "1 file · Pending review" | amber "Pending review" |
| `reupload` | only rejected files | red warning, "Re-upload needed" | red "Re-upload needed" |
| `empty` | no files | upload icon, "Not uploaded" / "Optional" | as before |

**Counting.** `accepted` and `pending` count towards "x of N required categories uploaded". This is `isCategoryUploaded`, the same as the API, which counts a pending file. `reupload` does not count, and it is where Your next step / "Upload …" points. "Files uploaded" (the total file count) is unchanged.

## Files changed
- `src/utils/documentProgress.ts` (new): `documentCategoryState`, `isCategoryUploaded`, `isUsableDocument`, and the three labels.
- `src/pages/documents/Documents.tsx`: count and next step use `isCategoryUploaded`.
- `src/pages/documents/components/DocumentCategory.tsx`: list entry and heading badge per state (`CATEGORY_LOOK`, `headingLabel`).
- `src/pages/documents/Documents.css`: `.is-pending` (amber) and `.is-rejected` (red) for the list icon and badge, and the `--docs-warning*` / `--docs-danger-rgb` tokens.

## Tests
- Added: `tests/utils/documentProgress.test.ts` (6 tests). Each state, and what counts as uploaded.
- Added: `tests/pages/documents/components/DocumentCategory.test.tsx` (5 tests). The heading is "Re-upload needed" / "Pending review" / "Accepted"; the list entry has the tick only when accepted and a clock when pending.
- Updated: `tests/pages/documents/Documents.test.tsx`.
  - The BUG-087 test "leaves the category list and heading as they were" became "ticks an accepted category, and shows a pending one as Pending review".
  - Category buttons are found from the start of their name, because the next-step button ("Upload <category>") now matches too.
  - +2 tests: rejected only → Re-upload needed, not counted, next step points at it; rejected + pending → counted, shown as pending.
  - The new and changed expectations were red first.
- E2E: `e2e/sidebar/documents/documents.spec.ts`, +1 test with the types and documents stubbed (accepted, rejected-only, pending). `documents.spec.ts`: 5 passed against the local API.
- Run:
  - Documents and utils suites: 33 passed.
  - Full `npx vitest run` (before the pending split): 1387 passed, 1 failed. The failure is `FundingRequestStep.test.tsx` "takes several purposes", a 9 s timeout under load; it passes alone (13/13) and is unrelated.
  - `npm run typecheck`: clean.

## Open / follow-up
- **QA document DOC-00275275** was left Rejected on client 150, which is useful for the retest.
- **Admin side:** the client's Documents tab in react-fch was not changed. It already shows each file's status.
