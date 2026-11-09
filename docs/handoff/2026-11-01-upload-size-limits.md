# File manager: 5 MB pictures, 20 MB other files, refusals say why (BUG-014, round 2)

2026-11-01

## Problem
QA round 2 **BUG-014** was reported against the Owner portal: a 12 MB file that was the PNG signature followed by zeros was accepted by the file manager. The borrower portal's file manager had the same gaps:
- every file was capped at 20 MB, with no lower cap for pictures;
- a failed upload only said "Failed to upload file".

The API now refuses pictures over 5 MB, other files over 20 MB, and pictures that do not open (see `fch-api/docs/handoff/2026-11-01-upload-size-limits-and-profile-picture.md`).

## Solution
- `FILE_MANAGER_CONFIG` gains `MAX_PICTURE_SIZE` (5 MB) and `PICTURE_EXTENSIONS`. `maxUploadSizeFor()` gives the limit for a file name. `fileRejectionReason()` (checked when a file is chosen) and `CustomFileManager` both use it.
- The upload dialog's hint now reads "Max 5MB per image, 20MB per other file."
- `useFileManager.handleUploadFile` shows the API's reason. A 413 from Nginx shows "This file is too large to upload."

## Files changed
- `src/modules/filemanager/config.ts`: picture limit, `maxUploadSizeFor`, used by `fileRejectionReason`.
- `src/components/FileManagerModal/CustomFileManager.tsx`: per-file limit.
- `src/components/FileManagerModal/Modals.tsx`: hint text.
- `src/components/FileManagerModal/useFileManager.ts`: the API's reason, and the 413 message.
- `tests/modules/filemanager/config.test.ts`: limits, including QA's 12 MB `.png`.
- `tests/components/FileManagerModal/useFileManager.upload.test.ts`: new (422 reason, 413, other failures).
- `e2e/sidebar/documents/document-upload-limits.spec.ts`: new. Documents, Miscellaneous Documents, file manager, Upload: the 12 MB fake PNG is refused when chosen, and a 50 KB fake PNG is refused by the API with "This file is not a valid image." Writes nothing.

## Testing
- New tests failed first (no helper, generic message), then passed.
- Full Vitest: 207 files, 1530/1530 passed. `npm run typecheck` is clean.
- Playwright (chromium, local API): the new spec passed. `document-upload.spec.ts` still fails on its stale accordion selector (already logged as E2E-024 in `docs/e2e/ISSUES.md`), not because of this change.

## Open items
- Nginx and PHP upload limits must allow 20 MB plus overhead (see the API handoff).
