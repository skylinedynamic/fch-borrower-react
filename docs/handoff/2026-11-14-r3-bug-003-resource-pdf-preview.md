# R3-BUG-003: Resource Hub PDF preview reads the file through the API

**Date:** 2026-11-14
**Author:** Awlad Hossain

## Problem

Resource Hub › click a PDF resource (e.g. "EIN Overview"). A dark window opened with only "Preview Not Available / Click Download to save this file to your device."

Resource files became private, so `file_url` is now a signed link:
`https://api…/private-files/resources/ein.pdf?expires=…&signature=…`

1. `ResourceHub.jsx` decided "is it a PDF?" with `file_url.endsWith('.pdf')`. The signed link ends with its query, so no PDF was ever recognised.
2. The download's file name, when there was no `Content-Disposition` header, took the extension from the same link (`pdf?expires=…`).
3. Even if a PDF had been recognised, the API sends `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`, so the portal can't frame the signed link. That was the admin portal's blank window.

## Solution

- **Preview.** It reads the file through the borrower API (`GET /borrower/resources/{id}/download`, the same access check as Download) and shows it from a local `blob:` link, released when the window closes.
  - This avoids the frame headers and the link's expiry.
  - The API's security headers stay as they are.
- **PDF check.** "Is it a PDF?" and the download's extension are read from the link's path, through a new `fileExtension()`.
- **Non-PDF files** are still offered for download only, and their file is not read.
- **Read failure.** If the file can't be read, the window says "The preview could not be loaded."

## Files changed

- `src/config/fileTypeConfig.ts`: `fileExtension()` and `PDF_EXTENSION`.
- `src/modules/resources/services.ts`:
  - `fetchResourceFile()` reads the file as a Blob and rejects a JSON error.
  - Removed the unused `fetchResourcePreview()`. It called `/borrower/resources/{id}/preview`, which does not exist.
- `src/modules/resources/queries.ts`: `resourceKeys.file`, `useResourceFile()`.
- `src/pages/resources/components/ResourceFilePreview.tsx` (new): reads the file, shows the PDF from a `blob:` link, and shows the loading and error states.
- `src/pages/resources/ResourceHub.jsx`:
  - the desktop preview uses `ResourceFilePreview`
  - the PDF icon check and the download extension use `fileExtension()`
- Tests:
  - `tests/config/fileTypeConfig.test.ts` (new, 8)
  - `tests/modules/resources/services.test.ts` (+2)
  - `tests/pages/resources/ResourceHub.test.tsx` (+3): a signed PDF link shows a `blob:` preview read through the API; a failed read says so; a non-PDF file is not read
  - `e2e/sidebar/resource-hub/resource-preview.spec.ts` (new): against the local API, with `E2EResourcePdfSeeder` (fch-api) adding a real PDF resource and removing it afterwards
- `docs/e2e/ISSUES.md`:
  - E2E-030 added
  - the coverage map now lists the preview

## Testing

- **Seen failing first:**
  - the 8 `fileExtension` tests
  - the 2 service tests
  - 2 of the 3 hub tests (the third, "a non-PDF is not read", passed before too)
  - the new E2E, on the old code: no file request was made
- **After the change:**
  - `tests/config`, `tests/modules/resources`, `tests/pages/resources`: 127 passed
  - `npm run typecheck`: clean
  - `e2e/sidebar/resource-hub` (local API, `E2E_BACKEND_PATH` set to the local fch-api): 8 passed, 3 failed
    - The new preview spec passed.
    - The 3 failures are local data (E2E-030): there are no borrower Download Assets or Training Academy resources locally. They don't touch the file preview.

## Open items

- **Deploy together:** deploy together with the admin panel change of the same date. fch-api needs no change, except the local-only E2E seeder.
- **Mobile view:** "Open Document" still opens the signed link in a new tab. That works, because a tab is not a frame, but the link expires after `FILES_SIGNED_URL_MINUTES` (60) if the page stays open.
- **`e2e/support/backend.ts`:** it still defaults to `../fch-backend-api` (E2E-024). Run the seeder-backed specs with `E2E_BACKEND_PATH`.
- **`ResourceHub.jsx`** is still `.jsx`.
